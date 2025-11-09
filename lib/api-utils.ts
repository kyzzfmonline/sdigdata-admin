/**
 * API Response Utilities
 *
 * Helper functions to safely extract data from API responses.
 * All backend API responses follow the pattern: {success, message, data, errors}
 */

import type { AxiosResponse } from "axios"

/**
 * Standard API response wrapper from backend
 */
export interface ApiResponse<T = any> {
  success: boolean
  message: string | null
  data: T
  errors: any | null
}

/**
 * Paginated response structure for /users endpoint
 */
export interface PaginatedUsersResponse {
  data: any[]
  pagination: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
  filters: {
    roles: string[]
    statuses: string[]
  }
}

/**
 * Paginated response structure for /responses endpoint
 */
export interface PaginatedResponsesResponse {
  responses: any[]
  total: number
  limit: number
  offset: number
}

/**
 * Paginated response structure for /notifications endpoint
 */
export interface PaginatedNotificationsResponse {
  notifications: any[]
  pagination: {
    page: number
    limit: number
    total: number
  }
}

/**
 * Extract data from a standard API response
 * For endpoints that return: {success, data: any}
 *
 * @example
 * const form = extractData(response) // Gets response.data.data
 */
export function extractData<T>(response: AxiosResponse<ApiResponse<T>>): T {
  return response.data.data
}

/**
 * Extract users from paginated users response
 * For /users endpoint which returns: {success, data: {data, pagination, filters}}
 *
 * @example
 * const users = extractUsers(response)
 */
export function extractUsers<T = any>(
  response: AxiosResponse<ApiResponse<PaginatedUsersResponse>>
): T[] {
  return (response.data.data.data as T[]) || []
}

/**
 * Extract responses from paginated responses response
 * For /responses endpoint which returns: {success, data: {responses, total, limit, offset}}
 *
 * @example
 * const responses = extractResponses(response)
 */
export function extractResponses<T = any>(
  response: AxiosResponse<ApiResponse<PaginatedResponsesResponse>>
): T[] {
  return (response.data.data.responses as T[]) || []
}

/**
 * Extract notifications from paginated notifications response
 * For /notifications endpoint which returns: {success, data: {notifications, pagination}}
 *
 * @example
 * const notifications = extractNotifications(response)
 */
export function extractNotifications<T = any>(
  response: AxiosResponse<ApiResponse<PaginatedNotificationsResponse>>
): T[] {
  return (response.data.data.notifications as T[]) || []
}

/**
 * Extract pagination metadata from paginated users response
 *
 * @example
 * const pagination = extractUsersPagination(response)
 */
export function extractUsersPagination(
  response: AxiosResponse<ApiResponse<PaginatedUsersResponse>>
) {
  return response.data.data.pagination
}

/**
 * Extract pagination metadata from paginated responses response
 *
 * @example
 * const { total, limit, offset } = extractResponsesPagination(response)
 */
export function extractResponsesPagination(
  response: AxiosResponse<ApiResponse<PaginatedResponsesResponse>>
) {
  const { total, limit, offset } = response.data.data
  return { total, limit, offset }
}

/**
 * Type guard to check if response is paginated with users
 */
export function isPaginatedUsers(data: any): data is PaginatedUsersResponse {
  return (
    data &&
    typeof data === "object" &&
    "data" in data &&
    Array.isArray(data.data) &&
    "pagination" in data
  )
}

/**
 * Type guard to check if response is paginated with responses
 */
export function isPaginatedResponses(data: any): data is PaginatedResponsesResponse {
  return (
    data &&
    typeof data === "object" &&
    "responses" in data &&
    Array.isArray(data.responses) &&
    "total" in data
  )
}

/**
 * Type guard to check if data is a direct array
 */
export function isDirectArray(data: any): data is any[] {
  return Array.isArray(data)
}

/**
 * Safely extract data with automatic pagination detection
 * This function automatically detects the response type and extracts appropriately
 *
 * @example
 * const data = safeExtract(response)
 */
export function safeExtract<T = any>(response: AxiosResponse<ApiResponse<any>>): T | T[] {
  const data = response.data.data

  // Check if paginated users response
  if (isPaginatedUsers(data)) {
    return data.data as T[]
  }

  // Check if paginated responses response
  if (isPaginatedResponses(data)) {
    return data.responses as T[]
  }

  // Check if direct array
  if (isDirectArray(data)) {
    return data as T[]
  }

  // Otherwise return as-is (single object or other structure)
  return data as T
}

/**
 * Response type mapping for documentation
 */
export const API_RESPONSE_PATTERNS = {
  // Paginated responses
  PAGINATED_USERS: "/users → {data[], pagination, filters}",
  PAGINATED_RESPONSES: "/responses → {responses[], total, limit, offset}",
  PAGINATED_NOTIFICATIONS: "/notifications → {notifications[], pagination}",

  // Direct array responses
  DIRECT_ARRAY_FORMS: "/forms → Form[]",
  DIRECT_ARRAY_ROLES: "/users/roles → Role[]",
  DIRECT_ARRAY_PERMISSIONS: "/users/permissions → Permission[]",
  DIRECT_ARRAY_FORM_AGENTS: "/forms/{id}/agents → User[]",
  DIRECT_ARRAY_ORGANIZATIONS: "/organizations → Organization[]",

  // Single object responses
  OBJECT_FORM: "/forms/{id} → Form",
  OBJECT_USER: "/users/me → User",
  OBJECT_RESPONSE: "/responses/{id} → Response",
  OBJECT_ANALYTICS: "/analytics/* → AnalyticsData",
} as const

/**
 * Example usage in hooks:
 *
 * // Method 1: Using specific extractors
 * export function useUsers() {
 *   return useQuery({
 *     queryFn: async () => {
 *       const response = await usersAPI.getAll()
 *       return extractUsers(response)
 *     }
 *   })
 * }
 *
 * // Method 2: Using safeExtract (automatic detection)
 * export function useUsers() {
 *   return useQuery({
 *     queryFn: async () => {
 *       const response = await usersAPI.getAll()
 *       return safeExtract<User>(response)
 *     }
 *   })
 * }
 *
 * // Method 3: Direct access (if you know the structure)
 * export function useForms() {
 *   return useQuery({
 *     queryFn: async () => {
 *       const response = await formsAPI.getAll()
 *       return extractData<Form[]>(response)
 *     }
 *   })
 * }
 */
