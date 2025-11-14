/**
 * Form Locking Hooks
 * React Query hooks for managing collaborative form editing with pessimistic locking
 * Prevents concurrent edits and data conflicts
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api"
import { queryKeys } from "@/lib/query-client"
import { toast } from "sonner"

// Types
export interface FormLock {
  id: string
  form_id: string
  locked_by: string
  locked_by_username?: string
  locked_at: string
  expires_at: string
  lock_type: "edit" | "admin" | "readonly"
  session_id: string
  is_active: boolean
  metadata?: Record<string, any>
}

export interface LockStatus {
  is_locked: boolean
  lock?: FormLock
  can_edit: boolean // Current user can edit
  can_force_unlock: boolean // Current user can force unlock
  reason?: string
}

export interface AcquireLockRequest {
  form_id: string
  lock_type?: "edit" | "admin"
  duration_minutes?: number // Default: 30 minutes
}

export interface ExtendLockRequest {
  additional_minutes: number
}

export interface ForceUnlockRequest {
  reason?: string
}

export interface LockHistory {
  id: string
  form_id: string
  locked_by: string
  locked_by_username?: string
  locked_at: string
  unlocked_at?: string
  lock_duration_seconds?: number
  lock_type: string
  unlocked_by?: string
  unlocked_reason?: string
  was_forced: boolean
}

export interface LockStats {
  total_locks: number
  active_locks: number
  expired_locks: number
  average_lock_duration_minutes: number
  most_locked_forms: Array<{
    form_id: string
    form_title: string
    lock_count: number
  }>
}

// Get lock status for a form
export function useFormLockStatus(formId: string | undefined) {
  return useQuery({
    queryKey: formId ? queryKeys.forms.lockStatus(formId) : [],
    queryFn: async () => {
      if (!formId) throw new Error("Form ID is required")
      const response = await apiClient.get(`/forms/${formId}/lock/status`)
      return response.data.data as LockStatus
    },
    enabled: !!formId,
    refetchInterval: 30000, // Refetch every 30 seconds to keep status fresh
  })
}

// Get current lock for a form
export function useFormLock(formId: string | undefined) {
  return useQuery({
    queryKey: formId ? ["forms", "detail", formId, "lock"] : [],
    queryFn: async () => {
      if (!formId) throw new Error("Form ID is required")
      const response = await apiClient.get(`/forms/${formId}/lock`)
      return response.data.data as FormLock | null
    },
    enabled: !!formId,
    refetchInterval: 30000, // Refetch every 30 seconds
  })
}

// Get my active locks
export function useMyLocks() {
  return useQuery({
    queryKey: ["form-locks", "my"],
    queryFn: async () => {
      const response = await apiClient.get("/users/me/form-locks")
      return response.data.data as FormLock[]
    },
    refetchInterval: 60000, // Refetch every minute
  })
}

// Get all active locks (admin)
export function useActiveLocks() {
  return useQuery({
    queryKey: ["form-locks", "active"],
    queryFn: async () => {
      const response = await apiClient.get("/form-locks/active")
      return response.data.data as FormLock[]
    },
    refetchInterval: 30000,
  })
}

// Get lock history for a form
export function useFormLockHistory(formId: string | undefined, days: number = 30) {
  return useQuery({
    queryKey: formId ? ["forms", "detail", formId, "lock-history", days] : [],
    queryFn: async () => {
      if (!formId) throw new Error("Form ID is required")
      const response = await apiClient.get(`/forms/${formId}/lock/history`, {
        params: { days },
      })
      return response.data.data as LockHistory[]
    },
    enabled: !!formId,
  })
}

// Get lock statistics
export function useLockStats() {
  return useQuery({
    queryKey: ["form-locks", "stats"],
    queryFn: async () => {
      const response = await apiClient.get("/form-locks/stats")
      return response.data.data as LockStats
    },
  })
}

// Acquire lock on a form
export function useAcquireFormLock() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: AcquireLockRequest) => {
      const response = await apiClient.post(`/forms/${data.form_id}/lock/acquire`, data)
      return response.data.data as FormLock
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.forms.lockStatus(data.form_id) })
      queryClient.invalidateQueries({ queryKey: ["form-locks", "my"] })
      toast.success("Form locked successfully. You can now edit it.")
    },
    onError: (error: any) => {
      if (error.response?.status === 409) {
        toast.error("Form is already locked by another user")
      } else {
        toast.error(error.response?.data?.message || "Failed to acquire lock")
      }
    },
  })
}

// Release lock on a form
export function useReleaseFormLock() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (formId: string) => {
      await apiClient.delete(`/forms/${formId}/lock`)
    },
    onSuccess: (_, formId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.forms.lockStatus(formId) })
      queryClient.invalidateQueries({ queryKey: ["form-locks", "my"] })
      toast.success("Form unlocked successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to release lock")
    },
  })
}

// Extend lock duration
export function useExtendFormLock(formId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: ExtendLockRequest) => {
      const response = await apiClient.post(`/forms/${formId}/lock/extend`, data)
      return response.data.data as FormLock
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.forms.lockStatus(formId) })
      queryClient.invalidateQueries({ queryKey: ["form-locks", "my"] })
      toast.success("Lock extended successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to extend lock")
    },
  })
}

// Force unlock (admin only)
export function useForceUnlockForm(formId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: ForceUnlockRequest) => {
      await apiClient.post(`/forms/${formId}/lock/force-unlock`, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.forms.lockStatus(formId) })
      queryClient.invalidateQueries({ queryKey: ["form-locks", "active"] })
      toast.success("Lock forcefully removed")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to force unlock")
    },
  })
}

// Auto-refresh lock (call periodically to prevent expiration)
export function useRefreshFormLock(formId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post(`/forms/${formId}/lock/refresh`)
      return response.data.data as FormLock
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.forms.lockStatus(formId) })
    },
    onError: (error: any) => {
      console.error("Failed to refresh lock:", error)
      // Don't show toast for refresh failures - happens in background
    },
  })
}

// Check if I can edit form (respects lock)
export function useCanEditForm(formId: string | undefined) {
  return useQuery({
    queryKey: formId ? ["forms", "detail", formId, "can-edit"] : [],
    queryFn: async () => {
      if (!formId) throw new Error("Form ID is required")
      const response = await apiClient.get(`/forms/${formId}/can-edit`)
      return response.data.data as {
        can_edit: boolean
        reason?: string
        lock_status?: LockStatus
      }
    },
    enabled: !!formId,
    refetchInterval: 30000,
  })
}

// Attempt to take over lock (if previous lock expired)
export function useTakeOverLock(formId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post(`/forms/${formId}/lock/takeover`)
      return response.data.data as FormLock
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.forms.lockStatus(formId) })
      queryClient.invalidateQueries({ queryKey: ["form-locks", "my"] })
      toast.success("Lock taken over successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to take over lock")
    },
  })
}

// Release all my locks
export function useReleaseAllMyLocks() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.delete("/users/me/form-locks")
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["form-locks", "my"] })
      toast.success(`Released ${data.released_count} lock(s)`)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to release locks")
    },
  })
}

// Clean up expired locks (admin/system function)
export function useCleanupExpiredLocks() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post("/form-locks/cleanup-expired")
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["form-locks"] })
      toast.success(`Cleaned up ${data.cleaned_count} expired lock(s)`)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to cleanup locks")
    },
  })
}

// Hook to automatically manage lock lifecycle
export function useFormLockManager(formId: string | undefined, autoRefresh: boolean = true) {
  const acquireLock = useAcquireFormLock()
  const releaseLock = useReleaseFormLock()
  const refreshLock = useRefreshFormLock(formId || "")
  const { data: lockStatus } = useFormLockStatus(formId)

  // Auto-refresh lock every 5 minutes if enabled
  useQuery({
    queryKey: formId ? ["forms", "detail", formId, "auto-refresh"] : [],
    queryFn: async () => {
      if (formId && lockStatus?.can_edit && autoRefresh) {
        await refreshLock.mutateAsync()
      }
      return null
    },
    enabled: !!formId && autoRefresh && lockStatus?.can_edit,
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  })

  return {
    lockStatus,
    acquireLock,
    releaseLock,
    refreshLock,
    canEdit: lockStatus?.can_edit || false,
    isLocked: lockStatus?.is_locked || false,
  }
}
