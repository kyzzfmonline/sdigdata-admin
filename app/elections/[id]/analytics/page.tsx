"use client"

import { use, useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { LayoutWrapper } from "@/components/layout-wrapper"
import { PageHeader } from "@/components/page-header"
import { RouteGuard } from "@/components/route-guard"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertTriangle,
  BarChart3,
  Download,
  TrendingUp,
  Users,
  Vote,
  Clock,
  MapPin,
  Calendar,
  RefreshCw,
  CheckCircle2,
  Lock,
} from "lucide-react"
import { motion } from "framer-motion"
import { useElection } from "@/hooks/elections"
import {
  useElectionResults,
  useElectionAnalytics,
  useTurnoutStats,
  useVotingTrends,
  useElectionPredictions,
  useFinalizeResults,
  useExportElectionData,
} from "@/hooks/elections"
import { usePermissions } from "@/lib/permission-context"
import type { ElectionStatus } from "@/lib/types"

const statusColors: Record<ElectionStatus, string> = {
  draft: "bg-gray-100 text-gray-800",
  scheduled: "bg-blue-100 text-blue-800",
  active: "bg-green-100 text-green-800",
  paused: "bg-yellow-100 text-yellow-800",
  closed: "bg-purple-100 text-purple-800",
  cancelled: "bg-red-100 text-red-800",
}

