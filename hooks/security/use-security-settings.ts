/**
 * Security Settings Hooks
 * React Query hooks for managing security settings and configurations
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api"
import { queryKeys } from "@/lib/query-client"
import { toast } from "sonner"

// Types
export interface SecuritySettings {
  id: string
  organization_id?: string
  require_mfa: boolean
  allowed_ip_ranges?: string[]
  session_timeout_minutes: number
  max_concurrent_sessions: number
  password_expiry_days?: number
  failed_login_attempts_limit: number
  account_lockout_duration_minutes: number
  allow_password_reuse: boolean
  password_reuse_limit?: number
  require_password_change_on_first_login: boolean
  allow_remember_me: boolean
  remember_me_duration_days?: number
  created_at: string
  updated_at?: string
}

export interface SecuritySettingsUpdate {
  require_mfa?: boolean
  allowed_ip_ranges?: string[]
  session_timeout_minutes?: number
  max_concurrent_sessions?: number
  password_expiry_days?: number
  failed_login_attempts_limit?: number
  account_lockout_duration_minutes?: number
  allow_password_reuse?: boolean
  password_reuse_limit?: number
  require_password_change_on_first_login?: boolean
  allow_remember_me?: boolean
  remember_me_duration_days?: number
}

export interface PasswordPolicy {
  min_length: number
  require_uppercase: boolean
  require_lowercase: boolean
  require_numbers: boolean
  require_special_chars: boolean
  special_chars_list?: string
  max_length?: number
  prevent_common_passwords: boolean
  prevent_user_info_in_password: boolean
}

export interface PasswordPolicyUpdate {
  min_length?: number
  require_uppercase?: boolean
  require_lowercase?: boolean
  require_numbers?: boolean
  require_special_chars?: boolean
  special_chars_list?: string
  max_length?: number
  prevent_common_passwords?: boolean
  prevent_user_info_in_password?: boolean
}

export interface AccountSecurityStatus {
  mfa_enabled: boolean
  mfa_methods: string[]
  password_last_changed: string
  password_expires_at?: string
  failed_login_attempts: number
  account_locked: boolean
  account_locked_until?: string
  trusted_devices_count: number
  active_sessions_count: number
  last_login: string
  last_login_ip: string
  security_score: number // 0-100
  security_recommendations: string[]
}

export interface LoginHistory {
  id: string
  user_id: string
  success: boolean
  ip_address: string
  user_agent: string
  location?: {
    city?: string
    country?: string
  }
  failure_reason?: string
  timestamp: string
}

// Get security settings
export function useSecuritySettings(orgId?: string) {
  return useQuery({
    queryKey: queryKeys.security.settings(orgId),
    queryFn: async () => {
      const response = await apiClient.get("/security/settings", {
        params: orgId ? { organization_id: orgId } : undefined,
      })
      return response.data.data as SecuritySettings
    },
  })
}

// Update security settings
export function useUpdateSecuritySettings(orgId?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: SecuritySettingsUpdate) => {
      const response = await apiClient.put("/security/settings", data, {
        params: orgId ? { organization_id: orgId } : undefined,
      })
      return response.data.data as SecuritySettings
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.security.settings(orgId) })
      toast.success("Security settings updated successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update security settings")
    },
  })
}

// Get password policy
export function usePasswordPolicy(orgId?: string) {
  return useQuery({
    queryKey: queryKeys.security.passwordPolicy(orgId),
    queryFn: async () => {
      const response = await apiClient.get("/security/password-policy", {
        params: orgId ? { organization_id: orgId } : undefined,
      })
      return response.data.data as PasswordPolicy
    },
  })
}

// Update password policy
export function useUpdatePasswordPolicy(orgId?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: PasswordPolicyUpdate) => {
      const response = await apiClient.put("/security/password-policy", data, {
        params: orgId ? { organization_id: orgId } : undefined,
      })
      return response.data.data as PasswordPolicy
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.security.passwordPolicy(orgId) })
      toast.success("Password policy updated successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update password policy")
    },
  })
}

// Get account security status
export function useAccountSecurityStatus() {
  return useQuery({
    queryKey: queryKeys.security.accountStatus(),
    queryFn: async () => {
      const response = await apiClient.get("/users/me/security/status")
      return response.data.data as AccountSecurityStatus
    },
  })
}

// Get login history
export function useLoginHistory(days: number = 30) {
  return useQuery({
    queryKey: queryKeys.security.loginHistory(days),
    queryFn: async () => {
      const response = await apiClient.get("/users/me/security/login-history", {
        params: { days },
      })
      return response.data.data as LoginHistory[]
    },
  })
}

// Enable MFA
export interface EnableMFARequest {
  method: "totp" | "sms" | "email"
  phone_number?: string // Required for SMS
}

export function useEnableMFA() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: EnableMFARequest) => {
      const response = await apiClient.post("/users/me/security/mfa/enable", data)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.security.accountStatus() })
      toast.success("MFA enabled successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to enable MFA")
    },
  })
}

// Disable MFA
export function useDisableMFA() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post("/users/me/security/mfa/disable")
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.security.accountStatus() })
      toast.success("MFA disabled successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to disable MFA")
    },
  })
}

// Change password
export interface ChangePasswordRequest {
  current_password: string
  new_password: string
}

export function useChangePassword() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: ChangePasswordRequest) => {
      const response = await apiClient.post("/users/me/security/change-password", data)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.security.accountStatus() })
      toast.success("Password changed successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to change password")
    },
  })
}

// Validate password against policy
export interface ValidatePasswordRequest {
  password: string
}

export interface ValidatePasswordResponse {
  valid: boolean
  errors: string[]
  strength: "weak" | "fair" | "good" | "strong"
  strength_score: number // 0-100
}

export function useValidatePassword() {
  return useMutation({
    mutationFn: async (data: ValidatePasswordRequest) => {
      const response = await apiClient.post("/security/password-policy/validate", data)
      return response.data.data as ValidatePasswordResponse
    },
  })
}

// Unlock account (admin function)
export function useUnlockAccount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiClient.post(`/users/${userId}/security/unlock`)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all() })
      toast.success("Account unlocked successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to unlock account")
    },
  })
}

// Reset failed login attempts (admin function)
export function useResetFailedAttempts() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiClient.post(`/users/${userId}/security/reset-failed-attempts`)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all() })
      toast.success("Failed login attempts reset")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to reset attempts")
    },
  })
}

// Force password change (admin function)
export function useForcePasswordChange() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiClient.post(`/users/${userId}/security/force-password-change`)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all() })
      toast.success("User will be required to change password on next login")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to force password change")
    },
  })
}
