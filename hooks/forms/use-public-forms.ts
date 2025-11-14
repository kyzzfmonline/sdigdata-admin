/**
 * Public Forms Hooks
 * React Query hooks for managing public form access and anonymous submissions
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api"
import { queryKeys } from "@/lib/query-client"
import { toast } from "sonner"

// Types
export interface PublicFormSettings {
  id: string
  form_id: string
  is_public: boolean
  public_url: string
  custom_slug?: string
  require_auth: boolean
  allow_anonymous: boolean
  allow_multiple_submissions: boolean
  collect_email: boolean
  collect_ip_address: boolean
  show_branding: boolean
  custom_success_message?: string
  redirect_url?: string
  max_submissions?: number
  expires_at?: string
  enabled: boolean
  created_at: string
  updated_at?: string
}

export interface UpdatePublicFormSettingsRequest {
  is_public?: boolean
  custom_slug?: string
  require_auth?: boolean
  allow_anonymous?: boolean
  allow_multiple_submissions?: boolean
  collect_email?: boolean
  collect_ip_address?: boolean
  show_branding?: boolean
  custom_success_message?: string
  redirect_url?: string
  max_submissions?: number
  expires_at?: string
  enabled?: boolean
}

export interface PublicFormSubmission {
  form_data: Record<string, any>
  respondent_email?: string
  metadata?: {
    user_agent?: string
    referrer?: string
    utm_source?: string
    utm_medium?: string
    utm_campaign?: string
  }
}

export interface PublicFormStats {
  total_submissions: number
  unique_visitors: number
  conversion_rate: number
  avg_completion_time_seconds: number
  submissions_by_day: Array<{
    date: string
    count: number
  }>
  top_referrers: Array<{
    referrer: string
    count: number
  }>
}

export interface PublicFormEmbed {
  iframe_code: string
  script_code: string
  link_code: string
  qr_code_url: string
}

export interface PublicFormAccess {
  can_access: boolean
  reason?: string
  form_status: "active" | "expired" | "disabled" | "max_submissions_reached"
  submissions_remaining?: number
}

// Get public form settings
export function usePublicFormSettings(formId: string | undefined) {
  return useQuery({
    queryKey: formId ? ["forms", "detail", formId, "public-settings"] : [],
    queryFn: async () => {
      if (!formId) throw new Error("Form ID is required")
      const response = await apiClient.get(`/forms/${formId}/public-settings`)
      return response.data.data as PublicFormSettings
    },
    enabled: !!formId,
  })
}

// Update public form settings
export function useUpdatePublicFormSettings(formId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: UpdatePublicFormSettingsRequest) => {
      const response = await apiClient.put(`/forms/${formId}/public-settings`, data)
      return response.data.data as PublicFormSettings
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forms", "detail", formId, "public-settings"] })
      toast.success("Public form settings updated successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update public form settings")
    },
  })
}

// Enable public access
export function useEnablePublicAccess(formId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data?: { custom_slug?: string }) => {
      const response = await apiClient.post(`/forms/${formId}/public-settings/enable`, data)
      return response.data.data as PublicFormSettings
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forms", "detail", formId, "public-settings"] })
      toast.success("Public access enabled successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to enable public access")
    },
  })
}

// Disable public access
export function useDisablePublicAccess(formId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post(`/forms/${formId}/public-settings/disable`)
      return response.data.data as PublicFormSettings
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forms", "detail", formId, "public-settings"] })
      toast.success("Public access disabled successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to disable public access")
    },
  })
}

// Get public form by slug (no auth required)
export function usePublicForm(slug: string | undefined) {
  return useQuery({
    queryKey: slug ? ["public-forms", slug] : [],
    queryFn: async () => {
      if (!slug) throw new Error("Form slug is required")
      const response = await apiClient.get(`/public/forms/${slug}`)
      return response.data.data
    },
    enabled: !!slug,
  })
}

// Submit public form (no auth required)
export function useSubmitPublicForm(slug: string) {
  return useMutation({
    mutationFn: async (data: PublicFormSubmission) => {
      const response = await apiClient.post(`/public/forms/${slug}/submit`, data)
      return response.data.data
    },
    onSuccess: () => {
      toast.success("Form submitted successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to submit form")
    },
  })
}

// Check public form access (no auth required)
export function useCheckPublicFormAccess(slug: string | undefined) {
  return useQuery({
    queryKey: slug ? ["public-forms", slug, "access"] : [],
    queryFn: async () => {
      if (!slug) throw new Error("Form slug is required")
      const response = await apiClient.get(`/public/forms/${slug}/access`)
      return response.data.data as PublicFormAccess
    },
    enabled: !!slug,
  })
}

// Get public form statistics
export function usePublicFormStats(formId: string | undefined, days: number = 30) {
  return useQuery({
    queryKey: formId ? ["forms", "detail", formId, "public-stats", days] : [],
    queryFn: async () => {
      if (!formId) throw new Error("Form ID is required")
      const response = await apiClient.get(`/forms/${formId}/public-stats`, {
        params: { days },
      })
      return response.data.data as PublicFormStats
    },
    enabled: !!formId,
  })
}

// Get embed codes
export function usePublicFormEmbed(formId: string | undefined) {
  return useQuery({
    queryKey: formId ? ["forms", "detail", formId, "embed"] : [],
    queryFn: async () => {
      if (!formId) throw new Error("Form ID is required")
      const response = await apiClient.get(`/forms/${formId}/public-settings/embed`)
      return response.data.data as PublicFormEmbed
    },
    enabled: !!formId,
  })
}

// Regenerate public URL
export function useRegeneratePublicUrl(formId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post(`/forms/${formId}/public-settings/regenerate-url`)
      return response.data.data as PublicFormSettings
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forms", "detail", formId, "public-settings"] })
      toast.success("Public URL regenerated successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to regenerate URL")
    },
  })
}

// Check custom slug availability
export function useCheckSlugAvailability() {
  return useMutation({
    mutationFn: async (data: { slug: string; form_id?: string }) => {
      const response = await apiClient.post("/public/forms/check-slug", data)
      return response.data.data as {
        available: boolean
        suggestions?: string[]
      }
    },
  })
}

// Get all public forms (for gallery/discovery)
export interface PublicFormsFilters {
  category?: string
  tags?: string[]
  search?: string
  sort_by?: "recent" | "popular" | "submissions"
  limit?: number
  offset?: number
}

export function usePublicFormsList(filters?: PublicFormsFilters) {
  return useQuery({
    queryKey: ["public-forms", "list", filters],
    queryFn: async () => {
      const response = await apiClient.get("/public/forms", {
        params: filters,
      })
      return response.data.data
    },
  })
}

// Track public form view (analytics)
export function useTrackPublicFormView(slug: string) {
  return useMutation({
    mutationFn: async (data?: { referrer?: string; utm_params?: Record<string, string> }) => {
      await apiClient.post(`/public/forms/${slug}/track-view`, data)
    },
  })
}

// Get public form submission confirmation
export function usePublicFormSubmissionConfirmation(
  slug: string | undefined,
  submissionId: string | undefined
) {
  return useQuery({
    queryKey: slug && submissionId ? ["public-forms", slug, "submissions", submissionId] : [],
    queryFn: async () => {
      if (!slug || !submissionId) {
        throw new Error("Form slug and submission ID are required")
      }
      const response = await apiClient.get(
        `/public/forms/${slug}/submissions/${submissionId}/confirmation`
      )
      return response.data.data
    },
    enabled: !!slug && !!submissionId,
  })
}

// Save draft submission (for multi-step forms)
export function useSavePublicFormDraft(slug: string) {
  return useMutation({
    mutationFn: async (data: { form_data: Record<string, any>; step?: number }) => {
      const response = await apiClient.post(`/public/forms/${slug}/save-draft`, data)
      return response.data.data as {
        draft_id: string
        expires_at: string
      }
    },
  })
}

// Load draft submission
export function usePublicFormDraft(slug: string | undefined, draftId: string | undefined) {
  return useQuery({
    queryKey: slug && draftId ? ["public-forms", slug, "drafts", draftId] : [],
    queryFn: async () => {
      if (!slug || !draftId) {
        throw new Error("Form slug and draft ID are required")
      }
      const response = await apiClient.get(`/public/forms/${slug}/drafts/${draftId}`)
      return response.data.data
    },
    enabled: !!slug && !!draftId,
  })
}

// Report public form (spam, abuse, etc.)
export function useReportPublicForm(slug: string) {
  return useMutation({
    mutationFn: async (data: { reason: string; details?: string; email?: string }) => {
      const response = await apiClient.post(`/public/forms/${slug}/report`, data)
      return response.data.data
    },
    onSuccess: () => {
      toast.success("Report submitted successfully. Thank you for your feedback.")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to submit report")
    },
  })
}
