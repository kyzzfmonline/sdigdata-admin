import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { politicalPartiesAPI } from "@/lib/api"
import { queryKeys } from "@/lib/query-client"
import { useToast } from "@/hooks/use-toast"
import type {
  PoliticalParty,
  CreatePartyInput,
  UpdatePartyInput,
  PartyStats,
  PartyLeaderboardEntry,
  PartyElectionHistory,
  CandidateProfile,
} from "@/lib/types"

// ============================================
// PARTY QUERIES
// ============================================

export function useParties(params?: {
  status?: string
  search?: string
  limit?: number
  offset?: number
}) {
  return useQuery({
    queryKey: queryKeys.parties.all(params),
    queryFn: async () => {
      const response = await politicalPartiesAPI.getAll(params)
      return response.data.data as {
        parties: PoliticalParty[]
        total: number
        limit: number
        offset: number
      }
    },
  })
}

export function useParty(id: string) {
  return useQuery({
    queryKey: queryKeys.parties.detail(id),
    queryFn: async () => {
      const response = await politicalPartiesAPI.getById(id)
      return response.data.data as PoliticalParty
    },
    enabled: !!id,
  })
}

export function usePartyCandidates(
  partyId: string,
  params?: { status?: string; limit?: number; offset?: number }
) {
  return useQuery({
    queryKey: queryKeys.parties.candidates(partyId, params),
    queryFn: async () => {
      const response = await politicalPartiesAPI.getCandidates(partyId, params)
      return response.data.data as {
        candidates: CandidateProfile[]
        total: number
        limit: number
        offset: number
      }
    },
    enabled: !!partyId,
  })
}

export function usePartyStats(partyId: string) {
  return useQuery({
    queryKey: queryKeys.parties.stats(partyId),
    queryFn: async () => {
      const response = await politicalPartiesAPI.getStats(partyId)
      return response.data.data as PartyStats
    },
    enabled: !!partyId,
  })
}

export function usePartyElectionHistory(partyId: string) {
  return useQuery({
    queryKey: queryKeys.parties.elections(partyId),
    queryFn: async () => {
      const response = await politicalPartiesAPI.getElectionHistory(partyId)
      return response.data.data as PartyElectionHistory[]
    },
    enabled: !!partyId,
  })
}

export function usePartyLeaderboard(params?: {
  sort_by?: "total_wins" | "total_candidates" | "elections"
  limit?: number
}) {
  return useQuery({
    queryKey: queryKeys.parties.leaderboard(params),
    queryFn: async () => {
      const response = await politicalPartiesAPI.getLeaderboard(params)
      return response.data.data as PartyLeaderboardEntry[]
    },
  })
}

// ============================================
// PARTY MUTATIONS
// ============================================

export function useCreateParty() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: CreatePartyInput) => {
      const response = await politicalPartiesAPI.create(data)
      return response.data.data as PoliticalParty
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.parties.all() })
      toast({
        title: "Success",
        description: "Political party created successfully",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create party",
        variant: "destructive",
      })
    },
  })
}

export function useUpdateParty() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdatePartyInput }) => {
      const response = await politicalPartiesAPI.update(id, data)
      return response.data.data as PoliticalParty
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.parties.all() })
      queryClient.invalidateQueries({ queryKey: queryKeys.parties.detail(variables.id) })
      toast({
        title: "Success",
        description: "Political party updated successfully",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update party",
        variant: "destructive",
      })
    },
  })
}

export function useDeleteParty() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await politicalPartiesAPI.delete(id)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.parties.all() })
      toast({
        title: "Success",
        description: "Political party dissolved successfully",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete party",
        variant: "destructive",
      })
    },
  })
}
