"use client"

import { use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { format, formatDistanceToNow, isPast, isFuture } from "date-fns"
import { LayoutWrapper } from "@/components/layout-wrapper"
import { PageHeader } from "@/components/page-header"
import { RouteGuard } from "@/components/route-guard"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Edit,
  Play,
  Pause,
  Square,
  XCircle,
  BarChart3,
  Calendar,
  Users,
  Vote,
  ClipboardList,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Eye,
  ExternalLink,
  Settings,
} from "lucide-react"
import { motion } from "framer-motion"
import {
  useElection,
  usePublishElection,
  usePauseElection,
  useResumeElection,
  useCloseElection,
  useCancelElection,
} from "@/hooks/elections"
import { useElectionResults, useTurnoutStats } from "@/hooks/elections"
import { usePermissions } from "@/lib/permission-context"
import { PositionsManager } from "@/components/elections/positions-manager"
import { PollOptionsManager } from "@/components/elections/poll-options-manager"
import type { ElectionStatus, ElectionType } from "@/lib/types"

const statusColors: Record<ElectionStatus, string> = {
  draft: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  paused: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  closed: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
}

const typeLabels: Record<ElectionType, string> = {
  election: "Election",
  poll: "Poll",
  survey: "Survey",
  referendum: "Referendum",
}

const votingMethodLabels = {
  single_choice: "Single Choice",
  multi_choice: "Multiple Choice",
  ranked_choice: "Ranked Choice",
}

const verificationLabels = {
  anonymous: "Anonymous",
  registered: "Registered Users",
  verified: "Verified Identity",
}

