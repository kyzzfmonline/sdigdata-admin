/**
 * React Query hooks for form templates
 */

"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { templatesAPI } from "@/lib/api"
import { toast } from "@/hooks/use-toast"

/**
 * Get all templates with optional filters
 */
export function useTemplates(params?: {
  category?: string
  search?: string
  is_public?: boolean
  organization_id?: string
  sort?: string
  order?: "asc" | "desc"
  page?: number
  limit?: number
}) {
  return useQuery({
    queryKey: ["templates", params],
    queryFn: async () => {
      const response = await templatesAPI.getAll(params)
      return response.data.data
    },
  })
}

/**
 * Get popular templates
 */
export function usePopularTemplates(limit?: number) {
  return useQuery({
    queryKey: ["templates", "popular", limit],
    queryFn: async () => {
      const response = await templatesAPI.getPopular()
      return response.data.data
    },
  })
}

/**
 * Get single template by ID
 */
export function useTemplate(id: string | null) {
  return useQuery({
    queryKey: ["templates", id],
    queryFn: async () => {
      if (!id) return null
      const response = await templatesAPI.getById(id)
      return response.data.data
    },
    enabled: !!id,
  })
}

/**
 * Save form as template
 */
export function useSaveAsTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      formId,
      data,
    }: {
      formId: string
      data: {
        name: string
        description?: string
        category: string
        is_public?: boolean
        tags?: string[]
        thumbnail_url?: string
      }
    }) => {
      const response = await templatesAPI.saveAsTemplate(formId, data)
      return response.data.data
    },
    onSuccess: (data) => {
      // Invalidate templates list
      queryClient.invalidateQueries({ queryKey: ["templates"] })

      toast({
        title: "Template Created",
        description: `Form saved as template "${data.name}" successfully`,
      })
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Save Template",
        description: error.response?.data?.detail || "An error occurred",
        variant: "destructive",
      })
    },
  })
}

/**
 * Create form from template
 */
export function useCreateFromTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      templateId,
      title,
      organizationId,
    }: {
      templateId: string
      title?: string
      organizationId?: string
    }) => {
      const response = await templatesAPI.useTemplate(templateId, {
        title: title || "",
        organization_id: organizationId || "default",
      })
      return response.data.data
    },
    onSuccess: (data) => {
      // Invalidate forms list
      queryClient.invalidateQueries({ queryKey: ["forms"] })

      toast({
        title: "Form Created",
        description: "Form created from template successfully",
      })

      return data
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Create Form",
        description: error.response?.data?.detail || "An error occurred",
        variant: "destructive",
      })
    },
  })
}

/**
 * Create new template (admin only)
 */
export function useCreateTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      name: string
      description?: string
      category: string
      form_schema: Record<string, any>
      thumbnail_url?: string
      is_public?: boolean
      tags?: string[]
    }) => {
      const response = await templatesAPI.create(data)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] })

      toast({
        title: "Template Created",
        description: "Template created successfully",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Create Template",
        description: error.response?.data?.detail || "An error occurred",
        variant: "destructive",
      })
    },
  })
}

/**
 * Update template (admin only)
 */
export function useUpdateTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string
      data: {
        name?: string
        description?: string
        form_schema?: Record<string, any>
        thumbnail_url?: string
        is_public?: boolean
        tags?: string[]
      }
    }) => {
      const response = await templatesAPI.update(id, data)
      return response.data.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["templates"] })
      queryClient.invalidateQueries({ queryKey: ["templates", variables.id] })

      toast({
        title: "Template Updated",
        description: "Template updated successfully",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Update Template",
        description: error.response?.data?.detail || "An error occurred",
        variant: "destructive",
      })
    },
  })
}

/**
 * Delete template (admin only)
 */
export function useDeleteTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await templatesAPI.delete(id)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] })

      toast({
        title: "Template Deleted",
        description: "Template deleted successfully",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Delete Template",
        description: error.response?.data?.detail || "An error occurred",
        variant: "destructive",
      })
    },
  })
}
