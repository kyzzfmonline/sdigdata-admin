"use client"

import Link from "next/link"
import { LayoutWrapper } from "@/components/layout-wrapper"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Calculator,
  Vote,
  ChevronRight,
  Calendar,
  MapPin,
  Users,
  BarChart3,
  AlertTriangle,
} from "lucide-react"
import { motion } from "framer-motion"
import { usePermissions } from "@/lib/permission-context"
import { RouteGuard } from "@/components/route-guard"
import { useElections } from "@/hooks/elections"
import { format } from "date-fns"
import type { Election, ElectionStatus } from "@/lib/types"

const statusColors: Record<ElectionStatus, string> = {
  draft: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  paused: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  closed: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
}

function ElectionCard({ election, index }: { election: Election; index: number }) {
  const canCollate = election.status === "active" || election.status === "closed"

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link href={canCollate ? `/collation/${election.id}` : "#"}>
        <Card
          className={`group hover:shadow-md transition-all duration-200 ${
            canCollate
              ? "hover:border-primary cursor-pointer"
              : "opacity-60 cursor-not-allowed"
          }`}
        >
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Vote className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">
                    {election.title}
                  </CardTitle>
                  {election.description && (
                    <CardDescription className="mt-1 line-clamp-1">
                      {election.description}
                    </CardDescription>
                  )}
                </div>
              </div>
              <Badge className={statusColors[election.status]}>
                {election.status.charAt(0).toUpperCase() + election.status.slice(1)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>
                    {format(new Date(election.start_date), "MMM d")} -{" "}
                    {format(new Date(election.end_date), "MMM d, yyyy")}
                  </span>
                </div>
              </div>
              {canCollate && (
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              )}
            </div>
            {!canCollate && (
              <p className="text-xs text-muted-foreground mt-2">
                Collation available for active or closed elections only
              </p>
            )}
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <div className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function CollationPage() {
  const { hasPermission } = usePermissions()
  const { data: elections, isLoading, error } = useElections()

  // Filter to show only elections (not polls/surveys)
  const collationElections = elections?.filter(
    (e) => e.election_type === "election" || e.election_type === "referendum"
  )

  // Separate active/closed (collatable) from others
  const collatableElections = collationElections?.filter(
    (e) => e.status === "active" || e.status === "closed"
  )
  const otherElections = collationElections?.filter(
    (e) => e.status !== "active" && e.status !== "closed"
  )

  return (
    <RouteGuard permissions={["collation:read", "elections:read"]}>
      <LayoutWrapper>
        <PageHeader
          title="Results Collation"
          description="Collate and verify election results from polling stations"
          breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Collation" }]}
        />

        <motion.div
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
                    <Calculator className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{collatableElections?.length || 0}</p>
                    <p className="text-sm text-muted-foreground">Ready for Collation</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
                    <Vote className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{collationElections?.length || 0}</p>
                    <p className="text-sm text-muted-foreground">Total Elections</p>
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
                    <p className="text-2xl font-bold">-</p>
                    <p className="text-sm text-muted-foreground">Officers Assigned</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900/30">
                    <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">-</p>
                    <p className="text-sm text-muted-foreground">Open Incidents</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {isLoading ? (
            <LoadingSkeleton />
          ) : error ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-destructive">Failed to load elections. Please try again.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Ready for Collation */}
              {collatableElections && collatableElections.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-green-600" />
                    Ready for Collation
                  </h2>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {collatableElections.map((election, index) => (
                      <ElectionCard key={election.id} election={election} index={index} />
                    ))}
                  </div>
                </div>
              )}

              {/* Other Elections */}
              {otherElections && otherElections.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-muted-foreground">
                    <Vote className="h-5 w-5" />
                    Other Elections
                  </h2>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {otherElections.map((election, index) => (
                      <ElectionCard
                        key={election.id}
                        election={election}
                        index={index + (collatableElections?.length || 0)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {(!collationElections || collationElections.length === 0) && (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Vote className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Elections Found</h3>
                    <p className="text-muted-foreground mb-4">
                      Create an election first to start collating results.
                    </p>
                    {hasPermission("elections:create") && (
                      <Link href="/elections/new">
                        <Button>Create Election</Button>
                      </Link>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </motion.div>
      </LayoutWrapper>
    </RouteGuard>
  )
}
