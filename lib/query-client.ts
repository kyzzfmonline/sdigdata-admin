import { QueryClient, DefaultOptions } from "@tanstack/react-query"
import { logger } from "./logger"

const queryConfig: DefaultOptions = {
  queries: {
    // Stale time: 5 minutes - data is considered fresh for 5 minutes
    staleTime: 5 * 60 * 1000,

    // Cache time: 10 minutes - unused data stays in cache for 10 minutes
    gcTime: 10 * 60 * 1000,

    // Retry failed requests 3 times with exponential backoff
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

    // Refetch on window focus for fresh data
    refetchOnWindowFocus: true,

    // Don't refetch on mount if data is fresh
    refetchOnMount: false,

    // Refetch on reconnect
    refetchOnReconnect: true,
  },
  mutations: {
    // Retry mutations once
    retry: 1,

    // Log mutation errors
    onError: (error) => {
      logger.error("Mutation error", { error })
    },
  },
}

export const queryClient = new QueryClient({
  defaultOptions: queryConfig,
})

// Query keys factory for consistent naming
export const queryKeys = {
  // Auth
  auth: {
    me: ["auth", "me"] as const,
  },

  // Forms
  forms: {
    all: (params?: any) => ["forms", "list", params] as const,
    assigned: ["forms", "assigned"] as const,
    detail: (id: string) => ["forms", "detail", id] as const,
    templates: ["forms", "templates"] as const,
  },

  // Responses
  responses: {
    all: (params?: any) => ["responses", "list", params] as const,
    detail: (id: string) => ["responses", "detail", id] as const,
  },

  // Users
  users: {
    all: (params?: any) => ["users", "list", params] as const,
    detail: (id: string) => ["users", "detail", id] as const,
    notifications: ["users", "notifications"] as const,
    preferences: ["users", "preferences"] as const,
    roles: ["users", "roles"] as const,
    permissions: ["users", "permissions"] as const,
    userRoles: (userId: string) => ["users", userId, "roles"] as const,
    userPermissions: (userId: string) => ["users", userId, "permissions"] as const,
  },

  // Analytics
  analytics: {
    dashboard: (period?: string) => ["analytics", "dashboard", period] as const,
    performance: (period?: string) => ["analytics", "performance", period] as const,
    formAnalytics: (formId: string) => ["analytics", "form", formId] as const,
    formDetailedAnalytics: (formId: string) => ["analytics", "form", formId, "detailed"] as const,
    agentPerformance: (agentId: string) => ["analytics", "agent", agentId] as const,
  },

  // Notifications
  notifications: {
    all: (params?: any) => ["notifications", "list", params] as const,
    recent: ["notifications", "recent"] as const,
  },

  // Health
  health: {
    dashboard: ["health", "dashboard"] as const,
  },

  // Search
  search: {
    global: (params: any) => ["search", "global", params] as const,
  },
}
