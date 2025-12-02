"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { formatDistanceToNow, format, isPast, isFuture } from "date-fns"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
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
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Play,
  Pause,
  Square,
  XCircle,
  BarChart3,
  Search,
  Vote,
  Users,
  ClipboardList,
  Calendar,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import {
  useElections,
  useDeleteElection,
  usePublishElection,
  usePauseElection,
  useResumeElection,
  useCloseElection,
  useCancelElection,
} from "@/hooks/elections"
import { usePermissions } from "@/lib/permission-context"
import type { Election, ElectionStatus, ElectionType } from "@/lib/types"

const statusColors: Record<ElectionStatus, string> = {
  draft: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  paused: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  closed: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
}

const typeIcons: Record<ElectionType, typeof Vote> = {
  election: Vote,
  poll: ClipboardList,
  survey: ClipboardList,
  referendum: Users,
}

const typeLabels: Record<ElectionType, string> = {
  election: "Election",
  poll: "Poll",
  survey: "Survey",
  referendum: "Referendum",
}

export function ElectionsTable() {
  const router = useRouter()
  const { hasPermission } = usePermissions()
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedElection, setSelectedElection] = useState<Election | null>(null)

  const { data: elections, isLoading, error } = useElections({
    status: statusFilter !== "all" ? statusFilter : undefined,
    election_type: typeFilter !== "all" ? typeFilter : undefined,
  })

  const deleteElection = useDeleteElection()
  const publishElection = usePublishElection()
  const pauseElection = usePauseElection()
  const resumeElection = useResumeElection()
  const closeElection = useCloseElection()
  const cancelElection = useCancelElection()

  const filteredElections = elections?.filter((election) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      election.title.toLowerCase().includes(query) ||
      election.description?.toLowerCase().includes(query)
    )
  })

  const handleDelete = (election: Election) => {
    setSelectedElection(election)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (selectedElection) {
      deleteElection.mutate(selectedElection.id)
      setDeleteDialogOpen(false)
      setSelectedElection(null)
    }
  }

  const getElectionTimeStatus = (election: Election) => {
    const start = new Date(election.start_date)
    const end = new Date(election.end_date)
    const now = new Date()

    if (election.status === "active") {
      if (isPast(end)) {
        return { label: "Ended", color: "text-red-600" }
      }
      return { label: `Ends ${formatDistanceToNow(end, { addSuffix: true })}`, color: "text-green-600" }
    }
    if (election.status === "scheduled" && isFuture(start)) {
      return { label: `Starts ${formatDistanceToNow(start, { addSuffix: true })}`, color: "text-blue-600" }
    }
    if (election.status === "closed") {
      return { label: `Ended ${formatDistanceToNow(end, { addSuffix: true })}`, color: "text-gray-600" }
    }
    return null
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="rounded-lg border">
          {[...Array(5)].map((_, i) => (
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

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load elections. Please try again.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search elections..."
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
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="election">Election</SelectItem>
            <SelectItem value="poll">Poll</SelectItem>
            <SelectItem value="survey">Survey</SelectItem>
            <SelectItem value="referendum">Referendum</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]">Election</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date Range</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence>
              {filteredElections && filteredElections.length > 0 ? (
                filteredElections.map((election, index) => {
                  const TypeIcon = typeIcons[election.election_type]
                  const timeStatus = getElectionTimeStatus(election)

                  return (
                    <motion.tr
                      key={election.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b last:border-b-0 hover:bg-muted/50"
                    >
                      <TableCell>
                        <Link
                          href={`/elections/${election.id}`}
                          className="flex items-start gap-3 group"
                        >
                          <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                            <TypeIcon className="h-5 w-5 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate group-hover:text-primary transition-colors">
                              {election.title}
                            </p>
                            {election.description && (
                              <p className="text-sm text-muted-foreground truncate max-w-md">
                                {election.description}
                              </p>
                            )}
                            {timeStatus && (
                              <p className={`text-xs mt-1 ${timeStatus.color}`}>
                                {timeStatus.label}
                              </p>
                            )}
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-normal">
                          {typeLabels[election.election_type]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[election.status]}>
                          {election.status.charAt(0).toUpperCase() + election.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>
                            {format(new Date(election.start_date), "MMM d")} -{" "}
                            {format(new Date(election.end_date), "MMM d, yyyy")}
                          </span>
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
                            <DropdownMenuItem onClick={() => router.push(`/elections/${election.id}`)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {hasPermission("elections:manage") && election.status === "draft" && (
                              <DropdownMenuItem onClick={() => router.push(`/elections/${election.id}/edit`)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => router.push(`/elections/${election.id}/analytics`)}>
                              <BarChart3 className="h-4 w-4 mr-2" />
                              Analytics
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            {/* Lifecycle Actions */}
                            {hasPermission("elections:manage") && (
                              <>
                                {election.status === "draft" && (
                                  <DropdownMenuItem
                                    onClick={() => publishElection.mutate(election.id)}
                                    className="text-green-600"
                                  >
                                    <Play className="h-4 w-4 mr-2" />
                                    Publish
                                  </DropdownMenuItem>
                                )}
                                {election.status === "active" && (
                                  <DropdownMenuItem
                                    onClick={() => pauseElection.mutate(election.id)}
                                    className="text-yellow-600"
                                  >
                                    <Pause className="h-4 w-4 mr-2" />
                                    Pause
                                  </DropdownMenuItem>
                                )}
                                {election.status === "paused" && (
                                  <DropdownMenuItem
                                    onClick={() => resumeElection.mutate(election.id)}
                                    className="text-green-600"
                                  >
                                    <Play className="h-4 w-4 mr-2" />
                                    Resume
                                  </DropdownMenuItem>
                                )}
                                {(election.status === "active" || election.status === "paused") && (
                                  <DropdownMenuItem
                                    onClick={() => closeElection.mutate(election.id)}
                                    className="text-purple-600"
                                  >
                                    <Square className="h-4 w-4 mr-2" />
                                    Close Voting
                                  </DropdownMenuItem>
                                )}
                                {election.status !== "cancelled" && election.status !== "closed" && (
                                  <DropdownMenuItem
                                    onClick={() => cancelElection.mutate(election.id)}
                                    className="text-orange-600"
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Cancel
                                  </DropdownMenuItem>
                                )}

                                <DropdownMenuSeparator />
                              </>
                            )}

                            {hasPermission("elections:delete") && (
                              <DropdownMenuItem
                                onClick={() => handleDelete(election)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </motion.tr>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Vote className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">No elections found</p>
                      {hasPermission("elections:create") && (
                        <Link href="/elections/new">
                          <Button variant="outline" size="sm" className="mt-2">
                            Create your first election
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Election</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedElection?.title}"? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
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
