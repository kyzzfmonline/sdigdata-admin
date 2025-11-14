/**
 * Session Management Hooks
 * React Query hooks for managing user sessions
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api"
import { queryKeys } from "@/lib/query-client"
import { toast } from "sonner"

// Types
export interface Session {
  id: string
  user_id: string
  device_info: {
    browser?: string
    os?: string
    device_type?: string
  }
  ip_address: string
  location?: {
    city?: string
    country?: string
  }
  created_at: string
  last_activity: string
  expires_at: string
  is_current: boolean
  is_active: boolean
  is_revoked: boolean
}

export interface SessionStats {
  total_sessions: number
  active_sessions: number
  revoked_sessions: number
  expired_sessions: number
  avg_session_duration_hours: number
}

export interface SuspiciousSession extends Session {
  suspicion_reasons: string[]
  risk_level: "low" | "medium" | "high"
}

// List my sessions
export function useSessions(includeRevoked: boolean = false) {
  return useQuery({
    queryKey: queryKeys.sessions.list(includeRevoked),
    queryFn: async () => {
      const response = await apiClient.get("/users/me/sessions", {
        params: { include_revoked: includeRevoked },
      })
      return response.data.data as Session[]
    },
  })
}

// Get single session
export function useSession(sessionId: string | undefined) {
  return useQuery({
    queryKey: sessionId ? queryKeys.sessions.detail(sessionId) : [],
    queryFn: async () => {
      if (!sessionId) throw new Error("Session ID is required")
      const response = await apiClient.get(`/users/me/sessions/${sessionId}`)
      return response.data.data as Session
    },
    enabled: !!sessionId,
  })
}

// Get session statistics
export function useSessionStats() {
  return useQuery({
    queryKey: queryKeys.sessions.stats(),
    queryFn: async () => {
      const response = await apiClient.get("/users/me/sessions/stats/overview")
      return response.data.data as SessionStats
    },
  })
}

// Get suspicious sessions
export function useSuspiciousSessions() {
  return useQuery({
    queryKey: queryKeys.sessions.suspicious(),
    queryFn: async () => {
      const response = await apiClient.get("/users/me/sessions/security/suspicious")
      return response.data.data as SuspiciousSession[]
    },
  })
}

// Revoke session mutation
export function useRevokeSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (sessionId: string) => {
      await apiClient.delete(`/users/me/sessions/${sessionId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.my() })
      toast.success("Session revoked successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to revoke session")
    },
  })
}

// Revoke all sessions mutation
export function useRevokeAllSessions() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (keepCurrent: boolean = true) => {
      const response = await apiClient.delete("/users/me/sessions", {
        params: { keep_current: keepCurrent },
      })
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.my() })
      toast.success(
        data.revoked_count > 0
          ? `Revoked ${data.revoked_count} session(s)`
          : "No sessions to revoke"
      )
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to revoke sessions")
    },
  })
}
