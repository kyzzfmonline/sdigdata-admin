/**
 * RBAC Permission Groups Hooks
 * React Query hooks for managing permission groups
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api"
import { queryKeys } from "@/lib/query-client"
import { toast } from "sonner"

// Types
export interface PermissionGroup {
  id: string
  name: string
  description?: string
  organization_id?: string
  permission_count?: number
  created_at: string
  updated_at?: string
}

export interface PermissionGroupCreate {
  name: string
  description?: string
  organization_id?: string
}

export interface PermissionGroupUpdate {
  name?: string
  description?: string
}

export interface PermissionGroupWithDetails extends PermissionGroup {
  permissions: GroupPermission[]
}

export interface GroupPermission {
  id: string
  name: string
  resource: string
  action: string
  description?: string
}

export interface AssignPermissionsToGroupRequest {
  permission_ids: string[]
}

// List all permission groups
export function usePermissionGroups(orgId?: string) {
  return useQuery({
    queryKey: queryKeys.rbac.permissionGroups.list(orgId),
    queryFn: async () => {
      const response = await apiClient.get("/rbac/permission-groups", {
        params: orgId ? { organization_id: orgId } : undefined,
      })
      return response.data.data as PermissionGroup[]
    },
  })
}

// Get single permission group with details
export function usePermissionGroup(groupId: string | undefined) {
  return useQuery({
    queryKey: groupId ? queryKeys.rbac.permissionGroups.detail(groupId) : [],
    queryFn: async () => {
      if (!groupId) throw new Error("Permission group ID is required")
      const response = await apiClient.get(`/rbac/permission-groups/${groupId}`)
      return response.data.data as PermissionGroupWithDetails
    },
    enabled: !!groupId,
  })
}

// Get permission group permissions
export function usePermissionGroupPermissions(groupId: string | undefined) {
  return useQuery({
    queryKey: groupId ? ["rbac", "permission-groups", "detail", groupId, "permissions"] : [],
    queryFn: async () => {
      if (!groupId) throw new Error("Permission group ID is required")
      const response = await apiClient.get(`/rbac/permission-groups/${groupId}/permissions`)
      return response.data.data as GroupPermission[]
    },
    enabled: !!groupId,
  })
}

// Get permission group roles (roles that have this group assigned)
export function usePermissionGroupRoles(groupId: string | undefined) {
  return useQuery({
    queryKey: groupId ? ["rbac", "permission-groups", "detail", groupId, "roles"] : [],
    queryFn: async () => {
      if (!groupId) throw new Error("Permission group ID is required")
      const response = await apiClient.get(`/rbac/permission-groups/${groupId}/roles`)
      return response.data.data
    },
    enabled: !!groupId,
  })
}

// Get permission groups by organization
export function usePermissionGroupsByOrg(orgId: string | undefined) {
  return useQuery({
    queryKey: orgId ? ["rbac", "permission-groups", "by-org", orgId] : [],
    queryFn: async () => {
      if (!orgId) throw new Error("Organization ID is required")
      const response = await apiClient.get("/rbac/permission-groups/by-organization", {
        params: { organization_id: orgId },
      })
      return response.data.data as PermissionGroup[]
    },
    enabled: !!orgId,
  })
}

// Create permission group mutation
export function useCreatePermissionGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: PermissionGroupCreate) => {
      const response = await apiClient.post("/rbac/permission-groups", data)
      return response.data.data as PermissionGroup
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rbac.permissionGroups.all })
      toast.success("Permission group created successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create permission group")
    },
  })
}

// Update permission group mutation
export function useUpdatePermissionGroup(groupId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: PermissionGroupUpdate) => {
      const response = await apiClient.put(`/rbac/permission-groups/${groupId}`, data)
      return response.data.data as PermissionGroup
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rbac.permissionGroups.detail(groupId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.rbac.permissionGroups.all })
      toast.success("Permission group updated successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update permission group")
    },
  })
}

// Delete permission group mutation
export function useDeletePermissionGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (groupId: string) => {
      await apiClient.delete(`/rbac/permission-groups/${groupId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rbac.permissionGroups.all })
      toast.success("Permission group deleted successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete permission group")
    },
  })
}

// Assign permissions to group
export function useAssignPermissionsToGroup(groupId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: AssignPermissionsToGroupRequest) => {
      const response = await apiClient.post(`/rbac/permission-groups/${groupId}/permissions`, data)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["rbac", "permission-groups", "detail", groupId, "permissions"],
      })
      queryClient.invalidateQueries({ queryKey: queryKeys.rbac.permissionGroups.detail(groupId) })
      toast.success("Permissions assigned to group successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to assign permissions")
    },
  })
}

// Revoke permissions from group
export function useRevokePermissionsFromGroup(groupId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: AssignPermissionsToGroupRequest) => {
      const response = await apiClient.delete(`/rbac/permission-groups/${groupId}/permissions`, {
        data,
      })
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["rbac", "permission-groups", "detail", groupId, "permissions"],
      })
      queryClient.invalidateQueries({ queryKey: queryKeys.rbac.permissionGroups.detail(groupId) })
      toast.success("Permissions revoked from group successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to revoke permissions")
    },
  })
}

// Clone permission group
export interface ClonePermissionGroupRequest {
  new_name: string
  new_description?: string
  organization_id?: string
}

export function useClonePermissionGroup(groupId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: ClonePermissionGroupRequest) => {
      const response = await apiClient.post(`/rbac/permission-groups/${groupId}/clone`, data)
      return response.data.data as PermissionGroup
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rbac.permissionGroups.all })
      toast.success("Permission group cloned successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to clone permission group")
    },
  })
}
