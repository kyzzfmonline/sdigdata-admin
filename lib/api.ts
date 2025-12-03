import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios"
import { useStore } from "./store"
import { logger } from "./logger"
import { API_TIMEOUT_MS } from "./constants"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

logger.info("API Base URL configured", { baseURL: API_BASE_URL })

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
})

logger.debug("Axios client created", { baseURL: apiClient.defaults.baseURL })

// Track if we're currently refreshing the token to avoid multiple simultaneous refresh requests
let isRefreshing = false
let failedQueue: Array<{
  resolve: (value?: any) => void
  reject: (reason?: any) => void
}> = []

/**
 * Process queued requests after token refresh
 */
const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })

  failedQueue = []
}

/**
 * Decode JWT token to get expiration time
 */
const decodeJWT = (token: string): { exp?: number } | null => {
  try {
    const base64Url = token.split(".")[1]
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join("")
    )
    return JSON.parse(jsonPayload)
  } catch (e) {
    logger.error("Failed to decode JWT token", { error: e })
    return null
  }
}

/**
 * Check if JWT token is expired or about to expire (within 5 minutes)
 */
const isTokenExpired = (token: string): boolean => {
  const decoded = decodeJWT(token)
  if (!decoded || !decoded.exp) {
    return true
  }

  const currentTime = Math.floor(Date.now() / 1000)
  const { TOKEN_EXPIRY_BUFFER_SECONDS } = require("./constants")

  return decoded.exp - currentTime < TOKEN_EXPIRY_BUFFER_SECONDS
}

/**
 * Refresh the authentication token
 */
const refreshAuthToken = async (): Promise<string> => {
  try {
    const token = useStore.getState().token
    if (!token) {
      throw new Error("No token available to refresh")
    }

    // Call the refresh endpoint
    const response = await axios.post(
      `${API_BASE_URL}/auth/refresh`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )

    // Backend wraps all responses in {success, data, message, errors}
    const newToken = response.data?.data?.access_token
    if (!newToken) {
      throw new Error("No access token in refresh response")
    }

    // Update token in store
    useStore.getState().setToken(newToken)
    logger.info("Token refreshed successfully")

    return newToken
  } catch (error) {
    logger.error("Token refresh failed", { error })
    throw error
  }
}

// Attach JWT token to all requests and check expiration
apiClient.interceptors.request.use(
  async (config) => {
    const token = useStore.getState().token

    if (token) {
      // Check if token is expired or about to expire
      if (isTokenExpired(token)) {
        logger.info("Token expired or expiring soon, attempting refresh")

        if (!isRefreshing) {
          isRefreshing = true
          try {
            const newToken = await refreshAuthToken()
            isRefreshing = false
            processQueue(null, newToken)
            config.headers.Authorization = `Bearer ${newToken}`
          } catch (error) {
            isRefreshing = false
            processQueue(error as Error, null)
            // Logout on refresh failure
            useStore.getState().logout()
            if (typeof window !== "undefined" && window.location.pathname !== "/login") {
              window.location.href = "/login"
            }
            return Promise.reject(error)
          }
        } else {
          // Queue this request until token is refreshed
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject })
          })
            .then((newToken) => {
              config.headers.Authorization = `Bearer ${newToken}`
              return config
            })
            .catch((error) => {
              return Promise.reject(error)
            })
        }
      } else {
        config.headers.Authorization = `Bearer ${token}`
      }
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Handle errors globally with token refresh on 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (error.response) {
      const status = error.response.status

      switch (status) {
        case 401:
          // Unauthorized - try to refresh token once
          if (!originalRequest._retry) {
            // Don't retry refresh endpoint itself
            if (originalRequest.url?.includes("/auth/refresh")) {
              logger.warn("Refresh token expired - redirecting to login", { status })
              useStore.getState().logout()
              if (typeof window !== "undefined" && window.location.pathname !== "/login") {
                window.location.href = "/login"
              }
              break
            }

            if (isRefreshing) {
              // Queue this request to be retried after token refresh
              return new Promise((resolve, reject) => {
                failedQueue.push({ resolve, reject })
              })
                .then((token) => {
                  originalRequest.headers.Authorization = `Bearer ${token}`
                  return apiClient(originalRequest)
                })
                .catch((err) => {
                  return Promise.reject(err)
                })
            }

            originalRequest._retry = true
            isRefreshing = true

            try {
              const newToken = await refreshAuthToken()
              isRefreshing = false
              processQueue(null, newToken)

              // Retry original request with new token
              originalRequest.headers.Authorization = `Bearer ${newToken}`
              return apiClient(originalRequest)
            } catch (refreshError) {
              isRefreshing = false
              processQueue(refreshError as Error, null)

              logger.warn("Token refresh failed - redirecting to login", { status })
              useStore.getState().logout()
              if (typeof window !== "undefined" && window.location.pathname !== "/login") {
                window.location.href = "/login"
              }
              return Promise.reject(refreshError)
            }
          } else {
            // Already retried once, give up
            logger.warn("Authentication failed after retry - redirecting to login", { status })
            useStore.getState().logout()
            if (typeof window !== "undefined" && window.location.pathname !== "/login") {
              window.location.href = "/login"
            }
          }
          break

        case 403:
          // Forbidden - user lacks permission
          logger.error("Permission denied", {
            status,
            detail: error.response.data,
          })
          break

        case 422:
          // Validation error - handled by individual components
          logger.warn("Validation error", {
            status,
            detail: error.response.data,
          })
          break

        case 429:
          // Rate limit exceeded
          logger.warn("Rate limit exceeded", { status })
          break

        case 500:
        case 502:
        case 503:
          // Server error
          logger.error("Server error", { status })
          break

        default:
          logger.error("API error", {
            status,
            detail: error.response.data || error.message,
          })
      }
    } else if (error.request) {
      // Network error
      logger.error("Network error - please check your connection")
    } else {
      logger.error("Request error", { message: error.message })
    }

    return Promise.reject(error)
  }
)

