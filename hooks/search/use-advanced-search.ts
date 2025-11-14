/**
 * Advanced Search Hooks
 * React Query hooks for global search with filters, saved searches, and search analytics
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api"
import { queryKeys } from "@/lib/query-client"
import { toast } from "sonner"

// Types
export interface SearchQuery {
  query: string
  filters?: SearchFilters
  sort?: SearchSort
  limit?: number
  offset?: number
}

export interface SearchFilters {
  resource_types?: ResourceType[]
  date_range?: {
    start: string
    end: string
  }
  status?: string[]
  created_by?: string[]
  tags?: string[]
  custom_filters?: Record<string, any>
}

export type ResourceType =
  | "forms"
  | "responses"
  | "users"
  | "templates"
  | "audit_logs"
  | "api_keys"
  | "roles"
  | "permissions"

export interface SearchSort {
  field: string
  order: "asc" | "desc"
}

export interface SearchResult {
  resource_type: ResourceType
  resource_id: string
  title: string
  description?: string
  snippet?: string // Highlighted search snippet
  score: number // Relevance score
  metadata: Record<string, any>
  created_at: string
  updated_at?: string
}

export interface SearchResponse {
  results: SearchResult[]
  total: number
  took_ms: number
  facets?: SearchFacets
  suggestions?: string[]
}

export interface SearchFacets {
  resource_types: Array<{ type: ResourceType; count: number }>
  date_histogram: Array<{ date: string; count: number }>
  status: Array<{ status: string; count: number }>
  top_creators: Array<{ user_id: string; username: string; count: number }>
}

export interface SavedSearch {
  id: string
  name: string
  description?: string
  query: SearchQuery
  is_favorite: boolean
  alert_enabled: boolean
  alert_frequency?: "realtime" | "daily" | "weekly"
  created_at: string
  updated_at?: string
}

export interface CreateSavedSearchRequest {
  name: string
  description?: string
  query: SearchQuery
  is_favorite?: boolean
  alert_enabled?: boolean
  alert_frequency?: "realtime" | "daily" | "weekly"
}

export interface UpdateSavedSearchRequest {
  name?: string
  description?: string
  query?: SearchQuery
  is_favorite?: boolean
  alert_enabled?: boolean
  alert_frequency?: "realtime" | "daily" | "weekly"
}

export interface SearchSuggestion {
  text: string
  type: "recent" | "popular" | "autocomplete"
  count?: number
}

export interface SearchStats {
  total_searches: number
  unique_queries: number
  avg_results_per_search: number
  most_searched_terms: Array<{
    query: string
    count: number
  }>
  searches_by_resource_type: Record<ResourceType, number>
  zero_result_queries: string[]
}

// Global search
export function useGlobalSearch(searchQuery: SearchQuery) {
  return useQuery({
    queryKey: queryKeys.search.global(searchQuery),
    queryFn: async () => {
      const response = await apiClient.post("/search", searchQuery)
      return response.data.data as SearchResponse
    },
    enabled: !!searchQuery.query && searchQuery.query.length >= 2,
    staleTime: 30000, // 30 seconds
  })
}

// Search with debouncing (for instant search)
export function useInstantSearch(query: string, filters?: SearchFilters) {
  return useQuery({
    queryKey: ["search", "instant", query, filters],
    queryFn: async () => {
      const response = await apiClient.post("/search/instant", {
        query,
        filters,
        limit: 10,
      })
      return response.data.data as SearchResponse
    },
    enabled: !!query && query.length >= 2,
    staleTime: 10000, // 10 seconds for instant search
  })
}

// Search suggestions (autocomplete)
export function useSearchSuggestions(query: string | undefined) {
  return useQuery({
    queryKey: query ? ["search", "suggestions", query] : [],
    queryFn: async () => {
      if (!query) throw new Error("Query is required")
      const response = await apiClient.get("/search/suggestions", {
        params: { q: query },
      })
      return response.data.data as SearchSuggestion[]
    },
    enabled: !!query && query.length >= 2,
    staleTime: 60000, // 1 minute
  })
}

// Get recent searches
export function useRecentSearches(limit: number = 10) {
  return useQuery({
    queryKey: ["search", "recent", limit],
    queryFn: async () => {
      const response = await apiClient.get("/search/recent", {
        params: { limit },
      })
      return response.data.data as Array<{ query: string; timestamp: string }>
    },
  })
}

// Get popular searches
export function usePopularSearches(limit: number = 10) {
  return useQuery({
    queryKey: ["search", "popular", limit],
    queryFn: async () => {
      const response = await apiClient.get("/search/popular", {
        params: { limit },
      })
      return response.data.data as Array<{ query: string; count: number }>
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Save search
export function useSaveSearch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateSavedSearchRequest) => {
      const response = await apiClient.post("/search/saved", data)
      return response.data.data as SavedSearch
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.search.saved() })
      toast.success("Search saved successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to save search")
    },
  })
}

// Get saved searches
export function useSavedSearches() {
  return useQuery({
    queryKey: queryKeys.search.saved(),
    queryFn: async () => {
      const response = await apiClient.get("/search/saved")
      return response.data.data as SavedSearch[]
    },
  })
}

// Get single saved search
export function useSavedSearch(searchId: string | undefined) {
  return useQuery({
    queryKey: searchId ? ["search", "saved", searchId] : [],
    queryFn: async () => {
      if (!searchId) throw new Error("Search ID is required")
      const response = await apiClient.get(`/search/saved/${searchId}`)
      return response.data.data as SavedSearch
    },
    enabled: !!searchId,
  })
}

// Update saved search
export function useUpdateSavedSearch(searchId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: UpdateSavedSearchRequest) => {
      const response = await apiClient.put(`/search/saved/${searchId}`, data)
      return response.data.data as SavedSearch
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.search.saved() })
      queryClient.invalidateQueries({ queryKey: ["search", "saved", searchId] })
      toast.success("Saved search updated successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update saved search")
    },
  })
}

// Delete saved search
export function useDeleteSavedSearch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (searchId: string) => {
      await apiClient.delete(`/search/saved/${searchId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.search.saved() })
      toast.success("Saved search deleted successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete saved search")
    },
  })
}

// Execute saved search
export function useExecuteSavedSearch(searchId: string) {
  return useQuery({
    queryKey: ["search", "saved", searchId, "execute"],
    queryFn: async () => {
      const response = await apiClient.post(`/search/saved/${searchId}/execute`)
      return response.data.data as SearchResponse
    },
    enabled: false, // Only run when manually triggered
  })
}

// Toggle favorite on saved search
export function useToggleSavedSearchFavorite(searchId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (isFavorite: boolean) => {
      const response = await apiClient.patch(`/search/saved/${searchId}/favorite`, {
        is_favorite: isFavorite,
      })
      return response.data.data as SavedSearch
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.search.saved() })
      queryClient.invalidateQueries({ queryKey: ["search", "saved", searchId] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update favorite status")
    },
  })
}

// Get search statistics
export function useSearchStats(days: number = 30) {
  return useQuery({
    queryKey: ["search", "stats", days],
    queryFn: async () => {
      const response = await apiClient.get("/search/stats", {
        params: { days },
      })
      return response.data.data as SearchStats
    },
  })
}

// Advanced search with filters
export function useAdvancedSearchWithFilters() {
  return useMutation({
    mutationFn: async (data: SearchQuery) => {
      const response = await apiClient.post("/search/advanced", data)
      return response.data.data as SearchResponse
    },
  })
}

// Export search results
export function useExportSearchResults() {
  return useMutation({
    mutationFn: async (data: { query: SearchQuery; format: "csv" | "json" | "xlsx" }) => {
      const response = await apiClient.post("/search/export", data, {
        responseType: "blob",
      })

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", `search-results-${new Date().toISOString()}.${data.format}`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    },
    onSuccess: () => {
      toast.success("Search results exported successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to export search results")
    },
  })
}

// Clear search history
export function useClearSearchHistory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      await apiClient.delete("/search/history")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["search", "recent"] })
      toast.success("Search history cleared")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to clear search history")
    },
  })
}

// Search within specific resource
export function useSearchResource(resourceType: ResourceType, query: string) {
  return useQuery({
    queryKey: ["search", "resource", resourceType, query],
    queryFn: async () => {
      const response = await apiClient.post(`/search/${resourceType}`, { query })
      return response.data.data as SearchResponse
    },
    enabled: !!query && query.length >= 2,
  })
}

// Get search filters (available filter options)
export function useSearchFilters() {
  return useQuery({
    queryKey: ["search", "filters"],
    queryFn: async () => {
      const response = await apiClient.get("/search/filters")
      return response.data.data as {
        resource_types: ResourceType[]
        available_statuses: string[]
        available_tags: string[]
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Build search query helper
export function useBuildSearchQuery() {
  return useMutation({
    mutationFn: async (data: {
      keywords: string[]
      operators?: Array<"AND" | "OR" | "NOT">
      fields?: string[]
    }) => {
      const response = await apiClient.post("/search/build-query", data)
      return response.data.data as { query: string }
    },
  })
}
