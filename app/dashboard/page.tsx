"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LayoutWrapper } from "@/components/layout-wrapper"
import { PageHeader } from "@/components/page-header"
import { StatCard as StandardizedStatCard, ContentCard } from "@/components/standardized-cards"
import { useDashboardAnalytics } from "@/hooks/use-analytics"
import {
  FileText,
  MessageSquare,
  Users,
  TrendingUp,
  Clock,
  CheckCircle2,
  Activity,
  Target,
  Zap,
  Award,
  AlertTriangle,
  BarChart3,
  Map,
} from "lucide-react"
import { motion } from "framer-motion"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CardSkeleton, ChartSkeleton, ListSkeleton } from "@/components/skeleton-loader"

interface DashboardData {
  stats: {
    total_forms: number
    total_responses: number
    total_agents: number
    avg_completion_rate: number
    active_forms: number
    pending_reviews: number
    completion_trend: number
    response_rate: number
  }
  response_trend: Array<{ date: string; responses: number; target?: number }>
  top_forms: Array<{ name: string; responses: number; completion_rate: number }>
  recent_activity: Array<{
    id: number
    type: string
    message: string
    time: string
    user: string
    status?: "success" | "warning" | "info" | "error"
  }>
  performance_metrics: {
    avg_response_time: number
    form_completion_rate: number
    user_satisfaction: number
    data_quality_score: number
  }
}

