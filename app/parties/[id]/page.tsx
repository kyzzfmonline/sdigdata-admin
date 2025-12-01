"use client"

import { use } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { format } from "date-fns"
import { LayoutWrapper } from "@/components/layout-wrapper"
import { PageHeader } from "@/components/page-header"
import { RouteGuard } from "@/components/route-guard"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Edit,
  Flag,
  Globe,
  Mail,
  Phone,
  MapPin,
  Users,
  Calendar,
  Trophy,
  TrendingUp,
  Vote,
} from "lucide-react"
import { motion } from "framer-motion"
import { useParty, usePartyCandidates, usePartyStats, usePartyElectionHistory } from "@/hooks/parties"
import { usePermissions } from "@/lib/permission-context"
import type { PartyStatus, CandidateProfileStatus } from "@/lib/types"

const statusColors: Record<PartyStatus, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  inactive: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  suspended: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  dissolved: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
}

const candidateStatusColors: Record<CandidateProfileStatus, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  inactive: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  suspended: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  deceased: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
}

interface PartyDetailPageProps {
  params: Promise<{ id: string }>
}

export default function PartyDetailPage({ params }: PartyDetailPageProps) {
  const { id } = use(params)
  const searchParams = useSearchParams()
  const { hasPermission } = usePermissions()
  const defaultTab = searchParams.get("tab") || "overview"

  const { data: party, isLoading, error } = useParty(id)
  const { data: candidatesData } = usePartyCandidates(id)
  const { data: stats } = usePartyStats(id)
  const { data: electionHistory } = usePartyElectionHistory(id)

  const candidates = candidatesData?.candidates || []

  if (isLoading) {
    return (
      <RouteGuard permissions={["elections:read"]}>
        <LayoutWrapper>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            <Skeleton className="h-12 w-64" />
            <Skeleton className="h-64 w-full" />
          </div>
        </LayoutWrapper>
      </RouteGuard>
    )
  }

  if (error || !party) {
    return (
      <RouteGuard permissions={["elections:read"]}>
        <LayoutWrapper>
          <div className="text-center py-12">
            <p className="text-destructive">Failed to load party details. Please try again.</p>
          </div>
        </LayoutWrapper>
      </RouteGuard>
    )
  }

  return (
    <RouteGuard permissions={["elections:read"]}>
      <LayoutWrapper>
        <PageHeader
          title={party.name}
          description={party.slogan || "Political Party"}
          breadcrumbs={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Political Parties", href: "/parties" },
            { label: party.abbreviation || party.name },
          ]}
          action={
            hasPermission("elections:manage") && (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link href={`/parties/${id}/edit`}>
                  <Button className="gap-2">
                    <Edit className="h-4 w-4" />
                    Edit Party
                  </Button>
                </Link>
              </motion.div>
            )
          }
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Tabs defaultValue={defaultTab} className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="candidates">Candidates</TabsTrigger>
              <TabsTrigger value="stats">Statistics</TabsTrigger>
              <TabsTrigger value="history">Election History</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Info Card */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div
                        className="p-4 rounded-lg"
                        style={{
                          backgroundColor: party.color_primary
                            ? `${party.color_primary}20`
                            : "hsl(var(--primary) / 0.1)",
                        }}
                      >
                        {party.logo_url ? (
                          <img
                            src={party.logo_url}
                            alt={party.name}
                            className="h-16 w-16 object-contain"
                          />
                        ) : (
                          <Flag
                            className="h-16 w-16"
                            style={{ color: party.color_primary || "hsl(var(--primary))" }}
                          />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-2xl">{party.name}</CardTitle>
                          <Badge className={statusColors[party.status]}>
                            {party.status.charAt(0).toUpperCase() + party.status.slice(1)}
                          </Badge>
                        </div>
                        {party.abbreviation && (
                          <CardDescription className="text-lg mt-1">
                            {party.abbreviation}
                          </CardDescription>
                        )}
                        {party.slogan && (
                          <p className="text-muted-foreground italic mt-2">"{party.slogan}"</p>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {party.description && (
                      <div>
                        <h4 className="font-medium mb-2">About</h4>
                        <p className="text-muted-foreground">{party.description}</p>
                      </div>
                    )}

                    {/* Color Preview */}
                    {(party.color_primary || party.color_secondary) && (
                      <div>
                        <h4 className="font-medium mb-2">Party Colors</h4>
                        <div className="flex gap-2">
                          {party.color_primary && (
                            <div className="flex items-center gap-2">
                              <div
                                className="w-8 h-8 rounded border"
                                style={{ backgroundColor: party.color_primary }}
                              />
                              <span className="text-sm font-mono">{party.color_primary}</span>
                            </div>
                          )}
                          {party.color_secondary && (
                            <div className="flex items-center gap-2">
                              <div
                                className="w-8 h-8 rounded border"
                                style={{ backgroundColor: party.color_secondary }}
                              />
                              <span className="text-sm font-mono">{party.color_secondary}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Contact & Info Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Party Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {party.founded_date && (
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Founded</p>
                          <p className="font-medium">{format(new Date(party.founded_date), "MMMM d, yyyy")}</p>
                        </div>
                      </div>
                    )}

                    {party.leader_name && (
                      <div className="flex items-center gap-3">
                        <Users className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Leader</p>
                          <p className="font-medium">{party.leader_name}</p>
                        </div>
                      </div>
                    )}

                    {party.headquarters_address && (
                      <div className="flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Headquarters</p>
                          <p className="font-medium">{party.headquarters_address}</p>
                        </div>
                      </div>
                    )}

                    {party.website && (
                      <div className="flex items-center gap-3">
                        <Globe className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Website</p>
                          <a
                            href={party.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-primary hover:underline"
                          >
                            {party.website.replace(/^https?:\/\//, "")}
                          </a>
                        </div>
                      </div>
                    )}

                    {party.email && (
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Email</p>
                          <a
                            href={`mailto:${party.email}`}
                            className="font-medium text-primary hover:underline"
                          >
                            {party.email}
                          </a>
                        </div>
                      </div>
                    )}

                    {party.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Phone</p>
                          <p className="font-medium">{party.phone}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="candidates" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Party Candidates
                  </CardTitle>
                  <CardDescription>
                    {candidates.length} candidate{candidates.length !== 1 ? "s" : ""} registered with this party
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {candidates.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Candidate</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Registered</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {candidates.map((candidate) => (
                          <TableRow key={candidate.id}>
                            <TableCell>
                              <Link
                                href={`/candidates/${candidate.id}`}
                                className="flex items-center gap-3 group"
                              >
                                <Avatar>
                                  <AvatarImage src={candidate.photo_url} />
                                  <AvatarFallback>
                                    {candidate.name
                                      .split(" ")
                                      .map((n: string) => n[0])
                                      .join("")
                                      .toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <p className="font-medium group-hover:text-primary transition-colors">
                                  {candidate.name}
                                </p>
                              </Link>
                            </TableCell>
                            <TableCell>
                              <Badge className={candidateStatusColors[candidate.status]}>
                                {candidate.status.charAt(0).toUpperCase() + candidate.status.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {format(new Date(candidate.created_at), "MMM d, yyyy")}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No candidates registered with this party yet</p>
                      {hasPermission("elections:create") && (
                        <Link href="/candidates/new">
                          <Button variant="outline" className="mt-4">
                            Add Candidate
                          </Button>
                        </Link>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="stats" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-primary/10">
                        <Users className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{stats?.candidates?.total || party.total_candidates || 0}</p>
                        <p className="text-sm text-muted-foreground">Total Candidates</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-green-500/10">
                        <Vote className="h-6 w-6 text-green-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{stats?.elections?.total_participations || party.total_elections_participated || 0}</p>
                        <p className="text-sm text-muted-foreground">Elections</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-yellow-500/10">
                        <Trophy className="h-6 w-6 text-yellow-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{stats?.elections?.total_wins || party.total_wins || 0}</p>
                        <p className="text-sm text-muted-foreground">Total Wins</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-blue-500/10">
                        <TrendingUp className="h-6 w-6 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">
                          {stats?.elections?.total_participations && stats?.elections?.total_wins
                            ? `${((stats.elections.total_wins / stats.elections.total_participations) * 100).toFixed(1)}%`
                            : "0%"}
                        </p>
                        <p className="text-sm text-muted-foreground">Win Rate</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Vote className="h-5 w-5" />
                    Election History
                  </CardTitle>
                  <CardDescription>
                    Past elections where this party participated
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {electionHistory && electionHistory.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Election</TableHead>
                          <TableHead>Candidates</TableHead>
                          <TableHead>Seats Won</TableHead>
                          <TableHead>Total Votes</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {electionHistory.map((history) => (
                          <TableRow key={history.election_id}>
                            <TableCell>
                              <Link
                                href={`/elections/${history.election_id}`}
                                className="font-medium hover:text-primary transition-colors"
                              >
                                {history.election_title}
                              </Link>
                            </TableCell>
                            <TableCell>{history.candidates_fielded}</TableCell>
                            <TableCell>
                              <Badge variant={history.seats_won > 0 ? "default" : "secondary"}>
                                {history.seats_won}
                              </Badge>
                            </TableCell>
                            <TableCell>{history.total_votes.toLocaleString()}</TableCell>
                            <TableCell>
                              {format(new Date(history.election_date), "MMM d, yyyy")}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8">
                      <Vote className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No election history yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </LayoutWrapper>
    </RouteGuard>
  )
}
