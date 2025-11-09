import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios"
import { useStore } from "./store"
import { logger } from "./logger"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

logger.info("API Base URL configured", { baseURL: API_BASE_URL })

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
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
  const expirationBuffer = 5 * 60 // 5 minutes in seconds

  return decoded.exp - currentTime < expirationBuffer
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
    apiClient.get("/forms", { params }),
  getAssigned: () => apiClient.get("/forms/assigned"),
  getById: (id: string) => apiClient.get(`/forms/${id}`),
  create: (data: any) => apiClient.post("/forms", data),
  update: (id: string, data: any) => apiClient.put(`/forms/${id}`, data),
  publish: (id: string) => apiClient.post(`/forms/${id}/publish`),
  assign: (
    id: string,
    data: { agent_ids: string[]; due_date?: string; target_responses?: number }
  ) => apiClient.post(`/forms/${id}/assign`, data),
  duplicate: (id: string) => apiClient.post(`/forms/${id}/duplicate`),
  delete: (id: string) => apiClient.delete(`/forms/${id}`),
  cleanup: () => apiClient.delete("/forms/cleanup"),
  export: (formId: string) =>
    apiClient.get(`/forms/${formId}/export`, {
      responseType: "blob",
    }),
  getTemplates: () => apiClient.get("/forms/templates"),
}

// Responses endpoints
export const responsesAPI = {
  getAll: (params?: { form_id?: string }) => apiClient.get("/responses", { params }),
  getById: (id: string) => apiClient.get(`/responses/${id}`),
  create: (data: { form_id: string; data: any; attachments?: Record<string, string> }) =>
    apiClient.post("/responses", data),
  delete: (id: string) => apiClient.delete(`/responses/${id}`),
  cleanup: () => apiClient.delete("/responses/cleanup"),
  // New view modes
  getTableView: (params: { form_id: string; limit?: number; offset?: number }) =>
    apiClient.get("/responses", {
      params: { ...params, view: "table" },
    }),
  getChartView: (params: {
    form_id: string
    group_by?: string
    aggregate?: "count" | "sum" | "avg" | "min" | "max"
    chart_type?: "bar" | "pie" | "line" | "scatter" | "histogram"
  }) =>
    apiClient.get("/responses", {
      params: { ...params, view: "chart" },
    }),
  getTimeSeriesView: (params: {
    form_id: string
    date_field?: string
    time_granularity?: "hour" | "day" | "week" | "month" | "year"
    aggregate?: "count" | "sum" | "avg" | "min" | "max"
  }) =>
    apiClient.get("/responses", {
      params: { ...params, view: "time_series" },
    }),
  getMapView: (params: { form_id: string; limit?: number; offset?: number }) =>
    apiClient.get("/responses", {
      params: { ...params, view: "map" },
    }),
  getSummaryView: (params: { form_id: string }) =>
    apiClient.get("/responses", {
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
  }) => apiClient.get("/users", { params }),
  getMe: () => apiClient.get("/users/me"),
  updateMe: (data: any) => apiClient.put("/users/me", data),
  changePassword: (currentPassword: string, newPassword: string) =>
    apiClient.post("/users/me/password", {
      current_password: currentPassword,
      new_password: newPassword,
    }),
  getNotifications: () => apiClient.get("/users/me/notifications"),
  updateNotifications: (data: any) => apiClient.put("/users/me/notifications", data),
  getPreferences: () => apiClient.get("/users/me/preferences"),
  updatePreferences: (data: any) => apiClient.put("/users/me/preferences", data),
  // Roles and permissions
  getRoles: () => apiClient.get("/users/roles"),
  getPermissions: () => apiClient.get("/users/permissions"),
  getUserRoles: (userId: string) => apiClient.get(`/users/${userId}/roles`),
  getUserPermissions: (userId: string) => apiClient.get(`/users/${userId}/permissions`),
  assignRole: (userId: string, roleId: string) =>
    apiClient.post(`/users/${userId}/roles/${roleId}`),
  removeRole: (userId: string, roleId: string) =>
    apiClient.delete(`/users/${userId}/roles/${roleId}`),
  delete: (id: string) => apiClient.delete(`/users/${id}`),
  cleanup: () => apiClient.delete("/users/cleanup"),
}

// Analytics endpoints
export const analyticsAPI = {
  getDashboard: (period?: "24h" | "7d" | "30d" | "90d") =>
    apiClient.get("/analytics/dashboard", { params: { period } }),
  getPerformance: (period?: "24h" | "7d" | "30d" | "90d") =>
    apiClient.get("/analytics/performance", { params: { period } }),
  getFormAnalytics: (formId: string) => apiClient.get(`/analytics/forms/${formId}`),
  getFormDetailedAnalytics: (formId: string) =>
    apiClient.get(`/analytics/forms/${formId}/detailed`),
  getAgentPerformance: (agentId: string) => apiClient.get(`/analytics/agents/${agentId}`),
}

// Notifications endpoints
export const notificationsAPI = {
  getAll: (params?: { unread_only?: boolean; page?: number; limit?: number }) =>
    apiClient.get("/notifications", { params }),
  getRecent: () => apiClient.get("/notifications/recent"),
  markAsRead: (id: string) => apiClient.put(`/notifications/${id}/read`),
  markAllAsRead: () => apiClient.put("/notifications/read-all"),
  delete: (id: string) => apiClient.delete(`/notifications/${id}`),
}

// Files endpoints for presigning URLs
export const filesAPI = {
  presign: (filename: string, contentType: string, method: "GET" | "PUT" = "PUT") =>
    apiClient.post("/files/presign", {
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
  }) => apiClient.post("/export/responses", data, { responseType: "blob" }),
}

// System health endpoints
export const healthAPI = {
  getDashboard: () => apiClient.get("/health/dashboard"),
}

// Search endpoints
export const searchAPI = {
  global: (params: { q: string; type?: "all" | "forms" | "responses" | "users"; limit?: number }) =>
    apiClient.get("/search/global", { params }),
}
