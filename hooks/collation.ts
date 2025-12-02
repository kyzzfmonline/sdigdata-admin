"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { collationAPI, geographicAPI } from "@/lib/api"
import type {
  CollationDashboard,
  CollationIncident,
  CollationLiveFeedItem,
  CollationOfficer,
  OfficerAssignment,
  Region,
  Constituency,
  ElectoralArea,
  PollingStation,
  ResultSheet,
  ResultSheetEntry,
  SubmissionProgress,
} from "@/lib/types"

// ============================================
// GEOGRAPHIC HOOKS
// ============================================

export function useRegions() {
  return useQuery({
    queryKey: ["regions"],
    queryFn: async () => {
      const response = await geographicAPI.listRegions()
      return response.data.data.regions as Region[]
    },
  })
}

export function useConstituencies(regionId?: string) {
  return useQuery({
    queryKey: ["constituencies", regionId],
    queryFn: async () => {
      const response = await geographicAPI.listConstituencies(regionId)
      return response.data.data.constituencies as Constituency[]
    },
  })
}

export function useElectoralAreas(constituencyId?: string) {
  return useQuery({
    queryKey: ["electoral-areas", constituencyId],
    queryFn: async () => {
      const response = await geographicAPI.listElectoralAreas(constituencyId)
      return response.data.data.electoral_areas as ElectoralArea[]
    },
    enabled: !!constituencyId,
  })
}

export function usePollingStations(params?: {
  electoral_area_id?: string
  constituency_id?: string
  region_id?: string
}) {
  return useQuery({
    queryKey: ["polling-stations", params],
    queryFn: async () => {
      const response = await geographicAPI.listPollingStations(params)
      return response.data.data.polling_stations as PollingStation[]
    },
  })
}

export function useGeographicStats() {
  return useQuery({
    queryKey: ["geographic-stats"],
    queryFn: async () => {
      const response = await geographicAPI.getHierarchyStats()
      return response.data.data as {
        total_regions: number
        total_constituencies: number
        total_electoral_areas: number
        total_polling_stations: number
        total_registered_voters: number
      }
    },
  })
}

// ============================================
// COLLATION DASHBOARD HOOKS
// ============================================

export function useCollationDashboard(electionId: string) {
  return useQuery({
    queryKey: ["collation-dashboard", electionId],
    queryFn: async () => {
      const response = await collationAPI.getCollationDashboard(electionId)
      return response.data.data as CollationDashboard
    },
    enabled: !!electionId,
    refetchInterval: 30000, // Refresh every 30 seconds for real-time updates
  })
}

export function useSubmissionProgress(
  electionId: string,
  params?: { region_id?: string; constituency_id?: string }
) {
  return useQuery({
    queryKey: ["submission-progress", electionId, params],
    queryFn: async () => {
      const response = await collationAPI.getSubmissionProgress(electionId, params)
      return response.data.data as SubmissionProgress
    },
    enabled: !!electionId,
    refetchInterval: 15000, // Refresh every 15 seconds
  })
}

export function useLiveFeed(electionId: string, limit = 20) {
  return useQuery({
    queryKey: ["live-feed", electionId, limit],
    queryFn: async () => {
      const response = await collationAPI.getLiveFeed(electionId, limit)
      return response.data.data.feed as CollationLiveFeedItem[]
    },
    enabled: !!electionId,
    refetchInterval: 10000, // Refresh every 10 seconds
  })
}

// ============================================
// RESULT SHEET HOOKS
// ============================================

export function useResultSheets(
  electionId: string,
  params?: {
    sheet_type?: string
    status?: string
    collation_center_id?: string
    constituency_id?: string
    region_id?: string
  }
) {
  return useQuery({
    queryKey: ["result-sheets", electionId, params],
    queryFn: async () => {
      const response = await collationAPI.listResultSheets(electionId, params)
      return response.data.data.sheets as ResultSheet[]
    },
    enabled: !!electionId,
  })
}

export function useResultSheet(sheetId: string) {
  return useQuery({
    queryKey: ["result-sheet", sheetId],
    queryFn: async () => {
      const response = await collationAPI.getResultSheet(sheetId)
      return response.data.data as ResultSheet & {
        entries_by_position: Record<string, ResultSheetEntry[]>
        attachments: unknown[]
        workflow_history: unknown[]
      }
    },
    enabled: !!sheetId,
  })
}

export function useResultEntries(sheetId: string) {
  return useQuery({
    queryKey: ["result-entries", sheetId],
    queryFn: async () => {
      const response = await collationAPI.getResultEntries(sheetId)
      return response.data.data.entries as ResultSheetEntry[]
    },
    enabled: !!sheetId,
  })
}

export function useCreateResultSheet() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: {
      election_id: string
      polling_station_id?: string
      collation_center_id?: string
      sheet_type: string
    }) => collationAPI.createResultSheet(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["result-sheets", variables.election_id] })
    },
  })
}

export function useBulkAddEntries() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      sheetId,
      entries,
    }: {
      sheetId: string
      entries: Array<{
        position_id?: string
        candidate_id?: string
        poll_option_id?: string
        votes: number
        votes_in_words?: string
      }>
    }) => collationAPI.bulkAddEntries(sheetId, entries),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["result-sheet", variables.sheetId] })
      queryClient.invalidateQueries({ queryKey: ["result-entries", variables.sheetId] })
    },
  })
}

export function useUpdateSheetTotals() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      sheetId,
      data,
    }: {
      sheetId: string
      data: {
        total_registered_voters?: number
        total_votes_cast?: number
        total_valid_votes?: number
        total_rejected_votes?: number
      }
    }) => collationAPI.updateSheetTotals(sheetId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["result-sheet", variables.sheetId] })
    },
  })
}

