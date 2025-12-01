"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
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
  Search,
  Flag,
  Users,
  BarChart3,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useParties, useDeleteParty } from "@/hooks/parties"
import { usePermissions } from "@/lib/permission-context"
import type { PoliticalParty, PartyStatus } from "@/lib/types"

const statusColors: Record<PartyStatus, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  inactive: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  suspended: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  dissolved: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
}

export function PartiesTable() {
  const router = useRouter()
  const { hasPermission } = usePermissions()
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedParty, setSelectedParty] = useState<PoliticalParty | null>(null)

  const { data, isLoading, error } = useParties({
    status: statusFilter !== "all" ? statusFilter : undefined,
    search: searchQuery || undefined,
  })

  const deleteParty = useDeleteParty()

  const parties = data?.parties || []

  const handleDelete = (party: PoliticalParty) => {
    setSelectedParty(party)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (selectedParty) {
      deleteParty.mutate(selectedParty.id)
      setDeleteDialogOpen(false)
      setSelectedParty(null)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-4">
          <Skeleton className="h-10 w-64" />
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
        <p className="text-destructive">Failed to load political parties. Please try again.</p>
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
            placeholder="Search parties..."
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
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="dissolved">Dissolved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]">Party</TableHead>
              <TableHead>Abbreviation</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Founded</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence>
              {parties.length > 0 ? (
                parties.map((party, index) => (
                  <motion.tr
                    key={party.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b last:border-b-0 hover:bg-muted/50"
                  >
                    <TableCell>
                      <Link
                        href={`/parties/${party.id}`}
                        className="flex items-start gap-3 group"
                      >
                        <div
                          className="p-2 rounded-lg transition-colors"
                          style={{
                            backgroundColor: party.color_primary
                              ? `${party.color_primary}20`
                              : "hsl(var(--primary) / 0.1)",
                          }}
                        >
                          {party.logo_url ? (
                            <img
                              src={party.logo_url}
                              alt={party.name}
                              className="h-5 w-5 object-contain"
                            />
                          ) : (
                            <Flag
                              className="h-5 w-5"
                              style={{ color: party.color_primary || "hsl(var(--primary))" }}
                            />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate group-hover:text-primary transition-colors">
                            {party.name}
                          </p>
                          {party.slogan && (
                            <p className="text-sm text-muted-foreground truncate max-w-md italic">
                              "{party.slogan}"
                            </p>
                          )}
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {party.abbreviation}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[party.status]}>
                        {party.status.charAt(0).toUpperCase() + party.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {party.founded_date ? (
                        <span className="text-sm text-muted-foreground">
                          {new Date(party.founded_date).getFullYear()}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => router.push(`/parties/${party.id}`)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          {hasPermission("elections:manage") && (
                            <DropdownMenuItem onClick={() => router.push(`/parties/${party.id}/edit`)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => router.push(`/parties/${party.id}?tab=candidates`)}>
                            <Users className="h-4 w-4 mr-2" />
                            View Candidates
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/parties/${party.id}?tab=stats`)}>
                            <BarChart3 className="h-4 w-4 mr-2" />
                            View Stats
                          </DropdownMenuItem>

                          {hasPermission("elections:manage") && party.status !== "dissolved" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDelete(party)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Dissolve Party
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </motion.tr>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Flag className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">No political parties found</p>
                      {hasPermission("elections:create") && (
                        <Link href="/parties/new">
                          <Button variant="outline" size="sm" className="mt-2">
                            Register first party
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
            <AlertDialogTitle>Dissolve Political Party</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to dissolve "{selectedParty?.name}"? This will mark the party
              as dissolved and cannot be undone easily.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Dissolve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
