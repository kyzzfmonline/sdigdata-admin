import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { electionsAPI } from "@/lib/api"
import { queryKeys } from "@/lib/query-client"
import { useToast } from "@/hooks/use-toast"
import type {
  Election,
  ElectionPosition,
  Candidate,
  PollOption,
  CreateElectionInput,
  UpdateElectionInput,
  CreatePositionInput,
  UpdatePositionInput,
  CreateCandidateInput,
  UpdateCandidateInput,
  CreatePollOptionInput,
  UpdatePollOptionInput,
  ElectionAuditLog,
} from "@/lib/types"

// ============================================
// ELECTION QUERIES
// ============================================

// Fetch all elections with optional filters
export function useElections(params?: {
  organization_id?: string
  status?: string
  election_type?: string
  page?: number
  limit?: number
}) {
  return useQuery({
    queryKey: queryKeys.elections.all(params),
    queryFn: async () => {
      const response = await electionsAPI.getAll(params)
      return response.data.data as Election[]
    },
  })
}

// Fetch single election by ID (includes positions, candidates, poll options)
export function useElection(id: string) {
  return useQuery({
    queryKey: queryKeys.elections.detail(id),
    queryFn: async () => {
      const response = await electionsAPI.getById(id)
      return response.data.data as Election
    },
    enabled: !!id,
  })
}

// Fetch election audit log
export function useElectionAuditLog(
  electionId: string,
  params?: { page?: number; limit?: number }
) {
  return useQuery({
    queryKey: queryKeys.elections.auditLog(electionId),
    queryFn: async () => {
      const response = await electionsAPI.getAuditLog(electionId, params)
      return response.data.data as ElectionAuditLog[]
    },
    enabled: !!electionId,
  })
}

// ============================================
// ELECTION MUTATIONS
// ============================================

// Create election mutation
export function useCreateElection() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: CreateElectionInput) => {
      const response = await electionsAPI.create(data)
      return response.data.data as Election
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.elections.all() })
      queryClient.invalidateQueries({ queryKey: queryKeys.elections.dashboard() })
      toast({
        title: "Success",
        description: "Election created successfully",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create election",
        variant: "destructive",
      })
    },
  })
}

// Update election mutation
export function useUpdateElection() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateElectionInput }) => {
      const response = await electionsAPI.update(id, data)
      return response.data.data as Election
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.elections.all() })
      queryClient.invalidateQueries({ queryKey: queryKeys.elections.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.elections.dashboard() })
      toast({
        title: "Success",
        description: "Election updated successfully",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update election",
        variant: "destructive",
      })
    },
  })
}

// Delete election mutation (soft delete)
export function useDeleteElection() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await electionsAPI.delete(id)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.elections.all() })
      queryClient.invalidateQueries({ queryKey: queryKeys.elections.dashboard() })
      toast({
        title: "Success",
        description: "Election deleted successfully",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete election",
        variant: "destructive",
      })
    },
  })
}

// ============================================
// LIFECYCLE MUTATIONS
// ============================================

// Publish election
export function usePublishElection() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await electionsAPI.publish(id)
      return response.data.data as Election
    },
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.elections.all() })
      queryClient.invalidateQueries({ queryKey: queryKeys.elections.detail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.elections.dashboard() })
      toast({
        title: "Success",
        description: "Election published successfully",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to publish election",
        variant: "destructive",
      })
    },
  })
}

// Pause election
export function usePauseElection() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await electionsAPI.pause(id)
      return response.data.data as Election
    },
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.elections.all() })
      queryClient.invalidateQueries({ queryKey: queryKeys.elections.detail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.elections.dashboard() })
      toast({
        title: "Success",
        description: "Election paused successfully",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to pause election",
        variant: "destructive",
      })
    },
  })
}

// Resume election
export function useResumeElection() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await electionsAPI.resume(id)
      return response.data.data as Election
    },
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.elections.all() })
      queryClient.invalidateQueries({ queryKey: queryKeys.elections.detail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.elections.dashboard() })
      toast({
        title: "Success",
        description: "Election resumed successfully",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to resume election",
        variant: "destructive",
      })
    },
  })
}

// Close election
export function useCloseElection() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await electionsAPI.close(id)
      return response.data.data as Election
    },
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.elections.all() })
      queryClient.invalidateQueries({ queryKey: queryKeys.elections.detail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.elections.dashboard() })
      toast({
        title: "Success",
        description: "Election closed successfully",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to close election",
        variant: "destructive",
      })
    },
  })
}

// Cancel election
export function useCancelElection() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await electionsAPI.cancel(id)
      return response.data.data as Election
    },
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.elections.all() })
      queryClient.invalidateQueries({ queryKey: queryKeys.elections.detail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.elections.dashboard() })
      toast({
        title: "Success",
        description: "Election cancelled",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to cancel election",
        variant: "destructive",
      })
    },
  })
}

// ============================================
// POSITION QUERIES & MUTATIONS
// ============================================

// Fetch positions for an election
export function usePositions(electionId: string) {
  return useQuery({
    queryKey: queryKeys.elections.positions(electionId),
    queryFn: async () => {
      const response = await electionsAPI.getPositions(electionId)
      return response.data.data as ElectionPosition[]
    },
    enabled: !!electionId,
  })
}

