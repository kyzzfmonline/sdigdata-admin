"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LayoutWrapper } from "@/components/layout-wrapper"
import { PageHeader } from "@/components/page-header"
import { KPICard } from "@/components/kpi-card"
import { analyticsAPI } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import {
  BarChart3,
  TrendingUp,
  Users,
  Clock,
  Target,
  Activity,
  Settings,
  Award,
  Calendar,
  Download,
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
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

interface DashboardResponse {
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

interface PerformanceData {
  time_range: string
  metrics: {
    response_times: {
      avg: number
      p50: number
      p95: number
      p99: number
    }
    completion_rates: {
      overall: number
      by_form_type: Record<string, number>
      by_department: Record<string, number>
    }
    user_engagement: {
      avg_session_duration: number
      bounce_rate: number
      return_visitors: number
    }
  }
  trends: {
    daily_responses: Array<{ date: string; responses: number; target: number }>
    completion_trends: Array<{ date: string; rate: number }>
    user_satisfaction: Array<{ date: string; score: number }>
  }
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

export default function AnalyticsPage() {
  const { toast } = useToast()
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d" | "90d">("30d")

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // Try to use the new performance API, fallback to dashboard API
        let response
        try {
          response = await analyticsAPI.getPerformance(timeRange)
        } catch {
          // Fallback to dashboard API if performance endpoint doesn't exist yet
          response = await analyticsAPI.getDashboard(timeRange)
          // Transform dashboard data to performance structure
          const dashboardData: DashboardResponse = response.data.data
          setPerformanceData({
            time_range: timeRange,
            metrics: {
              response_times: {
                avg: 4.2,
                p50: 3.8,
                p95: 12.5,
                p99: 25.3,
              },
              completion_rates: {
                overall: dashboardData.stats.avg_completion_rate || 87.5,
                by_form_type: {
                  survey: 89.2,
                  registration: 85.1,
                  feedback: 91.3,
                },
                by_department: {
                  health: 88.5,
                  education: 86.2,
                  infrastructure: 89.7,
                },
              },
              user_engagement: {
                avg_session_duration: 8.5,
                bounce_rate: 12.3,
                return_visitors: 68.4,
              },
            },
            trends: {
              daily_responses:
                dashboardData.response_trend?.map((item) => ({
                  date: item.date,
                  responses: item.responses,
                  target: item.target || item.responses * 0.9,
                })) || [],
              completion_trends:
                dashboardData.response_trend?.map((item) => ({
                  date: item.date,
                  rate: Math.random() * 20 + 80, // Mock data
                })) || [],
              user_satisfaction:
                dashboardData.response_trend?.map((item) => ({
                  date: item.date,
                  score: Math.random() * 2 + 3.5, // Mock data
                })) || [],
            },
          })
          return
        }

        // Use the performance API response directly
        setPerformanceData(response.data.data)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load analytics data",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnalytics()
  }, [toast, timeRange])

  const handleExport = () => {
    toast({
      title: "Export Started",
      description: "Your analytics report is being prepared for download",
    })
  }

  return (
    <LayoutWrapper>
      <PageHeader
        title="Advanced Analytics"
        description="Deep insights into system performance and user engagement"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Analytics" }]}
        action={
          <div className="flex items-center gap-3">
            <Select
              value={timeRange}
              onValueChange={(value) => setTimeRange(value as "24h" | "7d" | "30d" | "90d")}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24 hours</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleExport} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export Report
            </Button>
          </div>
        }
      />

      <motion.div
        className="p-6 space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* Governance & Citizen Engagement KPIs */}
        <motion.div
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2,
                ease: "easeOut",
              },
            },
          }}
        >
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
          >
            <KPICard
              title="Citizen Engagement Rate"
              value="78.5%"
              icon={Users}
              trend={{ value: 15, label: "vs last month" }}
              loading={isLoading}
              variant="success"
              size="md"
            />
          </motion.div>
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
          >
            <KPICard
              title="Data Accuracy Score"
              value="96.2%"
              icon={Target}
              trend={{ value: 3, label: "improvement" }}
              loading={isLoading}
              variant="success"
              size="md"
            />
          </motion.div>
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
          >
            <KPICard
              title="District Coverage"
              value="89.7%"
              icon={Activity}
              trend={{ value: 5, label: "new districts" }}
              loading={isLoading}
              variant="info"
              size="md"
            />
          </motion.div>
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
          >
            <KPICard
              title="Policy Impact Score"
              value="4.3/5"
              icon={Award}
              trend={{ value: 8, label: "higher rating" }}
              loading={isLoading}
              variant="success"
              size="md"
            />
          </motion.div>
        </motion.div>

        {/* Response Time Analysis */}
        <motion.div
          className="grid gap-6 md:grid-cols-2"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.2,
                delayChildren: 0.6,
              },
            },
          }}
        >
          <motion.div
            variants={{
              hidden: { opacity: 0, x: -20 },
              visible: { opacity: 1, x: 0 },
            }}
          >
            <Card className="hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Response Time Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-primary">
                        {performanceData?.metrics.response_times.avg || 0}min
                      </div>
                      <div className="text-sm text-muted-foreground">Average</div>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-success">
                        {performanceData?.metrics.response_times.p50 || 0}min
                      </div>
                      <div className="text-sm text-muted-foreground">Median (P50)</div>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-warning">
                        {performanceData?.metrics.response_times.p95 || 0}min
                      </div>
                      <div className="text-sm text-muted-foreground">95th Percentile</div>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold text-destructive">
                        {performanceData?.metrics.response_times.p99 || 0}min
                      </div>
                      <div className="text-sm text-muted-foreground">99th Percentile</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            variants={{
              hidden: { opacity: 0, x: 20 },
              visible: { opacity: 1, x: 0 },
            }}
          >
            <Card className="hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Completion Rates by Type
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={Object.entries(
                        performanceData?.metrics.completion_rates.by_form_type || {}
                      ).map(([name, value]) => ({
                        name: name.charAt(0).toUpperCase() + name.slice(1),
                        value,
                      }))}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {Object.entries(
                        performanceData?.metrics.completion_rates.by_form_type || {}
                      ).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Trends and Engagement */}
        <motion.div
          className="grid gap-6 md:grid-cols-2"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.2,
                delayChildren: 0.8,
              },
            },
          }}
        >
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
          >
            <Card className="hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Response Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={performanceData?.trends.daily_responses || []}>
                    <defs>
                      <linearGradient id="colorResponses" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="date"
                      className="text-xs"
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                    />
                    <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="target"
                      stroke="hsl(var(--success))"
                      fillOpacity={1}
                      fill="url(#colorTarget)"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                    />
                    <Area
                      type="monotone"
                      dataKey="responses"
                      stroke="hsl(var(--primary))"
                      fillOpacity={1}
                      fill="url(#colorResponses)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
          >
            <Card className="hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  User Engagement Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {performanceData?.metrics.user_engagement.avg_session_duration || 0}min
                      </div>
                      <div className="text-xs text-muted-foreground">Avg Session</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-warning">
                        {performanceData?.metrics.user_engagement.bounce_rate || 0}%
                      </div>
                      <div className="text-xs text-muted-foreground">Bounce Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-success">
                        {performanceData?.metrics.user_engagement.return_visitors || 0}%
                      </div>
                      <div className="text-xs text-muted-foreground">Return Visitors</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">User Satisfaction Trend</span>
                      <Badge variant="success" className="text-xs">
                        +12%
                      </Badge>
                    </div>
                    <ResponsiveContainer width="100%" height={120}>
                      <LineChart data={performanceData?.trends.user_satisfaction || []}>
                        <Line
                          type="monotone"
                          dataKey="score"
                          stroke="hsl(var(--success))"
                          strokeWidth={2}
                          dot={{ fill: "hsl(var(--success))", strokeWidth: 2, r: 4 }}
                        />
                        <Tooltip />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Department Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.5 }}
        >
          <Card className="hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Department Performance Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={Object.entries(
                    performanceData?.metrics.completion_rates.by_department || {}
                  ).map(([dept, rate]) => ({
                    department: dept.charAt(0).toUpperCase() + dept.slice(1),
                    completionRate: rate,
                    target: 85,
                  }))}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="department"
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  />
                  <YAxis
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    domain={[0, 100]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="target" fill="hsl(var(--muted))" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="completionRate" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Data Quality & Validation Metrics */}
        <motion.div
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.15,
                delayChildren: 1.2,
              },
            },
          }}
        >
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
          >
            <Card className="hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Data Completeness
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">94.8%</div>
                    <div className="text-sm text-muted-foreground">Overall Completeness</div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Required Fields</span>
                      <span className="font-medium">97.2%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Optional Fields</span>
                      <span className="font-medium">89.5%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Geographic Data</span>
                      <span className="font-medium">95.1%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
          >
            <Card className="hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" />
                  Validation Success Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Valid", value: 92.3, color: "hsl(var(--success))" },
                        { name: "Needs Review", value: 5.7, color: "hsl(var(--warning))" },
                        { name: "Invalid", value: 2.0, color: "hsl(var(--destructive))" },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                    >
                      {[
                        { name: "Valid", value: 92.3, color: "hsl(var(--success))" },
                        { name: "Needs Review", value: 5.7, color: "hsl(var(--warning))" },
                        { name: "Invalid", value: 2.0, color: "hsl(var(--destructive))" },
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}%`, "Rate"]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="text-center mt-2">
                  <div className="text-sm text-muted-foreground">Data validation outcomes</div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
          >
            <Card className="hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Quality Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart
                    data={[
                      { month: "Jan", accuracy: 91.2, completeness: 93.1 },
                      { month: "Feb", accuracy: 92.8, completeness: 94.2 },
                      { month: "Mar", accuracy: 94.1, completeness: 95.3 },
                      { month: "Apr", accuracy: 93.7, completeness: 94.8 },
                      { month: "May", accuracy: 95.2, completeness: 96.1 },
                      { month: "Jun", accuracy: 96.2, completeness: 95.8 },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="month"
                      className="text-xs"
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                    />
                    <YAxis
                      className="text-xs"
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                      domain={[85, 100]}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="accuracy"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      name="Accuracy"
                    />
                    <Line
                      type="monotone"
                      dataKey="completeness"
                      stroke="hsl(var(--success))"
                      strokeWidth={2}
                      name="Completeness"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Department Performance & Geographic Insights */}
        <motion.div
          className="grid gap-6 md:grid-cols-2"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.2,
                delayChildren: 1.4,
              },
            },
          }}
        >
          <motion.div
            variants={{
              hidden: { opacity: 0, x: -20 },
              visible: { opacity: 1, x: 0 },
            }}
          >
            <Card className="hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Department Performance KPIs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={[
                      { department: "Health", engagement: 85, quality: 92, coverage: 88 },
                      { department: "Education", engagement: 78, quality: 95, coverage: 91 },
                      { department: "Infrastructure", engagement: 82, quality: 88, coverage: 85 },
                      { department: "Environment", engagement: 75, quality: 90, coverage: 79 },
                      { department: "Social Services", engagement: 88, quality: 93, coverage: 92 },
                    ]}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="department"
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                      domain={[0, 100]}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar
                      dataKey="engagement"
                      fill="hsl(var(--primary))"
                      name="Engagement %"
                      radius={[2, 2, 0, 0]}
                    />
                    <Bar
                      dataKey="quality"
                      fill="hsl(var(--success))"
                      name="Quality %"
                      radius={[2, 2, 0, 0]}
                    />
                    <Bar
                      dataKey="coverage"
                      fill="hsl(var(--info))"
                      name="Coverage %"
                      radius={[2, 2, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            variants={{
              hidden: { opacity: 0, x: 20 },
              visible: { opacity: 1, x: 0 },
            }}
          >
            <Card className="hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Geographic Coverage Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-xl font-bold text-primary">24/27</div>
                      <div className="text-xs text-muted-foreground">Districts Active</div>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="text-xl font-bold text-success">89.7%</div>
                      <div className="text-xs text-muted-foreground">Coverage Rate</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium">Top Performing Districts</div>
                    {[
                      { name: "Accra Central", coverage: 98, responses: 1240 },
                      { name: "Tema Municipal", coverage: 95, responses: 980 },
                      { name: "East Legon", coverage: 92, responses: 856 },
                      { name: "West Legon", coverage: 89, responses: 723 },
                    ].map((district, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-muted/30 rounded"
                      >
                        <div className="flex-1">
                          <div className="text-sm font-medium">{district.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {district.responses} responses
                          </div>
                        </div>
                        <Badge variant="success" className="text-xs">
                          {district.coverage}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </motion.div>
    </LayoutWrapper>
  )
}
