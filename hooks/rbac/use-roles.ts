/**
 * RBAC Roles Hooks
 * React Query hooks for managing roles
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api"
import { queryKeys } from "@/lib/query-client"
import { toast } from "sonner"

// Types
export interface Role {
  id: string
  name: string
  description: string | null
  level?: number
  is_system_role?: boolean
  permission_count?: number
  user_count?: number
  created_at: string
  updated_at?: string
}

export interface RoleCreate {
  name: string
  description?: string
}

export interface RoleUpdate {
  name?: string
  description?: string
}

export interface RoleWithDetails extends Role {
  permissions: Permission[]
}

export interface Permission {
  id: string
  name: string
  resource: string
  action: string
  description?: string
}

export interface AssignPermissionsRequest {
  permission_ids: string[]
}

// List all roles
export function useRoles() {
  return useQuery({
    queryKey: queryKeys.rbac.roles.list(),
    queryFn: async () => {
      const response = await apiClient.get("/rbac/roles")
      return response.data.data as Role[]
    },
  })
}

// Get single role with details
export function useRole(roleId: string | undefined) {
  return useQuery({
    queryKey: roleId ? queryKeys.rbac.roles.detail(roleId) : [],
    queryFn: async () => {
      if (!roleId) throw new Error("Role ID is required")
      const response = await apiClient.get(`/rbac/roles/${roleId}`)
      return response.data.data as RoleWithDetails
    },
    enabled: !!roleId,
  })
}

// Get role permissions
export function useRolePermissions(roleId: string | undefined) {
  return useQuery({
    queryKey: roleId ? queryKeys.rbac.roles.permissions(roleId) : [],
    queryFn: async () => {
      if (!roleId) throw new Error("Role ID is required")
      const response = await apiClient.get(`/rbac/roles/${roleId}/permissions`)
      return response.data.data as Permission[]
    },
    enabled: !!roleId,
  })
}

// Get role users
export function useRoleUsers(roleId: string | undefined) {
  return useQuery({
    queryKey: roleId ? queryKeys.rbac.roles.users(roleId) : [],
    queryFn: async () => {
      if (!roleId) throw new Error("Role ID is required")
      const response = await apiClient.get(`/rbac/roles/${roleId}/users`)
      return response.data.data
    },
    enabled: !!roleId,
  })
}

// Get expiring roles
export function useExpiringRoles(days: number = 7) {
  return useQuery({
    queryKey: queryKeys.rbac.roles.expiring(days),
    queryFn: async () => {
      const response = await apiClient.get("/rbac/roles/expiring", {
        params: { days },
      })
      return response.data.data
    },
  })
}

// Get expired roles
export function useExpiredRoles() {
  return useQuery({
    queryKey: queryKeys.rbac.roles.expired(),
    queryFn: async () => {
      const response = await apiClient.get("/rbac/roles/expired")
      return response.data.data
    },
  })
}

// Create role mutation
export function useCreateRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: RoleCreate) => {
      const response = await apiClient.post("/rbac/roles", data)
      return response.data.data as Role
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rbac.roles.list() })
      toast.success("Role created successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create role")
    },
  })
}

// Update role mutation
export function useUpdateRole(roleId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: RoleUpdate) => {
      const response = await apiClient.put(`/rbac/roles/${roleId}`, data)
      return response.data.data as Role
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rbac.roles.detail(roleId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.rbac.roles.list() })
      toast.success("Role updated successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update role")
    },
  })
}

// Delete role mutation
export function useDeleteRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (roleId: string) => {
      await apiClient.delete(`/rbac/roles/${roleId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rbac.roles.list() })
      toast.success("Role deleted successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete role")
    },
  })
}

// Assign permissions to role
export function useAssignPermissionsToRole(roleId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: AssignPermissionsRequest) => {
      const response = await apiClient.post(`/rbac/roles/${roleId}/permissions`, data)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rbac.roles.permissions(roleId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.rbac.roles.detail(roleId) })
      toast.success("Permissions assigned successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to assign permissions")
    },
  })
}

// Revoke permissions from role
export function useRevokePermissionsFromRole(roleId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: AssignPermissionsRequest) => {
      const response = await apiClient.delete(`/rbac/roles/${roleId}/permissions`, { data })
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rbac.roles.permissions(roleId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.rbac.roles.detail(roleId) })
      toast.success("Permissions revoked successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to revoke permissions")
    },
  })
}

// Expire old roles (admin task)
export function useExpireOldRoles() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post("/rbac/roles/expire-old")
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rbac.roles.all })
      toast.success("Expired roles processed")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to expire roles")
    },
  })
}
