import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { formsAPI } from "@/lib/api"
import { queryKeys } from "@/lib/query-client"
import { useToast } from "@/hooks/use-toast"
import type { Form } from "@/lib/types"

// Fetch all forms with optional filters
export function useForms(params?: { organization_id?: string; status?: string }) {
  return useQuery({
    queryKey: queryKeys.forms.all(params),
    queryFn: async () => {
      const response = await formsAPI.getAll(params)
      return response.data.data as Form[]
    },
  })
}

// Fetch assigned forms (for agents)
export function useAssignedForms() {
  return useQuery({
    queryKey: queryKeys.forms.assigned,
    queryFn: async () => {
      const response = await formsAPI.getAssigned()
      return response.data.data as Form[]
    },
  })
}

// Fetch single form by ID
export function useForm(id: string) {
  return useQuery({
    queryKey: queryKeys.forms.detail(id),
    queryFn: async () => {
      const response = await formsAPI.getById(id)
      return response.data.data as Form
    },
    enabled: !!id,
  })
}

// Fetch form templates
export function useFormTemplates() {
  return useQuery({
    queryKey: queryKeys.forms.templates,
    queryFn: async () => {
      const response = await formsAPI.getTemplates()
      return response.data.data as Form[]
    },
  })
}

// Create form mutation
export function useCreateForm() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await formsAPI.create(data)
      return response.data.data as Form
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.forms.all() })
      toast({
        title: "Success",
        description: "Form created successfully",
      })
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create form",
        variant: "destructive",
      })
    },
  })
}

// Update form mutation
export function useUpdateForm() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await formsAPI.update(id, data)
      return response.data.data as Form
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.forms.all() })
      queryClient.invalidateQueries({ queryKey: queryKeys.forms.detail(variables.id) })
      toast({
        title: "Success",
        description: "Form updated successfully",
      })
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update form",
        variant: "destructive",
      })
    },
  })
}

// Publish form mutation
export function usePublishForm() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await formsAPI.publish(id)
      return response.data.data as Form
    },
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.forms.all() })
      queryClient.invalidateQueries({ queryKey: queryKeys.forms.detail(id) })
      toast({
        title: "Success",
        description: "Form published successfully",
      })
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to publish form",
        variant: "destructive",
      })
    },
  })
}

// Assign form mutation
export function useAssignForm() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string
      data: { agent_ids: string[]; due_date?: string; target_responses?: number }
    }) => {
      const response = await formsAPI.assign(id, data)
      return response.data.data
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.forms.all() })
      queryClient.invalidateQueries({ queryKey: queryKeys.forms.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.forms.assigned })
      toast({
        title: "Success",
        description: "Form assigned successfully",
      })
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to assign form",
        variant: "destructive",
      })
    },
  })
}

// Duplicate form mutation
export function useDuplicateForm() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await formsAPI.duplicate(id)
      return response.data.data as Form
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.forms.all() })
      toast({
        title: "Success",
        description: "Form duplicated successfully",
      })
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to duplicate form",
        variant: "destructive",
      })
    },
  })
}

// Delete form mutation (soft delete)
export function useDeleteForm() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await formsAPI.delete(id)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.forms.all() })
      toast({
        title: "Success",
        description: "Form deleted successfully",
      })
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete form",
        variant: "destructive",
      })
    },
  })
}

// Export form mutation
export function useExportForm() {
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (formId: string) => {
      const response = await formsAPI.export(formId)
      return response.data
    },
    onSuccess: (blob, formId) => {
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `form-${formId}-export.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast({
        title: "Success",
        description: "Form exported successfully",
      })
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to export form",
        variant: "destructive",
      })
    },
  })
}

// Cleanup deleted forms mutation (admin only)
export function useCleanupForms() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async () => {
      const response = await formsAPI.cleanup()
      return response.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.forms.all() })
      toast({
        title: "Success",
        description: `Cleaned up ${data.data.deleted_count} deleted forms`,
      })
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to cleanup deleted forms",
        variant: "destructive",
      })
    },
  })
}
