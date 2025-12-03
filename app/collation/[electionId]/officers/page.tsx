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
import { Label } from "@/components/ui/label"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Users,
  Search,
  MoreHorizontal,
  Eye,
  UserPlus,
  MapPin,
  Phone,
  Mail,
  IdCard,
  RefreshCw,
  CheckCircle,
  XCircle,
  Building2,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { format } from "date-fns"
import { usePermissions } from "@/lib/permission-context"
import { RouteGuard } from "@/components/route-guard"
import { useElection } from "@/hooks/elections"
import {
  useCollationOfficers,
  useElectionAssignments,
  useCreateOfficer,
  useAssignOfficer,
} from "@/hooks/collation"
import type { CollationOfficer, OfficerAssignment } from "@/lib/types"

const officerTypeLabels: Record<string, string> = {
  presiding: "Presiding Officer",
  returning: "Returning Officer",
  deputy_returning: "Deputy Returning Officer",
  collation_clerk: "Collation Clerk",
}

const officerTypeColors: Record<string, string> = {
  presiding: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  returning: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  deputy_returning: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  collation_clerk: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
}

function OfficersTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="rounded-lg border">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 border-b last:border-b-0">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-8 w-8" />
          </div>
        ))}
      </div>
    </div>
  )
}

function OfficerRow({
  officer,
  electionId,
  assignments,
}: {
  officer: CollationOfficer
  electionId: string
  assignments?: OfficerAssignment[]
}) {
  const { hasPermission } = usePermissions()
  const officerAssignments = assignments?.filter((a) => a.officer_id === officer.id) || []

  return (
    <motion.tr
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-b last:border-b-0 hover:bg-muted/50"
    >
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-medium truncate">{officer.username || "Unknown"}</p>
            <p className="text-xs text-muted-foreground truncate">{officer.email || "-"}</p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge className={officerTypeColors[officer.officer_type] || "bg-gray-100"}>
          {officerTypeLabels[officer.officer_type] || officer.officer_type}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Phone className="h-3.5 w-3.5" />
          <span>{officer.phone || "-"}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <IdCard className="h-3.5 w-3.5" />
          <span>{officer.national_id || "-"}</span>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={officer.is_active ? "default" : "secondary"} className="gap-1">
          {officer.is_active ? (
            <>
              <CheckCircle className="h-3 w-3" />
              Active
            </>
          ) : (
            <>
              <XCircle className="h-3 w-3" />
              Inactive
            </>
          )}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="text-sm">
          <p className="font-medium">{officerAssignments.length}</p>
          <p className="text-xs text-muted-foreground">assignments</p>
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
            <DropdownMenuItem>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </DropdownMenuItem>
            {hasPermission("collation:assign") && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <MapPin className="h-4 w-4 mr-2" />
                  Assign to Station
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </motion.tr>
  )
}

function CreateOfficerDialog({ electionId }: { electionId: string }) {
  const [open, setOpen] = useState(false)
  const [userId, setUserId] = useState("")
  const [officerType, setOfficerType] = useState("")
  const [phone, setPhone] = useState("")
  const [nationalId, setNationalId] = useState("")

  const createOfficer = useCreateOfficer()

  const handleSubmit = () => {
    if (!userId || !officerType) return

    createOfficer.mutate(
      {
        user_id: userId,
        officer_type: officerType,
        phone: phone || undefined,
        national_id: nationalId || undefined,
      },
      {
        onSuccess: () => {
          setOpen(false)
          setUserId("")
          setOfficerType("")
          setPhone("")
          setNationalId("")
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <UserPlus className="h-4 w-4" />
          Add Officer
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Collation Officer</DialogTitle>
          <DialogDescription>
            Register a new collation officer for election management.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="userId">User ID</Label>
            <Input
              id="userId"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Enter user ID"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="officerType">Officer Type</Label>
            <Select value={officerType} onValueChange={setOfficerType}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="presiding">Presiding Officer</SelectItem>
                <SelectItem value="returning">Returning Officer</SelectItem>
                <SelectItem value="deputy_returning">Deputy Returning Officer</SelectItem>
                <SelectItem value="collation_clerk">Collation Clerk</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone (Optional)</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter phone number"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nationalId">National ID (Optional)</Label>
            <Input
              id="nationalId"
              value={nationalId}
              onChange={(e) => setNationalId(e.target.value)}
              placeholder="Enter national ID"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={createOfficer.isPending || !userId || !officerType}>
            {createOfficer.isPending ? "Creating..." : "Create Officer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function AssignmentsCard({ assignments }: { assignments?: OfficerAssignment[] }) {
  if (!assignments || assignments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Recent Assignments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No assignments found
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Recent Assignments
        </CardTitle>
        <CardDescription>
          {assignments.length} total assignments
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {assignments.slice(0, 5).map((assignment) => (
            <div key={assignment.id} className="px-6 py-3 flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{assignment.officer_name || "Unknown Officer"}</p>
                <p className="text-xs text-muted-foreground">
                  {assignment.polling_station_name || assignment.collation_center_name || "Unassigned"}
                </p>
              </div>
              <Badge variant="outline">{assignment.role.replace(/_/g, " ")}</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default function OfficersPage() {
  const params = useParams()
  const electionId = params.electionId as string
  const { hasPermission } = usePermissions()

  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")

  const { data: election, isLoading: electionLoading } = useElection(electionId)
  const {
    data: officers,
    isLoading: officersLoading,
    refetch,
  } = useCollationOfficers({
    officer_type: typeFilter !== "all" ? typeFilter : undefined,
  })
  const { data: assignments } = useElectionAssignments(electionId)

  const isLoading = electionLoading || officersLoading

  // Filter by search query
  const filteredOfficers =
    officers?.filter((officer: CollationOfficer) => {
      if (!searchQuery) return true
      const query = searchQuery.toLowerCase()
      return (
        officer.username?.toLowerCase().includes(query) ||
        officer.email?.toLowerCase().includes(query) ||
        officer.phone?.toLowerCase().includes(query) ||
        officer.national_id?.toLowerCase().includes(query)
      )
    }) || []

  // Group by type for summary
  const officersByType = officers?.reduce(
    (acc: Record<string, number>, officer: CollationOfficer) => {
      acc[officer.officer_type] = (acc[officer.officer_type] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  ) || {}

  return (
    <RouteGuard permissions={["collation:read"]}>
      <LayoutWrapper>
        <PageHeader
          title="Collation Officers"
          description={election?.title || "Loading..."}
          breadcrumbs={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Collation", href: "/collation" },
            { label: election?.title || "...", href: `/collation/${electionId}` },
            { label: "Officers" },
          ]}
          action={
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              {hasPermission("collation:create") && (
                <CreateOfficerDialog electionId={electionId} />
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
            <OfficersTableSkeleton />
          ) : (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
                        <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{officersByType.presiding || 0}</p>
                        <p className="text-sm text-muted-foreground">Presiding Officers</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30">
                        <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{officersByType.returning || 0}</p>
                        <p className="text-sm text-muted-foreground">Returning Officers</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-full bg-cyan-100 dark:bg-cyan-900/30">
                        <Users className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{officersByType.deputy_returning || 0}</p>
                        <p className="text-sm text-muted-foreground">Deputy Returning</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
                        <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{officersByType.collation_clerk || 0}</p>
                        <p className="text-sm text-muted-foreground">Collation Clerks</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 lg:grid-cols-3">
                {/* Officers Table */}
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader className="pb-4">
                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1 max-w-sm">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search officers..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                          />
                        </div>
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Officer Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="presiding">Presiding Officer</SelectItem>
                            <SelectItem value="returning">Returning Officer</SelectItem>
                            <SelectItem value="deputy_returning">Deputy Returning</SelectItem>
                            <SelectItem value="collation_clerk">Collation Clerk</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="rounded-lg border mx-6 mb-6">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[25%]">Officer</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Phone</TableHead>
                              <TableHead>National ID</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Assignments</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <AnimatePresence>
                              {filteredOfficers.length > 0 ? (
                                filteredOfficers.map((officer: CollationOfficer) => (
                                  <OfficerRow
                                    key={officer.id}
                                    officer={officer}
                                    electionId={electionId}
                                    assignments={assignments}
                                  />
                                ))
                              ) : (
                                <TableRow>
                                  <TableCell colSpan={7} className="h-32 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                      <Users className="h-8 w-8 text-muted-foreground" />
                                      <p className="text-muted-foreground">No officers found</p>
                                      {hasPermission("collation:create") && (
                                        <CreateOfficerDialog electionId={electionId} />
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
                      {filteredOfficers.length > 0 && (
                        <div className="px-6 pb-6 text-sm text-muted-foreground">
                          Showing {filteredOfficers.length} officer
                          {filteredOfficers.length !== 1 ? "s" : ""}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  <AssignmentsCard assignments={assignments} />
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </LayoutWrapper>
    </RouteGuard>
  )
}
