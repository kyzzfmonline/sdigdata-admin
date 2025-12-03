"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { LayoutWrapper } from "@/components/layout-wrapper"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Calculator,
  FileText,
  Users,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  MapPin,
  TrendingUp,
  ChevronRight,
  Activity,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { formatDistanceToNow, format } from "date-fns"
import { usePermissions } from "@/lib/permission-context"
import { RouteGuard } from "@/components/route-guard"
import { useElection } from "@/hooks/elections"
import {
  useCollationDashboard,
  useSubmissionProgress,
  useLiveFeed,
  useResultSheets,
  useIncidents,
} from "@/hooks/collation"
import type { ResultSheetStatus, ResultSheet, CollationLiveFeedItem, CollationIncident } from "@/lib/types"

const statusColors: Record<ResultSheetStatus, string> = {
  draft: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  submitted: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  verified: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  approved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  certified: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
}

const statusIcons: Record<ResultSheetStatus, React.ReactNode> = {
  draft: <Clock className="h-4 w-4" />,
  submitted: <Loader2 className="h-4 w-4" />,
  verified: <CheckCircle className="h-4 w-4" />,
  approved: <CheckCircle className="h-4 w-4" />,
  certified: <CheckCircle className="h-4 w-4" />,
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-10 w-10 rounded-full mb-2" />
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-4 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function LiveFeedItemComponent({ item }: { item: CollationLiveFeedItem }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
    >
      <div className="p-2 rounded-full bg-primary/10 shrink-0">
        <Activity className="h-3.5 w-3.5 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{item.action}</p>
        <p className="text-xs text-muted-foreground truncate">
          {item.polling_station_name || item.electoral_area_name || "System"}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(item.performed_at), { addSuffix: true })}
        </p>
      </div>
    </motion.div>
  )
}

function RegionalBreakdown({ data }: { data: Array<{ region_name: string; total_stations: number; completed_stations: number; total_votes: number }> }) {
  return (
    <div className="space-y-3">
      {data.map((region, index) => {
        const progress = region.total_stations > 0
          ? (region.completed_stations / region.total_stations) * 100
          : 0

        return (
          <motion.div
            key={region.region_name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-medium">{region.region_name}</span>
              </div>
              <span className="text-muted-foreground">
                {region.completed_stations}/{region.total_stations}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{progress.toFixed(1)}% complete</span>
              <span>{region.total_votes.toLocaleString()} votes</span>
            </div>
          </motion.div>
        )
      })}
      {data.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No regional data available yet
        </p>
      )}
    </div>
  )
}