export default function DashboardPage() {
  const [timePeriod, setTimePeriod] = useState<"24h" | "7d" | "30d" | "90d">("7d")
  const { data: dashboardData, isLoading } = useDashboardAnalytics(timePeriod)

  return (
    <LayoutWrapper>
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="mb-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div>
                <h1 className="text-3xl sm:text-4xl font-semibold text-foreground tracking-tight">
                  Dashboard
                </h1>
                <p className="text-base text-muted-foreground mt-2">
                  Overview of your data collection system
                </p>
              </div>
              <Select
                value={timePeriod}
                onValueChange={(value) => setTimePeriod(value as "24h" | "7d" | "30d" | "90d")}
              >
                <SelectTrigger className="w-[200px] h-11 bg-card border-border shadow-sm">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24h">Last 24 hours</SelectItem>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </motion.div>

          {isLoading ? (
            <>
              {/* Primary KPI Cards Skeleton */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>

              {/* Secondary KPI Cards Skeleton */}
              <div className="mt-8">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <CardSkeleton key={i} />
                  ))}
                </div>
              </div>

              {/* Charts Row Skeleton */}
              <div className="mt-12">
                <div className="grid gap-6 md:grid-cols-2">
                  <ChartSkeleton />
                  <ChartSkeleton />
                </div>
              </div>

              {/* Recent Activity Skeleton */}
              <div className="mt-8">
                <Card className="hover:shadow-md transition-all duration-200 border border-border">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-primary" />
                      <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ListSkeleton items={5} />
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <>
              {/* Primary KPI Cards */}
              <motion.div
                className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.08,
                      delayChildren: 0.1,
                    },
                  },
                }}
              >
                <StandardizedStatCard
                  title="System Uptime"
                  value="98.5%"
                  icon={Zap}
                  trend={{
                    value: 0.5,
                    label: "vs last month",
                  }}
                  variant="elevated"
                  size="sm"
                  status="success"
                />
                <StandardizedStatCard
                  title="Total Responses"
                  value={dashboardData?.stats.total_responses || 0}
                  description="from last week"
                  icon={MessageSquare}
                  trend={{
                    value: 8,
                    label: "vs last week",
                  }}
                  variant="gradient"
                  status="info"
                />
                <StandardizedStatCard
                  title="Active Agents"
                  value={dashboardData?.stats.total_agents || 0}
                  description="new this week"
                  icon={Users}
                  trend={{
                    value: 3,
                    label: "new agents",
                  }}
                  variant="gradient"
                  status="success"
                />
                <StandardizedStatCard
                  title="Completion Rate"
                  value={`${dashboardData?.stats.avg_completion_rate || 0}%`}
                  description="from last month"
                  icon={CheckCircle2}
                  trend={{
                    value: 5,
                    label: "vs last month",
                  }}
                  variant="gradient"
                  status="success"
                />
              </motion.div>

              {/* Secondary KPI Cards */}
              <div className="mt-8">
                <motion.div
                  className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: { opacity: 0 },
                    visible: {
                      opacity: 1,
                      transition: {
                        staggerChildren: 0.08,
                        delayChildren: 0.3,
                      },
                    },
                  }}
                >
                  <StandardizedStatCard
                    title="Active Forms"
                    value={dashboardData?.stats.active_forms || 0}
                    icon={Activity}
                    badge="Active"
                    variant="elevated"
                    size="sm"
                  />
                  <StandardizedStatCard
                    title="Pending Reviews"
                    value={dashboardData?.stats.pending_reviews || 0}
                    icon={AlertTriangle}
                    trend={{
                      value: -15,
                      label: "vs last week",
                      direction: "down",
                    }}
                    variant="elevated"
                    size="sm"
                    status="warning"
                  />
                  <StandardizedStatCard
                    title="Response Rate"
                    value={`${dashboardData?.stats.response_rate || 0}%`}
                    icon={Target}
                    badge="Target"
                    variant="elevated"
                    size="sm"
                    status="info"
                  />
                  <StandardizedStatCard
                    title="Total Forms"
                    value={dashboardData?.stats.total_forms || 0}
                    description="from last month"
                    icon={FileText}
                    trend={{
                      value: 12,
                      label: "vs last month",
                    }}
                    variant="gradient"
                  />
                </motion.div>
              </div>

              {/* Charts Row */}
              <div className="mt-12">
                <motion.div
                  className="grid gap-6 md:grid-cols-2"
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: { opacity: 0 },
                    visible: {
                      opacity: 1,
                      transition: {
                        staggerChildren: 0.15,
                        delayChildren: 0.5,
                      },
                    },
                  }}
                >
                  {/* Data Collection Progress */}
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, x: -20 },
                      visible: { opacity: 1, x: 0 },
                    }}
                  >
                    <ContentCard
                      title="Data Collection Progress"
                      description="Monthly response targets vs actual submissions"
                      icon={BarChart3}
                      variant="elevated"
                    >
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={dashboardData?.response_trend || []}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis
                              dataKey="date"
                              className="text-xs fill-muted-foreground"
                              tickFormatter={(value) =>
                                new Date(value).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })
                              }
                            />
                            <YAxis className="text-xs fill-muted-foreground" />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "hsl(var(--card))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "6px",
                              }}
                              labelFormatter={(value) => new Date(value).toLocaleDateString()}
                            />
                            <Bar
                              dataKey="target"
                              fill="hsl(var(--muted))"
                              name="Target"
                              radius={[2, 2, 0, 0]}
                            />
                            <Bar
                              dataKey="responses"
                              fill="hsl(var(--primary))"
                              name="Actual"
                              radius={[2, 2, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </ContentCard>
                  </motion.div>

                  {/* Geographic Coverage */}
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, x: 20 },
                      visible: { opacity: 1, x: 0 },
                    }}
                  >
                    <ContentCard
                      title="Geographic Coverage"
                      description="Data collection reach across districts"
                      icon={Activity}
                      variant="elevated"
                    >
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={[
                              { district: "Accra", completion: 92, target: 100 },
                              { district: "Tema", completion: 87, target: 100 },
                              { district: "East Legon", completion: 78, target: 100 },
                              { district: "West Legon", completion: 95, target: 100 },
                              { district: "Adenta", completion: 71, target: 100 },
                              { district: "Ashaiman", completion: 83, target: 100 },
                            ]}
                            layout="horizontal"
                            margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis
                              type="number"
                              className="text-xs fill-muted-foreground"
                              domain={[0, 100]}
                            />
                            <YAxis
                              type="category"
                              dataKey="district"
                              className="text-xs fill-muted-foreground"
                              width={50}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "hsl(var(--card))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "6px",
                              }}
                              formatter={(value, name) => [
                                `${value}%`,
                                name === "completion" ? "Completed" : "Target",
                              ]}
                            />
                            <Bar
                              dataKey="completion"
                              fill="hsl(var(--primary))"
                              name="completion"
                              radius={[0, 2, 2, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </ContentCard>
                  </motion.div>
                </motion.div>
              </div>

              {/* Recent Activity */}
              <div className="mt-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.5 }}
                >
                  <ContentCard title="Recent Activity" icon={Activity} variant="elevated">
                    <div className="space-y-3">
                      {dashboardData?.recent_activity
                        ?.slice(0, 5)
                        .map((activity: DashboardData["recent_activity"][0], index: number) => (
                          <div
                            key={activity.id || index}
                            className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 border border-border/40"
                          >
                            <div
                              className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                                activity.status === "success"
                                  ? "bg-green-600"
                                  : activity.status === "warning"
                                    ? "bg-amber-600"
                                    : activity.status === "error"
                                      ? "bg-red-600"
                                      : "bg-primary"
                              }`}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground">
                                {activity.message}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {activity.user} • {new Date(activity.time).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        )) || (
                        <div className="text-center py-12 text-muted-foreground text-sm">
                          No recent activity
                        </div>
                      )}
                    </div>
                  </ContentCard>
                </motion.div>
              </div>
            </>
          )}
        </div>
      </div>
    </LayoutWrapper>
  )
}