// Auth endpoints
export const authAPI = {
  login: (username: string, password: string) =>
    apiClient.post("/auth/login", { username, password }),
  register: (data: {
    username: string
    password: string
    role: "admin" | "agent"
    organization_id: string
  }) => apiClient.post("/auth/register", data),
}

// Forms endpoints
export const formsAPI = {
  getAll: (params?: { organization_id?: string; status?: string }) =>
    apiClient.get("/v1/forms", { params }),
  getAssigned: () => apiClient.get("/v1/forms/assigned"),
  getById: (id: string) => apiClient.get(`/v1/forms/${id}`),
  create: (data: import("./types").CreateFormInput) => apiClient.post("/v1/forms", data),
  update: (id: string, data: import("./types").UpdateFormInput) =>
    apiClient.put(`/v1/forms/${id}`, data),
  publish: (id: string) => apiClient.post(`/v1/forms/${id}/publish`),
  assign: (
    id: string,
    data: { agent_ids: string[]; due_date?: string; target_responses?: number }
  ) => apiClient.post(`/v1/forms/${id}/assign`, data),
  duplicate: (id: string) => apiClient.post(`/v1/forms/${id}/duplicate`),
  delete: (id: string) => apiClient.delete(`/v1/forms/${id}`),
  cleanup: () => apiClient.delete("/v1/forms/cleanup"),
  export: (formId: string) =>
    apiClient.get(`/v1/forms/${formId}/export`, {
      responseType: "blob",
    }),
  getTemplates: () => apiClient.get("/v1/forms/templates"),

  // Form Locking
  acquireLock: (id: string, timeoutSeconds = 300) =>
    apiClient.post(`/v1/forms/${id}/lock`, { lock_timeout_seconds: timeoutSeconds }),
  releaseLock: (id: string) => apiClient.delete(`/v1/forms/${id}/lock`),
  forceUnlock: (id: string) => apiClient.post(`/v1/forms/${id}/lock/force-unlock`),
  getLockStatus: (id: string) => apiClient.get(`/v1/forms/${id}/lock/status`),

  // Form Versioning
  getVersions: (id: string) => apiClient.get(`/v1/forms/${id}/versions`),
  getVersion: (id: string, versionNumber: number) =>
    apiClient.get(`/v1/forms/${id}/versions/${versionNumber}`),
  restoreVersion: (id: string, versionNumber: number) =>
    apiClient.post(`/v1/forms/${id}/versions/${versionNumber}/restore`),
  compareVersions: (id: string, versionA: number, versionB: number) =>
    apiClient.get(`/v1/forms/${id}/versions/compare`, {
      params: { version_a: versionA, version_b: versionB },
    }),
  getChangeLog: (
    id: string,
    params?: { start_version?: number; end_version?: number; change_type?: string }
  ) => apiClient.get(`/v1/forms/${id}/versions/change-log`, { params }),

  // Conditional Logic
  createConditionalRule: (formId: string, data: any) =>
    apiClient.post(`/v1/forms/${formId}/conditional-rules`, data),
  getConditionalRules: (formId: string, params?: { rule_type?: string; is_active?: boolean }) =>
    apiClient.get(`/v1/forms/${formId}/conditional-rules`, { params }),
  updateConditionalRule: (formId: string, ruleId: string, data: any) =>
    apiClient.put(`/v1/forms/${formId}/conditional-rules/${ruleId}`, data),
  deleteConditionalRule: (formId: string, ruleId: string) =>
    apiClient.delete(`/v1/forms/${formId}/conditional-rules/${ruleId}`),
  evaluateConditionalRules: (formId: string, formData: Record<string, any>) =>
    apiClient.post(`/v1/forms/${formId}/conditional-rules/evaluate`, { form_data: formData }),

  // Validation Rules
  createValidationRule: (formId: string, data: any) =>
    apiClient.post(`/v1/forms/${formId}/validation-rules`, data),
  getValidationRules: (formId: string, params?: { field_id?: string; is_active?: boolean }) =>
    apiClient.get(`/v1/forms/${formId}/validation-rules`, { params }),
  updateValidationRule: (formId: string, ruleId: string, data: any) =>
    apiClient.put(`/v1/forms/${formId}/validation-rules/${ruleId}`, data),
  deleteValidationRule: (formId: string, ruleId: string) =>
    apiClient.delete(`/v1/forms/${formId}/validation-rules/${ruleId}`),
  validateFormData: (formId: string, formData: Record<string, any>, partial = false) =>
    apiClient.post(`/v1/forms/${formId}/validation-rules/validate`, {
      form_data: formData,
      partial,
    }),
}

