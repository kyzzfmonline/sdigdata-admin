"use client"

import { Card } from "@/components/ui/card"
import { useQuery } from "@tanstack/react-query"
import { analyticsAPI } from "@/lib/api"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { TrendingUp, TrendingDown, Users, FileText, Clock, Award } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface ResponseAnalyticsDashboardProps {
  formId: string
}

const COLORS = {
  primary: "hsl(var(--primary))",
  success: "hsl(var(--success))",
  warning: "hsl(var(--warning))",
  error: "hsl(var(--destructive))",
  muted: "hsl(var(--muted))",
}

const QUALITY_COLORS = ["#ef4444", "#f97316", "#eab308", "#84cc16", "#22c55e"]

export function ResponseAnalyticsDashboard({ formId }: ResponseAnalyticsDashboardProps) {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["form-analytics", formId],
    queryFn: async () => {
      const response = await analyticsAPI.getFormDetailedAnalytics(formId)
      return response.data?.data || response.data
    },
    enabled: !!formId,
  })

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6">
            <Skeleton className="h-24 w-full" />
          </Card>
        ))}
      </div>
    )
  }

  if (!analytics) {
    return null
  }

  const stats = [
    {
      title: "Total Responses",
      value: analytics.total_responses || 0,
      change: analytics.response_change_percent,
      icon: FileText,
      color: "text-primary",
    },
    {
      title: "Avg. Quality Score",
      value: `${(analytics.avg_quality_score || 0).toFixed(1)}%`,
      change: analytics.quality_change_percent,
      icon: Award,
      color: "text-success",
    },
    {
      title: "Unique Contributors",
      value: analytics.unique_contributors || 0,
      change: analytics.contributor_change_percent,
      icon: Users,
      color: "text-warning",
    },
    {
      title: "Avg. Completion Time",
      value: `${Math.round((analytics.avg_completion_time || 0) / 60)}m`,
      change: analytics.time_change_percent,
      icon: Clock,
      color: "text-muted-foreground",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <p className="text-3xl font-bold mt-2">{stat.value}</p>
                {stat.change !== undefined && stat.change !== null && (
                  <div className="flex items-center gap-1 mt-2">
                    {stat.change >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-success" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-destructive" />
                    )}
                    <span
                      className={`text-sm font-medium ${
                        stat.change >= 0 ? "text-success" : "text-destructive"
                      }`}
                    >
                      {Math.abs(stat.change).toFixed(1)}%
                    </span>
                    <span className="text-xs text-muted-foreground">vs last period</span>
                  </div>
                )}
              </div>
              <stat.icon className={`w-8 h-8 ${stat.color}`} />
            </div>
          </Card>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Responses Over Time */}
        {analytics.responses_over_time && analytics.responses_over_time.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Responses Over Time</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analytics.responses_over_time}>
                <defs>
                  <linearGradient id="colorResponses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke={COLORS.primary}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorResponses)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Quality Score Distribution */}
        {analytics.quality_distribution && analytics.quality_distribution.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Quality Score Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.quality_distribution}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="range" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {analytics.quality_distribution.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={QUALITY_COLORS[index % QUALITY_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Top Contributors */}
        {analytics.top_contributors && analytics.top_contributors.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Top Contributors</h3>
            <div className="space-y-4">
              {analytics.top_contributors.slice(0, 5).map((contributor: any, index: number) => (
                <div key={contributor.user_id} className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{contributor.username}</p>
                    <p className="text-sm text-muted-foreground">
                      {contributor.response_count} responses
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <Award className="w-4 h-4 text-success" />
                      <span className="font-semibold">{contributor.avg_quality?.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Response Time Heatmap */}
        {analytics.hourly_distribution && analytics.hourly_distribution.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Response Activity by Hour</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.hourly_distribution}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="hour" className="text-xs" label={{ value: "Hour of Day", position: "insideBottom", offset: -5 }} />
                <YAxis className="text-xs" label={{ value: "Responses", angle: -90, position: "insideLeft" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke={COLORS.success}
                  strokeWidth={2}
                  dot={{ fill: COLORS.success, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>

      {/* Field-Specific Analytics */}
      {analytics.field_analytics && analytics.field_analytics.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Field-Level Insights</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {analytics.field_analytics.map((field: any) => (
              <Card key={field.field_id} className="p-4">
                <p className="font-medium mb-2">{field.field_label}</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Completion Rate:</span>
                    <span className="font-semibold">{field.completion_rate?.toFixed(1)}%</span>
                  </div>
                  {field.most_common_value && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Most Common:</span>
                      <span className="font-semibold truncate ml-2" title={field.most_common_value}>
                        {field.most_common_value}
                      </span>
                    </div>
                  )}
                  {field.avg_value !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Average:</span>
                      <span className="font-semibold">{field.avg_value.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
