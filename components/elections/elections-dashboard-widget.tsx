"use client"

import Link from "next/link"
import { format, formatDistanceToNow, isPast } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import {
  Vote,
  Clock,
  TrendingUp,
  Calendar,
  ArrowRight,
  Users,
  BarChart3,
} from "lucide-react"
import { motion } from "framer-motion"
import { useElectionsDashboard, useActiveElectionsDashboard } from "@/hooks/elections"
import type { ElectionStatus } from "@/lib/types"

const statusColors: Record<ElectionStatus, string> = {
  draft: "bg-gray-100 text-gray-800",
  scheduled: "bg-blue-100 text-blue-800",
  active: "bg-green-100 text-green-800",
  paused: "bg-yellow-100 text-yellow-800",
  closed: "bg-purple-100 text-purple-800",
  cancelled: "bg-red-100 text-red-800",
}

export function ElectionsDashboardWidget() {
  const { data: dashboard, isLoading: dashboardLoading } = useElectionsDashboard()
  const { data: activeElections, isLoading: activeLoading } = useActiveElectionsDashboard()

  const isLoading = dashboardLoading || activeLoading

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
          <Skeleton className="h-32" />
        </CardContent>
      </Card>
    )
  }

  const totalElections = dashboard
    ? Object.values(dashboard.status_summary).reduce((a, b) => a + b, 0)
    : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Vote className="h-5 w-5 text-primary" />
              Elections Overview
            </CardTitle>
            <CardDescription>Active polls, elections, and voting status</CardDescription>
          </div>
          <Link href="/elections">
            <Button variant="outline" size="sm" className="gap-1">
              View All
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {dashboard?.status_summary.active || 0}
              </p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {dashboard?.status_summary.scheduled || 0}
              </p>
              <p className="text-xs text-muted-foreground">Scheduled</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-900/20">
              <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                {dashboard?.status_summary.draft || 0}
              </p>
              <p className="text-xs text-muted-foreground">Drafts</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20">
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {dashboard?.status_summary.closed || 0}
              </p>
              <p className="text-xs text-muted-foreground">Closed</p>
            </div>
          </div>

          {/* Active Elections */}
          {activeElections && activeElections.length > 0 ? (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Live Elections
              </h4>
              {activeElections.slice(0, 3).map((election) => (
                <Link
                  key={election.election.id}
                  href={`/elections/${election.election.id}`}
                  className="block"
                >
                  <div className="p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{election.election.title}</p>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Vote className="h-3 w-3" />
                            {election.total_votes} votes
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {election.turnout_rate.toFixed(1)}% turnout
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-green-100 text-green-800">Live</Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          Ends {formatDistanceToNow(new Date(election.election.end_date), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <Vote className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No active elections</p>
            </div>
          )}

          {/* Upcoming Elections */}
          {dashboard?.upcoming_elections && dashboard.upcoming_elections.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Upcoming
              </h4>
              <div className="space-y-2">
                {dashboard.upcoming_elections.slice(0, 3).map((election) => (
                  <Link
                    key={election.id}
                    href={`/elections/${election.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <div>
                        <p className="font-medium text-sm">{election.title}</p>
                        <p className="text-xs text-muted-foreground">
                          Starts {format(new Date(election.start_date), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">{election.type}</Badge>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Recent Closed */}
          {dashboard?.recent_closed && dashboard.recent_closed.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Recently Closed
              </h4>
              <div className="space-y-2">
                {dashboard.recent_closed.slice(0, 2).map((election) => (
                  <Link
                    key={election.id}
                    href={`/elections/${election.id}/analytics`}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-sm">{election.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {election.total_votes} total votes
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      View Results
                    </Button>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