// Form Templates endpoints
export const templatesAPI = {
  getAll: (params?: {
    category?: string
    search?: string
    is_public?: boolean
    organization_id?: string
    sort?: string
    order?: "asc" | "desc"
    page?: number
    limit?: number
  }) => apiClient.get("/v1/form-templates", { params }),
  getPopular: () => apiClient.get("/v1/form-templates/popular"),
  getById: (id: string) => apiClient.get(`/v1/form-templates/${id}`),
  create: (data: any) => apiClient.post("/v1/form-templates", data),
  update: (id: string, data: any) => apiClient.put(`/v1/form-templates/${id}`, data),
  delete: (id: string) => apiClient.delete(`/v1/form-templates/${id}`),
  useTemplate: (id: string, data: { title: string; organization_id: string }) =>
    apiClient.post(`/v1/form-templates/${id}/use`, data),
  saveAsTemplate: (
    formId: string,
    data: {
      name: string
      description?: string
      category: string
      is_public?: boolean
      tags?: string[]
      thumbnail_url?: string
    }
  ) => apiClient.post(`/v1/form-templates/from-form/${formId}`, data),
}

// Responses endpoints
export const responsesAPI = {
  getAll: (params?: { form_id?: string }) => apiClient.get("/v1/responses", { params }),
  getById: (id: string) => apiClient.get(`/v1/responses/${id}`),
  create: (data: import("./types").CreateResponseInput) => apiClient.post("/v1/responses", data),
  delete: (id: string) => apiClient.delete(`/v1/responses/${id}`),
  cleanup: () => apiClient.delete("/v1/responses/cleanup"),
  // New view modes
  getTableView: (params: { form_id: string; limit?: number; offset?: number }) =>
    apiClient.get("/v1/responses", {
      params: { ...params, view: "table" },
    }),
  getChartView: (params: {
    form_id: string
    group_by?: string
    aggregate?: "count" | "sum" | "avg" | "min" | "max"
    chart_type?: "bar" | "pie" | "line" | "scatter" | "histogram"
  }) =>
    apiClient.get("/v1/responses", {
      params: { ...params, view: "chart" },
    }),
  getTimeSeriesView: (params: {
    form_id: string
    date_field?: string
    time_granularity?: "hour" | "day" | "week" | "month" | "year"
    aggregate?: "count" | "sum" | "avg" | "min" | "max"
  }) =>
    apiClient.get("/v1/responses", {
      params: { ...params, view: "time_series" },
    }),
  getMapView: (params: { form_id: string; limit?: number; offset?: number }) =>
    apiClient.get("/v1/responses", {
      params: { ...params, view: "map" },
    }),
  getSummaryView: (params: { form_id: string }) =>
    apiClient.get("/v1/responses", {
      params: { ...params, view: "summary" },
    }),
}

// Users endpoints
export const usersAPI = {
  getAll: (params?: {
    role?: string
    status?: string
    search?: string
    page?: number
    limit?: number
    sort?: string
    order?: "asc" | "desc"
  }) => apiClient.get("/v1/users", { params }),
  getMe: () => apiClient.get("/v1/users/me"),
  updateMe: (data: import("./types").UpdateUserInput) => apiClient.put("/v1/users/me", data),
  changePassword: (currentPassword: string, newPassword: string) =>
    apiClient.post("/v1/users/me/password", {
      current_password: currentPassword,
      new_password: newPassword,
    }),
  getNotifications: () => apiClient.get("/v1/users/me/notifications"),
  updateNotifications: (data: import("./types").UpdateNotificationPreferencesInput) =>
    apiClient.put("/v1/users/me/notifications", data),
  getPreferences: () => apiClient.get("/v1/users/me/preferences"),
  updatePreferences: (data: import("./types").UpdatePreferencesInput) =>
    apiClient.put("/v1/users/me/preferences", data),
  // Roles and permissions
  getRoles: () => apiClient.get("/v1/users/roles"),
  getPermissions: () => apiClient.get("/v1/users/permissions"),
  getUserRoles: (userId: string) => apiClient.get(`/v1/users/${userId}/roles`),
  getUserPermissions: (userId: string) => apiClient.get(`/v1/users/${userId}/permissions`),
  assignRole: (userId: string, roleId: string) =>
    apiClient.post(`/v1/users/${userId}/roles/${roleId}`),
  removeRole: (userId: string, roleId: string) =>
    apiClient.delete(`/v1/users/${userId}/roles/${roleId}`),
  delete: (id: string) => apiClient.delete(`/v1/users/${id}`),
  cleanup: () => apiClient.delete("/v1/users/cleanup"),
}

// Analytics endpoints
export const analyticsAPI = {
  getDashboard: (period?: "24h" | "7d" | "30d" | "90d") =>
    apiClient.get("/v1/analytics/dashboard", { params: { period } }),
  getPerformance: (period?: "24h" | "7d" | "30d" | "90d") =>
    apiClient.get("/v1/analytics/performance", { params: { period } }),
  getFormAnalytics: (formId: string) => apiClient.get(`/v1/analytics/forms/${formId}`),
  getFormDetailedAnalytics: (formId: string) =>
    apiClient.get(`/v1/analytics/forms/${formId}/detailed`),
  getAgentPerformance: (agentId: string) => apiClient.get(`/v1/analytics/agents/${agentId}`),
}

// Notifications endpoints
export const notificationsAPI = {
  getAll: (params?: { unread_only?: boolean; page?: number; limit?: number }) =>
    apiClient.get("/v1/notifications", { params }),
  getRecent: () => apiClient.get("/v1/notifications/recent"),
  markAsRead: (id: string) => apiClient.put(`/v1/notifications/${id}/read`),
  markAllAsRead: () => apiClient.put("/v1/notifications/read-all"),
  delete: (id: string) => apiClient.delete(`/v1/notifications/${id}`),
}

