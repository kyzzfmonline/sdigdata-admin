/**
 * Analytics Hooks
 * React Query hooks for advanced analytics, dashboards, and performance metrics
 */

import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/lib/api"
import { queryKeys } from "@/lib/query-client"

// Types
export interface DashboardAnalytics {
  period: string
  summary: {
    total_forms: number
    total_responses: number
    total_users: number
    active_users: number
    response_rate: number
    avg_completion_time_minutes: number
  }
  trends: {
    forms_created: TimeSeriesData[]
    responses_submitted: TimeSeriesData[]
    user_activity: TimeSeriesData[]
  }
  top_forms: Array<{
    form_id: string
    form_title: string
    response_count: number
    completion_rate: number
  }>
  user_engagement: {
    daily_active_users: number
    weekly_active_users: number
    monthly_active_users: number
  }
}

export interface TimeSeriesData {
  timestamp: string
  value: number
  label?: string
}

export interface FormAnalytics {
  form_id: string
  form_title: string
  period: string
  overview: {
    total_responses: number
    unique_respondents: number
    completion_rate: number
    avg_completion_time_minutes: number
    abandonment_rate: number
  }
  responses_over_time: TimeSeriesData[]
  completion_funnel: Array<{
    step: string
    step_number: number
    started: number
    completed: number
    drop_off_rate: number
  }>
  field_analytics: Array<{
    field_id: string
    field_name: string
    field_type: string
    response_count: number
    skip_rate: number
    avg_time_spent_seconds: number
    most_common_values?: Array<{ value: string; count: number }>
  }>
  device_breakdown: Array<{
    device_type: string
    count: number
    percentage: number
  }>
  location_breakdown: Array<{
    country: string
    city?: string
    count: number
  }>
}

export interface DetailedFormAnalytics {
  form_id: string
  advanced_metrics: {
    heat_map: Array<{
      field_id: string
      interaction_count: number
      avg_time_seconds: number
    }>
    error_analysis: Array<{
      field_id: string
      field_name: string
      error_count: number
      common_errors: string[]
    }>
    drop_off_points: Array<{
      field_id: string
      field_name: string
      drop_off_count: number
      drop_off_rate: number
    }>
    session_replay_available: boolean
  }
  comparative_analysis: {
    vs_last_period: {
      response_change: number
      completion_rate_change: number
      avg_time_change: number
    }
    vs_similar_forms: {
      percentile_rank: number
      avg_completion_rate: number
    }
  }
}

export interface AgentPerformance {
  agent_id: string
  agent_name: string
  period: string
  metrics: {
    forms_assigned: number
    forms_completed: number
    responses_collected: number
    avg_response_time_hours: number
    completion_rate: number
    quality_score: number
  }
  activity_timeline: TimeSeriesData[]
  top_forms: Array<{
    form_id: string
    form_title: string
    responses: number
  }>
  performance_comparison: {
    vs_team_avg: number
    vs_last_period: number
    ranking: number
    total_agents: number
  }
}

export interface PerformanceMetrics {
  period: string
  system_health: {
    uptime_percentage: number
    avg_response_time_ms: number
    error_rate: number
    active_sessions: number
  }
  api_performance: {
    total_requests: number
    successful_requests: number
    failed_requests: number
    avg_latency_ms: number
    slowest_endpoints: Array<{
      endpoint: string
      avg_latency_ms: number
      p95_latency_ms: number
    }>
  }
  database_performance: {
    query_count: number
    avg_query_time_ms: number
    slow_queries_count: number
    connection_pool_usage: number
  }
  resource_usage: {
    cpu_usage_percentage: number
    memory_usage_percentage: number
    disk_usage_percentage: number
    network_bandwidth_mbps: number
  }
}

