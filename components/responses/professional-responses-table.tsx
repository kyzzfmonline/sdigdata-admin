"use client"

import { useState, useEffect, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { responsesAPI, formsAPI } from "@/lib/api"
import { useQuery } from "@tanstack/react-query"
import type { FormResponse, Form } from "@/lib/types"
import { useDeleteResponse } from "@/hooks/use-responses"
import {
  Table,
  Grid,
  BarChart3,
  TrendingUp,
  Download,
  Eye,
  Trash2,
} from "lucide-react"
import { TableSkeleton } from "@/components/skeleton-loader"
import { usePermissions } from "@/lib/permission-context"
import { formatRelativeTime } from "@/lib/date-utils"
import { DataTable, DataTableColumnHeader } from "@/components/data-table"
import { ColumnDef } from "@tanstack/react-table"

// Import our new components
import { ResponseAnalyticsDashboard } from "./response-analytics-dashboard"
import { ResponseFiltersPanel, type ResponseFilters } from "./response-filters"
import { ResponseCardView } from "./response-card-view"
import { ResponseDetailModal } from "./response-detail-modal"
import { ResponseBulkActions } from "./response-bulk-actions"
import { ResponseVisualizations } from "./response-visualizations"

interface ProfessionalResponsesTableProps {
  formId?: string
}

type ViewMode = "table" | "cards" | "analytics" | "insights"

export function ProfessionalResponsesTable({ formId }: ProfessionalResponsesTableProps) {
  const [selectedFormId, setSelectedFormId] = useState(formId || "")
  const [viewMode, setViewMode] = useState<ViewMode>("table")
  const [selectedResponse, setSelectedResponse] = useState<FormResponse | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedResponses, setSelectedResponses] = useState<FormResponse[]>([])
  const [filters, setFilters] = useState<ResponseFilters>({
    search: "",
    qualityRange: [0, 100],
    fieldFilters: {},
  })

  const deleteResponse = useDeleteResponse()
  const { hasPermission } = usePermissions()

  const canViewResponses = hasPermission("responses:read")
  const canDeleteResponses = hasPermission("responses:delete")
  const canExportResponses = hasPermission("responses:export")

  // Fetch forms
  const { data: forms = [] } = useQuery({
    queryKey: ["forms"],
    queryFn: async () => {
      const response = await formsAPI.getAll()
      return response.data?.data || response.data || []
    },
  })

  // Fetch form details
  const { data: formData } = useQuery({
    queryKey: ["form", selectedFormId],
    queryFn: async () => {
      if (!selectedFormId) return null
      const response = await formsAPI.getById(selectedFormId)
      return response.data?.data || response.data
    },
    enabled: !!selectedFormId,
  })

  // Fetch responses
  const {
    data: responsesData,
    isLoading: responsesLoading,
  } = useQuery({
    queryKey: ["responses", selectedFormId],
    queryFn: async () => {
      if (!selectedFormId) return null
      try {
        const tableResponse = await responsesAPI.getTableView({
          form_id: selectedFormId,
          limit: 1000,
        })
        return tableResponse.data?.data || tableResponse.data || []
      } catch (error) {
        console.warn("Table view API failed, falling back:", error)
        const fallbackResponse = await responsesAPI.getAll({
          form_id: selectedFormId,
        })
        return { data: fallbackResponse.data?.data || [] }
      }
    },
    enabled: !!selectedFormId,
  })

  // Filter responses
  const filteredResponses = useMemo(() => {
    const responses = responsesData?.data || []
    if (!Array.isArray(responses)) return []

    return responses.filter((response: FormResponse) => {
      // Text search
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const matchesSearch =
          response.submitted_by?.toLowerCase().includes(searchLower) ||
          response.id.toLowerCase().includes(searchLower) ||
          Object.values(response.data || {}).some((val) =>
            String(val).toLowerCase().includes(searchLower)
          )
        if (!matchesSearch) return false
      }

      // Quality score range
      const qualityScore = (response as any).quality_score
      if (qualityScore !== undefined && qualityScore !== null) {
        if (qualityScore < filters.qualityRange[0] || qualityScore > filters.qualityRange[1]) {
          return false
        }
      }

      // Date range
      if (filters.dateRange?.from) {
        const submittedDate = new Date(response.submitted_at)
        if (submittedDate < filters.dateRange.from) return false
        if (filters.dateRange.to && submittedDate > filters.dateRange.to) return false
      }

      // Field filters
      for (const [fieldId, filterValue] of Object.entries(filters.fieldFilters)) {
        const responseValue = response.data[fieldId]
        if (filterValue && responseValue !== filterValue) {
          return false
        }
      }

      return true
    })
  }, [responsesData, filters])

  const formTitlesMap = forms.reduce((acc: Record<string, string>, form: Form) => {
    acc[form.id] = form.title
    return acc
  }, {})

  const handleViewResponse = (response: FormResponse) => {
    setSelectedResponse(response)
    setIsDetailModalOpen(true)
  }

  const handleDeleteResponse = (response: FormResponse) => {
    deleteResponse.mutate(response.id)
  }

  const handleBulkDelete = (responses: FormResponse[]) => {
    responses.forEach((r) => deleteResponse.mutate(r.id))
    setSelectedResponses([])
  }

  const handleToggleSelect = (response: FormResponse) => {
    setSelectedResponses((prev) => {
      const isSelected = prev.some((r) => r.id === response.id)
      if (isSelected) {
        return prev.filter((r) => r.id !== response.id)
      }
      return [...prev, response]
    })
  }

  // Table columns
  const columns: ColumnDef<FormResponse>[] = [
    {
      accessorKey: "id",
      header: ({ column }) => <DataTableColumnHeader column={column} title="ID" />,
      cell: ({ row }) => {
        const id = row.getValue("id") as string
        return <code className="text-xs bg-muted px-2 py-1 rounded">{id.slice(0, 8)}</code>
      },
    },
    {
      accessorKey: "submitted_by",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Submitted By" />,
      cell: ({ row }) => row.getValue("submitted_by") || "Anonymous",
    },
    {
      accessorKey: "submitted_at",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Submitted" />,
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {formatRelativeTime(row.getValue("submitted_at"))}
        </span>
      ),
    },
    {
      accessorKey: "quality_score",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Quality" />,
      cell: ({ row }) => {
        const score = (row.original as any).quality_score
        if (score === undefined || score === null) return <span className="text-muted-foreground">N/A</span>

        const variant = score >= 80 ? "success" : score >= 60 ? "warning" : "destructive"
        return <Badge variant={variant}>{score.toFixed(0)}%</Badge>
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewResponse(row.original)}
          >
            <Eye className="w-4 h-4" />
          </Button>
          {canDeleteResponses && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteResponse(row.original)}
              className="text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      ),
    },
  ]

  if (!canViewResponses) {
    return (
      <Card className="p-6 text-center">
        <p className="text-muted-foreground">You do not have permission to view responses.</p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Response Management</h1>
          <p className="text-muted-foreground mt-1">
            Advanced analytics and insights for form responses
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "table" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("table")}
          >
            <Table className="w-4 h-4 mr-2" />
            Table
          </Button>
          <Button
            variant={viewMode === "cards" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("cards")}
          >
            <Grid className="w-4 h-4 mr-2" />
            Cards
          </Button>
          <Button
            variant={viewMode === "analytics" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("analytics")}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Analytics
          </Button>
          <Button
            variant={viewMode === "insights" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("insights")}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Insights
          </Button>
        </div>
      </div>

      {/* Form Selector */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Select value={selectedFormId} onValueChange={setSelectedFormId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a form to view responses..." />
              </SelectTrigger>
              <SelectContent>
                {forms.filter((f: Form) => f.status === "active").map((form: Form) => (
                  <SelectItem key={form.id} value={form.id}>
                    {form.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {canExportResponses && selectedFormId && (
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          )}
        </div>
      </Card>

      {selectedFormId && (
        <>
          {/* Bulk Actions Bar */}
          {selectedResponses.length > 0 && (
            <ResponseBulkActions
              selectedResponses={selectedResponses}
              onDelete={handleBulkDelete}
              onClearSelection={() => setSelectedResponses([])}
            />
          )}

          {/* Analytics View */}
          {viewMode === "analytics" && (
            <ResponseAnalyticsDashboard formId={selectedFormId} />
          )}

          {/* Insights/Visualization View */}
          {viewMode === "insights" && (
            <ResponseVisualizations
              responses={filteredResponses}
              formData={formData}
            />
          )}

          {/* Table/Card Views with Filters */}
          {(viewMode === "table" || viewMode === "cards") && (
            <div className="grid gap-6 lg:grid-cols-4">
              {/* Filters Sidebar */}
              <div className="lg:col-span-1">
                <ResponseFiltersPanel
                  filters={filters}
                  onChange={setFilters}
                  fieldOptions={formData?.schema?.fields}
                />
              </div>

              {/* Main Content */}
              <div className="lg:col-span-3">
                <Card className="p-6">
                  {responsesLoading ? (
                    <TableSkeleton />
                  ) : filteredResponses.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">No responses found</p>
                    </div>
                  ) : viewMode === "table" ? (
                    <DataTable
                      columns={columns}
                      data={filteredResponses}
                      searchKey="submitted_by"
                      searchPlaceholder="Search responses..."
                      onRowDoubleClick={handleViewResponse}
                    />
                  ) : (
                    <ResponseCardView
                      responses={filteredResponses}
                      selectedResponses={selectedResponses}
                      onToggleSelect={handleToggleSelect}
                      onView={handleViewResponse}
                      onDelete={handleDeleteResponse}
                      formTitlesMap={formTitlesMap}
                      formData={formData}
                    />
                  )}
                </Card>
              </div>
            </div>
          )}
        </>
      )}

      {/* Detail Modal */}
      <ResponseDetailModal
        open={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
        response={selectedResponse}
        formData={formData}
      />
    </div>
  )
}