// Files endpoints for presigning URLs
export const filesAPI = {
  presign: (filename: string, contentType: string, method: "GET" | "PUT" = "PUT") =>
    apiClient.post("/v1/files/presign", {
      filename,
      content_type: contentType,
      method,
    }),
}

// Export endpoints
export const exportAPI = {
  responses: (data: {
    form_ids: string[]
    date_range?: { start: string; end: string }
    format: "csv" | "xlsx" | "json"
    include_metadata?: boolean
    anonymize?: boolean
  }) => apiClient.post("/v1/export/responses", data, { responseType: "blob" }),
}

// System health endpoints
export const healthAPI = {
  getDashboard: () => apiClient.get("/v1/health/dashboard"),
}

// Search endpoints
export const searchAPI = {
  global: (params: { q: string; type?: "all" | "forms" | "responses" | "users"; limit?: number }) =>
    apiClient.get("/v1/search/global", { params }),
}

// RBAC endpoints
export const rbacAPI = {
  // Roles
  getRoles: () => apiClient.get("/v1/rbac/roles"),
  getRole: (id: string) => apiClient.get(`/v1/rbac/roles/${id}`),
  createRole: (data: { name: string; description?: string; level?: number }) =>
    apiClient.post("/v1/rbac/roles", data),
  updateRole: (id: string, data: { name?: string; description?: string; level?: number }) =>
    apiClient.put(`/v1/rbac/roles/${id}`, data),
  deleteRole: (id: string) => apiClient.delete(`/v1/rbac/roles/${id}`),

  // Permissions
  getPermissions: (params?: { resource?: string; action?: string }) =>
    apiClient.get("/v1/rbac/permissions", { params }),
  createPermission: (data: {
    name: string
    resource: string
    action: string
    description?: string
  }) => apiClient.post("/v1/rbac/permissions", data),
  deletePermission: (id: string) => apiClient.delete(`/v1/rbac/permissions/${id}`),

  // Role-Permissions
  getRolePermissions: (roleId: string) => apiClient.get(`/v1/rbac/roles/${roleId}/permissions`),
  assignPermissionsToRole: (roleId: string, data: { permission_ids: string[] }) =>
    apiClient.post(`/v1/rbac/roles/${roleId}/permissions`, data),
  revokePermissionsFromRole: (roleId: string, data: { permission_ids: string[] }) =>
    apiClient.delete(`/v1/rbac/roles/${roleId}/permissions`, { data }),

  // User-Roles
  getUserRoles: (userId: string) => apiClient.get(`/v1/rbac/users/${userId}/roles`),
  assignRoleToUser: (userId: string, data: { role_id: string }) =>
    apiClient.post(`/v1/rbac/users/${userId}/roles`, data),
  revokeRoleFromUser: (userId: string, roleId: string) =>
    apiClient.delete(`/v1/rbac/users/${userId}/roles/${roleId}`),
  getUserPermissions: (userId: string) => apiClient.get(`/v1/rbac/users/${userId}/permissions`),
  getRoleUsers: (roleId: string) => apiClient.get(`/v1/rbac/roles/${roleId}/users`),
}

// Session Management endpoints
export const sessionAPI = {
  getSessions: () => apiClient.get("/v1/users/me/sessions"),
  revokeSession: (sessionId: string) => apiClient.delete(`/v1/users/me/sessions/${sessionId}`),
  revokeAllSessions: () => apiClient.delete("/v1/users/me/sessions"),
}

// API Keys endpoints
export const apiKeysAPI = {
  getApiKeys: () => apiClient.get("/v1/users/me/api-keys"),
  createApiKey: (data: import("./types").CreateApiKeyInput) =>
    apiClient.post("/v1/users/me/api-keys", data),
  revokeApiKey: (keyId: string) => apiClient.delete(`/v1/users/me/api-keys/${keyId}`),
  rotateApiKey: (keyId: string) => apiClient.post(`/v1/users/me/api-keys/${keyId}/rotate`),
  getApiKeyUsage: (keyId: string) => apiClient.get(`/v1/users/me/api-keys/${keyId}/usage`),
}

// Audit Logs endpoints
export const auditAPI = {
  getAuditLogs: (params?: {
    user_id?: string
    action_type?: string
    resource_type?: string
    severity?: string
    start_date?: string
    end_date?: string
    page?: number
    limit?: number
  }) => apiClient.get("/v1/audit-logs", { params }),
  exportAuditLogs: (params?: {
    format?: "csv" | "json" | "xlsx"
    start_date?: string
    end_date?: string
  }) =>
    apiClient.get("/v1/audit-logs/export", {
      params,
      responseType: "blob",
    }),
  getSecurityEvents: () => apiClient.get("/v1/audit-logs/security-events"),
  getUserActivityLog: (userId: string) => apiClient.get(`/v1/users/${userId}/activity-log`),
  getUserPermissionHistory: (userId: string) =>
    apiClient.get(`/v1/users/${userId}/permission-history`),
}

// Webhooks endpoints
export const webhooksAPI = {
  getWebhooks: () => apiClient.get("/v1/webhooks"),
  createWebhook: (data: import("./types").CreateWebhookInput) =>
    apiClient.post("/v1/webhooks", data),
  updateWebhook: (id: string, data: Partial<import("./types").CreateWebhookInput>) =>
    apiClient.put(`/v1/webhooks/${id}`, data),
  deleteWebhook: (id: string) => apiClient.delete(`/v1/webhooks/${id}`),
  testWebhook: (id: string) => apiClient.post(`/v1/webhooks/${id}/test`),
  getWebhookLogs: (id: string) => apiClient.get(`/v1/webhooks/${id}/logs`),
}

