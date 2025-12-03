"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { LayoutWrapper } from "@/components/layout-wrapper"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertTriangle,
  Search,
  Plus,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowUpCircle,
  MapPin,
  RefreshCw,
  User,
  Calendar,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { formatDistanceToNow } from "date-fns"
import { usePermissions } from "@/lib/permission-context"
import { RouteGuard } from "@/components/route-guard"
import { useElection } from "@/hooks/elections"
import { useIncidents, useReportIncident, useResolveIncident } from "@/hooks/collation"
import type { CollationIncident } from "@/lib/types"

type IncidentSeverity = "low" | "medium" | "high" | "critical"
type IncidentStatus = "reported" | "investigating" | "resolved"
type IncidentType = "violence" | "equipment_failure" | "irregularity" | "protest" | "other"

const severityColors: Record<IncidentSeverity, string> = {
  low: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  critical: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
}

const statusColors: Record<IncidentStatus, string> = {
  reported: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  investigating: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  resolved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
}

const statusIcons: Record<IncidentStatus, React.ReactNode> = {
  reported: <AlertCircle className="h-3.5 w-3.5" />,
  investigating: <Clock className="h-3.5 w-3.5" />,
  resolved: <CheckCircle className="h-3.5 w-3.5" />,
}

const incidentTypeLabels: Record<IncidentType, string> = {
  violence: "Violence",
  equipment_failure: "Equipment Failure",
  irregularity: "Irregularity",
  protest: "Protest",
  other: "Other",
}

function IncidentsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    </div>
  )
}