export default function ElectionAnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { hasPermission } = usePermissions()
  const [trendGranularity, setTrendGranularity] = useState<"minute" | "hour" | "day">("hour")

  const { data: election, isLoading: electionLoading } = useElection(id)
  const { data: results, isLoading: resultsLoading } = useElectionResults(id)
  const { data: turnout, isLoading: turnoutLoading } = useTurnoutStats(id)
  const { data: trends, isLoading: trendsLoading } = useVotingTrends(id, trendGranularity)
  const { data: predictions, isLoading: predictionsLoading } = useElectionPredictions(id)

  const finalizeResults = useFinalizeResults()
  const exportData = useExportElectionData()

  const isLoading = electionLoading || resultsLoading

  if (isLoading) {
    return (
      <RouteGuard permissions={["election_analytics:view"]}>
        <LayoutWrapper>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            <Skeleton className="h-10 w-64" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
            <Skeleton className="h-96" />
          </div>
        </LayoutWrapper>
      </RouteGuard>
    )
  }

  if (!election) {
    return (
      <RouteGuard permissions={["election_analytics:view"]}>
        <LayoutWrapper>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center py-12">
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Election Not Found</h2>
              <Link href="/elections">
                <Button>Back to Elections</Button>
              </Link>
            </div>
          </div>
        </LayoutWrapper>
      </RouteGuard>
    )
  }

  const canFinalize = hasPermission("election_analytics:finalize") && election.status === "closed"
  const isElectionType = election.election_type === "election"

  return (
    <RouteGuard permissions={["election_analytics:view"]}>
      <LayoutWrapper>
        <PageHeader
          title={`Analytics: ${election.title}`}
          description="View voting results, trends, and analytics"
          breadcrumbs={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Elections", href: "/elections" },
            { label: election.title, href: `/elections/${id}` },
            { label: "Analytics" },
          ]}
          action={
            <div className="flex items-center gap-2">
              {canFinalize && !results?.finalized && (
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => finalizeResults.mutate(id)}
                  disabled={finalizeResults.isPending}
                >
                  <Lock className="h-4 w-4" />
                  Finalize Results
                </Button>
              )}
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => exportData.mutate({ electionId: id, format: "csv" })}
                disabled={exportData.isPending}
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => exportData.mutate({ electionId: id, format: "json" })}
                disabled={exportData.isPending}
              >
                <Download className="h-4 w-4" />
                Export JSON
              </Button>
            </div>
          }
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* Status Banner */}
          {results?.results_hidden && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4"
            >
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-800 dark:text-yellow-200">
                    Results Hidden
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Results will be visible after the election closes
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {results?.finalized && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4"
            >
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800 dark:text-green-200">
                    Results Finalized
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    These results have been certified and cannot be changed
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-4"
          >
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <Vote className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{results?.total_voters || 0}</p>
                    <p className="text-sm text-muted-foreground">Total Votes</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-blue-500/10">
                    <Users className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{turnout?.turnout_rate || 0}%</p>
                    <p className="text-sm text-muted-foreground">Turnout Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-green-500/10">
                    <TrendingUp className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {predictions?.voting_velocity?.toFixed(1) || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Votes/Hour</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-purple-500/10">
                    <BarChart3 className="h-6 w-6 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {predictions?.time_progress?.toFixed(0) || 0}%
                    </p>
                    <p className="text-sm text-muted-foreground">Time Progress</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Results */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Tabs defaultValue="results">
              <TabsList>
                <TabsTrigger value="results">Results</TabsTrigger>
                <TabsTrigger value="trends">Trends</TabsTrigger>
                {predictions && election.status === "active" && (
                  <TabsTrigger value="predictions">Predictions</TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="results" className="mt-6 space-y-6">
                {!results?.results_hidden ? (
                  <>
                    {isElectionType && results?.positions ? (
                      results.positions.map((position) => (
                        <Card key={position.position_id}>
                          <CardHeader>
                            <CardTitle>{position.title}</CardTitle>
                            <CardDescription>
                              {position.total_votes} total votes
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              {position.candidates
                                .sort((a, b) => b.votes - a.votes)
                                .map((candidate, index) => (
                                  <div key={candidate.candidate_id} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        <span
                                          className={`text-lg font-bold ${
                                            index === 0 ? "text-primary" : "text-muted-foreground"
                                          }`}
                                        >
                                          #{index + 1}
                                        </span>
                                        <div>
                                          <p className="font-medium">{candidate.name}</p>
                                          {candidate.party && (
                                            <p className="text-sm text-muted-foreground">
                                              {candidate.party}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <p className="font-bold">{candidate.votes}</p>
                                        <p className="text-sm text-muted-foreground">
                                          {candidate.percentage.toFixed(1)}%
                                        </p>
                                      </div>
                                    </div>
                                    <Progress
                                      value={candidate.percentage}
                                      className={`h-2 ${index === 0 ? "" : "opacity-70"}`}
                                    />
                                  </div>
                                ))}
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : results?.options ? (
                      <Card>
                        <CardHeader>
                          <CardTitle>Poll Results</CardTitle>
                          <CardDescription>
                            {results.total_voters} total votes
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {results.options
                              .sort((a, b) => b.votes - a.votes)
                              .map((option, index) => (
                                <div key={option.option_id} className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <span
                                        className={`text-lg font-bold ${
                                          index === 0 ? "text-primary" : "text-muted-foreground"
                                        }`}
                                      >
                                        #{index + 1}
                                      </span>
                                      <div>
                                        <p className="font-medium">{option.option_text}</p>
                                        {option.description && (
                                          <p className="text-sm text-muted-foreground">
                                            {option.description}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-bold">{option.votes}</p>
                                      <p className="text-sm text-muted-foreground">
                                        {option.percentage.toFixed(1)}%
                                      </p>
                                    </div>
                                  </div>
                                  <Progress
                                    value={option.percentage}
                                    className={`h-2 ${index === 0 ? "" : "opacity-70"}`}
                                  />
                                </div>
                              ))}
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <Card>
                        <CardContent className="py-12 text-center">
                          <Vote className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">No votes recorded yet</p>
                        </CardContent>
                      </Card>
                    )}
                  </>
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        Results are hidden until the election closes
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="trends" className="mt-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Voting Trends</CardTitle>
                        <CardDescription>Vote distribution over time</CardDescription>
                      </div>
                      <Select
                        value={trendGranularity}
                        onValueChange={(v) => setTrendGranularity(v as typeof trendGranularity)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="minute">Per Minute</SelectItem>
                          <SelectItem value="hour">Per Hour</SelectItem>
                          <SelectItem value="day">Per Day</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {trendsLoading ? (
                      <Skeleton className="h-64" />
                    ) : trends?.trend && trends.trend.length > 0 ? (
                      <div className="space-y-4">
                        <div className="text-center text-sm text-muted-foreground mb-4">
                          Showing voting activity over time
                        </div>
                        <div className="space-y-2">
                          {trends.trend.slice(-10).map((point, index) => (
                            <div key={index} className="flex items-center gap-4">
                              <span className="text-sm text-muted-foreground w-32">
                                {point.period}
                              </span>
                              <div className="flex-1">
                                <Progress
                                  value={
                                    (point.votes /
                                      Math.max(...trends.trend.map((t) => t.votes))) *
                                    100
                                  }
                                  className="h-4"
                                />
                              </div>
                              <span className="text-sm font-medium w-16 text-right">
                                {point.votes} votes
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No trend data available yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {predictions && election.status === "active" && (
                <TabsContent value="predictions" className="mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Projected Total Votes</CardTitle>
                        <CardDescription>
                          Based on current voting patterns
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-4xl font-bold text-primary">
                          {predictions.projected_total_votes?.toLocaleString() || "N/A"}
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                          Confidence:{" "}
                          <Badge
                            variant={
                              predictions.confidence === "high"
                                ? "default"
                                : predictions.confidence === "medium"
                                ? "secondary"
                                : "outline"
                            }
                          >
                            {predictions.confidence}
                          </Badge>
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Time Remaining</CardTitle>
                        <CardDescription>Until voting closes</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-4xl font-bold text-primary">
                          {predictions.remaining_hours?.toFixed(1) || "0"} hours
                        </div>
                        <Progress
                          value={predictions.time_progress || 0}
                          className="mt-4"
                        />
                      </CardContent>
                    </Card>

                    {predictions.projected_winners &&
                      predictions.projected_winners.length > 0 && (
                        <Card className="md:col-span-2">
                          <CardHeader>
                            <CardTitle>Projected Winners</CardTitle>
                            <CardDescription>
                              Based on current vote counts (subject to change)
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              {predictions.projected_winners.map((winner) => (
                                <div
                                  key={winner.position_id}
                                  className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                                >
                                  <div>
                                    <p className="text-sm text-muted-foreground">
                                      {winner.position_title}
                                    </p>
                                    <p className="font-medium">
                                      {winner.projected_winner}
                                    </p>
                                  </div>
                                  <Badge variant="secondary">
                                    +{winner.current_lead?.toFixed(1)}% lead
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                  </div>
                </TabsContent>
              )}
            </Tabs>
          </motion.div>
        </div>
      </LayoutWrapper>
    </RouteGuard>
  )
}
