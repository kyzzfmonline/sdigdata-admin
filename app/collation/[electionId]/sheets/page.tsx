"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { LayoutWrapper } from "@/components/layout-wrapper"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import {
  FileText,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Plus,
  ChevronRight,
  MapPin,
  RefreshCw,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { formatDistanceToNow, format } from "date-fns"
import { usePermissions } from "@/lib/permission-context"
import { RouteGuard } from "@/components/route-guard"
import { useElection } from "@/hooks/elections"
import { useResultSheets, useVerifySheet, useApproveSheet, useRejectSheet } from "@/hooks/collation"
import type { ResultSheetStatus, ResultSheetType, ResultSheet } from "@/lib/types"

const statusColors: Record<ResultSheetStatus, string> = {
  draft: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  submitted: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  verified: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  approved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  certified: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
}

const statusIcons: Record<ResultSheetStatus, React.ReactNode> = {
  draft: <Clock className="h-3.5 w-3.5" />,
  submitted: <Loader2 className="h-3.5 w-3.5" />,
  verified: <CheckCircle className="h-3.5 w-3.5" />,
  approved: <CheckCircle className="h-3.5 w-3.5" />,
  certified: <CheckCircle className="h-3.5 w-3.5" />,
}

const sheetTypeLabels: Record<ResultSheetType, string> = {
  polling_station: "Polling Station",
  electoral_area: "Electoral Area",
  constituency: "Constituency",
  regional: "Regional",
  national: "National",
}

function SheetsTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="rounded-lg border">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 border-b last:border-b-0">
            <Skeleton className="h-10 w-10 rounded" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-8 w-8" />
          </div>
        ))}
      </div>
    </div>
  )
}

function SheetRow({ sheet, electionId }: { sheet: ResultSheet; electionId: string }) {
  const { hasPermission } = usePermissions()
  const verifySheet = useVerifySheet()
  const approveSheet = useApproveSheet()
  const rejectSheet = useRejectSheet()

  const canVerify = sheet.status === "submitted" && hasPermission("collation:verify")
  const canApprove = sheet.status === "verified" && hasPermission("collation:approve")
  const canReject = (sheet.status === "submitted" || sheet.status === "verified") && hasPermission("collation:verify")

  const handleVerify = () => {
    verifySheet.mutate({ sheetId: sheet.id })
  }

  const handleApprove = () => {
    approveSheet.mutate({ sheetId: sheet.id })
  }

  const handleReject = () => {
    const reason = prompt("Enter rejection reason:")
    if (reason) {
      rejectSheet.mutate({ sheetId: sheet.id, reason })
    }
  }

  return (
    <motion.tr
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-b last:border-b-0 hover:bg-muted/50"
    >
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-medium truncate">
              {sheet.polling_station_name || sheet.electoral_area_name || "Unknown"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {sheet.polling_station_code || sheetTypeLabels[sheet.sheet_type]}
            </p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline">{sheetTypeLabels[sheet.sheet_type]}</Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          <span className="truncate max-w-[150px]">
            {sheet.constituency_name || sheet.region_name || "-"}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <Badge className={`gap-1 ${statusColors[sheet.status]}`}>
          {statusIcons[sheet.status]}
          {sheet.status.charAt(0).toUpperCase() + sheet.status.slice(1)}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="text-sm">
          <p className="font-medium">
            {sheet.total_votes_cast?.toLocaleString() || "-"}
          </p>
          <p className="text-xs text-muted-foreground">
            of {sheet.total_registered_voters?.toLocaleString() || "-"} registered
          </p>
        </div>
      </TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <Link href={`/collation/${electionId}/sheets/${sheet.id}`}>
              <DropdownMenuItem>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
            </Link>

            {(canVerify || canApprove || canReject) && <DropdownMenuSeparator />}

            {canVerify && (
              <DropdownMenuItem
                onClick={handleVerify}
                className="text-cyan-600"
                disabled={verifySheet.isPending}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Verify
              </DropdownMenuItem>
            )}
            {canApprove && (
              <DropdownMenuItem
                onClick={handleApprove}
                className="text-green-600"
                disabled={approveSheet.isPending}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </DropdownMenuItem>
            )}
            {canReject && (
              <DropdownMenuItem
                onClick={handleReject}
                className="text-destructive"
                disabled={rejectSheet.isPending}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </motion.tr>
  )
}

export default function ResultSheetsPage() {
  const params = useParams()
  const electionId = params.electionId as string
  const { hasPermission } = usePermissions()

  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")

  const { data: election, isLoading: electionLoading } = useElection(electionId)
  const {
    data: sheets,
    isLoading: sheetsLoading,
    refetch,
  } = useResultSheets(electionId, {
    status: statusFilter !== "all" ? statusFilter : undefined,
    sheet_type: typeFilter !== "all" ? typeFilter : undefined,
  })

  const isLoading = electionLoading || sheetsLoading

  // Filter by search query
  const filteredSheets = sheets?.filter((sheet: ResultSheet) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      sheet.polling_station_name?.toLowerCase().includes(query) ||
      sheet.polling_station_code?.toLowerCase().includes(query) ||
      sheet.electoral_area_name?.toLowerCase().includes(query) ||
      sheet.constituency_name?.toLowerCase().includes(query) ||
      sheet.region_name?.toLowerCase().includes(query)
    )
  }) || []

  return (
    <RouteGuard permissions={["collation:read"]}>
      <LayoutWrapper>
        <PageHeader
          title="Result Sheets"
          description={election?.title || "Loading..."}
          breadcrumbs={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Collation", href: "/collation" },
            { label: election?.title || "...", href: `/collation/${electionId}` },
            { label: "Sheets" },
          ]}
          action={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              {hasPermission("collation:create") && (
                <Link href={`/collation/${electionId}/sheets/new`}>
                  <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    New Sheet
                  </Button>
                </Link>
              )}
            </div>
          }
        />

        <motion.div
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          {isLoading ? (
            <SheetsTableSkeleton />
          ) : (
            <Card>
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search sheets..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="submitted">Submitted</SelectItem>
                      <SelectItem value="verified">Verified</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="certified">Certified</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="polling_station">Polling Station</SelectItem>
                      <SelectItem value="electoral_area">Electoral Area</SelectItem>
                      <SelectItem value="constituency">Constituency</SelectItem>
                      <SelectItem value="regional">Regional</SelectItem>
                      <SelectItem value="national">National</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="rounded-lg border mx-6 mb-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[25%]">Station/Area</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Votes</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <AnimatePresence>
                        {filteredSheets.length > 0 ? (
                          filteredSheets.map((sheet: ResultSheet) => (
                            <SheetRow
                              key={sheet.id}
                              sheet={sheet}
                              electionId={electionId}
                            />
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} className="h-32 text-center">
                              <div className="flex flex-col items-center gap-2">
                                <FileText className="h-8 w-8 text-muted-foreground" />
                                <p className="text-muted-foreground">No result sheets found</p>
                                {hasPermission("collation:create") && (
                                  <Link href={`/collation/${electionId}/sheets/new`}>
                                    <Button variant="outline" size="sm" className="mt-2">
                                      Create first result sheet
                                    </Button>
                                  </Link>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </AnimatePresence>
                    </TableBody>
                  </Table>
                </div>

                {/* Summary */}
                {filteredSheets.length > 0 && (
                  <div className="px-6 pb-6 text-sm text-muted-foreground">
                    Showing {filteredSheets.length} sheets
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </motion.div>
      </LayoutWrapper>
    </RouteGuard>
  )
}