export default function ElectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const { hasPermission } = usePermissions()

  const { data: election, isLoading, error } = useElection(id)
  const { data: results } = useElectionResults(id)
  const { data: turnout } = useTurnoutStats(id)

  const publishElection = usePublishElection()
  const pauseElection = usePauseElection()
  const resumeElection = useResumeElection()
  const closeElection = useCloseElection()
  const cancelElection = useCancelElection()

  if (isLoading) {
    return (
      <RouteGuard permissions={["elections:read"]}>
        <LayoutWrapper>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            <Skeleton className="h-10 w-64" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
            <Skeleton className="h-64" />
          </div>
        </LayoutWrapper>
      </RouteGuard>
    )
  }

  if (error || !election) {
    return (
      <RouteGuard permissions={["elections:read"]}>
        <LayoutWrapper>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center py-12">
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Election Not Found</h2>
              <p className="text-muted-foreground mb-4">
                The election you're looking for doesn't exist or has been removed.
              </p>
              <Link href="/elections">
                <Button>Back to Elections</Button>
              </Link>
            </div>
          </div>
        </LayoutWrapper>
      </RouteGuard>
    )
  }

  const getTimeStatus = () => {
    const start = new Date(election.start_date)
    const end = new Date(election.end_date)
    const now = new Date()

    if (election.status === "active") {
      if (isPast(end)) {
        return { label: "Voting period ended", icon: AlertTriangle, color: "text-red-600" }
      }
      return {
        label: `Ends ${formatDistanceToNow(end, { addSuffix: true })}`,
        icon: Clock,
        color: "text-green-600",
      }
    }
    if (election.status === "scheduled" && isFuture(start)) {
      return {
        label: `Starts ${formatDistanceToNow(start, { addSuffix: true })}`,
        icon: Calendar,
        color: "text-blue-600",
      }
    }
    if (election.status === "closed") {
      return {
        label: `Ended ${formatDistanceToNow(end, { addSuffix: true })}`,
        icon: CheckCircle2,
        color: "text-purple-600",
      }
    }
    return null
  }

  const timeStatus = getTimeStatus()
  const isElectionType = election.election_type === "election"
  const canManage = hasPermission("elections:manage")

  return (
    <RouteGuard permissions={["elections:read"]}>
      <LayoutWrapper>
        <PageHeader
          title={election.title}
          description={election.description}
          breadcrumbs={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Elections", href: "/elections" },
            { label: election.title },
          ]}
          action={
            <div className="flex items-center gap-2">
              {canManage && election.status === "draft" && (
                <Link href={`/elections/${id}/edit`}>
                  <Button variant="outline" className="gap-2">
                    <Edit className="h-4 w-4" />
                    Edit
                  </Button>
                </Link>
              )}
              <Link href={`/elections/${id}/analytics`}>
                <Button variant="outline" className="gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Analytics
                </Button>
              </Link>
            </div>
          }
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* Status Bar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap items-center gap-4"
          >
            <Badge className={statusColors[election.status]} variant="secondary">
              {election.status.charAt(0).toUpperCase() + election.status.slice(1)}
            </Badge>
            <Badge variant="outline">{typeLabels[election.election_type]}</Badge>
            <Badge variant="outline">{votingMethodLabels[election.voting_method]}</Badge>
            {timeStatus && (
              <div className={`flex items-center gap-1 text-sm ${timeStatus.color}`}>
                <timeStatus.icon className="h-4 w-4" />
                {timeStatus.label}
              </div>
            )}
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
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
                    <ClipboardList className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {isElectionType
                        ? election.positions?.length || 0
                        : election.poll_options?.length || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {isElectionType ? "Positions" : "Options"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-purple-500/10">
                    <Calendar className="h-6 w-6 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {format(new Date(election.start_date), "MMM d")} -{" "}
                      {format(new Date(election.end_date), "MMM d, yyyy")}
                    </p>
                    <p className="text-sm text-muted-foreground">Voting Period</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Lifecycle Actions */}
          {canManage && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Election Controls
                  </CardTitle>
                  <CardDescription>Manage the election lifecycle</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    {election.status === "draft" && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button className="gap-2" variant="default">
                            <Play className="h-4 w-4" />
                            Publish Election
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Publish Election?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will make the election live and allow voters to cast their votes.
                              Make sure all positions and candidates are configured.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => publishElection.mutate(id)}
                            >
                              Publish
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}

                    {election.status === "active" && (
                      <>
                        <Button
                          variant="outline"
                          className="gap-2 text-yellow-600"
                          onClick={() => pauseElection.mutate(id)}
                        >
                          <Pause className="h-4 w-4" />
                          Pause Voting
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" className="gap-2 text-purple-600">
                              <Square className="h-4 w-4" />
                              Close Voting
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Close Voting?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will end the voting period. No more votes will be accepted.
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => closeElection.mutate(id)}
                              >
                                Close Voting
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}

                    {election.status === "paused" && (
                      <Button
                        variant="outline"
                        className="gap-2 text-green-600"
                        onClick={() => resumeElection.mutate(id)}
                      >
                        <Play className="h-4 w-4" />
                        Resume Voting
                      </Button>
                    )}

                    {!["cancelled", "closed"].includes(election.status) && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" className="gap-2 text-destructive">
                            <XCircle className="h-4 w-4" />
                            Cancel Election
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Cancel Election?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will cancel the election entirely. All votes will be discarded.
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => cancelElection.mutate(id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Cancel Election
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}

                    {election.status === "active" && (
                      <Link
                        href={`/public/elections/${id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="outline" className="gap-2">
                          <ExternalLink className="h-4 w-4" />
                          View Public Ballot
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Main Content Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Tabs defaultValue={isElectionType ? "positions" : "options"}>
              <TabsList>
                {isElectionType ? (
                  <TabsTrigger value="positions">Positions & Candidates</TabsTrigger>
                ) : (
                  <TabsTrigger value="options">Poll Options</TabsTrigger>
                )}
                <TabsTrigger value="settings">Settings</TabsTrigger>
                <TabsTrigger value="audit">Audit Log</TabsTrigger>
              </TabsList>

              {isElectionType ? (
                <TabsContent value="positions" className="mt-6">
                  <PositionsManager
                    electionId={id}
                    positions={election.positions || []}
                    canEdit={canManage && election.status === "draft"}
                  />
                </TabsContent>
              ) : (
                <TabsContent value="options" className="mt-6">
                  <PollOptionsManager
                    electionId={id}
                    options={election.poll_options || []}
                    canEdit={canManage && election.status === "draft"}
                  />
                </TabsContent>
              )}

              <TabsContent value="settings" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Election Configuration</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium mb-2">Voting Settings</h4>
                        <dl className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Voting Method</dt>
                            <dd>{votingMethodLabels[election.voting_method]}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Results Visibility</dt>
                            <dd>
                              {election.results_visibility === "real_time"
                                ? "Real-time"
                                : "After Close"}
                            </dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Show Voter Count</dt>
                            <dd>{election.show_voter_count ? "Yes" : "No"}</dd>
                          </div>
                        </dl>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Verification</h4>
                        <dl className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Verification Level</dt>
                            <dd>{verificationLabels[election.verification_level]}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">National ID Required</dt>
                            <dd>{election.require_national_id ? "Yes" : "No"}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Phone OTP Required</dt>
                            <dd>{election.require_phone_otp ? "Yes" : "No"}</dd>
                          </div>
                        </dl>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="audit" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Audit Log</CardTitle>
                    <CardDescription>
                      Track all changes and actions on this election
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-center py-8">
                      Audit log will be displayed here
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </LayoutWrapper>
    </RouteGuard>
  )
}
