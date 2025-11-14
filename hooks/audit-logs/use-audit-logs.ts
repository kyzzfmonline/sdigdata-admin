/**
 * Audit Logs Hooks
 * React Query hooks for viewing and analyzing audit logs
 */

import { useQuery, useMutation } from "@tanstack/react-query"
import { apiClient } from "@/lib/api"
import { queryKeys } from "@/lib/query-client"
import { toast } from "sonner"
// Types
export interface AuditLog {
  id: string
  user_id: string
  username?: string
  action: string
  resource_type: string
  resource_id?: string
  details?: Record<string, any>
  ip_address?: string
  user_agent?: string
  status: "success" | "failure"
  error_message?: string
  timestamp: string
}

export interface AuditLogStats {
  total_logs: number
  logs_by_action: Record<string, number>
  logs_by_resource: Record<string, number>
  logs_by_user: Record<string, number>
  logs_by_status: {
    success: number
    failure: number
  }
  recent_failures: AuditLog[]
}

export interface AuditLogFilters {
  user_id?: string
  action?: string
  resource_type?: string
  resource_id?: string
  status?: "success" | "failure"
  start_date?: string
  end_date?: string
  limit?: number
  offset?: number
}

export interface UserActivitySummary {
  user_id: string
  username: string
  total_actions: number
  successful_actions: number
  failed_actions: number
  most_common_actions: Array<{
    action: string
    count: number
  }>
  recent_activity: AuditLog[]
}

// List audit logs with filters
export function useAuditLogs(filters?: AuditLogFilters) {
  return useQuery({
    queryKey: queryKeys.auditLogs.list(filters),
    queryFn: async () => {
      const response = await apiClient.get("/audit-logs", {
        params: filters,
      })
      return response.data.data as AuditLog[]
    },
  })
}

// Get single audit log details
export function useAuditLog(logId: string | undefined) {
  return useQuery({
    queryKey: logId ? queryKeys.auditLogs.detail(logId) : [],
    queryFn: async () => {
      if (!logId) throw new Error("Audit log ID is required")
      const response = await apiClient.get(`/audit-logs/${logId}`)
      return response.data.data as AuditLog
    },
    enabled: !!logId,
  })
}

// Get audit log statistics
export function useAuditLogStats(days: number = 30) {
  return useQuery({
    queryKey: queryKeys.auditLogs.stats(days),
    queryFn: async () => {
      const response = await apiClient.get("/audit-logs/stats", {
        params: { days },
      })
      return response.data.data as AuditLogStats
    },
  })
}

// Get user activity summary
export function useUserActivitySummary(userId: string | undefined, days: number = 30) {
  return useQuery({
    queryKey: userId ? queryKeys.auditLogs.userSummary(userId, days) : [],
    queryFn: async () => {
      if (!userId) throw new Error("User ID is required")
      const response = await apiClient.get(`/audit-logs/users/${userId}/summary`, {
        params: { days },
      })
      return response.data.data as UserActivitySummary
    },
    enabled: !!userId,
  })
}

// Get my audit logs
export function useMyAuditLogs(filters?: Omit<AuditLogFilters, "user_id">) {
  return useQuery({
    queryKey: ["audit-logs", "my", filters],
    queryFn: async () => {
      const response = await apiClient.get("/users/me/audit-logs", {
        params: filters,
      })
      return response.data.data as AuditLog[]
    },
  })
}

// Get audit logs by action
export function useAuditLogsByAction(
  action: string | undefined,
  filters?: Omit<AuditLogFilters, "action">
) {
  return useQuery({
    queryKey: action ? ["audit-logs", "by-action", action, filters] : [],
    queryFn: async () => {
      if (!action) throw new Error("Action is required")
      const response = await apiClient.get("/audit-logs/by-action", {
        params: { action, ...filters },
      })
      return response.data.data as AuditLog[]
    },
    enabled: !!action,
  })
}

// Get audit logs by resource
export function useAuditLogsByResource(
  resourceType: string | undefined,
  resourceId?: string,
  filters?: Omit<AuditLogFilters, "resource_type" | "resource_id">
) {
  return useQuery({
    queryKey: resourceType ? ["audit-logs", "by-resource", resourceType, resourceId, filters] : [],
    queryFn: async () => {
      if (!resourceType) throw new Error("Resource type is required")
      const response = await apiClient.get("/audit-logs/by-resource", {
        params: { resource_type: resourceType, resource_id: resourceId, ...filters },
      })
      return response.data.data as AuditLog[]
    },
    enabled: !!resourceType,
  })
}

// Get failed audit logs
export function useFailedAuditLogs(filters?: Omit<AuditLogFilters, "status">) {
  return useQuery({
    queryKey: ["audit-logs", "failed", filters],
    queryFn: async () => {
      const response = await apiClient.get("/audit-logs/failed", {
        params: filters,
      })
      return response.data.data as AuditLog[]
    },
  })
}

// Get audit log timeline (for visualization)
export interface AuditLogTimelineEntry {
  date: string
  total: number
  success: number
  failure: number
  by_action: Record<string, number>
}

export function useAuditLogTimeline(days: number = 30) {
  return useQuery({
    queryKey: ["audit-logs", "timeline", days],
    queryFn: async () => {
      const response = await apiClient.get("/audit-logs/timeline", {
        params: { days },
      })
      return response.data.data as AuditLogTimelineEntry[]
    },
  })
}

// Get security events (filtered audit logs for security-related actions)
export function useSecurityEvents(days: number = 7) {
  return useQuery({
    queryKey: ["audit-logs", "security-events", days],
    queryFn: async () => {
      const response = await apiClient.get("/audit-logs/security-events", {
        params: { days },
      })
      return response.data.data as AuditLog[]
    },
  })
}

// Export audit logs
export function useExportAuditLogs() {
  return useMutation({
    mutationFn: async ({
      filters,
      format,
    }: {
      filters?: AuditLogFilters
      format: "csv" | "json"
    }) => {
      const response = await apiClient.get("/audit-logs/export", {
        params: { ...filters, format },
        responseType: "blob",
      })

      // Download file
      const blob = new Blob([response.data], {
        type: format === "csv" ? "text/csv" : "application/json",
      })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `audit-logs-${Date.now()}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    },
    onSuccess: (_, { format }) => {
      toast.success(`Audit logs exported as ${format.toUpperCase()}`)
    },
    onError: () => {
      toast.error("Failed to export audit logs")
    },
  })
}