// Get dashboard analytics
export function useDashboardAnalytics(period: string = "30d") {
  return useQuery({
    queryKey: queryKeys.analytics.dashboard(period),
    queryFn: async () => {
      const response = await apiClient.get("/analytics/dashboard", {
        params: { period },
      })
      return response.data.data as DashboardAnalytics
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Get form analytics
export function useFormAnalytics(formId: string | undefined) {
  return useQuery({
    queryKey: formId ? queryKeys.analytics.formAnalytics(formId) : [],
    queryFn: async () => {
      if (!formId) throw new Error("Form ID is required")
      const response = await apiClient.get(`/analytics/forms/${formId}`)
      return response.data.data as FormAnalytics
    },
    enabled: !!formId,
  })
}

// Get detailed form analytics
export function useDetailedFormAnalytics(formId: string | undefined) {
  return useQuery({
    queryKey: formId ? queryKeys.analytics.formDetailedAnalytics(formId) : [],
    queryFn: async () => {
      if (!formId) throw new Error("Form ID is required")
      const response = await apiClient.get(`/analytics/forms/${formId}/detailed`)
      return response.data.data as DetailedFormAnalytics
    },
    enabled: !!formId,
  })
}

// Get agent performance
export function useAgentPerformance(agentId: string | undefined, period: string = "30d") {
  return useQuery({
    queryKey: agentId ? queryKeys.analytics.agentPerformance(agentId) : [],
    queryFn: async () => {
      if (!agentId) throw new Error("Agent ID is required")
      const response = await apiClient.get(`/analytics/agents/${agentId}`, {
        params: { period },
      })
      return response.data.data as AgentPerformance
    },
    enabled: !!agentId,
  })
}

// Get performance metrics
export function usePerformanceMetrics(period: string = "24h") {
  return useQuery({
    queryKey: queryKeys.analytics.performance(period),
    queryFn: async () => {
      const response = await apiClient.get("/analytics/performance", {
        params: { period },
      })
      return response.data.data as PerformanceMetrics
    },
    refetchInterval: 60000, // Refetch every minute for real-time metrics
  })
}

// Get response trends
export function useResponseTrends(formId?: string, period: string = "30d") {
  return useQuery({
    queryKey: ["analytics", "response-trends", formId, period],
    queryFn: async () => {
      const response = await apiClient.get("/analytics/response-trends", {
        params: { form_id: formId, period },
      })
      return response.data.data as TimeSeriesData[]
    },
  })
}

// Get user engagement metrics
export function useUserEngagementMetrics(period: string = "30d") {
  return useQuery({
    queryKey: ["analytics", "user-engagement", period],
    queryFn: async () => {
      const response = await apiClient.get("/analytics/user-engagement", {
        params: { period },
      })
      return response.data.data as {
        dau: number
        wau: number
        mau: number
        stickiness: number
        retention_rate: number
        churn_rate: number
      }
    },
  })
}

// Get conversion funnel
export function useConversionFunnel(formId: string | undefined) {
  return useQuery({
    queryKey: formId ? ["analytics", "conversion-funnel", formId] : [],
    queryFn: async () => {
      if (!formId) throw new Error("Form ID is required")
      const response = await apiClient.get(`/analytics/forms/${formId}/funnel`)
      return response.data.data
    },
    enabled: !!formId,
  })
}

// Get cohort analysis
export function useCohortAnalysis(
  cohortType: "weekly" | "monthly" = "monthly",
  metric: string = "retention"
) {
  return useQuery({
    queryKey: ["analytics", "cohort", cohortType, metric],
    queryFn: async () => {
      const response = await apiClient.get("/analytics/cohort", {
        params: { cohort_type: cohortType, metric },
      })
      return response.data.data
    },
  })
}

// Get field performance
export function useFieldPerformance(formId: string | undefined, fieldId: string | undefined) {
  return useQuery({
    queryKey: formId && fieldId ? ["analytics", "field-performance", formId, fieldId] : [],
    queryFn: async () => {
      if (!formId || !fieldId) {
        throw new Error("Form ID and field ID are required")
      }
      const response = await apiClient.get(
        `/analytics/forms/${formId}/fields/${fieldId}/performance`
      )
      return response.data.data
    },
    enabled: !!formId && !!fieldId,
  })
}

// Get comparative analytics
export function useComparativeAnalytics(formIds: string[]) {
  return useQuery({
    queryKey: ["analytics", "comparative", formIds],
    queryFn: async () => {
      const response = await apiClient.post("/analytics/compare", {
        form_ids: formIds,
      })
      return response.data.data
    },
    enabled: formIds.length > 0,
  })
}

// Get real-time analytics
export function useRealTimeAnalytics() {
  return useQuery({
    queryKey: ["analytics", "realtime"],
    queryFn: async () => {
      const response = await apiClient.get("/analytics/realtime")
      return response.data.data as {
        active_users: number
        active_sessions: number
        responses_last_hour: number
        active_forms: Array<{
          form_id: string
          form_title: string
          active_users: number
        }>
      }
    },
    refetchInterval: 10000, // Refetch every 10 seconds
  })
}

// Get export analytics
export function useExportAnalytics() {
  return useQuery({
    queryKey: ["analytics", "exports"],
    queryFn: async () => {
      const response = await apiClient.get("/analytics/exports")
      return response.data.data as {
        total_exports: number
        exports_by_format: Record<string, number>
        exports_by_resource: Record<string, number>
        recent_exports: Array<{
          id: string
          resource_type: string
          format: string
          created_at: string
          size_bytes: number
        }>
      }
    },
  })
}

// Get custom report
export interface CustomReportRequest {
  name: string
  metrics: string[]
  dimensions: string[]
  filters?: Record<string, any>
  date_range: {
    start: string
    end: string
  }
  granularity?: "hour" | "day" | "week" | "month"
}

export function useCustomReport(reportConfig: CustomReportRequest) {
  return useQuery({
    queryKey: ["analytics", "custom-report", reportConfig],
    queryFn: async () => {
      const response = await apiClient.post("/analytics/custom-report", reportConfig)
      return response.data.data
    },
    enabled: !!reportConfig.metrics.length && !!reportConfig.dimensions.length,
  })
}

// Get benchmark data
export function useBenchmarkData(formId: string | undefined) {
  return useQuery({
    queryKey: formId ? ["analytics", "benchmark", formId] : [],
    queryFn: async () => {
      if (!formId) throw new Error("Form ID is required")
      const response = await apiClient.get(`/analytics/forms/${formId}/benchmark`)
      return response.data.data as {
        form_metrics: Record<string, number>
        industry_avg: Record<string, number>
        percentile_rank: Record<string, number>
      }
    },
    enabled: !!formId,
  })
}

// Get predictive analytics
export function usePredictiveAnalytics(formId: string | undefined) {
  return useQuery({
    queryKey: formId ? ["analytics", "predictive", formId] : [],
    queryFn: async () => {
      if (!formId) throw new Error("Form ID is required")
      const response = await apiClient.get(`/analytics/forms/${formId}/predictive`)
      return response.data.data as {
        predicted_responses_next_week: number
        predicted_completion_rate: number
        trending_direction: "up" | "down" | "stable"
        confidence_score: number
      }
    },
    enabled: !!formId,
  })
}