// Public Forms endpoints (no authentication required)
export const publicFormsAPI = {
  // Get public form by ID
  getForm: (formId: string) =>
    axios.get(`${API_BASE_URL}/form/${formId}`),

  // Submit response to public form
  submit: (formId: string, data: Record<string, any>) =>
    axios.post(`${API_BASE_URL}/form/${formId}/submit`, { data }),

  // Check form availability/status
  checkStatus: (formId: string) =>
    axios.get(`${API_BASE_URL}/form/${formId}/status`),
}

// ============================================
// ELECTIONS & VOTING API
// ============================================

// Elections endpoints
export const electionsAPI = {
  // List elections
  getAll: (params?: {
    organization_id?: string
    status?: string
    election_type?: string
    page?: number
    limit?: number
  }) => apiClient.get("/v1/elections", { params }),

  // Get single election with positions/candidates/options
  getById: (id: string) => apiClient.get(`/v1/elections/${id}`),

  // Create election
  create: (data: import("./types").CreateElectionInput) =>
    apiClient.post("/v1/elections", data),

  // Update election
  update: (id: string, data: import("./types").UpdateElectionInput) =>
    apiClient.put(`/v1/elections/${id}`, data),

  // Delete election (soft delete)
  delete: (id: string) => apiClient.delete(`/v1/elections/${id}`),

  // Lifecycle management
  publish: (id: string) => apiClient.post(`/v1/elections/${id}/publish`),
  pause: (id: string) => apiClient.post(`/v1/elections/${id}/pause`),
  resume: (id: string) => apiClient.post(`/v1/elections/${id}/resume`),
  close: (id: string) => apiClient.post(`/v1/elections/${id}/close`),
  cancel: (id: string) => apiClient.post(`/v1/elections/${id}/cancel`),

  // Audit log
  getAuditLog: (id: string, params?: { page?: number; limit?: number }) =>
    apiClient.get(`/v1/elections/${id}/audit-log`, { params }),

  // ========== POSITIONS ==========
  // List positions for an election
  getPositions: (electionId: string) =>
    apiClient.get(`/v1/elections/${electionId}/positions`),

  // Create position
  createPosition: (electionId: string, data: import("./types").CreatePositionInput) =>
    apiClient.post(`/v1/elections/${electionId}/positions`, data),

  // Update position
  updatePosition: (
    electionId: string,
    positionId: string,
    data: import("./types").UpdatePositionInput
  ) => apiClient.put(`/v1/elections/${electionId}/positions/${positionId}`, data),

  // Delete position
  deletePosition: (electionId: string, positionId: string) =>
    apiClient.delete(`/v1/elections/${electionId}/positions/${positionId}`),

  // ========== CANDIDATES ==========
  // List candidates for a position
  getCandidates: (electionId: string, positionId: string) =>
    apiClient.get(`/v1/elections/${electionId}/positions/${positionId}/candidates`),

  // Create candidate
  createCandidate: (
    electionId: string,
    positionId: string,
    data: import("./types").CreateCandidateInput
  ) => apiClient.post(`/v1/elections/${electionId}/positions/${positionId}/candidates`, data),

  // Update candidate
  updateCandidate: (
    electionId: string,
    positionId: string,
    candidateId: string,
    data: import("./types").UpdateCandidateInput
  ) =>
    apiClient.put(
      `/v1/elections/${electionId}/positions/${positionId}/candidates/${candidateId}`,
      data
    ),

  // Delete candidate
  deleteCandidate: (electionId: string, positionId: string, candidateId: string) =>
    apiClient.delete(
      `/v1/elections/${electionId}/positions/${positionId}/candidates/${candidateId}`
    ),

  // ========== POLL OPTIONS ==========
  // List poll options for an election (for polls/surveys)
  getPollOptions: (electionId: string) =>
    apiClient.get(`/v1/elections/${electionId}/options`),

  // Create poll option
  createPollOption: (electionId: string, data: import("./types").CreatePollOptionInput) =>
    apiClient.post(`/v1/elections/${electionId}/options`, data),

  // Update poll option
  updatePollOption: (
    electionId: string,
    optionId: string,
    data: import("./types").UpdatePollOptionInput
  ) => apiClient.put(`/v1/elections/${electionId}/options/${optionId}`, data),

  // Delete poll option
  deletePollOption: (electionId: string, optionId: string) =>
    apiClient.delete(`/v1/elections/${electionId}/options/${optionId}`),
}

// Voting endpoints (authenticated)
export const votingAPI = {
  // Verify voter eligibility and get voter status
  verifyVoter: (
    electionId: string,
    data?: { national_id?: string; phone?: string; otp?: string }
  ) => apiClient.post(`/v1/elections/${electionId}/verify`, data),

  // Cast votes
  castVotes: (electionId: string, data: import("./types").CastVotesInput) =>
    apiClient.post(`/v1/elections/${electionId}/vote`, data),

  // Check if user has already voted
  getVoteStatus: (electionId: string) =>
    apiClient.get(`/v1/elections/${electionId}/vote-status`),
}