// ============================================
// WORKFLOW HOOKS
// ============================================

export function useSubmitSheet() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (sheetId: string) => collationAPI.submitSheet(sheetId),
    onSuccess: (_, sheetId) => {
      queryClient.invalidateQueries({ queryKey: ["result-sheet", sheetId] })
      queryClient.invalidateQueries({ queryKey: ["result-sheets"] })
      queryClient.invalidateQueries({ queryKey: ["collation-dashboard"] })
      queryClient.invalidateQueries({ queryKey: ["submission-progress"] })
    },
  })
}

export function useVerifySheet() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ sheetId, notes }: { sheetId: string; notes?: string }) =>
      collationAPI.verifySheet(sheetId, notes),
    onSuccess: (_, { sheetId }) => {
      queryClient.invalidateQueries({ queryKey: ["result-sheet", sheetId] })
      queryClient.invalidateQueries({ queryKey: ["result-sheets"] })
      queryClient.invalidateQueries({ queryKey: ["collation-dashboard"] })
    },
  })
}

export function useApproveSheet() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ sheetId, notes }: { sheetId: string; notes?: string }) =>
      collationAPI.approveSheet(sheetId, notes),
    onSuccess: (_, { sheetId }) => {
      queryClient.invalidateQueries({ queryKey: ["result-sheet", sheetId] })
      queryClient.invalidateQueries({ queryKey: ["result-sheets"] })
      queryClient.invalidateQueries({ queryKey: ["collation-dashboard"] })
    },
  })
}

export function useCertifySheet() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ sheetId, notes }: { sheetId: string; notes?: string }) =>
      collationAPI.certifySheet(sheetId, notes),
    onSuccess: (_, { sheetId }) => {
      queryClient.invalidateQueries({ queryKey: ["result-sheet", sheetId] })
      queryClient.invalidateQueries({ queryKey: ["result-sheets"] })
      queryClient.invalidateQueries({ queryKey: ["collation-dashboard"] })
    },
  })
}

export function useRejectSheet() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ sheetId, reason }: { sheetId: string; reason: string }) =>
      collationAPI.rejectSheet(sheetId, reason),
    onSuccess: (_, { sheetId }) => {
      queryClient.invalidateQueries({ queryKey: ["result-sheet", sheetId] })
      queryClient.invalidateQueries({ queryKey: ["result-sheets"] })
    },
  })
}

// ============================================
// OFFICERS HOOKS
// ============================================

export function useCollationOfficers(params?: {
  officer_type?: string
  is_active?: boolean
}) {
  return useQuery({
    queryKey: ["collation-officers", params],
    queryFn: async () => {
      const response = await collationAPI.listOfficers(params)
      return response.data.data.officers as CollationOfficer[]
    },
  })
}

export function useElectionAssignments(
  electionId: string,
  params?: { officer_id?: string; polling_station_id?: string }
) {
  return useQuery({
    queryKey: ["election-assignments", electionId, params],
    queryFn: async () => {
      const response = await collationAPI.getElectionAssignments(electionId, params)
      return response.data.data.assignments as OfficerAssignment[]
    },
    enabled: !!electionId,
  })
}

export function useCreateOfficer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: {
      user_id: string
      officer_type: string
      national_id?: string
      phone?: string
    }) => collationAPI.createOfficer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collation-officers"] })
    },
  })
}

export function useAssignOfficer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: {
      officer_id: string
      election_id: string
      polling_station_id?: string
      collation_center_id?: string
      role: string
    }) => collationAPI.assignOfficer(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["election-assignments", variables.election_id],
      })
    },
  })
}

// ============================================
// INCIDENTS HOOKS
// ============================================

export function useIncidents(
  electionId: string,
  params?: { status?: string; severity?: string }
) {
  return useQuery({
    queryKey: ["incidents", electionId, params],
    queryFn: async () => {
      const response = await collationAPI.listIncidents(electionId, params)
      return response.data.data.incidents as CollationIncident[]
    },
    enabled: !!electionId,
  })
}

export function useReportIncident() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: {
      election_id: string
      polling_station_id?: string
      collation_center_id?: string
      incident_type: string
      severity: string
      description: string
      evidence_urls?: string[]
    }) => collationAPI.reportIncident(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["incidents", variables.election_id] })
    },
  })
}

export function useResolveIncident() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      incidentId,
      resolutionNotes,
    }: {
      incidentId: string
      resolutionNotes: string
    }) => collationAPI.resolveIncident(incidentId, resolutionNotes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incidents"] })
    },
  })
}

// ============================================
// AGGREGATION HOOKS
// ============================================

export function useAggregateResults(
  electionId: string,
  level: string,
  areaId?: string
) {
  return useQuery({
    queryKey: ["aggregate-results", electionId, level, areaId],
    queryFn: async () => {
      const response = await collationAPI.aggregateResults(electionId, level, areaId)
      return response.data.data
    },
    enabled: !!electionId && !!level,
  })
}

export function useCollationResults(electionId: string, level?: string) {
  return useQuery({
    queryKey: ["collation-results", electionId, level],
    queryFn: async () => {
      const response = await collationAPI.getCollationResults(electionId, level)
      return response.data.data.results
    },
    enabled: !!electionId,
  })
}

export function useSaveAggregation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      electionId,
      params,
    }: {
      electionId: string
      params: {
        level: string
        electoral_area_id?: string
        constituency_id?: string
        region_id?: string
      }
    }) => collationAPI.saveAggregation(electionId, params),
    onSuccess: (_, { electionId }) => {
      queryClient.invalidateQueries({ queryKey: ["collation-results", electionId] })
    },
  })
}
