"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useResultSheets, useVerifySheet, useApproveSheet, useCertifySheet, useRejectSheet } from "@/hooks/collation"
import type { ResultSheet, ResultSheetStatus } from "@/lib/types"
import {
  Search,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Eye,
  FileCheck,
  FileClock,
  FileX,
  Filter,
} from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { toast } from "sonner"

interface ResultSheetsListProps {
  electionId: string
}

const statusColors: Record<ResultSheetStatus, string> = {
  draft: "bg-gray-100 text-gray-700",
  submitted: "bg-blue-100 text-blue-700",
  verified: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  certified: "bg-emerald-100 text-emerald-700",
}

const statusIcons: Record<ResultSheetStatus, React.ReactNode> = {
  draft: <FileClock className="h-3 w-3" />,
  submitted: <FileCheck className="h-3 w-3" />,
  verified: <CheckCircle className="h-3 w-3" />,
  approved: <CheckCircle className="h-3 w-3" />,
  certified: <CheckCircle className="h-3 w-3" />,
}

export function ResultSheetsList({ electionId }: ResultSheetsListProps) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [actionDialog, setActionDialog] = useState<{
    type: "verify" | "approve" | "certify" | "reject"
    sheet: ResultSheet
  } | null>(null)
  const [notes, setNotes] = useState("")

  const { data: sheets, isLoading } = useResultSheets(electionId, {
    status: statusFilter || undefined,
  })

  const verifySheet = useVerifySheet()
  const approveSheet = useApproveSheet()
  const certifySheet = useCertifySheet()
  const rejectSheet = useRejectSheet()

  const filteredSheets = sheets?.filter((sheet) => {
    if (!search) return true
    const searchLower = search.toLowerCase()
    return (
      sheet.polling_station_name?.toLowerCase().includes(searchLower) ||
      sheet.polling_station_code?.toLowerCase().includes(searchLower) ||
      sheet.constituency_name?.toLowerCase().includes(searchLower) ||
      sheet.region_name?.toLowerCase().includes(searchLower)
    )
  })

  const handleAction = async () => {
    if (!actionDialog) return

    try {
      switch (actionDialog.type) {
        case "verify":
          await verifySheet.mutateAsync({
            sheetId: actionDialog.sheet.id,
            notes: notes || undefined,
          })
          toast.success("Result sheet verified successfully")
          break
        case "approve":
          await approveSheet.mutateAsync({
            sheetId: actionDialog.sheet.id,
            notes: notes || undefined,
          })
          toast.success("Result sheet approved successfully")
          break
        case "certify":
          await certifySheet.mutateAsync({
            sheetId: actionDialog.sheet.id,
            notes: notes || undefined,
          })
          toast.success("Result sheet certified successfully")
          break
        case "reject":
          if (!notes || notes.length < 10) {
            toast.error("Please provide a reason for rejection (at least 10 characters)")
            return
          }
          await rejectSheet.mutateAsync({
            sheetId: actionDialog.sheet.id,
            reason: notes,
          })
          toast.success("Result sheet rejected")
          break
      }
      setActionDialog(null)
      setNotes("")
    } catch (error) {
      toast.error("Action failed. Please try again.")
    }
  }

  const canVerify = (status: ResultSheetStatus) => status === "submitted"
  const canApprove = (status: ResultSheetStatus) => status === "verified"
  const canCertify = (status: ResultSheetStatus) => status === "approved"
  const canReject = (status: ResultSheetStatus) =>
    ["submitted", "verified", "approved"].includes(status)

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Result Sheets</CardTitle>
              <CardDescription>
                View and manage result sheets for this election
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search stations..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 w-[200px]"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="All status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="certified">Certified</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-16 bg-muted animate-pulse rounded"
                />
              ))}
            </div>
          ) : filteredSheets?.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              No result sheets found
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Polling Station</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Votes</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSheets?.map((sheet) => (
                    <TableRow key={sheet.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {sheet.polling_station_name || "N/A"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {sheet.polling_station_code}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{sheet.electoral_area_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {sheet.constituency_name}, {sheet.region_name}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={cn(
                            "capitalize flex items-center gap-1 w-fit",
                            statusColors[sheet.status]
                          )}
                        >
                          {statusIcons[sheet.status]}
                          {sheet.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <p className="font-medium">
                          {sheet.total_valid_votes?.toLocaleString() || "-"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          of {sheet.total_votes_cast?.toLocaleString() || "-"} cast
                        </p>
                      </TableCell>
                      <TableCell>
                        {sheet.submitted_at ? (
                          <div className="text-sm">
                            <p>
                              {format(new Date(sheet.submitted_at), "MMM d, h:mm a")}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              by {sheet.created_by_username}
                            </p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/elections/${electionId}/collation/sheets/${sheet.id}`}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {canVerify(sheet.status) && (
                              <DropdownMenuItem
                                onClick={() =>
                                  setActionDialog({ type: "verify", sheet })
                                }
                              >
                                <CheckCircle className="h-4 w-4 mr-2 text-yellow-600" />
                                Verify
                              </DropdownMenuItem>
                            )}
                            {canApprove(sheet.status) && (
                              <DropdownMenuItem
                                onClick={() =>
                                  setActionDialog({ type: "approve", sheet })
                                }
                              >
                                <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                                Approve
                              </DropdownMenuItem>
                            )}
                            {canCertify(sheet.status) && (
                              <DropdownMenuItem
                                onClick={() =>
                                  setActionDialog({ type: "certify", sheet })
                                }
                              >
                                <FileCheck className="h-4 w-4 mr-2 text-emerald-600" />
                                Certify
                              </DropdownMenuItem>
                            )}
                            {canReject(sheet.status) && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() =>
                                    setActionDialog({ type: "reject", sheet })
                                  }
                                  className="text-red-600"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Reject
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={!!actionDialog} onOpenChange={() => setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="capitalize">
              {actionDialog?.type} Result Sheet
            </DialogTitle>
            <DialogDescription>
              {actionDialog?.type === "reject"
                ? "Please provide a reason for rejecting this result sheet."
                : `Are you sure you want to ${actionDialog?.type} this result sheet?`}
            </DialogDescription>
          </DialogHeader>

          {actionDialog && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium">
                  {actionDialog.sheet.polling_station_name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {actionDialog.sheet.constituency_name},{" "}
                  {actionDialog.sheet.region_name}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {actionDialog.type === "reject" ? "Reason (required)" : "Notes (optional)"}
                </label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={
                    actionDialog.type === "reject"
                      ? "Enter reason for rejection..."
                      : "Add any notes..."
                  }
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              disabled={
                verifySheet.isPending ||
                approveSheet.isPending ||
                certifySheet.isPending ||
                rejectSheet.isPending
              }
              variant={actionDialog?.type === "reject" ? "destructive" : "default"}
            >
              {actionDialog?.type === "reject" ? "Reject" : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
