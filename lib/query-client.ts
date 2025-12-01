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
    all: ["auth"] as const,
    me: () => ["auth", "me"] as const,
    verify: () => ["auth", "verify"] as const,
    permissions: () => ["auth", "permissions"] as const,
  },

  // Forms
  forms: {
    all: (params?: any) => ["forms", "list", params] as const,
    assigned: ["forms", "assigned"] as const,
    detail: (id: string) => ["forms", "detail", id] as const,
    templates: ["forms", "templates"] as const,
    versions: (id: string) => ["forms", "detail", id, "versions"] as const,
    version: (id: string, version: number) => ["forms", "detail", id, "versions", version] as const,
    assignments: (id: string) => ["forms", "detail", id, "assignments"] as const,
    agents: (id: string) => ["forms", "detail", id, "agents"] as const,
    lockStatus: (id: string) => ["forms", "detail", id, "lock-status"] as const,
    conditionalRules: (id: string) => ["forms", "detail", id, "conditional-rules"] as const,
    validationRules: (id: string) => ["forms", "detail", id, "validation-rules"] as const,
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

  // RBAC
  rbac: {
    all: ["rbac"] as const,
    roles: {
      all: ["rbac", "roles"] as const,
      list: () => ["rbac", "roles", "list"] as const,
      detail: (id: string) => ["rbac", "roles", "detail", id] as const,
      permissions: (id: string) => ["rbac", "roles", "detail", id, "permissions"] as const,
      users: (id: string) => ["rbac", "roles", "detail", id, "users"] as const,
      expiring: (days: number) => ["rbac", "roles", "expiring", days] as const,
      expired: () => ["rbac", "roles", "expired"] as const,
    },
    permissions: {
      all: ["rbac", "permissions"] as const,
      list: (resource?: string) => ["rbac", "permissions", "list", { resource }] as const,
    },
    permissionGroups: {
      all: ["rbac", "permission-groups"] as const,
      list: (orgId?: string) => ["rbac", "permission-groups", "list", { orgId }] as const,
      detail: (id: string) => ["rbac", "permission-groups", "detail", id] as const,
    },
  },

  // Sessions
  sessions: {
    all: ["sessions"] as const,
    my: () => ["sessions", "my"] as const,
    list: (includeRevoked: boolean) => ["sessions", "my", "list", { includeRevoked }] as const,
    detail: (id: string) => ["sessions", "detail", id] as const,
    stats: () => ["sessions", "my", "stats"] as const,
    suspicious: () => ["sessions", "my", "suspicious"] as const,
  },

  // API Keys
  apiKeys: {
    all: ["api-keys"] as const,
    my: () => ["api-keys", "my"] as const,
    list: (includeRevoked: boolean) => ["api-keys", "my", "list", { includeRevoked }] as const,
    detail: (id: string) => ["api-keys", "detail", id] as const,
    stats: () => ["api-keys", "my", "stats"] as const,
    usage: (id: string, days: number) => ["api-keys", "detail", id, "usage", days] as const,
  },

  // Audit Logs
  auditLogs: {
    all: ["audit-logs"] as const,
    list: (params?: any) => ["audit-logs", "list", params] as const,
    detail: (id: string) => ["audit-logs", "detail", id] as const,
    stats: (days: number) => ["audit-logs", "stats", days] as const,
    userSummary: (userId: string, days: number) =>
      ["audit-logs", "user-summary", userId, days] as const,
  },

  // Security Settings
  security: {
    all: ["security"] as const,
    settings: (orgId?: string) => ["security", "settings", { orgId }] as const,
    passwordPolicy: (orgId?: string) => ["security", "password-policy", { orgId }] as const,
    accountStatus: () => ["security", "account-status"] as const,
    loginHistory: (days: number) => ["security", "login-history", days] as const,
    systemConfig: {
      all: ["security", "system-config"] as const,
      list: (prefix?: string) => ["security", "system-config", "list", { prefix }] as const,
      detail: (key: string) => ["security", "system-config", "detail", key] as const,
    },
  },

  // Analytics
  analytics: {
    dashboard: (period?: string) => ["analytics", "dashboard", period] as const,
    performance: (period?: string) => ["analytics", "performance", period] as const,
    formAnalytics: (formId: string) => ["analytics", "form", formId] as const,
    formDetailedAnalytics: (formId: string) => ["analytics", "form", formId, "detailed"] as const,
    agentPerformance: (agentId: string) => ["analytics", "agent", agentId] as const,
  },

  // Templates
  templates: {
    all: (params?: any) => ["templates", "list", params] as const,
    detail: (id: string) => ["templates", "detail", id] as const,
    popular: (limit: number) => ["templates", "popular", limit] as const,
  },

  // Notifications
  notifications: {
    all: (params?: any) => ["notifications", "list", params] as const,
    recent: ["notifications", "recent"] as const,
  },

  // Organizations
  organizations: {
    all: ["organizations"] as const,
    list: () => ["organizations", "list"] as const,
    detail: (id: string) => ["organizations", "detail", id] as const,
  },

  // ML/AI
  ml: {
    all: ["ml"] as const,
    qualityStats: (formId?: string) => ["ml", "quality-stats", { formId }] as const,
    datasets: () => ["ml", "datasets"] as const,
    trainingData: (params?: any) => ["ml", "training-data", params] as const,
    spatialData: (params?: any) => ["ml", "spatial-data", params] as const,
    temporalTrends: (formId: string | undefined, days: number) =>
      ["ml", "temporal-trends", { formId, days }] as const,
  },

  // Search
  search: {
    global: (params: any) => ["search", "global", params] as const,
    saved: () => ["search", "saved"] as const,
  },

  // Metrics
  metrics: {
    all: ["metrics"] as const,
    systemHealth: () => ["metrics", "system-health"] as const,
    performance: () => ["metrics", "performance"] as const,
    apiUsage: (days: number) => ["metrics", "api-usage", days] as const,
    rateLimits: () => ["metrics", "rate-limits"] as const,
    logs: (params?: any) => ["metrics", "logs", params] as const,
  },

  // Health
  health: {
    dashboard: ["health", "dashboard"] as const,
  },

  // Elections
  elections: {
    all: (params?: any) => ["elections", "list", params] as const,
    detail: (id: string) => ["elections", "detail", id] as const,
    positions: (electionId: string) => ["elections", "detail", electionId, "positions"] as const,
    candidates: (electionId: string, positionId: string) =>
      ["elections", "detail", electionId, "positions", positionId, "candidates"] as const,
    pollOptions: (electionId: string) =>
      ["elections", "detail", electionId, "poll-options"] as const,
    auditLog: (electionId: string) => ["elections", "detail", electionId, "audit-log"] as const,
    results: (electionId: string) => ["elections", "detail", electionId, "results"] as const,
    finalizedResults: (electionId: string) =>
      ["elections", "detail", electionId, "results", "finalized"] as const,
    analytics: (electionId: string) =>
      ["elections", "detail", electionId, "analytics"] as const,
    demographics: (electionId: string) =>
      ["elections", "detail", electionId, "analytics", "demographics"] as const,
    regionalResults: (electionId: string, positionId?: string) =>
      ["elections", "detail", electionId, "analytics", "regional", positionId] as const,
    trends: (electionId: string, granularity?: string) =>
      ["elections", "detail", electionId, "analytics", "trends", granularity] as const,
    turnout: (electionId: string) =>
      ["elections", "detail", electionId, "analytics", "turnout"] as const,
    predictions: (electionId: string) =>
      ["elections", "detail", electionId, "analytics", "predictions"] as const,
    comparison: (electionId: string, candidateIds: string[]) =>
      ["elections", "detail", electionId, "analytics", "comparison", candidateIds] as const,
    dashboard: () => ["elections", "dashboard"] as const,
    activeDashboard: () => ["elections", "dashboard", "active"] as const,
    voteStatus: (electionId: string) =>
      ["elections", "detail", electionId, "vote-status"] as const,
  },

  // Political Parties
  parties: {
    all: (params?: any) => ["parties", "list", params] as const,
    detail: (id: string) => ["parties", "detail", id] as const,
    candidates: (partyId: string, params?: any) =>
      ["parties", "detail", partyId, "candidates", params] as const,
    stats: (partyId: string) => ["parties", "detail", partyId, "stats"] as const,
    elections: (partyId: string) => ["parties", "detail", partyId, "elections"] as const,
    leaderboard: (params?: any) => ["parties", "leaderboard", params] as const,
  },

  // Candidate Profiles
  candidateProfiles: {
    all: (params?: any) => ["candidate-profiles", "list", params] as const,
    detail: (id: string) => ["candidate-profiles", "detail", id] as const,
    stats: (id: string) => ["candidate-profiles", "detail", id, "stats"] as const,
    leaderboard: (params?: any) => ["candidate-profiles", "leaderboard", params] as const,
  },
}