// Election Analytics endpoints
export const electionAnalyticsAPI = {
  // Get live results
  getResults: (electionId: string, positionId?: string) =>
    apiClient.get(`/v1/elections/${electionId}/results`, {
      params: positionId ? { position_id: positionId } : undefined,
    }),

  // Get finalized results
  getFinalizedResults: (electionId: string) =>
    apiClient.get(`/v1/elections/${electionId}/results/final`),

  // Finalize and cache results (admin only)
  finalizeResults: (electionId: string) =>
    apiClient.post(`/v1/elections/${electionId}/results/finalize`),

  // Get comprehensive analytics
  getAnalytics: (electionId: string) =>
    apiClient.get(`/v1/elections/${electionId}/analytics`),

  // Get demographic breakdown
  getDemographics: (electionId: string) =>
    apiClient.get(`/v1/elections/${electionId}/analytics/demographics`),

  // Get regional results
  getRegionalResults: (electionId: string, positionId?: string) =>
    apiClient.get(`/v1/elections/${electionId}/analytics/regional`, {
      params: positionId ? { position_id: positionId } : undefined,
    }),

  // Get voting trends
  getTrends: (electionId: string, granularity: "minute" | "hour" | "day" = "hour") =>
    apiClient.get(`/v1/elections/${electionId}/analytics/trends`, {
      params: { granularity },
    }),

  // Get turnout statistics
  getTurnout: (electionId: string) =>
    apiClient.get(`/v1/elections/${electionId}/analytics/turnout`),

  // Get predictions (active elections only)
  getPredictions: (electionId: string) =>
    apiClient.get(`/v1/elections/${electionId}/analytics/predictions`),

  // Compare candidates
  compareCandidates: (electionId: string, candidateIds: string[]) =>
    apiClient.get(`/v1/elections/${electionId}/analytics/comparison`, {
      params: { candidate_ids: candidateIds.join(",") },
    }),

  // Dashboard - overview of all elections
  getDashboard: () => apiClient.get("/v1/elections/dashboard"),

  // Dashboard - active elections only
  getActiveDashboard: () => apiClient.get("/v1/elections/dashboard/active"),

  // Export election data
  exportData: (electionId: string, format: "json" | "csv" = "json") =>
    apiClient.get(`/v1/elections/${electionId}/export`, {
      params: { format },
      responseType: format === "csv" ? "blob" : "json",
    }),
}

// ============================================
// POLITICAL PARTIES API
// ============================================

export const politicalPartiesAPI = {
  // List parties
  getAll: (params?: {
    status?: string
    search?: string
    limit?: number
    offset?: number
  }) => apiClient.get("/v1/political-parties", { params }),

  // Get single party
  getById: (id: string) => apiClient.get(`/v1/political-parties/${id}`),

  // Create party
  create: (data: import("./types").CreatePartyInput) =>
    apiClient.post("/v1/political-parties", data),

  // Update party
  update: (id: string, data: import("./types").UpdatePartyInput) =>
    apiClient.put(`/v1/political-parties/${id}`, data),

  // Delete party (soft delete)
  delete: (id: string) => apiClient.delete(`/v1/political-parties/${id}`),

  // Permanently delete party (hard delete - only works for soft-deleted parties)
  hardDelete: (id: string) => apiClient.delete(`/v1/political-parties/${id}/permanent`),

  // List soft-deleted parties
  getDeleted: (params?: { limit?: number; offset?: number }) =>
    apiClient.get("/v1/political-parties/deleted/list", { params }),

  // Get party candidates
  getCandidates: (
    partyId: string,
    params?: { status?: string; limit?: number; offset?: number }
  ) => apiClient.get(`/v1/political-parties/${partyId}/candidates`, { params }),

  // Get party stats
  getStats: (partyId: string) =>
    apiClient.get(`/v1/political-parties/${partyId}/stats`),

  // Get party election history
  getElectionHistory: (partyId: string) =>
    apiClient.get(`/v1/political-parties/${partyId}/elections`),

  // Get leaderboard
  getLeaderboard: (params?: {
    sort_by?: "total_wins" | "total_candidates" | "elections"
    limit?: number
  }) => apiClient.get("/v1/political-parties/leaderboard", { params }),
}

// ============================================
// CANDIDATE PROFILES API
// ============================================

export const candidateProfilesAPI = {
  // List candidate profiles
  getAll: (params?: {
    party?: string
    status?: string
    search?: string
    limit?: number
    offset?: number
  }) => apiClient.get("/v1/candidate-profiles", { params }),

  // Get single candidate profile
  getById: (id: string) => apiClient.get(`/v1/candidate-profiles/${id}`),

  // Create candidate profile
  create: (data: import("./types").CreateCandidateProfileInput) =>
    apiClient.post("/v1/candidate-profiles", data),

  // Update candidate profile
  update: (id: string, data: import("./types").UpdateCandidateProfileInput) =>
    apiClient.put(`/v1/candidate-profiles/${id}`, data),

  // Delete candidate profile (soft delete)
  delete: (id: string) => apiClient.delete(`/v1/candidate-profiles/${id}`),

  // Get candidate stats
  getStats: (id: string) => apiClient.get(`/v1/candidate-profiles/${id}/stats`),

  // Get leaderboard
  getLeaderboard: (params?: {
    sort_by?: "total_wins" | "total_votes" | "win_rate" | "elections_count"
    limit?: number
  }) => apiClient.get("/v1/candidate-profiles/leaderboard", { params }),

  // Assign candidate to election position
  assign: (data: import("./types").AssignCandidateInput) =>
    apiClient.post("/v1/candidate-profiles/assign", data),

  // Remove candidate from election
  removeAssignment: (assignmentId: string) =>
    apiClient.delete(`/v1/candidate-profiles/assign/${assignmentId}`),

  // Update candidacy status
  updateCandidacyStatus: (
    assignmentId: string,
    status: import("./types").CandidacyStatus
  ) =>
    apiClient.put(`/v1/candidate-profiles/assign/${assignmentId}/status`, null, {
      params: { new_status: status },
    }),
}