function IncidentCard({ incident, onResolve }: { incident: CollationIncident; onResolve: (id: string, notes: string) => void }) {
  const { hasPermission } = usePermissions()
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false)
  const [resolutionNotes, setResolutionNotes] = useState("")

  const canResolve = incident.status !== "resolved" && hasPermission("collation:manage")

  const handleResolve = () => {
    onResolve(incident.id, resolutionNotes)
    setResolveDialogOpen(false)
    setResolutionNotes("")
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="h-full hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${
                incident.severity === "critical" ? "bg-red-100 dark:bg-red-900/30" :
                incident.severity === "high" ? "bg-orange-100 dark:bg-orange-900/30" :
                incident.severity === "medium" ? "bg-yellow-100 dark:bg-yellow-900/30" :
                "bg-blue-100 dark:bg-blue-900/30"
              }`}>
                <AlertTriangle className={`h-5 w-5 ${
                  incident.severity === "critical" ? "text-red-600" :
                  incident.severity === "high" ? "text-orange-600" :
                  incident.severity === "medium" ? "text-yellow-600" :
                  "text-blue-600"
                }`} />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-base truncate">
                  {incidentTypeLabels[incident.incident_type]}
                </CardTitle>
                <CardDescription className="mt-1">
                  {incident.severity} severity
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <Badge className={`${severityColors[incident.severity]}`}>
                {incident.severity}
              </Badge>
              <Badge className={`gap-1 ${statusColors[incident.status]}`}>
                {statusIcons[incident.status]}
                {incident.status}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {incident.description}
          </p>

          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              <span>{incident.reported_by_username || "Unknown"}</span>
            </div>
          </div>

          {incident.resolution_notes && (
            <div className="mt-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
              <p className="text-xs font-medium text-green-800 dark:text-green-200 mb-1">Resolution:</p>
              <p className="text-xs text-green-700 dark:text-green-300">{incident.resolution_notes}</p>
            </div>
          )}

          {canResolve && (
            <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full mt-4">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Resolve Incident
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Resolve Incident</DialogTitle>
                  <DialogDescription>
                    Provide resolution notes for this incident.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="resolution">Resolution Notes</Label>
                    <Textarea
                      id="resolution"
                      placeholder="Describe how the incident was resolved..."
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      rows={4}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setResolveDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleResolve} disabled={!resolutionNotes.trim()}>
                    Mark as Resolved
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

function ReportIncidentDialog({ electionId, onReport }: { electionId: string; onReport: (data: Parameters<ReturnType<typeof useReportIncident>["mutate"]>[0]) => void }) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    description: "",
    incident_type: "other" as IncidentType,
    severity: "medium" as IncidentSeverity,
  })

  const handleSubmit = () => {
    onReport({
      election_id: electionId,
      incident_type: formData.incident_type,
      severity: formData.severity,
      description: formData.description,
    })
    setOpen(false)
    setFormData({
      description: "",
      incident_type: "other",
      severity: "medium",
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Report Incident
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Report New Incident</DialogTitle>
          <DialogDescription>
            Report an issue that occurred during collation.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={formData.incident_type}
                onValueChange={(v) => setFormData({ ...formData, incident_type: v as IncidentType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="violence">Violence</SelectItem>
                  <SelectItem value="equipment_failure">Equipment Failure</SelectItem>
                  <SelectItem value="irregularity">Irregularity</SelectItem>
                  <SelectItem value="protest">Protest</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Severity</Label>
              <Select
                value={formData.severity}
                onValueChange={(v) => setFormData({ ...formData, severity: v as IncidentSeverity })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Detailed description of what happened..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!formData.description.trim()}
          >
            Submit Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function IncidentsPage() {
  const params = useParams()
  const electionId = params.electionId as string
  const { hasPermission } = usePermissions()

  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [severityFilter, setSeverityFilter] = useState<string>("all")

  const { data: election, isLoading: electionLoading } = useElection(electionId)
  const {
    data: incidents,
    isLoading: incidentsLoading,
    refetch,
  } = useIncidents(electionId, {
    status: statusFilter !== "all" ? statusFilter : undefined,
    severity: severityFilter !== "all" ? severityFilter : undefined,
  })

  const reportIncident = useReportIncident()
  const resolveIncident = useResolveIncident()

  const isLoading = electionLoading || incidentsLoading

  // Filter by search query
  const filteredIncidents = incidents?.filter((incident: CollationIncident) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      incident.description.toLowerCase().includes(query) ||
      incident.incident_type.toLowerCase().includes(query)
    )
  }) || []

  const handleReport = (data: Parameters<typeof reportIncident.mutate>[0]) => {
    reportIncident.mutate(data)
  }

  const handleResolve = (incidentId: string, notes: string) => {
    resolveIncident.mutate({ incidentId, resolutionNotes: notes })
  }

  // Group by status for summary
  const reportedCount = filteredIncidents.filter((i: CollationIncident) => i.status === "reported").length
  const investigatingCount = filteredIncidents.filter((i: CollationIncident) => i.status === "investigating").length
  const resolvedCount = filteredIncidents.filter((i: CollationIncident) => i.status === "resolved").length

  return (
    <RouteGuard permissions={["collation:read"]}>
      <LayoutWrapper>
        <PageHeader
          title="Incidents"
          description={election?.title || "Loading..."}
          breadcrumbs={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Collation", href: "/collation" },
            { label: election?.title || "...", href: `/collation/${electionId}` },
            { label: "Incidents" },
          ]}
          action={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              {hasPermission("collation:create") && (
                <ReportIncidentDialog electionId={electionId} onReport={handleReport} />
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
          {isLoading ? (
            <IncidentsSkeleton />
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid gap-4 md:grid-cols-3 mb-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30">
                        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{reportedCount}</p>
                        <p className="text-sm text-muted-foreground">Reported</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                        <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{investigatingCount}</p>
                        <p className="text-sm text-muted-foreground">Investigating</p>
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
                        <p className="text-2xl font-bold">{resolvedCount}</p>
                        <p className="text-sm text-muted-foreground">Resolved</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search incidents..."
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
                    <SelectItem value="reported">Reported</SelectItem>
                    <SelectItem value="investigating">Investigating</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severity</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Incidents Grid */}
              <AnimatePresence mode="popLayout">
                {filteredIncidents.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredIncidents.map((incident: CollationIncident) => (
                      <IncidentCard
                        key={incident.id}
                        incident={incident}
                        onResolve={handleResolve}
                      />
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Incidents</h3>
                      <p className="text-muted-foreground mb-4">
                        No incidents have been reported for this election.
                      </p>
                      {hasPermission("collation:create") && (
                        <ReportIncidentDialog electionId={electionId} onReport={handleReport} />
                      )}
                    </CardContent>
                  </Card>
                )}
              </AnimatePresence>
            </>
          )}
        </motion.div>
      </LayoutWrapper>
    </RouteGuard>
  )
}
