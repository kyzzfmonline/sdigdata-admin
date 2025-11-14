/**
 * RBAC Permissions Hooks
 * React Query hooks for managing permissions
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api"
import { queryKeys } from "@/lib/query-client"
import { toast } from "sonner"

// Types
export interface Permission {
  id: string
  name: string
  resource: string
  action: string
  description?: string
  created_at: string
  updated_at?: string
}

export interface PermissionCreate {
  name: string
  resource: string
  action: string
  description?: string
}

export interface PermissionUpdate {
  name?: string
  description?: string
}

export interface PermissionWithDetails extends Permission {
  roles_count?: number
  users_count?: number
  permission_groups?: PermissionGroup[]
}

export interface PermissionGroup {
  id: string
  name: string
  description?: string
}

export interface PermissionStats {
  total_permissions: number
  by_resource: Record<string, number>
  by_action: Record<string, number>
  most_assigned: Permission[]
  least_assigned: Permission[]
}

// List all permissions
export function usePermissions(resource?: string) {
  return useQuery({
    queryKey: queryKeys.rbac.permissions.list(resource),
    queryFn: async () => {
      const response = await apiClient.get("/rbac/permissions", {
        params: resource ? { resource } : undefined,
      })
      return response.data.data as Permission[]
    },
  })
}

// Get single permission with details
export function usePermission(permissionId: string | undefined) {
  return useQuery({
    queryKey: permissionId ? ["rbac", "permissions", "detail", permissionId] : [],
    queryFn: async () => {
      if (!permissionId) throw new Error("Permission ID is required")
      const response = await apiClient.get(`/rbac/permissions/${permissionId}`)
      return response.data.data as PermissionWithDetails
    },
    enabled: !!permissionId,
  })
}

// Get permission statistics
export function usePermissionStats() {
  return useQuery({
    queryKey: ["rbac", "permissions", "stats"],
    queryFn: async () => {
      const response = await apiClient.get("/rbac/permissions/stats")
      return response.data.data as PermissionStats
    },
  })
}

// Get permissions by resource
export function usePermissionsByResource(resource: string | undefined) {
  return useQuery({
    queryKey: resource ? ["rbac", "permissions", "by-resource", resource] : [],
    queryFn: async () => {
      if (!resource) throw new Error("Resource is required")
      const response = await apiClient.get("/rbac/permissions/by-resource", {
        params: { resource },
      })
      return response.data.data as Permission[]
    },
    enabled: !!resource,
  })
}

// Get permissions by action
export function usePermissionsByAction(action: string | undefined) {
  return useQuery({
    queryKey: action ? ["rbac", "permissions", "by-action", action] : [],
    queryFn: async () => {
      if (!action) throw new Error("Action is required")
      const response = await apiClient.get("/rbac/permissions/by-action", {
        params: { action },
      })
      return response.data.data as Permission[]
    },
    enabled: !!action,
  })
}

// Get permission roles
export function usePermissionRoles(permissionId: string | undefined) {
  return useQuery({
    queryKey: permissionId ? ["rbac", "permissions", "detail", permissionId, "roles"] : [],
    queryFn: async () => {
      if (!permissionId) throw new Error("Permission ID is required")
      const response = await apiClient.get(`/rbac/permissions/${permissionId}/roles`)
      return response.data.data
    },
    enabled: !!permissionId,
  })
}

// Get permission users
export function usePermissionUsers(permissionId: string | undefined) {
  return useQuery({
    queryKey: permissionId ? ["rbac", "permissions", "detail", permissionId, "users"] : [],
    queryFn: async () => {
      if (!permissionId) throw new Error("Permission ID is required")
      const response = await apiClient.get(`/rbac/permissions/${permissionId}/users`)
      return response.data.data
    },
    enabled: !!permissionId,
  })
}

// Create permission mutation
export function useCreatePermission() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: PermissionCreate) => {
      const response = await apiClient.post("/rbac/permissions", data)
      return response.data.data as Permission
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rbac.permissions.all })
      toast.success("Permission created successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create permission")
    },
  })
}

// Update permission mutation
export function useUpdatePermission(permissionId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: PermissionUpdate) => {
      const response = await apiClient.put(`/rbac/permissions/${permissionId}`, data)
      return response.data.data as Permission
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rbac", "permissions", "detail", permissionId] })
      queryClient.invalidateQueries({ queryKey: queryKeys.rbac.permissions.all })
      toast.success("Permission updated successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update permission")
    },
  })
}

// Delete permission mutation
export function useDeletePermission() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (permissionId: string) => {
      await apiClient.delete(`/rbac/permissions/${permissionId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rbac.permissions.all })
      toast.success("Permission deleted successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete permission")
    },
  })
}

// Bulk create permissions
export interface BulkPermissionCreate {
  permissions: PermissionCreate[]
}

export function useBulkCreatePermissions() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: BulkPermissionCreate) => {
      const response = await apiClient.post("/rbac/permissions/bulk", data)
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rbac.permissions.all })
      toast.success(`Created ${data.created_count} permission(s) successfully`)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create permissions")
    },
  })
}