// Public Elections endpoints (no authentication required for anonymous voting)
export const publicElectionsAPI = {
  // Get public election info
  getElection: (electionId: string) =>
    axios.get(`${API_BASE_URL}/v1/vote/${electionId}`),

  // Get election results (if visibility allows)
  getResults: (electionId: string) =>
    axios.get(`${API_BASE_URL}/v1/vote/${electionId}/results`),

  // Request OTP for phone verification
  requestOTP: (electionId: string, data: { phone: string }) =>
    axios.post(`${API_BASE_URL}/v1/vote/${electionId}/request-otp`, data),

  // Verify voter (anonymous flow)
  verifyVoter: (
    electionId: string,
    data: { national_id?: string; phone?: string; otp?: string }
  ) => axios.post(`${API_BASE_URL}/v1/vote/${electionId}/verify`, data),

  // Cast anonymous vote
  castVote: (electionId: string, data: import("./types").CastVotesInput) =>
    axios.post(`${API_BASE_URL}/v1/vote/${electionId}/vote`, data),

  // Check vote status with voter token
  checkVoteStatus: (electionId: string, voterToken: string) =>
    axios.get(`${API_BASE_URL}/v1/vote/${electionId}/vote-status`, {
      params: { voter_token: voterToken },
    }),
}

// ============================================
// GEOGRAPHIC API
// ============================================
export const geographicAPI = {
  // Regions
  listRegions: () => apiClient.get("/v1/geographic/regions"),
  createRegion: (data: { name: string; code: string; metadata?: Record<string, unknown> }) =>
    apiClient.post("/v1/geographic/regions", data),
  getRegion: (regionId: string) => apiClient.get(`/v1/geographic/regions/${regionId}`),
  updateRegion: (regionId: string, data: { name?: string; code?: string; metadata?: Record<string, unknown> }) =>
    apiClient.patch(`/v1/geographic/regions/${regionId}`, data),
  deleteRegion: (regionId: string) => apiClient.delete(`/v1/geographic/regions/${regionId}`),
  getRegionBreakdown: (regionId: string) => apiClient.get(`/v1/geographic/regions/${regionId}/breakdown`),

  // Constituencies
  listConstituencies: (regionId?: string) =>
    apiClient.get("/v1/geographic/constituencies", { params: { region_id: regionId } }),
  createConstituency: (data: { name: string; code: string; region_id: string; metadata?: Record<string, unknown> }) =>
    apiClient.post("/v1/geographic/constituencies", data),
  getConstituency: (constituencyId: string) => apiClient.get(`/v1/geographic/constituencies/${constituencyId}`),

  // Electoral Areas
  listElectoralAreas: (constituencyId?: string) =>
    apiClient.get("/v1/geographic/electoral-areas", { params: { constituency_id: constituencyId } }),
  createElectoralArea: (data: { name: string; code: string; constituency_id: string; metadata?: Record<string, unknown> }) =>
    apiClient.post("/v1/geographic/electoral-areas", data),

  // Polling Stations
  listPollingStations: (params?: {
    electoral_area_id?: string
    constituency_id?: string
    region_id?: string
    limit?: number
    offset?: number
  }) => apiClient.get("/v1/geographic/polling-stations", { params }),
  createPollingStation: (data: {
    name: string
    code: string
    electoral_area_id: string
    address?: string
    gps_coordinates?: string
    registered_voters?: number
    metadata?: Record<string, unknown>
  }) => apiClient.post("/v1/geographic/polling-stations", data),
  getPollingStation: (stationId: string) => apiClient.get(`/v1/geographic/polling-stations/${stationId}`),
  updatePollingStation: (stationId: string, data: {
    name?: string
    address?: string
    gps_coordinates?: string
    registered_voters?: number
    metadata?: Record<string, unknown>
  }) => apiClient.patch(`/v1/geographic/polling-stations/${stationId}`, data),

  // Stats
  getHierarchyStats: () => apiClient.get("/v1/geographic/stats"),
}

