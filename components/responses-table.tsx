"use client"

import { useState, useEffect } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { responsesAPI, formsAPI } from "@/lib/api"
import { useQuery } from "@tanstack/react-query"
import type { FormResponse, Form } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { useDeleteResponse } from "@/hooks/use-responses"
import { DataTable, DataTableColumnHeader } from "@/components/data-table"
import { ColumnDef } from "@tanstack/react-table"
import {
  Download,
  Eye,
  BarChart3,
  Map,
  TrendingUp,
  Table as TableIcon,
  FileText,
  Trash2,
  MoreHorizontal,
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { TableSkeleton } from "@/components/skeleton-loader"
import { usePermissions } from "@/lib/permission-context"
import { PermissionGuard } from "@/components/permission-guards"

type ViewMode = "table" | "chart" | "time_series" | "map" | "summary"

interface ResponsesTableProps {
  formId?: string
}

export function ResponsesTable({ formId }: ResponsesTableProps) {
  const [selectedFormId, setSelectedFormId] = useState(formId || "")
  const [selectedResponse, setSelectedResponse] = useState<FormResponse | null>(null)
  const [isResponseSheetOpen, setIsResponseSheetOpen] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>("table")
  const [responseViewMode, setResponseViewMode] = useState<"data" | "chart" | "map" | "summary">(
    "data"
  )
  const [isExporting, setIsExporting] = useState(false)
  const [deleteResponseId, setDeleteResponseId] = useState<string | null>(null)
  const { toast } = useToast()
  const deleteResponse = useDeleteResponse()
  const { hasPermission } = usePermissions()

  // Update selectedFormId when formId prop changes
  useEffect(() => {
    if (formId) {
      setSelectedFormId(formId)
    }
  }, [formId])

  // Fetch forms
  const { data: forms = [] } = useQuery({
    queryKey: ["forms"],
    queryFn: async () => {
      try {
        const response = await formsAPI.getAll()
        return response.data?.data || response.data || []
      } catch (error) {
        console.error("Failed to fetch forms:", error)
        throw error
      }
    },
    retry: 2,
  })

  // Fetch form details for field labels
  const { data: formData } = useQuery({
    queryKey: ["form", selectedResponse?.form_id],
    queryFn: async () => {
      if (!selectedResponse?.form_id) return null
      try {
        const response = await formsAPI.getById(selectedResponse.form_id)
        return response.data?.data || response.data
      } catch (error) {
        console.error("Failed to fetch form:", error)
        return null
      }
    },
    enabled: !!selectedResponse?.form_id,
  })

  // Create field label mapping
  const fieldLabels =
    formData?.schema?.fields?.reduce((acc: Record<string, string>, field: any) => {
      acc[field.id] = field.label || field.id
      return acc
    }, {}) || {}

  // Fetch responses based on view mode
  const {
    data: responsesData,
    isLoading: responsesLoading,
    error: responsesError,
  } = useQuery({
    queryKey: ["responses", selectedFormId, viewMode],
    queryFn: async () => {
      if (!selectedFormId) return null

      try {
        switch (viewMode) {
          case "table":
            try {
              const tableResponse = await responsesAPI.getTableView({
                form_id: selectedFormId,
                limit: 100,
              })
              return tableResponse.data?.data || tableResponse.data || []
            } catch (error) {
              console.warn("Table view API failed, falling back to basic responses:", error)
              const fallbackResponse = await responsesAPI.getAll({
                form_id: selectedFormId,
              })
              return { data: fallbackResponse.data?.data || [] }
            }
          case "chart":
            try {
              const chartResponse = await responsesAPI.getChartView({
                form_id: selectedFormId,
                group_by: "age",
                aggregate: "count",
              })
              return chartResponse.data
            } catch (error) {
              console.warn("Chart view API failed:", error)
              return { chart_data: [], group_by: "age", aggregate: "count" }
            }
          case "time_series":
            try {
              const timeSeriesResponse = await responsesAPI.getTimeSeriesView({
                form_id: selectedFormId,
                time_granularity: "day",
              })
              return timeSeriesResponse.data
            } catch (error) {
              console.warn("Time series view API failed:", error)
              return { time_series: [], granularity: "day", date_field: "submitted_at" }
            }
          case "map":
            try {
              const mapResponse = await responsesAPI.getMapView({
                form_id: selectedFormId,
              })
              return mapResponse.data
            } catch (error) {
              console.warn("Map view API failed:", error)
              return { map_data: [], total_points: 0 }
            }
          case "summary":
            try {
              const summaryResponse = await responsesAPI.getSummaryView({
                form_id: selectedFormId,
              })
              return summaryResponse.data
            } catch (error) {
              console.warn("Summary view API failed:", error)
              return {
                total_responses: 0,
                date_range: null,
                submission_types: {},
              }
            }
          default:
            return null
        }
      } catch (error) {
        console.error("Failed to fetch responses:", error)
        throw error
      }
    },
    enabled: !!selectedFormId,
    retry: (failureCount, error: any) => {
      if (error?.response?.status >= 400 && error?.response?.status < 500) {
        return false
      }
      return failureCount < 2
    },
  })

  const handleFormChange = (value: string) => {
    setSelectedFormId(value)
  }

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode)
  }

  const handleBulkDelete = (selectedResponses: FormResponse[]) => {
    if (
      confirm(
        `Are you sure you want to delete ${selectedResponses.length} response(s)? This action cannot be undone.`
      )
    ) {
      selectedResponses.forEach((response) => {
        deleteResponse.mutate(response.id)
      })
    }
  }

  const handleRowDoubleClick = (response: FormResponse) => {
    setSelectedResponse(response)
  }

  const handleDelete = () => {
    if (!deleteResponseId) return
    deleteResponse.mutate(deleteResponseId, {
      onSettled: () => setDeleteResponseId(null),
    })
  }

  const handleExport = async () => {
    if (!selectedFormId) {
      toast({
        title: "Error",
        description: "Please select a form",
        variant: "destructive",
      })
      return
    }

    setIsExporting(true)
    try {
      const response = await formsAPI.export(selectedFormId)
      const blob = new Blob([response.data], { type: "text/csv" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `responses_${selectedFormId}_${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Success",
        description: "Responses exported successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export responses",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const filteredForms = forms.filter((f: Form) => f.status === "published")

  // Check permissions
  const canViewResponses = hasPermission("responses.read")
  const canDeleteResponses = hasPermission("responses.delete")
  const canExportResponses = hasPermission("responses.export")

  if (!canViewResponses) {
    return (
      <Card>
        <div className="p-6 text-center">
          <p className="text-muted-foreground">You do not have permission to view responses.</p>
        </div>
      </Card>
    )
  }

  // Helper functions to determine view mode availability
  const isChartAvailable = () => {
    // Enable chart view when we have any responses
    return (
      selectedFormId && responsesData && (!Array.isArray(responsesData) || responsesData.length > 0)
    )
  }

  const isTimeSeriesAvailable = () => {
    // Enable time series view if we have responses data
    return responsesData && Array.isArray(responsesData) ? responsesData.length > 0 : true
  }

  const isMapAvailable = () => {
    // Enable map view if we have responses data
    return responsesData && Array.isArray(responsesData) ? responsesData.length > 0 : true
  }

  const isSummaryAvailable = () => {
    // Enable summary view if we have responses data
    return responsesData && Array.isArray(responsesData) ? responsesData.length > 0 : true
  }

  const columns: ColumnDef<FormResponse>[] = [
    {
      accessorKey: "submitted_by",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Submitted By" />,
      cell: ({ row }) => {
        return <span>{row.getValue("submitted_by") || "Anonymous"}</span>
      },
    },
    {
      accessorKey: "submitted_at",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Submitted At" />,
      cell: ({ row }) => {
        const submittedAt = row.getValue("submitted_at") as string
        return <span>{submittedAt ? new Date(submittedAt).toLocaleString() : "Unknown"}</span>
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const response = row.original

        return (
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedResponse(response)
                setIsResponseSheetOpen(true)
              }}
              disabled={!response.data}
              title="View Details"
            >
              <Eye className="w-4 h-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="w-4 h-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {canDeleteResponses && (
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => setDeleteResponseId(response.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ]

  const renderTableView = () => {
    if (responsesError) {
      return (
        <div className="text-center py-12">
          <p className="text-destructive">
            Error loading responses: {(responsesError as Error).message}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            The responses API might not be available or the form might not have any responses yet.
          </p>
        </div>
      )
    }

    const responses = responsesData?.data || []
    if (!Array.isArray(responses) || responses.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No responses found for this form.</p>
          <p className="text-sm text-muted-foreground mt-2">
            Responses will appear here once users submit the form.
          </p>
        </div>
      )
    }

    return (
      <DataTable
        columns={columns}
        data={responses}
        searchKey="submitted_by"
        searchPlaceholder="Search responses..."
        onRowDoubleClick={handleRowDoubleClick}
        bulkActions={
          canDeleteResponses
            ? [
                {
                  label: "Delete Selected",
                  action: handleBulkDelete,
                  variant: "destructive",
                },
              ]
            : []
        }
      />
    )
  }

  const renderChartView = () => {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Chart visualization coming soon...</p>
      </div>
    )
  }

  const renderTimeSeriesView = () => {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Time series visualization coming soon...</p>
      </div>
    )
  }

  const renderMapView = () => {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Map visualization coming soon...</p>
      </div>
    )
  }

  const renderSummaryView = () => {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Summary view coming soon...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Responses</h1>
          <p className="text-muted-foreground mt-1">View and export collected data</p>
        </div>
        {canExportResponses && (
          <Button
            onClick={handleExport}
            disabled={!selectedFormId || isExporting}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            {isExporting ? "Exporting..." : "Export CSV"}
          </Button>
        )}
      </div>

      <Card className="p-6">
        <div className="mb-6">
          <label className="block text-sm font-medium text-foreground mb-2">Select Form</label>
          <Select value={selectedFormId} onValueChange={handleFormChange}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a form to view responses..." />
            </SelectTrigger>
            <SelectContent>
              {filteredForms.map((form: Form) => (
                <SelectItem key={form.id} value={form.id}>
                  {form.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedFormId && (
          <div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-2">View Mode</label>
              <Select
                value={viewMode}
                onValueChange={(value) => handleViewModeChange(value as ViewMode)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a view mode..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="table">
                    <div className="flex items-center gap-2">
                      <TableIcon className="w-4 h-4" />
                      Table View
                    </div>
                  </SelectItem>
                  <SelectItem value="chart">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      Chart View
                    </div>
                  </SelectItem>
                  <SelectItem value="time_series">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Time Series
                    </div>
                  </SelectItem>
                  <SelectItem value="map">
                    <div className="flex items-center gap-2">
                      <Map className="w-4 h-4" />
                      Map View
                    </div>
                  </SelectItem>
                  <SelectItem value="summary">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Summary
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="mt-6">
              {viewMode === "table" && renderTableView()}
              {viewMode === "chart" && renderChartView()}
              {viewMode === "time_series" && renderTimeSeriesView()}
              {viewMode === "map" && renderMapView()}
              {viewMode === "summary" && renderSummaryView()}
            </div>
          </div>
        )}
      </Card>

      <Sheet open={isResponseSheetOpen} onOpenChange={setIsResponseSheetOpen}>
        <SheetContent className="w-[800px] sm:w-[900px] max-w-[95vw]">
          <SheetHeader>
            <SheetTitle>Response Details</SheetTitle>
            <SheetDescription>
              Complete response data from {selectedResponse?.submitted_by || "Anonymous"}
            </SheetDescription>
          </SheetHeader>

          {selectedResponse && (
            <div className="space-y-6 mt-6">
              <div className="bg-muted/30 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Form:</span>
                    <span className="ml-2 font-medium">{formData?.title || "Unknown Form"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Submitted:</span>
                    <span className="ml-2 font-medium">
                      {new Date(selectedResponse.submitted_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-b">
                <div className="flex space-x-1">
                  <button
                    onClick={() => setResponseViewMode("data")}
                    className={`px-4 py-2 text-sm font-medium rounded-t-md ${
                      responseViewMode === "data"
                        ? "bg-background border-b-2 border-primary text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Data
                  </button>
                  <button
                    onClick={() => setResponseViewMode("chart")}
                    className={`px-4 py-2 text-sm font-medium rounded-t-md ${
                      responseViewMode === "chart"
                        ? "bg-background border-b-2 border-primary text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Chart
                  </button>
                  <button
                    onClick={() => setResponseViewMode("map")}
                    className={`px-4 py-2 text-sm font-medium rounded-t-md ${
                      responseViewMode === "map"
                        ? "bg-background border-b-2 border-primary text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Map
                  </button>
                  <button
                    onClick={() => setResponseViewMode("summary")}
                    className={`px-4 py-2 text-sm font-medium rounded-t-md ${
                      responseViewMode === "summary"
                        ? "bg-background border-b-2 border-primary text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Summary
                  </button>
                </div>
              </div>

              <div className="min-h-[400px]">
                {responseViewMode === "data" && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Answers</h3>
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                      {Object.entries(selectedResponse.data).map(([key, value]) => (
                        <div key={key} className="border-l-4 border-primary/20 pl-4 py-2">
                          <div className="font-medium text-foreground mb-1">
                            {fieldLabels[key] || key}
                          </div>
                          <div className="text-muted-foreground">
                            {typeof value === "object" ? (
                              <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto">
                                {JSON.stringify(value, null, 2)}
                              </pre>
                            ) : (
                              <span className="text-foreground">{String(value)}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {responseViewMode === "chart" && (
                  <div className="text-center py-12">
                    <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Response Chart</h3>
                    <p className="text-muted-foreground">
                      Chart visualization for this response coming soon...
                    </p>
                  </div>
                )}

                {responseViewMode === "map" && (
                  <div className="text-center py-12">
                    <Map className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Response Map</h3>
                    <p className="text-muted-foreground">
                      Map visualization for this response coming soon...
                    </p>
                  </div>
                )}

                {responseViewMode === "summary" && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Response Summary</h3>
                    <div className="space-y-4">
                      <div className="bg-muted/30 rounded-lg p-4">
                        <h4 className="font-medium mb-2">Key Information</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Total Fields:</span>
                            <span className="font-medium">
                              {Object.keys(selectedResponse.data).length}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Response ID:</span>
                            <span className="font-mono text-xs">
                              {selectedResponse.id.slice(-8)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Submitted:</span>
                            <span className="font-medium">
                              {new Date(selectedResponse.submitted_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-muted/30 rounded-lg p-4">
                        <h4 className="font-medium mb-2">Field Highlights</h4>
                        <div className="space-y-2">
                          {Object.entries(selectedResponse.data)
                            .slice(0, 3)
                            .map(([key, value]) => (
                              <div key={key} className="text-sm">
                                <span className="text-muted-foreground">
                                  {fieldLabels[key] || key}:
                                </span>
                                <span className="ml-2 font-medium">
                                  {typeof value === "object"
                                    ? "[Object]"
                                    : String(value).slice(0, 50)}
                                  {String(value).length > 50 && "..."}
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteResponseId} onOpenChange={() => setDeleteResponseId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the response and all
              associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