export default function ElectionCollationPage() {
  const params = useParams()
  const electionId = params.electionId as string
  const { hasPermission } = usePermissions()
  const [activeTab, setActiveTab] = useState("overview")

  const { data: election, isLoading: electionLoading } = useElection(electionId)
  const { data: dashboard, isLoading: dashboardLoading, refetch: refetchDashboard } = useCollationDashboard(electionId)
  const { data: liveFeedData, isLoading: feedLoading } = useLiveFeed(electionId, 10)
  const { data: sheets, isLoading: sheetsLoading } = useResultSheets(electionId)
  const { data: incidents, isLoading: incidentsLoading } = useIncidents(electionId)

  const isLoading = electionLoading || dashboardLoading

  if (isLoading) {
    return (
      <RouteGuard permissions={["collation:read"]}>
        <LayoutWrapper>
          <PageHeader
            title="Loading..."
            breadcrumbs={[
              { label: "Dashboard", href: "/dashboard" },
              { label: "Collation", href: "/collation" },
              { label: "Loading..." },
            ]}
          />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <DashboardSkeleton />
          </div>
        </LayoutWrapper>
      </RouteGuard>
    )
  }

  if (!election) {
    return (
      <RouteGuard permissions={["collation:read"]}>
        <LayoutWrapper>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
            <h2 className="text-xl font-semibold mb-2">Election Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The election you're looking for doesn't exist or you don't have access.
            </p>
            <Link href="/collation">
              <Button>Back to Collation</Button>
            </Link>
          </div>
        </LayoutWrapper>
      </RouteGuard>
    )
  }

  const summary = dashboard?.summary || {
    total_stations: 0,
    completed: 0,
    in_progress: 0,
    pending: 0,
    completion_percentage: 0,
  }

  const statusBreakdown = dashboard?.status_breakdown || {
    draft: 0,
    submitted: 0,
    verified: 0,
    approved: 0,
    certified: 0,
  }

  // Limit to 10 items for the dashboard view
  const recentSheets = sheets?.slice(0, 10) || []
  const recentIncidents = incidents?.slice(0, 5) || []

  return (
    <RouteGuard permissions={["collation:read"]}>
      <LayoutWrapper>
        <PageHeader
          title={election.title}
          description="Collation Dashboard"
          breadcrumbs={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Collation", href: "/collation" },
            { label: election.title },
          ]}
          action={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchDashboard()}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              {hasPermission("collation:manage") && (
                <Link href={`/collation/${electionId}/sheets`}>
                  <Button size="sm" className="gap-2">
                    <FileText className="h-4 w-4" />
                    Manage Sheets
                  </Button>
                </Link>
              )}
              {hasPermission("collation:manage") && (
                <Link href={`/collation/${electionId}/officers`}>
                  <Button size="sm" variant="outline" className="gap-2">
                    <Users className="h-4 w-4" />
                    Officers
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
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
                    <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{summary.total_stations}</p>
                    <p className="text-sm text-muted-foreground">Total Stations</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{summary.completed}</p>
                    <p className="text-sm text-muted-foreground">Completed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                    <Loader2 className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{summary.in_progress}</p>
                    <p className="text-sm text-muted-foreground">In Progress</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30">
                    <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{summary.completion_percentage.toFixed(1)}%</p>
                    <p className="text-sm text-muted-foreground">Progress</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Progress Bar */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="text-sm text-muted-foreground">
                  {summary.completed} of {summary.total_stations} stations
                </span>
              </div>
              <Progress value={summary.completion_percentage} className="h-3" />
              <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-gray-400" />
                    Draft: {statusBreakdown.draft}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    Submitted: {statusBreakdown.submitted}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-cyan-500" />
                    Verified: {statusBreakdown.verified}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    Approved: {statusBreakdown.approved}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    Certified: {statusBreakdown.certified}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="overview" className="gap-2">
                <Calculator className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="sheets" className="gap-2">
                <FileText className="h-4 w-4" />
                Result Sheets
              </TabsTrigger>
              <TabsTrigger value="incidents" className="gap-2">
                <AlertTriangle className="h-4 w-4" />
                Incidents
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid gap-6 lg:grid-cols-3">
                {/* Regional Breakdown */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-lg">Regional Progress</CardTitle>
                    <CardDescription>
                      Collation progress by region
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RegionalBreakdown data={dashboard?.regional_breakdown || []} />
                  </CardContent>
                </Card>

                {/* Live Feed */}
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Activity className="h-4 w-4 text-green-500" />
                        Live Feed
                      </CardTitle>
                      <Badge variant="outline" className="text-xs">
                        Auto-refresh
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px] pr-4">
                      <AnimatePresence mode="popLayout">
                        {feedLoading ? (
                          <div className="space-y-3">
                            {[...Array(5)].map((_, i) => (
                              <Skeleton key={i} className="h-16 w-full" />
                            ))}
                          </div>
                        ) : liveFeedData && liveFeedData.length > 0 ? (
                          liveFeedData.map((item) => (
                            <LiveFeedItemComponent key={item.id} item={item} />
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-8">
                            No activity yet
                          </p>
                        )}
                      </AnimatePresence>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              {/* Top Candidates */}
              {dashboard?.top_candidates && dashboard.top_candidates.length > 0 && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Leading Candidates</CardTitle>
                    <CardDescription>
                      Based on collated results so far
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
                      {dashboard.top_candidates.slice(0, 5).map((candidate, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="text-center p-4 rounded-lg bg-muted/50"
                        >
                          <p className="text-2xl font-bold text-primary">
                            {candidate.total_votes.toLocaleString()}
                          </p>
                          <p className="font-medium truncate">{candidate.candidate_name}</p>
                          {candidate.party && (
                            <Badge variant="outline" className="mt-1">
                              {candidate.party}
                            </Badge>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="sheets">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Recent Result Sheets</CardTitle>
                      <CardDescription>
                        Latest submitted and processed result sheets
                      </CardDescription>
                    </div>
                    <Link href={`/collation/${electionId}/sheets`}>
                      <Button variant="outline" size="sm" className="gap-2">
                        View All
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  {sheetsLoading ? (
                    <div className="space-y-3">
                      {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : recentSheets.length > 0 ? (
                    <div className="space-y-3">
                      {recentSheets.map((sheet: ResultSheet, index: number) => (
                        <motion.div
                          key={sheet.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                              <FileText className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">
                                {sheet.polling_station_name || sheet.electoral_area_name || "Unknown Station"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {sheet.polling_station_code || sheet.sheet_type}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge className={statusColors[sheet.status]}>
                              {statusIcons[sheet.status]}
                              <span className="ml-1">{sheet.status}</span>
                            </Badge>
                            <Link href={`/collation/${electionId}/sheets/${sheet.id}`}>
                              <Button variant="ghost" size="sm">
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </Link>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No result sheets yet
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="incidents">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Recent Incidents</CardTitle>
                      <CardDescription>
                        Reported issues and their status
                      </CardDescription>
                    </div>
                    <Link href={`/collation/${electionId}/incidents`}>
                      <Button variant="outline" size="sm" className="gap-2">
                        View All
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  {incidentsLoading ? (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-20 w-full" />
                      ))}
                    </div>
                  ) : recentIncidents.length > 0 ? (
                    <div className="space-y-3">
                      {recentIncidents.map((incident: CollationIncident, index: number) => (
                        <motion.div
                          key={incident.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg ${
                                incident.severity === "critical" ? "bg-red-100 dark:bg-red-900/30" :
                                incident.severity === "high" ? "bg-orange-100 dark:bg-orange-900/30" :
                                incident.severity === "medium" ? "bg-yellow-100 dark:bg-yellow-900/30" :
                                "bg-blue-100 dark:bg-blue-900/30"
                              }`}>
                                <AlertTriangle className={`h-4 w-4 ${
                                  incident.severity === "critical" ? "text-red-600" :
                                  incident.severity === "high" ? "text-orange-600" :
                                  incident.severity === "medium" ? "text-yellow-600" :
                                  "text-blue-600"
                                }`} />
                              </div>
                              <div>
                                <p className="font-medium">{incident.incident_type}</p>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {incident.description}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <Badge variant={
                                incident.status === "resolved" ? "default" :
                                "secondary"
                              }>
                                {incident.status}
                              </Badge>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        No incidents reported
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </LayoutWrapper>
    </RouteGuard>
  )
}
