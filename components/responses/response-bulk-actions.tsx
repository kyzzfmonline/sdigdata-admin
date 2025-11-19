"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Download,
  Trash2,
  Tag,
  UserPlus,
  Flag,
  CheckCircle2,
  FileJson,
  FileSpreadsheet,
  ChevronDown,
} from "lucide-react"
import type { FormResponse } from "@/lib/types"
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
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"

interface ResponseBulkActionsProps {
  selectedResponses: FormResponse[]
  onDelete: (responses: FormResponse[]) => void
  onClearSelection: () => void
}

type ExportFormat = "csv" | "json" | "excel"

export function ResponseBulkActions({
  selectedResponses,
  onDelete,
  onClearSelection,
}: ResponseBulkActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const { toast } = useToast()

  const handleExport = async (format: ExportFormat) => {
    // TODO: Implement actual export logic
    toast({
      title: "Exporting...",
      description: `Exporting ${selectedResponses.length} response(s) as ${format.toUpperCase()}`,
    })

    // Simulate export
    const data = selectedResponses.map((r) => r.data)

    if (format === "json") {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `responses-${new Date().toISOString().split("T")[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    } else if (format === "csv") {
      // Basic CSV export
      const headers = Object.keys(data[0] || {})
      const csv = [
        headers.join(","),
        ...data.map((row) => headers.map((h) => JSON.stringify(row[h] || "")).join(",")),
      ].join("\n")

      const blob = new Blob([csv], { type: "text/csv" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `responses-${new Date().toISOString().split("T")[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
    }

    toast({
      title: "Export Complete",
      description: `${selectedResponses.length} response(s) exported successfully`,
    })
  }

  const handleTag = () => {
    toast({
      title: "Tag Responses",
      description: "Tagging feature will be available soon",
    })
  }

  const handleAssign = () => {
    toast({
      title: "Assign Responses",
      description: "Assignment feature will be available soon",
    })
  }

  const handleFlag = () => {
    toast({
      title: "Flag for Review",
      description: "Flagging feature will be available soon",
    })
  }

  const handleMarkReviewed = () => {
    toast({
      title: "Mark as Reviewed",
      description: "Review status feature will be available soon",
    })
  }

  const handleDeleteConfirm = () => {
    onDelete(selectedResponses)
    setShowDeleteDialog(false)
    onClearSelection()
  }

  if (selectedResponses.length === 0) return null

  return (
    <>
      <div className="flex items-center gap-2 p-4 bg-primary/5 border-b">
        <div className="flex-1">
          <p className="font-semibold">
            {selectedResponses.length} response{selectedResponses.length !== 1 ? "s" : ""} selected
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Export Format</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleExport("csv")}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                CSV File
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("json")}>
                <FileJson className="w-4 h-4 mr-2" />
                JSON File
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("excel")}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Excel File
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Actions
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Bulk Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleTag}>
                <Tag className="w-4 h-4 mr-2" />
                Add Tags
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleAssign}>
                <UserPlus className="w-4 h-4 mr-2" />
                Assign to User
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleFlag}>
                <Flag className="w-4 h-4 mr-2" />
                Flag for Review
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleMarkReviewed}>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Mark as Reviewed
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>

          <Button variant="ghost" onClick={onClearSelection}>
            Clear
          </Button>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedResponses.length} Response(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected responses
              and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
