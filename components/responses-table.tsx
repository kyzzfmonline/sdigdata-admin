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
import { Badge } from "@/components/ui/badge"
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
  Trash2,
  Copy,
  Check,
  FileIcon,
  ExternalLink,
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { formatRelativeTime, formatFullDate, isImageUrl, isUrl } from "@/lib/date-utils"

interface ResponsesTableProps {
  formId?: string
}

export function ResponsesTable({ formId }: ResponsesTableProps) {
  const [selectedFormId, setSelectedFormId] = useState(formId || "")
  const [selectedResponse, setSelectedResponse] = useState<FormResponse | null>(null)
  const [isResponseSheetOpen, setIsResponseSheetOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [deleteResponseId, setDeleteResponseId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
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

  // Fetch responses
  const {
    data: responsesData,
    isLoading: responsesLoading,
    error: responsesError,
  } = useQuery({
    queryKey: ["responses", selectedFormId],
    queryFn: async () => {
      if (!selectedFormId) return null

      try {
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
    setIsResponseSheetOpen(true)
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

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
    toast({
      title: "Copied",
      description: "Response ID copied to clipboard",
    })
  }

  const getQualityScoreBadge = (score?: number) => {
    if (score === undefined || score === null) return null

    let variant: "success" | "warning" | "destructive" = "success"
    if (score < 60) variant = "destructive"
    else if (score < 80) variant = "warning"

    return (
      <Badge variant={variant}>
        {score.toFixed(0)}%
      </Badge>
    )
  }

  const filteredForms = forms.filter((f: Form) => f.status === "active")

  // Check permissions
  const canViewResponses = hasPermission("responses:read")
  const canDeleteResponses = hasPermission("responses:delete")
  const canExportResponses = hasPermission("responses:export")

  if (!canViewResponses) {
    return (
      <Card>
        <div className="p-6 text-center">
          <p className="text-muted-foreground">You do not have permission to view responses.</p>
        </div>
      </Card>
    )
  }

  // Create a map of form IDs to titles for quick lookup
  const formTitlesMap = forms.reduce((acc: Record<string, string>, form: Form) => {
    acc[form.id] = form.title
    return acc
  }, {})

  const columns: ColumnDef<FormResponse>[] = [
    {
      accessorKey: "form_id",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Form Title" />,
      cell: ({ row }) => {
        const formId = row.getValue("form_id") as string
        return <span className="font-medium">{formTitlesMap[formId] || "Unknown Form"}</span>
      },
    },
    {
      accessorKey: "id",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Response ID" />,
      cell: ({ row }) => {
        const id = row.getValue("id") as string
        const shortId = id.slice(0, 8)
        const isCopied = copiedId === id

        return (
          <div className="flex items-center gap-2">
            <code className="text-xs bg-muted px-2 py-1 rounded">{shortId}</code>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation()
                handleCopyId(id)
              }}
            >
              {isCopied ? (
                <Check className="w-3 h-3 text-success" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </Button>
          </div>
        )
      },
    },
    {
      accessorKey: "submitted_by",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Submitted By" />,
      cell: ({ row }) => {
        const submittedBy = row.getValue("submitted_by") as string
        return <span>{submittedBy || "Anonymous"}</span>
      },
    },
    {
      accessorKey: "submitted_at",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Submitted" />,
      cell: ({ row }) => {
        const submittedAt = row.getValue("submitted_at") as string
        return (
          <span className="text-muted-foreground">
            {submittedAt ? formatRelativeTime(submittedAt) : "Unknown"}
          </span>
        )
      },
    },
    {
      accessorKey: "quality_score",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Quality Score" />,
      cell: ({ row }) => {
        const response = row.original as any
        const qualityScore = response.quality_score
        return qualityScore !== undefined ? getQualityScoreBadge(qualityScore) : <span className="text-muted-foreground text-sm">N/A</span>
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
            {canDeleteResponses && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteResponseId(response.id)}
                title="Delete Response"
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        )
      },
    },
  ]

  const renderValue = (value: any, key: string): JSX.Element => {
    // Handle null/undefined
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground italic">No value</span>
    }

    // Handle booleans
    if (typeof value === "boolean") {
      return (
        <Badge variant={value ? "success" : "secondary"}>
          {value ? "Yes" : "No"}
        </Badge>
      )
    }

    // Handle strings
    if (typeof value === "string") {
      // Check if it's an image URL
      if (isImageUrl(value)) {
        return (
          <div className="space-y-2">
            <img
              src={value}
              alt="Response attachment"
              className="max-h-[200px] rounded border"
              onError={(e) => {
                e.currentTarget.style.display = "none"
                e.currentTarget.nextElementSibling?.classList.remove("hidden")
              }}
            />
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              <ExternalLink className="w-3 h-3" />
              Open in new tab
            </a>
          </div>
        )
      }

      // Check if it's a file URL
      if (isUrl(value)) {
        return (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline flex items-center gap-2"
          >
            <FileIcon className="w-4 h-4" />
            <span className="break-all">{value}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )
      }

      // Check if it's a date string (ISO format)
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
        return (
          <span className="text-foreground">
            {formatRelativeTime(value)}
            <span className="text-xs text-muted-foreground ml-2">
              ({formatFullDate(value)})
            </span>
          </span>
        )
      }

      // Regular string
      return <span className="text-foreground">{value}</span>
    }

    // Handle arrays
    if (Array.isArray(value)) {
      return (
        <div className="space-y-1">
          {value.map((item, index) => (
            <div key={index} className="flex items-start gap-2">
              <span className="text-muted-foreground">•</span>
              {renderValue(item, `${key}.${index}`)}
            </div>
          ))}
        </div>
      )
    }

    // Handle objects (including GPS coordinates)
    if (typeof value === "object") {
      // Check for GPS coordinates
      if ("latitude" in value && "longitude" in value) {
        return (
          <div className="space-y-1">
            <div className="text-sm">
              <span className="text-muted-foreground">Lat:</span> {value.latitude}
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Lng:</span> {value.longitude}
            </div>
            <a
              href={`https://www.google.com/maps?q=${value.latitude},${value.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
            >
              <ExternalLink className="w-3 h-3" />
              View on map
            </a>
          </div>
        )
      }

      // Generic object - show as formatted JSON
      return (
        <pre className="text-xs bg-muted p-3 rounded mt-1 overflow-x-auto border">
          {JSON.stringify(value, null, 2)}
        </pre>
      )
    }

    // Handle numbers
    return <span className="text-foreground">{String(value)}</span>
  }

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
          <div className="mt-6">
            {responsesLoading ? <TableSkeleton /> : renderTableView()}
          </div>
        )}
      </Card>

      <Sheet open={isResponseSheetOpen} onOpenChange={setIsResponseSheetOpen}>
        <SheetContent className="w-[800px] sm:w-[900px] max-w-[95vw] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Response Details</SheetTitle>
            <SheetDescription>
              Complete response data from {selectedResponse?.submitted_by || "Anonymous"}
            </SheetDescription>
          </SheetHeader>

          {selectedResponse && (
            <div className="space-y-6 mt-6">
              {/* Header Section */}
              <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {formData?.title || "Unknown Form"}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Submitted {formatRelativeTime(selectedResponse.submitted_at)}
                    </p>
                  </div>
                  {(selectedResponse as any).quality_score !== undefined && (
                    <div>
                      {getQualityScoreBadge((selectedResponse as any).quality_score)}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2 border-t">
                  <span className="text-sm text-muted-foreground">Response ID:</span>
                  <code className="text-xs bg-muted px-2 py-1 rounded">
                    {selectedResponse.id.slice(0, 8)}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => handleCopyId(selectedResponse.id)}
                  >
                    {copiedId === selectedResponse.id ? (
                      <Check className="w-3 h-3 text-success" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                </div>

                <div className="text-sm text-muted-foreground pt-2 border-t">
                  <span className="font-medium">Full timestamp:</span>{" "}
                  {formatFullDate(selectedResponse.submitted_at)}
                </div>
              </div>

              {/* Data Section */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Response Data</h3>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                  {Object.entries(selectedResponse.data).map(([key, value]) => (
                    <div key={key} className="border-l-4 border-primary/20 pl-4 py-2">
                      <div className="font-medium text-foreground mb-2">
                        {fieldLabels[key] || key}
                      </div>
                      <div className="text-muted-foreground">
                        {renderValue(value, key)}
                      </div>
                    </div>
                  ))}

                  {Object.keys(selectedResponse.data).length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No data available for this response
                    </div>
                  )}
                </div>
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
