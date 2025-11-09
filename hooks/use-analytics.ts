import { useQuery } from "@tanstack/react-query"
import { analyticsAPI } from "@/lib/api"
import { queryKeys } from "@/lib/query-client"

type TimePeriod = "24h" | "7d" | "30d" | "90d"

// Fetch dashboard analytics
export function useDashboardAnalytics(period?: TimePeriod) {
  return useQuery({
    queryKey: queryKeys.analytics.dashboard(period),
    queryFn: async () => {
      const response = await analyticsAPI.getDashboard(period)
      return response.data.data
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - analytics can be slightly stale
  })
}

// Fetch performance analytics
export function usePerformanceAnalytics(period?: TimePeriod) {
  return useQuery({
    queryKey: queryKeys.analytics.performance(period),
    queryFn: async () => {
      const response = await analyticsAPI.getPerformance(period)
      return response.data.data
    },
    staleTime: 2 * 60 * 1000,
  })
}

// Fetch form-specific analytics
export function useFormAnalytics(formId: string) {
  return useQuery({
    queryKey: queryKeys.analytics.formAnalytics(formId),
    queryFn: async () => {
      const response = await analyticsAPI.getFormAnalytics(formId)
      return response.data.data
    },
    enabled: !!formId,
    staleTime: 2 * 60 * 1000,
  })
}

// Fetch detailed form analytics
export function useFormDetailedAnalytics(formId: string) {
  return useQuery({
    queryKey: queryKeys.analytics.formDetailedAnalytics(formId),
    queryFn: async () => {
      const response = await analyticsAPI.getFormDetailedAnalytics(formId)
      return response.data.data
    },
    enabled: !!formId,
    staleTime: 2 * 60 * 1000,
  })
}

// Fetch agent performance analytics
export function useAgentPerformance(agentId: string) {
  return useQuery({
    queryKey: queryKeys.analytics.agentPerformance(agentId),
    queryFn: async () => {
      const response = await analyticsAPI.getAgentPerformance(agentId)
      return response.data.data
    },
    enabled: !!agentId,
    staleTime: 5 * 60 * 1000, // 5 minutes for agent data
  })
}