// Create position
export function useCreatePosition() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({
      electionId,
      data,
    }: {
      electionId: string
      data: CreatePositionInput
    }) => {
      const response = await electionsAPI.createPosition(electionId, data)
      return response.data.data as ElectionPosition
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.elections.positions(variables.electionId),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.elections.detail(variables.electionId),
      })
      toast({
        title: "Success",
        description: "Position created successfully",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create position",
        variant: "destructive",
      })
    },
  })
}

// Update position
export function useUpdatePosition() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({
      electionId,
      positionId,
      data,
    }: {
      electionId: string
      positionId: string
      data: UpdatePositionInput
    }) => {
      const response = await electionsAPI.updatePosition(electionId, positionId, data)
      return response.data.data as ElectionPosition
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.elections.positions(variables.electionId),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.elections.detail(variables.electionId),
      })
      toast({
        title: "Success",
        description: "Position updated successfully",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update position",
        variant: "destructive",
      })
    },
  })
}

// Delete position
export function useDeletePosition() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({
      electionId,
      positionId,
    }: {
      electionId: string
      positionId: string
    }) => {
      const response = await electionsAPI.deletePosition(electionId, positionId)
      return response.data
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.elections.positions(variables.electionId),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.elections.detail(variables.electionId),
      })
      toast({
        title: "Success",
        description: "Position deleted successfully",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete position",
        variant: "destructive",
      })
    },
  })
}

// ============================================
// CANDIDATE QUERIES & MUTATIONS
// ============================================

// Fetch candidates for a position
export function useCandidates(electionId: string, positionId: string) {
  return useQuery({
    queryKey: queryKeys.elections.candidates(electionId, positionId),
    queryFn: async () => {
      const response = await electionsAPI.getCandidates(electionId, positionId)
      return response.data.data as Candidate[]
    },
    enabled: !!electionId && !!positionId,
  })
}

// Create candidate
export function useCreateCandidate() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({
      electionId,
      positionId,
      data,
    }: {
      electionId: string
      positionId: string
      data: CreateCandidateInput
    }) => {
      const response = await electionsAPI.createCandidate(electionId, positionId, data)
      return response.data.data as Candidate
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.elections.candidates(variables.electionId, variables.positionId),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.elections.detail(variables.electionId),
      })
      toast({
        title: "Success",
        description: "Candidate added successfully",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to add candidate",
        variant: "destructive",
      })
    },
  })
}

// Update candidate
export function useUpdateCandidate() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({
      electionId,
      positionId,
      candidateId,
      data,
    }: {
      electionId: string
      positionId: string
      candidateId: string
      data: UpdateCandidateInput
    }) => {
      const response = await electionsAPI.updateCandidate(
        electionId,
        positionId,
        candidateId,
        data
      )
      return response.data.data as Candidate
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.elections.candidates(variables.electionId, variables.positionId),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.elections.detail(variables.electionId),
      })
      toast({
        title: "Success",
        description: "Candidate updated successfully",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update candidate",
        variant: "destructive",
      })
    },
  })
}

// Delete candidate
export function useDeleteCandidate() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({
      electionId,
      positionId,
      candidateId,
    }: {
      electionId: string
      positionId: string
      candidateId: string
    }) => {
      const response = await electionsAPI.deleteCandidate(electionId, positionId, candidateId)
      return response.data
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.elections.candidates(variables.electionId, variables.positionId),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.elections.detail(variables.electionId),
      })
      toast({
        title: "Success",
        description: "Candidate removed successfully",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to remove candidate",
        variant: "destructive",
      })
    },
  })
}

// ============================================
// POLL OPTION QUERIES & MUTATIONS
// ============================================

// Fetch poll options for an election
export function usePollOptions(electionId: string) {
  return useQuery({
    queryKey: queryKeys.elections.pollOptions(electionId),
    queryFn: async () => {
      const response = await electionsAPI.getPollOptions(electionId)
      return response.data.data as PollOption[]
    },
    enabled: !!electionId,
  })
}

// Create poll option
export function useCreatePollOption() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({
      electionId,
      data,
    }: {
      electionId: string
      data: CreatePollOptionInput
    }) => {
      const response = await electionsAPI.createPollOption(electionId, data)
      return response.data.data as PollOption
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.elections.pollOptions(variables.electionId),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.elections.detail(variables.electionId),
      })
      toast({
        title: "Success",
        description: "Poll option added successfully",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to add poll option",
        variant: "destructive",
      })
    },
  })
}

// Update poll option
export function useUpdatePollOption() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({
      electionId,
      optionId,
      data,
    }: {
      electionId: string
      optionId: string
      data: UpdatePollOptionInput
    }) => {
      const response = await electionsAPI.updatePollOption(electionId, optionId, data)
      return response.data.data as PollOption
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.elections.pollOptions(variables.electionId),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.elections.detail(variables.electionId),
      })
      toast({
        title: "Success",
        description: "Poll option updated successfully",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update poll option",
        variant: "destructive",
      })
    },
  })
}

// Delete poll option
export function useDeletePollOption() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({
      electionId,
      optionId,
    }: {
      electionId: string
      optionId: string
    }) => {
      const response = await electionsAPI.deletePollOption(electionId, optionId)
      return response.data
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.elections.pollOptions(variables.electionId),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.elections.detail(variables.electionId),
      })
      toast({
        title: "Success",
        description: "Poll option removed successfully",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to remove poll option",
        variant: "destructive",
      })
    },
  })
}
