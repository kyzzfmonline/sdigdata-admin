import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { candidateProfilesAPI } from "@/lib/api"
import { queryKeys } from "@/lib/query-client"
import { useToast } from "@/hooks/use-toast"
import type {
  CandidateProfile,
  CreateCandidateProfileInput,
  UpdateCandidateProfileInput,
  CandidateStats,
  CandidateLeaderboardEntry,
  AssignCandidateInput,
  CandidateAssignment,
  CandidacyStatus,
} from "@/lib/types"

// ============================================
// CANDIDATE PROFILE QUERIES
// ============================================

export function useCandidateProfiles(params?: {
  party?: string
  status?: string
  search?: string
  limit?: number
  offset?: number
}) {
  return useQuery({
    queryKey: queryKeys.candidateProfiles.all(params),
    queryFn: async () => {
      const response = await candidateProfilesAPI.getAll(params)
      return response.data.data as {
        profiles: CandidateProfile[]
        total: number
        limit: number
        offset: number
      }
    },
  })
}

export function useCandidateProfile(id: string) {
  return useQuery({
    queryKey: queryKeys.candidateProfiles.detail(id),
    queryFn: async () => {
      const response = await candidateProfilesAPI.getById(id)
      return response.data.data as CandidateProfile
    },
    enabled: !!id,
  })
}

export function useCandidateStats(id: string) {
  return useQuery({
    queryKey: queryKeys.candidateProfiles.stats(id),
    queryFn: async () => {
      const response = await candidateProfilesAPI.getStats(id)
      return response.data.data as CandidateStats
    },
    enabled: !!id,
  })
}

export function useCandidateLeaderboard(params?: {
  sort_by?: "total_wins" | "total_votes" | "win_rate" | "elections_count"
  limit?: number
}) {
  return useQuery({
    queryKey: queryKeys.candidateProfiles.leaderboard(params),
    queryFn: async () => {
      const response = await candidateProfilesAPI.getLeaderboard(params)
      return response.data.data as CandidateLeaderboardEntry[]
    },
  })
}

// ============================================
// CANDIDATE PROFILE MUTATIONS
// ============================================

export function useCreateCandidateProfile() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: CreateCandidateProfileInput) => {
      const response = await candidateProfilesAPI.create(data)
      return response.data.data as CandidateProfile
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.candidateProfiles.all() })
      toast({
        title: "Success",
        description: "Candidate profile created successfully",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create candidate profile",
        variant: "destructive",
      })
    },
  })
}

export function useUpdateCandidateProfile() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateCandidateProfileInput }) => {
      const response = await candidateProfilesAPI.update(id, data)
      return response.data.data as CandidateProfile
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.candidateProfiles.all() })
      queryClient.invalidateQueries({ queryKey: queryKeys.candidateProfiles.detail(variables.id) })
      toast({
        title: "Success",
        description: "Candidate profile updated successfully",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update candidate profile",
        variant: "destructive",
      })
    },
  })
}

export function useDeleteCandidateProfile() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await candidateProfilesAPI.delete(id)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.candidateProfiles.all() })
      toast({
        title: "Success",
        description: "Candidate profile deleted successfully",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete candidate profile",
        variant: "destructive",
      })
    },
  })
}

// ============================================
// CANDIDATE ASSIGNMENT MUTATIONS
// ============================================

export function useAssignCandidateToElection() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: AssignCandidateInput) => {
      const response = await candidateProfilesAPI.assign(data)
      return response.data.data as CandidateAssignment
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.candidateProfiles.all() })
      queryClient.invalidateQueries({ queryKey: queryKeys.elections.all() })
      toast({
        title: "Success",
        description: "Candidate assigned to election successfully",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to assign candidate",
        variant: "destructive",
      })
    },
  })
}

export function useRemoveCandidateAssignment() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (assignmentId: string) => {
      const response = await candidateProfilesAPI.removeAssignment(assignmentId)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.candidateProfiles.all() })
      queryClient.invalidateQueries({ queryKey: queryKeys.elections.all() })
      toast({
        title: "Success",
        description: "Candidate removed from election successfully",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to remove candidate assignment",
        variant: "destructive",
      })
    },
  })
}

export function useUpdateCandidacyStatus() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({
      assignmentId,
      status,
    }: {
      assignmentId: string
      status: CandidacyStatus
    }) => {
      const response = await candidateProfilesAPI.updateCandidacyStatus(assignmentId, status)
      return response.data.data as CandidateAssignment
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.candidateProfiles.all() })
      queryClient.invalidateQueries({ queryKey: queryKeys.elections.all() })
      toast({
        title: "Success",
        description: `Candidacy status updated to ${variables.status}`,
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update candidacy status",
        variant: "destructive",
      })
    },
  })
}
