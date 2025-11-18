/**
 * Form Versioning Hooks
 * React Query hooks for managing form versions, comparison, and restoration
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api"
import { queryKeys } from "@/lib/query-client"
import { toast } from "sonner"

// Types
export interface FormVersion {
  id: string
  form_id: string
  version: number
  title: string
  description?: string
  fields: any[] // Form field schema
  branding?: any
  settings?: any
  status: "draft" | "active" | "archived" | "decommissioned"
  created_by: string
  created_by_username?: string
  created_at: string
  published_at?: string
  changelog?: string
  is_current: boolean
}

export interface FormVersionComparison {
  version1: FormVersion
  version2: FormVersion
  differences: VersionDifference[]
  summary: {
    fields_added: number
    fields_removed: number
    fields_modified: number
    metadata_changes: number
  }
}

export interface VersionDifference {
  type: "added" | "removed" | "modified"
  path: string
  field_name?: string
  old_value?: any
  new_value?: any
  description: string
}

export interface CreateVersionRequest {
  form_id: string
  title?: string
  description?: string
  changelog?: string
}

export interface PublishVersionRequest {
  changelog?: string
}

export interface RestoreVersionRequest {
  create_new_version: boolean // If true, creates new version; if false, overwrites current
  changelog?: string
}

export interface VersionStats {
  total_versions: number
  published_versions: number
  draft_versions: number
  archived_versions: number
  latest_version: number
  oldest_version_date: string
}

// List all versions for a form
export function useFormVersions(formId: string | undefined) {
  return useQuery({
    queryKey: formId ? queryKeys.forms.versions(formId) : [],
    queryFn: async () => {
      if (!formId) throw new Error("Form ID is required")
      const response = await apiClient.get(`/forms/${formId}/versions`)
      return response.data.data as FormVersion[]
    },
    enabled: !!formId,
  })
}

// Get specific version
export function useFormVersion(formId: string | undefined, version: number | undefined) {
  return useQuery({
    queryKey: formId && version ? queryKeys.forms.version(formId, version) : [],
    queryFn: async () => {
      if (!formId || version === undefined) {
        throw new Error("Form ID and version are required")
      }
      const response = await apiClient.get(`/forms/${formId}/versions/${version}`)
      return response.data.data as FormVersion
    },
    enabled: !!formId && version !== undefined,
  })
}

// Get current/latest version
export function useCurrentFormVersion(formId: string | undefined) {
  return useQuery({
    queryKey: formId ? ["forms", "detail", formId, "current-version"] : [],
    queryFn: async () => {
      if (!formId) throw new Error("Form ID is required")
      const response = await apiClient.get(`/forms/${formId}/versions/current`)
      return response.data.data as FormVersion
    },
    enabled: !!formId,
  })
}

// Get version statistics
export function useFormVersionStats(formId: string | undefined) {
  return useQuery({
    queryKey: formId ? ["forms", "detail", formId, "version-stats"] : [],
    queryFn: async () => {
      if (!formId) throw new Error("Form ID is required")
      const response = await apiClient.get(`/forms/${formId}/versions/stats`)
      return response.data.data as VersionStats
    },
    enabled: !!formId,
  })
}

// Compare two versions
export function useCompareVersions(
  formId: string | undefined,
  version1: number | undefined,
  version2: number | undefined
) {
  return useQuery({
    queryKey:
      formId && version1 !== undefined && version2 !== undefined
        ? ["forms", "detail", formId, "compare", version1, version2]
        : [],
    queryFn: async () => {
      if (!formId || version1 === undefined || version2 === undefined) {
        throw new Error("Form ID and both versions are required")
      }
      const response = await apiClient.get(`/forms/${formId}/versions/compare`, {
        params: { version1, version2 },
      })
      return response.data.data as FormVersionComparison
    },
    enabled: !!formId && version1 !== undefined && version2 !== undefined,
  })
}

// Create new version (save current state as new version)
export function useCreateFormVersion(formId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateVersionRequest) => {
      const response = await apiClient.post(`/forms/${formId}/versions`, data)
      return response.data.data as FormVersion
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.forms.versions(formId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.forms.detail(formId) })
      toast.success("New version created successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create version")
    },
  })
}

// Publish version (make it the active version)
export function usePublishVersion(formId: string, version: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data?: PublishVersionRequest) => {
      // Use the correct publish endpoint (no version-specific endpoint exists)
      // This sets form status to "active" (not "published")
      const response = await apiClient.post(`/forms/${formId}/publish`, data)
      return response.data.data as FormVersion
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.forms.versions(formId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.forms.detail(formId) })
      toast.success("Form published successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to publish form")
    },
  })
}

// Archive version
export function useArchiveVersion(formId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (version: number) => {
      const response = await apiClient.post(`/forms/${formId}/versions/${version}/archive`)
      return response.data.data as FormVersion
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.forms.versions(formId) })
      toast.success("Version archived successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to archive version")
    },
  })
}

// Restore version (revert to previous version)
export function useRestoreVersion(formId: string, version: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: RestoreVersionRequest) => {
      const response = await apiClient.post(`/forms/${formId}/versions/${version}/restore`, data)
      return response.data.data as FormVersion
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.forms.versions(formId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.forms.detail(formId) })
      toast.success("Version restored successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to restore version")
    },
  })
}

// Delete version (only for drafts, can't delete published)
export function useDeleteVersion(formId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (version: number) => {
      await apiClient.delete(`/forms/${formId}/versions/${version}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.forms.versions(formId) })
      toast.success("Version deleted successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete version")
    },
  })
}

// Duplicate version (create new version based on existing one)
export function useDuplicateVersion(formId: string, version: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data?: { title?: string; description?: string }) => {
      const response = await apiClient.post(`/forms/${formId}/versions/${version}/duplicate`, data)
      return response.data.data as FormVersion
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.forms.versions(formId) })
      toast.success("Version duplicated successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to duplicate version")
    },
  })
}

// Get version changelog
export function useVersionChangelog(formId: string | undefined) {
  return useQuery({
    queryKey: formId ? ["forms", "detail", formId, "changelog"] : [],
    queryFn: async () => {
      if (!formId) throw new Error("Form ID is required")
      const response = await apiClient.get(`/forms/${formId}/versions/changelog`)
      return response.data.data as Array<{
        version: number
        changelog: string
        created_by: string
        created_at: string
      }>
    },
    enabled: !!formId,
  })
}

// Preview version (get read-only preview of version without activating)
export function usePreviewVersion(formId: string | undefined, version: number | undefined) {
  return useQuery({
    queryKey: formId && version ? ["forms", "detail", formId, "preview", version] : [],
    queryFn: async () => {
      if (!formId || version === undefined) {
        throw new Error("Form ID and version are required")
      }
      const response = await apiClient.get(`/forms/${formId}/versions/${version}/preview`)
      return response.data.data
    },
    enabled: !!formId && version !== undefined,
  })
}
