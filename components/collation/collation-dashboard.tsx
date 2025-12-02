"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  useCollationDashboard,
  useLiveFeed,
  useSubmissionProgress,
  useRegions,
} from "@/hooks/collation"
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  Users,
  MapPin,
  RefreshCw,
  Activity,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"

interface CollationDashboardProps {
  electionId: string
  electionTitle?: string
}

export function CollationDashboard({ electionId, electionTitle }: CollationDashboardProps) {
  const [selectedRegion, setSelectedRegion] = useState<string>("")

  const { data: dashboard, isLoading, refetch } = useCollationDashboard(electionId)
  const { data: liveFeed } = useLiveFeed(electionId)
  const { data: progress } = useSubmissionProgress(electionId, {
    region_id: selectedRegion || undefined,
  })
  const { data: regions } = useRegions()

  if (isLoading) {
    return (
      <div className="grid gap-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-24" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!dashboard) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          No collation data available for this election
        </CardContent>
      </Card>
    )
  }

  const { summary, status_breakdown, regional_breakdown, top_candidates } = dashboard

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Collation Dashboard</h2>
          <p className="text-muted-foreground">
            {electionTitle || dashboard.election.title}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stations</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total_stations.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Polling stations to collate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {summary.completed.toLocaleString()}
            </div>
            <Progress
              value={summary.completion_percentage}
              className="mt-2 h-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {summary.completion_percentage.toFixed(1)}% complete
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {summary.in_progress.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Being processed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {summary.pending.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting submission
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Status Breakdown & Live Feed */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Status Breakdown</CardTitle>
            <CardDescription>Result sheets by workflow stage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <StatusBar
              label="Draft"
              count={status_breakdown.draft}
              total={summary.total_stations}
              color="bg-gray-400"
            />
            <StatusBar
              label="Submitted"
              count={status_breakdown.submitted}
              total={summary.total_stations}
              color="bg-blue-500"
            />
            <StatusBar
              label="Verified"
              count={status_breakdown.verified}
              total={summary.total_stations}
              color="bg-yellow-500"
            />
            <StatusBar
              label="Approved"
              count={status_breakdown.approved}
              total={summary.total_stations}
              color="bg-green-500"
            />
            <StatusBar
              label="Certified"
              count={status_breakdown.certified}
              total={summary.total_stations}
              color="bg-emerald-600"
            />
          </CardContent>
        </Card>

        {/* Live Feed */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-green-500" />
              Live Activity Feed
            </CardTitle>
            <CardDescription>Recent collation activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {liveFeed?.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  No recent activity
                </p>
              ) : (
                liveFeed?.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50"
                  >
                    <div
                      className={cn(
                        "p-1.5 rounded-full",
                        item.action === "certified"
                          ? "bg-emerald-100 text-emerald-600"
                          : item.action === "approved"
                          ? "bg-green-100 text-green-600"
                          : item.action === "verified"
                          ? "bg-yellow-100 text-yellow-600"
                          : item.action === "submitted"
                          ? "bg-blue-100 text-blue-600"
                          : "bg-gray-100 text-gray-600"
                      )}
                    >
                      <CheckCircle2 className="h-3 w-3" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium capitalize">
                        {item.action.replace("_", " ")}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {item.polling_station_name || "Collation center"}
                        {item.constituency_name && ` - ${item.constituency_name}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        by {item.performed_by} •{" "}
                        {formatDistanceToNow(new Date(item.performed_at), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Regional Breakdown */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Regional Progress</CardTitle>
              <CardDescription>Collation progress by region</CardDescription>
            </div>
            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All regions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All regions</SelectItem>
                {regions?.map((region) => (
                  <SelectItem key={region.id} value={region.id}>
                    {region.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {regional_breakdown.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                No regional data available
              </p>
            ) : (
              regional_breakdown.map((region) => {
                const percentage =
                  region.total_stations > 0
                    ? (region.completed_stations / region.total_stations) * 100
                    : 0
                return (
                  <div key={region.region_id} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{region.region_name}</span>
                      <span className="text-muted-foreground">
                        {region.completed_stations} / {region.total_stations} stations
                      </span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{percentage.toFixed(1)}% complete</span>
                      <span>{region.total_votes.toLocaleString()} votes counted</span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Top Candidates */}
      {top_candidates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Leading Candidates
            </CardTitle>
            <CardDescription>Based on certified results</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {top_candidates.map((candidate, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                        index === 0
                          ? "bg-yellow-100 text-yellow-700"
                          : index === 1
                          ? "bg-gray-100 text-gray-700"
                          : index === 2
                          ? "bg-orange-100 text-orange-700"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{candidate.candidate_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {candidate.party || "Independent"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{candidate.total_votes.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">votes</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function StatusBar({
  label,
  count,
  total,
  color,
}: {
  label: string
  count: number
  total: number
  color: string
}) {
  const percentage = total > 0 ? (count / total) * 100 : 0

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="text-muted-foreground">
          {count.toLocaleString()} ({percentage.toFixed(1)}%)
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn("h-full transition-all", color)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
