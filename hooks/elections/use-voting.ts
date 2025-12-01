import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { votingAPI } from "@/lib/api"
import { queryKeys } from "@/lib/query-client"
import { useToast } from "@/hooks/use-toast"
import type { CastVotesInput, VoteReceipt } from "@/lib/types"

// ============================================
// VOTING QUERIES
// ============================================

// Check if user has already voted
export function useVoteStatus(electionId: string) {
  return useQuery({
    queryKey: queryKeys.elections.voteStatus(electionId),
    queryFn: async () => {
      const response = await votingAPI.getVoteStatus(electionId)
      return response.data.data as {
        has_voted: boolean
        voted_at?: string
        confirmation_code?: string
      }
    },
    enabled: !!electionId,
  })
}

// ============================================
// VOTING MUTATIONS
// ============================================

// Verify voter eligibility
export function useVerifyVoter() {
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({
      electionId,
      data,
    }: {
      electionId: string
      data?: { national_id?: string; phone?: string; otp?: string }
    }) => {
      const response = await votingAPI.verifyVoter(electionId, data)
      return response.data.data as {
        verified: boolean
        voter_token: string
        verification_level: string
        message?: string
      }
    },
    onSuccess: (data) => {
      if (data.verified) {
        toast({
          title: "Verified",
          description: "You are eligible to vote in this election",
        })
      }
    },
    onError: (error: any) => {
      toast({
        title: "Verification Failed",
        description: error.response?.data?.message || "Unable to verify voter eligibility",
        variant: "destructive",
      })
    },
  })
}

// Cast votes
export function useCastVotes() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({
      electionId,
      data,
    }: {
      electionId: string
      data: CastVotesInput
    }) => {
      const response = await votingAPI.castVotes(electionId, data)
      return response.data.data as VoteReceipt
    },
    onSuccess: (data, variables) => {
      // Invalidate vote status and results
      queryClient.invalidateQueries({
        queryKey: queryKeys.elections.voteStatus(variables.electionId),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.elections.results(variables.electionId),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.elections.analytics(variables.electionId),
      })

      toast({
        title: "Vote Cast Successfully",
        description: `Confirmation code: ${data.confirmation_code}`,
      })
    },
    onError: (error: any) => {
      toast({
        title: "Vote Failed",
        description: error.response?.data?.message || "Failed to cast vote",
        variant: "destructive",
      })
    },
  })
}
