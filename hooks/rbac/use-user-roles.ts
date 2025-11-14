/**
 * RBAC User Roles Hooks
 * React Query hooks for managing user role assignments
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api"
import { queryKeys } from "@/lib/query-client"
import { toast } from "sonner"

// Types
export interface UserRole {
  id: string
  user_id: string
  role_id: string
  role_name: string
  assigned_by?: string
  assigned_at: string
  expires_at?: string
  is_active: boolean
}

export interface AssignRoleRequest {
  role_id: string
  expires_at?: string
}

export interface AssignRolesRequest {
  role_ids: string[]
  expires_at?: string
}

export interface RoleAssignment {
  user_id: string
  role_id: string
  assigned_by: string
  assigned_at: string
  expires_at?: string
}

export interface UserWithRoles {
  id: string
  username: string
  email: string
  roles: UserRole[]
  effective_permissions: string[]
}

// Get user's roles
export function useUserRoles(userId: string | undefined) {
  return useQuery({
    queryKey: userId ? queryKeys.users.userRoles(userId) : [],
    queryFn: async () => {
      if (!userId) throw new Error("User ID is required")
      const response = await apiClient.get(`/users/${userId}/roles`)
      return response.data.data as UserRole[]
    },
    enabled: !!userId,
  })
}

// Get user's effective permissions (computed from all their roles)
export function useUserEffectivePermissions(userId: string | undefined) {
  return useQuery({
    queryKey: userId ? queryKeys.users.userPermissions(userId) : [],
    queryFn: async () => {
      if (!userId) throw new Error("User ID is required")
      const response = await apiClient.get(`/users/${userId}/permissions`)
      return response.data.data
    },
    enabled: !!userId,
  })
}

// Get current user's roles
export function useMyRoles() {
  return useQuery({
    queryKey: queryKeys.users.roles,
    queryFn: async () => {
      const response = await apiClient.get("/users/me/roles")
      return response.data.data as UserRole[]
    },
  })
}

// Get current user's permissions
export function useMyPermissions() {
  return useQuery({
    queryKey: queryKeys.users.permissions,
    queryFn: async () => {
      const response = await apiClient.get("/users/me/permissions")
      return response.data.data
    },
  })
}

// Assign role to user
export function useAssignRoleToUser(userId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: AssignRoleRequest) => {
      const response = await apiClient.post(`/users/${userId}/roles`, data)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.userRoles(userId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.users.userPermissions(userId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(userId) })
      toast.success("Role assigned successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to assign role")
    },
  })
}

// Assign multiple roles to user
export function useAssignRolesToUser(userId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: AssignRolesRequest) => {
      const response = await apiClient.post(`/users/${userId}/roles/bulk`, data)
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.userRoles(userId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.users.userPermissions(userId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(userId) })
      toast.success(`Assigned ${data.assigned_count} role(s) successfully`)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to assign roles")
    },
  })
}

// Revoke role from user
export function useRevokeRoleFromUser(userId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (roleId: string) => {
      await apiClient.delete(`/users/${userId}/roles/${roleId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.userRoles(userId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.users.userPermissions(userId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(userId) })
      toast.success("Role revoked successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to revoke role")
    },
  })
}

// Revoke all roles from user
export function useRevokeAllRolesFromUser(userId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.delete(`/users/${userId}/roles`)
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.userRoles(userId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.users.userPermissions(userId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(userId) })
      toast.success(
        data.revoked_count > 0 ? `Revoked ${data.revoked_count} role(s)` : "No roles to revoke"
      )
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to revoke roles")
    },
  })
}

// Update role expiration
export interface UpdateRoleExpirationRequest {
  expires_at?: string | null
}

export function useUpdateUserRoleExpiration(userId: string, roleId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: UpdateRoleExpirationRequest) => {
      const response = await apiClient.put(`/users/${userId}/roles/${roleId}/expiration`, data)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.userRoles(userId) })
      toast.success("Role expiration updated successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update expiration")
    },
  })
}

// Get users with expiring roles
export function useUsersWithExpiringRoles(days: number = 7) {
  return useQuery({
    queryKey: ["users", "expiring-roles", days],
    queryFn: async () => {
      const response = await apiClient.get("/users/expiring-roles", {
        params: { days },
      })
      return response.data.data
    },
  })
}

// Get users with expired roles
export function useUsersWithExpiredRoles() {
  return useQuery({
    queryKey: ["users", "expired-roles"],
    queryFn: async () => {
      const response = await apiClient.get("/users/expired-roles")
      return response.data.data
    },
  })
}

// Check if user has permission
export interface CheckPermissionRequest {
  user_id: string
  resource: string
  action: string
}

export function useCheckUserPermission() {
  return useMutation({
    mutationFn: async (data: CheckPermissionRequest) => {
      const response = await apiClient.post("/rbac/check-permission", data)
      return response.data.data as { has_permission: boolean; reason?: string }
    },
  })
}

// Bulk assign roles to multiple users
export interface BulkAssignRolesRequest {
  user_ids: string[]
  role_ids: string[]
  expires_at?: string
}

export function useBulkAssignRoles() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: BulkAssignRolesRequest) => {
      const response = await apiClient.post("/users/roles/bulk-assign", data)
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all() })
      toast.success(`Assigned roles to ${data.affected_users} user(s) successfully`)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to bulk assign roles")
    },
  })
}