// ============================================
// COLLATION API
// ============================================
export const collationAPI = {
  // Result Sheets
  createResultSheet: (data: {
    election_id: string
    polling_station_id?: string
    collation_center_id?: string
    sheet_type: string
  }) => apiClient.post("/v1/collation/sheets", data),

  listResultSheets: (electionId: string, params?: {
    sheet_type?: string
    status?: string
    collation_center_id?: string
    constituency_id?: string
    region_id?: string
    limit?: number
    offset?: number
  }) => apiClient.get("/v1/collation/sheets", { params: { election_id: electionId, ...params } }),

  getResultSheet: (sheetId: string) => apiClient.get(`/v1/collation/sheets/${sheetId}`),

  updateSheetTotals: (sheetId: string, data: {
    total_registered_voters?: number
    total_votes_cast?: number
    total_valid_votes?: number
    total_rejected_votes?: number
  }) => apiClient.patch(`/v1/collation/sheets/${sheetId}/totals`, data),

  // Result Entries
  addResultEntry: (sheetId: string, data: {
    position_id?: string
    candidate_id?: string
    poll_option_id?: string
    votes: number
    votes_in_words?: string
  }) => apiClient.post(`/v1/collation/sheets/${sheetId}/entries`, data),

  bulkAddEntries: (sheetId: string, entries: Array<{
    position_id?: string
    candidate_id?: string
    poll_option_id?: string
    votes: number
    votes_in_words?: string
  }>) => apiClient.post(`/v1/collation/sheets/${sheetId}/entries/bulk`, { entries }),

  getResultEntries: (sheetId: string) => apiClient.get(`/v1/collation/sheets/${sheetId}/entries`),

  // Attachments
  addAttachment: (sheetId: string, data: {
    attachment_type: string
    file_url: string
    file_name?: string
  }) => apiClient.post(`/v1/collation/sheets/${sheetId}/attachments`, data),

  getAttachments: (sheetId: string) => apiClient.get(`/v1/collation/sheets/${sheetId}/attachments`),

  deleteAttachment: (attachmentId: string) => apiClient.delete(`/v1/collation/attachments/${attachmentId}`),

  // Workflow
  submitSheet: (sheetId: string) => apiClient.post(`/v1/collation/sheets/${sheetId}/submit`),
  verifySheet: (sheetId: string, notes?: string) =>
    apiClient.post(`/v1/collation/sheets/${sheetId}/verify`, { notes }),
  approveSheet: (sheetId: string, notes?: string) =>
    apiClient.post(`/v1/collation/sheets/${sheetId}/approve`, { notes }),
  certifySheet: (sheetId: string, notes?: string) =>
    apiClient.post(`/v1/collation/sheets/${sheetId}/certify`, { notes }),
  rejectSheet: (sheetId: string, reason: string) =>
    apiClient.post(`/v1/collation/sheets/${sheetId}/reject`, { reason }),
  getWorkflowHistory: (sheetId: string) => apiClient.get(`/v1/collation/sheets/${sheetId}/history`),

  // Officers
  createOfficer: (data: {
    user_id: string
    officer_type: string
    national_id?: string
    phone?: string
  }) => apiClient.post("/v1/collation/officers", data),

  listOfficers: (params?: { officer_type?: string; is_active?: boolean; limit?: number; offset?: number }) =>
    apiClient.get("/v1/collation/officers", { params }),

  getOfficer: (officerId: string) => apiClient.get(`/v1/collation/officers/${officerId}`),

  assignOfficer: (data: {
    officer_id: string
    election_id: string
    polling_station_id?: string
    collation_center_id?: string
    role: string
  }) => apiClient.post("/v1/collation/officers/assign", data),

  getElectionAssignments: (electionId: string, params?: { officer_id?: string; polling_station_id?: string }) =>
    apiClient.get(`/v1/collation/elections/${electionId}/assignments`, { params }),

  removeAssignment: (assignmentId: string) => apiClient.delete(`/v1/collation/assignments/${assignmentId}`),

  // Collation Centers
  createCollationCenter: (data: {
    name: string
    center_type: string
    electoral_area_id?: string
    constituency_id?: string
    region_id?: string
    address?: string
    gps_coordinates?: string
  }) => apiClient.post("/v1/collation/centers", data),

  listCollationCenters: (params?: {
    center_type?: string
    region_id?: string
    constituency_id?: string
    limit?: number
    offset?: number
  }) => apiClient.get("/v1/collation/centers", { params }),

  // Aggregation
  aggregateResults: (electionId: string, level: string, areaId?: string) =>
    apiClient.get(`/v1/collation/elections/${electionId}/aggregate`, {
      params: { level, area_id: areaId },
    }),

  saveAggregation: (electionId: string, params: {
    level: string
    electoral_area_id?: string
    constituency_id?: string
    region_id?: string
  }) => apiClient.post(`/v1/collation/elections/${electionId}/aggregate/save`, null, { params }),

  getCollationResults: (electionId: string, level?: string) =>
    apiClient.get(`/v1/collation/elections/${electionId}/results`, { params: { level } }),

  // Dashboard & Live Feed
  getCollationDashboard: (electionId: string) =>
    apiClient.get(`/v1/collation/elections/${electionId}/dashboard`),

  getSubmissionProgress: (electionId: string, params?: { region_id?: string; constituency_id?: string }) =>
    apiClient.get(`/v1/collation/elections/${electionId}/progress`, { params }),

  getLiveFeed: (electionId: string, limit?: number) =>
    apiClient.get(`/v1/collation/elections/${electionId}/live-feed`, { params: { limit } }),

  // Incidents
  reportIncident: (data: {
    election_id: string
    polling_station_id?: string
    collation_center_id?: string
    incident_type: string
    severity: string
    description: string
    evidence_urls?: string[]
  }) => apiClient.post("/v1/collation/incidents", data),

  listIncidents: (electionId: string, params?: { status?: string; severity?: string; limit?: number }) =>
    apiClient.get(`/v1/collation/elections/${electionId}/incidents`, { params }),

  resolveIncident: (incidentId: string, resolutionNotes: string) =>
    apiClient.post(`/v1/collation/incidents/${incidentId}/resolve`, { resolution_notes: resolutionNotes }),

  // Discrepancies
  getDiscrepancies: (electionId: string, status?: string) =>
    apiClient.get(`/v1/collation/elections/${electionId}/discrepancies`, { params: { status } }),

  resolveDiscrepancy: (discrepancyId: string, resolutionNotes: string) =>
    apiClient.post(`/v1/collation/discrepancies/${discrepancyId}/resolve`, { resolution_notes: resolutionNotes }),
}
