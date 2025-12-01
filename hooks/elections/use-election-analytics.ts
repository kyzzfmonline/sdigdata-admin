import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { electionAnalyticsAPI } from "@/lib/api"
import { queryKeys } from "@/lib/query-client"
import { useToast } from "@/hooks/use-toast"
import type {
  ElectionResults,
  ElectionAnalytics,
  DemographicBreakdown,
  VotingTrends,
  TurnoutStats,
  ElectionPredictions,
  CandidateComparison,
  ElectionsDashboard,
} from "@/lib/types"

// ============================================
// RESULTS QUERIES
// ============================================

// Get live election results
export function useElectionResults(electionId: string, positionId?: string) {
  return useQuery({
    queryKey: queryKeys.elections.results(electionId),
    queryFn: async () => {
      const response = await electionAnalyticsAPI.getResults(electionId, positionId)
      return response.data.data as ElectionResults
    },
    enabled: !!electionId,
    // Refetch results every 30 seconds for live updates
    refetchInterval: 30000,
  })
}

// Get finalized results
export function useFinalizedResults(electionId: string) {
  return useQuery({
    queryKey: queryKeys.elections.finalizedResults(electionId),
    queryFn: async () => {
      const response = await electionAnalyticsAPI.getFinalizedResults(electionId)
      return response.data.data as ElectionResults
    },
    enabled: !!electionId,
  })
}

// ============================================
// ANALYTICS QUERIES
// ============================================

// Get comprehensive analytics
export function useElectionAnalytics(electionId: string) {
  return useQuery({
    queryKey: queryKeys.elections.analytics(electionId),
    queryFn: async () => {
      const response = await electionAnalyticsAPI.getAnalytics(electionId)
      return response.data.data as ElectionAnalytics
    },
    enabled: !!electionId,
  })
}

// Get demographic breakdown
export function useElectionDemographics(electionId: string) {
  return useQuery({
    queryKey: queryKeys.elections.demographics(electionId),
    queryFn: async () => {
      const response = await electionAnalyticsAPI.getDemographics(electionId)
      return response.data.data as DemographicBreakdown
    },
    enabled: !!electionId,
  })
}

// Get regional results
export function useRegionalResults(electionId: string, positionId?: string) {
  return useQuery({
    queryKey: queryKeys.elections.regionalResults(electionId, positionId),
    queryFn: async () => {
      const response = await electionAnalyticsAPI.getRegionalResults(electionId, positionId)
      return response.data.data
    },
    enabled: !!electionId,
  })
}

// Get voting trends
export function useVotingTrends(
  electionId: string,
  granularity: "minute" | "hour" | "day" = "hour"
) {
  return useQuery({
    queryKey: queryKeys.elections.trends(electionId, granularity),
    queryFn: async () => {
      const response = await electionAnalyticsAPI.getTrends(electionId, granularity)
      return response.data.data as VotingTrends
    },
    enabled: !!electionId,
    // Refresh trends every minute for active monitoring
    refetchInterval: 60000,
  })
}

// Get turnout statistics
export function useTurnoutStats(electionId: string) {
  return useQuery({
    queryKey: queryKeys.elections.turnout(electionId),
    queryFn: async () => {
      const response = await electionAnalyticsAPI.getTurnout(electionId)
      return response.data.data as TurnoutStats
    },
    enabled: !!electionId,
    refetchInterval: 60000,
  })
}

// Get predictions (for active elections)
export function useElectionPredictions(electionId: string) {
  return useQuery({
    queryKey: queryKeys.elections.predictions(electionId),
    queryFn: async () => {
      const response = await electionAnalyticsAPI.getPredictions(electionId)
      return response.data.data as ElectionPredictions
    },
    enabled: !!electionId,
    refetchInterval: 60000,
  })
}

// Compare candidates
export function useCandidateComparison(electionId: string, candidateIds: string[]) {
  return useQuery({
    queryKey: queryKeys.elections.comparison(electionId, candidateIds),
    queryFn: async () => {
      const response = await electionAnalyticsAPI.compareCandidates(electionId, candidateIds)
      return response.data.data as CandidateComparison[]
    },
    enabled: !!electionId && candidateIds.length >= 2,
  })
}

// ============================================
// DASHBOARD QUERIES
// ============================================

// Get elections overview dashboard
export function useElectionsDashboard() {
  return useQuery({
    queryKey: queryKeys.elections.dashboard(),
    queryFn: async () => {
      const response = await electionAnalyticsAPI.getDashboard()
      return response.data.data as ElectionsDashboard
    },
    // Refresh dashboard every 2 minutes
    refetchInterval: 120000,
  })
}

// Get active elections dashboard
export function useActiveElectionsDashboard() {
  return useQuery({
    queryKey: queryKeys.elections.activeDashboard(),
    queryFn: async () => {
      const response = await electionAnalyticsAPI.getActiveDashboard()
      return response.data.data as {
        election: {
          id: string
          title: string
          type: string
          end_date: string
        }
        total_votes: number
        turnout_rate: number
      }[]
    },
    // Refresh every minute for active monitoring
    refetchInterval: 60000,
  })
}

// ============================================
// MUTATIONS
// ============================================

// Finalize results (admin only)
export function useFinalizeResults() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (electionId: string) => {
      const response = await electionAnalyticsAPI.finalizeResults(electionId)
      return response.data.data as ElectionResults
    },
    onSuccess: (data, electionId) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.elections.results(electionId),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.elections.finalizedResults(electionId),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.elections.detail(electionId),
      })
      toast({
        title: "Results Finalized",
        description: "Election results have been finalized and cached",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to finalize results",
        variant: "destructive",
      })
    },
  })
}

// Export election data
export function useExportElectionData() {
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({
      electionId,
      format,
    }: {
      electionId: string
      format: "json" | "csv"
    }) => {
      const response = await electionAnalyticsAPI.exportData(electionId, format)
      return { data: response.data, format }
    },
    onSuccess: ({ data, format }, variables) => {
      if (format === "csv") {
        // Handle CSV blob download
        const url = window.URL.createObjectURL(data)
        const link = document.createElement("a")
        link.href = url
        link.download = `election-${variables.electionId}-results.csv`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      } else {
        // Handle JSON download
        const blob = new Blob([JSON.stringify(data.data, null, 2)], {
          type: "application/json",
        })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = `election-${variables.electionId}-results.json`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      }

      toast({
        title: "Export Complete",
        description: `Election data exported as ${format.toUpperCase()}`,
      })
    },
    onError: (error: any) => {
      toast({
        title: "Export Failed",
        description: error.response?.data?.message || "Failed to export election data",
        variant: "destructive",
      })
    },
  })
}
