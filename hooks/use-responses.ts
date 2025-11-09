import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { responsesAPI } from "@/lib/api"
import { queryKeys } from "@/lib/query-client"
import { useToast } from "@/hooks/use-toast"

interface ResponsesParams {
  form_id?: string
}

// Fetch all responses with optional filters
export function useResponses(params?: ResponsesParams) {
  return useQuery({
    queryKey: queryKeys.responses.all(params),
    queryFn: async () => {
      const response = await responsesAPI.getAll(params)
      // Backend returns {success, data: {responses, total, limit, offset}}
      return response.data.data.responses
    },
  })
}

// Fetch single response by ID
export function useResponse(id: string) {
  return useQuery({
    queryKey: queryKeys.responses.detail(id),
    queryFn: async () => {
      const response = await responsesAPI.getById(id)
      return response.data.data
    },
    enabled: !!id,
  })
}

// Create response mutation
export function useCreateResponse() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: {
      form_id: string
      data: any
      attachments?: Record<string, string>
    }) => {
      const response = await responsesAPI.create(data)
      return response.data.data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.responses.all() })
      queryClient.invalidateQueries({
        queryKey: queryKeys.responses.all({ form_id: variables.form_id }),
      })
      toast({
        title: "Success",
        description: "Response submitted successfully",
      })
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit response",
        variant: "destructive",
      })
    },
  })
}

// Delete response mutation (soft delete)
export function useDeleteResponse() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await responsesAPI.delete(id)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.responses.all() })
      toast({
        title: "Success",
        description: "Response deleted successfully",
      })
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete response",
        variant: "destructive",
      })
    },
  })
}

// Cleanup deleted responses mutation (admin only)
export function useCleanupResponses() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async () => {
      const response = await responsesAPI.cleanup()
      return response.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.responses.all() })
      toast({
        title: "Success",
        description: `Cleaned up ${data.data.deleted_count} deleted responses`,
      })
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to cleanup deleted responses",
        variant: "destructive",
      })
    },
  })
}
