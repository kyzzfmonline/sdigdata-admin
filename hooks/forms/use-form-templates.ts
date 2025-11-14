/**
 * Form Templates Hooks
 * React Query hooks for managing form templates and creating forms from templates
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api"
import { queryKeys } from "@/lib/query-client"
import { toast } from "sonner"

// Types
export interface FormTemplate {
  id: string
  name: string
  description?: string
  category: string
  tags: string[]
  thumbnail_url?: string
  preview_url?: string
  fields: any[] // Template field schema
  branding?: any
  settings?: any
  is_public: boolean
  is_featured: boolean
  created_by: string
  created_by_username?: string
  organization_id?: string
  usage_count: number
  rating?: number
  created_at: string
  updated_at?: string
}

export interface TemplateCategory {
  id: string
  name: string
  description?: string
  icon?: string
  template_count: number
}

export interface CreateTemplateRequest {
  name: string
  description?: string
  category: string
  tags?: string[]
  fields: any[]
  branding?: any
  settings?: any
  is_public?: boolean
  thumbnail_url?: string
}

export interface UpdateTemplateRequest {
  name?: string
  description?: string
  category?: string
  tags?: string[]
  fields?: any[]
  branding?: any
  settings?: any
  is_public?: boolean
  thumbnail_url?: string
}

export interface CreateFormFromTemplateRequest {
  template_id: string
  title: string
  description?: string
  customize?: {
    branding?: any
    settings?: any
  }
}

export interface TemplateFilters {
  category?: string
  tags?: string[]
  is_public?: boolean
  is_featured?: boolean
  search?: string
  sort_by?: "popular" | "recent" | "name" | "rating"
  limit?: number
  offset?: number
}

export interface TemplateStats {
  total_templates: number
  public_templates: number
  private_templates: number
  featured_templates: number
  templates_by_category: Record<string, number>
  most_popular: FormTemplate[]
}

// List all templates with filters
export function useFormTemplates(filters?: TemplateFilters) {
  return useQuery({
    queryKey: queryKeys.templates.all(filters),
    queryFn: async () => {
      const response = await apiClient.get("/templates", {
        params: filters,
      })
      return response.data.data as FormTemplate[]
    },
  })
}

// Get single template
export function useFormTemplate(templateId: string | undefined) {
  return useQuery({
    queryKey: templateId ? queryKeys.templates.detail(templateId) : [],
    queryFn: async () => {
      if (!templateId) throw new Error("Template ID is required")
      const response = await apiClient.get(`/templates/${templateId}`)
      return response.data.data as FormTemplate
    },
    enabled: !!templateId,
  })
}

// Get template categories
export function useTemplateCategories() {
  return useQuery({
    queryKey: ["templates", "categories"],
    queryFn: async () => {
      const response = await apiClient.get("/templates/categories")
      return response.data.data as TemplateCategory[]
    },
  })
}

// Get popular templates
export function usePopularTemplates(limit: number = 10) {
  return useQuery({
    queryKey: queryKeys.templates.popular(limit),
    queryFn: async () => {
      const response = await apiClient.get("/templates/popular", {
        params: { limit },
      })
      return response.data.data as FormTemplate[]
    },
  })
}

// Get featured templates
export function useFeaturedTemplates() {
  return useQuery({
    queryKey: ["templates", "featured"],
    queryFn: async () => {
      const response = await apiClient.get("/templates/featured")
      return response.data.data as FormTemplate[]
    },
  })
}

// Get templates by category
export function useTemplatesByCategory(category: string | undefined) {
  return useQuery({
    queryKey: category ? ["templates", "by-category", category] : [],
    queryFn: async () => {
      if (!category) throw new Error("Category is required")
      const response = await apiClient.get("/templates/by-category", {
        params: { category },
      })
      return response.data.data as FormTemplate[]
    },
    enabled: !!category,
  })
}

// Get my templates (created by current user)
export function useMyTemplates() {
  return useQuery({
    queryKey: ["templates", "my"],
    queryFn: async () => {
      const response = await apiClient.get("/users/me/templates")
      return response.data.data as FormTemplate[]
    },
  })
}

// Get template stats
export function useTemplateStats() {
  return useQuery({
    queryKey: ["templates", "stats"],
    queryFn: async () => {
      const response = await apiClient.get("/templates/stats")
      return response.data.data as TemplateStats
    },
  })
}

// Create template
export function useCreateTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateTemplateRequest) => {
      const response = await apiClient.post("/templates", data)
      return response.data.data as FormTemplate
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] })
      toast.success("Template created successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create template")
    },
  })
}

// Update template
export function useUpdateTemplate(templateId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: UpdateTemplateRequest) => {
      const response = await apiClient.put(`/templates/${templateId}`, data)
      return response.data.data as FormTemplate
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.templates.detail(templateId) })
      queryClient.invalidateQueries({ queryKey: ["templates"] })
      toast.success("Template updated successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update template")
    },
  })
}

// Delete template
export function useDeleteTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (templateId: string) => {
      await apiClient.delete(`/templates/${templateId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] })
      toast.success("Template deleted successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete template")
    },
  })
}

// Create form from template
export function useCreateFormFromTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateFormFromTemplateRequest) => {
      const response = await apiClient.post("/templates/create-form", data)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.forms.all() })
      toast.success("Form created from template successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create form from template")
    },
  })
}

// Save form as template
export function useSaveFormAsTemplate(formId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Omit<CreateTemplateRequest, "fields">) => {
      const response = await apiClient.post(`/forms/${formId}/save-as-template`, data)
      return response.data.data as FormTemplate
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] })
      toast.success("Form saved as template successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to save form as template")
    },
  })
}

// Duplicate template
export function useDuplicateTemplate(templateId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data?: { name?: string; description?: string }) => {
      const response = await apiClient.post(`/templates/${templateId}/duplicate`, data)
      return response.data.data as FormTemplate
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] })
      toast.success("Template duplicated successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to duplicate template")
    },
  })
}

// Preview template
export function usePreviewTemplate(templateId: string | undefined) {
  return useQuery({
    queryKey: templateId ? ["templates", "preview", templateId] : [],
    queryFn: async () => {
      if (!templateId) throw new Error("Template ID is required")
      const response = await apiClient.get(`/templates/${templateId}/preview`)
      return response.data.data
    },
    enabled: !!templateId,
  })
}

// Rate template
export function useRateTemplate(templateId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (rating: number) => {
      const response = await apiClient.post(`/templates/${templateId}/rate`, { rating })
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.templates.detail(templateId) })
      toast.success("Rating submitted successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to submit rating")
    },
  })
}

// Search templates
export function useSearchTemplates(query: string | undefined) {
  return useQuery({
    queryKey: query ? ["templates", "search", query] : [],
    queryFn: async () => {
      if (!query) throw new Error("Search query is required")
      const response = await apiClient.get("/templates/search", {
        params: { q: query },
      })
      return response.data.data as FormTemplate[]
    },
    enabled: !!query && query.length > 2,
  })
}

// Get template usage history
export function useTemplateUsageHistory(templateId: string | undefined) {
  return useQuery({
    queryKey: templateId ? ["templates", "detail", templateId, "usage-history"] : [],
    queryFn: async () => {
      if (!templateId) throw new Error("Template ID is required")
      const response = await apiClient.get(`/templates/${templateId}/usage-history`)
      return response.data.data
    },
    enabled: !!templateId,
  })
}
