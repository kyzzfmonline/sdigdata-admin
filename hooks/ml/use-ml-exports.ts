/**
 * ML/AI Exports Hooks
 * React Query hooks for exporting training data, quality metrics, and spatial/temporal data
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api"
import { queryKeys } from "@/lib/query-client"
import { toast } from "sonner"

// Types
export interface MLDatasetQualityStats {
  form_id?: string
  total_samples: number
  complete_samples: number
  incomplete_samples: number
  duplicate_samples: number
  outlier_samples: number
  quality_score: number // 0-100
  completeness_ratio: number
  consistency_score: number
  field_quality_breakdown: Array<{
    field_id: string
    field_name: string
    missing_rate: number
    uniqueness: number
    data_type_consistency: number
  }>
  recommendations: string[]
}

export interface TrainingDataExportRequest {
  form_id?: string
  filters?: {
    date_range?: {
      start: string
      end: string
    }
    status?: string[]
    min_quality_score?: number
    exclude_duplicates?: boolean
    exclude_outliers?: boolean
  }
  format: "csv" | "json" | "parquet" | "tfrecord" | "jsonl"
  options?: {
    include_metadata?: boolean
    normalize?: boolean
    encoding?: string
    split_ratio?: {
      train: number
      validation: number
      test: number
    }
  }
}

export interface TrainingDataExport {
  id: string
  form_id?: string
  status: "pending" | "processing" | "completed" | "failed"
  format: string
  total_samples: number
  file_size_bytes: number
  download_url?: string
  expires_at?: string
  created_at: string
  completed_at?: string
  error_message?: string
}

export interface SpatialDataExportRequest {
  form_id?: string
  filters?: {
    bbox?: {
      min_lat: number
      min_lon: number
      max_lat: number
      max_lon: number
    }
    date_range?: {
      start: string
      end: string
    }
  }
  format: "geojson" | "shapefile" | "kml" | "gpkg"
  options?: {
    coordinate_system?: string
    include_attributes?: boolean
    simplify_geometry?: boolean
  }
}

export interface SpatialDataExport {
  id: string
  status: "pending" | "processing" | "completed" | "failed"
  format: string
  total_features: number
  file_size_bytes: number
  download_url?: string
  created_at: string
}

export interface TemporalTrendsRequest {
  form_id?: string
  field_ids?: string[]
  time_range: {
    start: string
    end: string
  }
  aggregation: "hour" | "day" | "week" | "month"
}

export interface TemporalTrends {
  form_id?: string
  field_trends: Array<{
    field_id: string
    field_name: string
    data_points: Array<{
      timestamp: string
      value: number
      count: number
      std_dev?: number
    }>
    trend_direction: "increasing" | "decreasing" | "stable" | "volatile"
    seasonality_detected: boolean
  }>
  correlations: Array<{
    field1_id: string
    field2_id: string
    correlation_coefficient: number
  }>
}

export interface MLDataset {
  id: string
  name: string
  description?: string
  form_id?: string
  sample_count: number
  feature_count: number
  target_variable?: string
  created_at: string
  updated_at?: string
  quality_score: number
  download_url?: string
}

export interface CreateMLDatasetRequest {
  name: string
  description?: string
  form_id?: string
  filters?: Record<string, any>
  feature_selection?: {
    include_fields?: string[]
    exclude_fields?: string[]
    auto_select?: boolean
  }
  target_variable?: string
  preprocessing?: {
    handle_missing?: "drop" | "mean" | "median" | "mode" | "forward_fill"
    encoding?: "onehot" | "label" | "ordinal"
    scaling?: "standard" | "minmax" | "robust"
  }
}

export interface FeatureImportance {
  field_id: string
  field_name: string
  importance_score: number
  correlation_with_target: number
  feature_type: string
}

export interface DataQualityReport {
  form_id: string
  generated_at: string
  overall_score: number
  issues: Array<{
    severity: "low" | "medium" | "high" | "critical"
    category: string
    description: string
    affected_count: number
    recommendation: string
  }>
  field_reports: Array<{
    field_id: string
    field_name: string
    completeness: number
    uniqueness: number
    validity: number
    consistency: number
  }>
}

// Get ML dataset quality statistics
export function useMLQualityStats(formId?: string) {
  return useQuery({
    queryKey: queryKeys.ml.qualityStats(formId),
    queryFn: async () => {
      const response = await apiClient.get("/ml/quality-stats", {
        params: formId ? { form_id: formId } : undefined,
      })
      return response.data.data as MLDatasetQualityStats
    },
  })
}

// Export training data
export function useExportTrainingData() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: TrainingDataExportRequest) => {
      const response = await apiClient.post("/ml/export-training-data", data)
      return response.data.data as TrainingDataExport
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ml.datasets() })
      toast.success("Training data export started. You'll be notified when it's ready.")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to export training data")
    },
  })
}

// Get training data exports
export function useTrainingDataExports() {
  return useQuery({
    queryKey: queryKeys.ml.trainingData(),
    queryFn: async () => {
      const response = await apiClient.get("/ml/training-data-exports")
      return response.data.data as TrainingDataExport[]
    },
  })
}

// Get single training data export
export function useTrainingDataExport(exportId: string | undefined) {
  return useQuery({
    queryKey: exportId ? ["ml", "training-data", exportId] : [],
    queryFn: async () => {
      if (!exportId) throw new Error("Export ID is required")
      const response = await apiClient.get(`/ml/training-data-exports/${exportId}`)
      return response.data.data as TrainingDataExport
    },
    enabled: !!exportId,
    refetchInterval: (data) => {
      // Poll every 5 seconds if status is pending or processing
      return data?.status === "pending" || data?.status === "processing" ? 5000 : false
    },
  })
}

// Export spatial data
export function useExportSpatialData() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: SpatialDataExportRequest) => {
      const response = await apiClient.post("/ml/export-spatial-data", data)
      return response.data.data as SpatialDataExport
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ml.spatialData() })
      toast.success("Spatial data export started")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to export spatial data")
    },
  })
}

// Get spatial data exports
export function useSpatialDataExports(filters?: Record<string, any>) {
  return useQuery({
    queryKey: queryKeys.ml.spatialData(filters),
    queryFn: async () => {
      const response = await apiClient.get("/ml/spatial-data-exports", {
        params: filters,
      })
      return response.data.data as SpatialDataExport[]
    },
  })
}

// Get temporal trends
export function useTemporalTrends(formId: string | undefined, days: number = 30) {
  return useQuery({
    queryKey: queryKeys.ml.temporalTrends(formId, days),
    queryFn: async () => {
      const response = await apiClient.get("/ml/temporal-trends", {
        params: {
          form_id: formId,
          days,
        },
      })
      return response.data.data as TemporalTrends
    },
    enabled: !!formId,
  })
}

// Get ML datasets
export function useMLDatasets() {
  return useQuery({
    queryKey: queryKeys.ml.datasets(),
    queryFn: async () => {
      const response = await apiClient.get("/ml/datasets")
      return response.data.data as MLDataset[]
    },
  })
}

// Create ML dataset
export function useCreateMLDataset() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateMLDatasetRequest) => {
      const response = await apiClient.post("/ml/datasets", data)
      return response.data.data as MLDataset
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ml.datasets() })
      toast.success("ML dataset created successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create ML dataset")
    },
  })
}

// Delete ML dataset
export function useDeleteMLDataset() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (datasetId: string) => {
      await apiClient.delete(`/ml/datasets/${datasetId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ml.datasets() })
      toast.success("ML dataset deleted successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete ML dataset")
    },
  })
}

// Get feature importance
export function useFeatureImportance(formId: string | undefined) {
  return useQuery({
    queryKey: formId ? ["ml", "feature-importance", formId] : [],
    queryFn: async () => {
      if (!formId) throw new Error("Form ID is required")
      const response = await apiClient.get(`/ml/forms/${formId}/feature-importance`)
      return response.data.data as FeatureImportance[]
    },
    enabled: !!formId,
  })
}

// Generate data quality report
export function useGenerateQualityReport() {
  return useMutation({
    mutationFn: async (formId: string) => {
      const response = await apiClient.post(`/ml/forms/${formId}/quality-report`)
      return response.data.data as DataQualityReport
    },
    onSuccess: () => {
      toast.success("Data quality report generated")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to generate quality report")
    },
  })
}

// Detect anomalies
export function useDetectAnomalies(formId: string | undefined) {
  return useQuery({
    queryKey: formId ? ["ml", "anomalies", formId] : [],
    queryFn: async () => {
      if (!formId) throw new Error("Form ID is required")
      const response = await apiClient.get(`/ml/forms/${formId}/detect-anomalies`)
      return response.data.data as Array<{
        response_id: string
        anomaly_score: number
        anomalous_fields: string[]
        reason: string
      }>
    },
    enabled: !!formId,
  })
}

// Get data distribution
export function useDataDistribution(formId: string | undefined, fieldId: string | undefined) {
  return useQuery({
    queryKey: formId && fieldId ? ["ml", "distribution", formId, fieldId] : [],
    queryFn: async () => {
      if (!formId || !fieldId) {
        throw new Error("Form ID and field ID are required")
      }
      const response = await apiClient.get(`/ml/forms/${formId}/fields/${fieldId}/distribution`)
      return response.data.data as {
        field_type: string
        distribution_type: string
        statistics: Record<string, number>
        histogram: Array<{ bin: string; count: number }>
      }
    },
    enabled: !!formId && !!fieldId,
  })
}

// Generate synthetic data
export function useGenerateSyntheticData() {
  return useMutation({
    mutationFn: async (data: {
      form_id: string
      sample_count: number
      method: "sampling" | "gan" | "variational"
    }) => {
      const response = await apiClient.post("/ml/generate-synthetic-data", data)
      return response.data.data
    },
    onSuccess: () => {
      toast.success("Synthetic data generation started")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to generate synthetic data")
    },
  })
}

// Validate dataset
export function useValidateDataset() {
  return useMutation({
    mutationFn: async (data: { form_id: string; validation_rules?: Record<string, any> }) => {
      const response = await apiClient.post("/ml/validate-dataset", data)
      return response.data.data as {
        valid: boolean
        validation_errors: Array<{
          rule: string
          failed_count: number
          examples: any[]
        }>
      }
    },
  })
}

// Download export file
export function useDownloadExport() {
  return useMutation({
    mutationFn: async (data: { export_id: string; export_type: "training" | "spatial" }) => {
      const response = await apiClient.get(
        `/ml/${data.export_type}-data-exports/${data.export_id}/download`,
        {
          responseType: "blob",
        }
      )

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement("a")
      link.href = url
      const contentDisposition = response.headers["content-disposition"]
      const filename = contentDisposition?.split("filename=")[1] || `export-${data.export_id}.zip`
      link.setAttribute("download", filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    },
    onSuccess: () => {
      toast.success("Export downloaded successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to download export")
    },
  })
}
