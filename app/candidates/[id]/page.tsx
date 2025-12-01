"use client"

import { use } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { format, differenceInYears } from "date-fns"
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
  User,
  Flag,
  Calendar,
  Mail,
  Phone,
  Trophy,
  TrendingUp,
  Vote,
  GraduationCap,
  FileText,
  Twitter,
  Facebook,
  Instagram,
  Linkedin,
  Globe,
} from "lucide-react"
import { motion } from "framer-motion"
import { useCandidateProfile } from "@/hooks/candidates"
import { usePermissions } from "@/lib/permission-context"
import type { CandidateProfileStatus } from "@/lib/types"

const statusColors: Record<CandidateProfileStatus, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  inactive: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  suspended: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  deceased: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
}

interface CandidateDetailPageProps {
  params: Promise<{ id: string }>
}

export default function CandidateDetailPage({ params }: CandidateDetailPageProps) {
  const { id } = use(params)
  const searchParams = useSearchParams()
  const { hasPermission } = usePermissions()
  const defaultTab = searchParams.get("tab") || "overview"

  const { data: candidate, isLoading, error } = useCandidateProfile(id)

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

  if (error || !candidate) {
    return (
      <RouteGuard permissions={["elections:read"]}>
        <LayoutWrapper>
          <div className="text-center py-12">
            <p className="text-destructive">Failed to load candidate profile. Please try again.</p>
          </div>
        </LayoutWrapper>
      </RouteGuard>
    )
  }

  const age = candidate.date_of_birth
    ? differenceInYears(new Date(), new Date(candidate.date_of_birth))
    : null

  const winRate = candidate.total_elections > 0
    ? ((candidate.total_wins / candidate.total_elections) * 100).toFixed(1)
    : "0"

  return (
    <RouteGuard permissions={["elections:read"]}>
      <LayoutWrapper>
        <PageHeader
          title={candidate.name}
          description="Candidate Profile"
          breadcrumbs={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Candidates", href: "/candidates" },
            { label: candidate.name },
          ]}
          action={
            hasPermission("elections:manage") && (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link href={`/candidates/${id}/edit`}>
                  <Button className="gap-2">
                    <Edit className="h-4 w-4" />
                    Edit Profile
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
              <TabsTrigger value="background">Background</TabsTrigger>
              <TabsTrigger value="stats">Statistics</TabsTrigger>
              <TabsTrigger value="elections">Elections</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile Card */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <div className="flex items-start gap-6">
                      <Avatar className="h-24 w-24">
                        <AvatarImage src={candidate.photo_url} alt={candidate.name} />
                        <AvatarFallback className="text-2xl">
                          {candidate.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <CardTitle className="text-2xl">{candidate.name}</CardTitle>
                          <Badge className={statusColors[candidate.status]}>
                            {candidate.status.charAt(0).toUpperCase() + candidate.status.slice(1)}
                          </Badge>
                        </div>

                        {candidate.party_name && (
                          <Badge
                            variant="outline"
                            className="mt-2 gap-1"
                          >
                            <Flag className="h-3 w-3" />
                            {candidate.party_name} {candidate.party_abbreviation ? `(${candidate.party_abbreviation})` : ""}
                          </Badge>
                        )}

                        <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
                          {age && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>{age} years old</span>
                            </div>
                          )}
                          {candidate.date_of_birth && (
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              <span>Born {format(new Date(candidate.date_of_birth), "MMM d, yyyy")}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {candidate.bio && (
                      <div>
                        <h4 className="font-medium mb-2">Biography</h4>
                        <p className="text-muted-foreground whitespace-pre-wrap">{candidate.bio}</p>
                      </div>
                    )}

                    {candidate.manifesto && (
                      <div>
                        <h4 className="font-medium mb-2">Manifesto</h4>
                        <p className="text-muted-foreground whitespace-pre-wrap">{candidate.manifesto}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Contact Info Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {candidate.email && (
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Email</p>
                          <a
                            href={`mailto:${candidate.email}`}
                            className="font-medium text-primary hover:underline"
                          >
                            {candidate.email}
                          </a>
                        </div>
                      </div>
                    )}

                    {candidate.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Phone</p>
                          <p className="font-medium">{candidate.phone}</p>
                        </div>
                      </div>
                    )}

                    {/* Social Links */}
                    {candidate.social_links && Object.keys(candidate.social_links).length > 0 && (
                      <div className="pt-4 border-t">
                        <p className="text-sm text-muted-foreground mb-3">Social Media</p>
                        <div className="flex gap-2">
                          {candidate.social_links.twitter && (
                            <a
                              href={candidate.social_links.twitter.startsWith("http") ? candidate.social_links.twitter : `https://twitter.com/${candidate.social_links.twitter.replace("@", "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-lg hover:bg-muted transition-colors"
                            >
                              <Twitter className="h-5 w-5" />
                            </a>
                          )}
                          {candidate.social_links.facebook && (
                            <a
                              href={candidate.social_links.facebook.startsWith("http") ? candidate.social_links.facebook : `https://facebook.com/${candidate.social_links.facebook}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-lg hover:bg-muted transition-colors"
                            >
                              <Facebook className="h-5 w-5" />
                            </a>
                          )}
                          {candidate.social_links.instagram && (
                            <a
                              href={candidate.social_links.instagram.startsWith("http") ? candidate.social_links.instagram : `https://instagram.com/${candidate.social_links.instagram.replace("@", "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-lg hover:bg-muted transition-colors"
                            >
                              <Instagram className="h-5 w-5" />
                            </a>
                          )}
                          {candidate.social_links.linkedin && (
                            <a
                              href={candidate.social_links.linkedin.startsWith("http") ? candidate.social_links.linkedin : `https://linkedin.com/in/${candidate.social_links.linkedin}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-lg hover:bg-muted transition-colors"
                            >
                              <Linkedin className="h-5 w-5" />
                            </a>
                          )}
                          {candidate.social_links.website && (
                            <a
                              href={candidate.social_links.website.startsWith("http") ? candidate.social_links.website : `https://${candidate.social_links.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-lg hover:bg-muted transition-colors"
                            >
                              <Globe className="h-5 w-5" />
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    {!candidate.email && !candidate.phone && (!candidate.social_links || Object.keys(candidate.social_links).length === 0) && (
                      <p className="text-muted-foreground text-center py-4">
                        No contact information available
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="background" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {candidate.education && candidate.education.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <GraduationCap className="h-5 w-5" />
                        Education
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {candidate.education.map((edu, index) => (
                          <div key={index} className="border-l-2 border-primary pl-4">
                            <p className="font-medium">{edu.degree}</p>
                            <p className="text-sm text-muted-foreground">{edu.institution}</p>
                            {edu.year && <p className="text-sm text-muted-foreground">{edu.year}</p>}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {candidate.experience && Object.keys(candidate.experience).length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Experience
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {Object.entries(candidate.experience).map(([key, value]) => (
                          <div key={key} className="border-l-2 border-primary pl-4">
                            <p className="font-medium capitalize">{key.replace(/_/g, " ")}</p>
                            <p className="text-sm text-muted-foreground">{value}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {candidate.policies && Object.keys(candidate.policies).length > 0 && (
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Policy Positions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(candidate.policies).map(([category, items]) => (
                          <div key={category} className="space-y-2">
                            <h4 className="font-medium capitalize">{category.replace(/_/g, " ")}</h4>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                              {items.map((item, idx) => (
                                <li key={idx}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {candidate.endorsements && candidate.endorsements.length > 0 && (
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle>Endorsements</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {candidate.endorsements.map((endorsement, index) => (
                          <Badge key={index} variant="secondary">
                            {endorsement}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {(!candidate.education || candidate.education.length === 0) &&
                 (!candidate.experience || Object.keys(candidate.experience).length === 0) &&
                 (!candidate.policies || Object.keys(candidate.policies).length === 0) &&
                 (!candidate.endorsements || candidate.endorsements.length === 0) && (
                  <Card className="lg:col-span-2">
                    <CardContent className="text-center py-12">
                      <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No background information available</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="stats" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-primary/10">
                        <Vote className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{candidate.total_elections || 0}</p>
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
                        <p className="text-2xl font-bold">{candidate.total_wins || 0}</p>
                        <p className="text-sm text-muted-foreground">Total Wins</p>
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
                        <p className="text-2xl font-bold">{winRate}%</p>
                        <p className="text-sm text-muted-foreground">Win Rate</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-blue-500/10">
                        <User className="h-6 w-6 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">
                          {candidate.total_votes_received?.toLocaleString() || "0"}
                        </p>
                        <p className="text-sm text-muted-foreground">Total Votes</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {candidate.highest_vote_percentage > 0 && (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground mb-1">Highest Vote Percentage</p>
                    <p className="text-3xl font-bold text-primary">
                      {candidate.highest_vote_percentage.toFixed(1)}%
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="elections" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Vote className="h-5 w-5" />
                    Election History
                  </CardTitle>
                  <CardDescription>
                    Elections this candidate has participated in
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {candidate.election_history && candidate.election_history.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Election</TableHead>
                          <TableHead>Position</TableHead>
                          <TableHead>Result</TableHead>
                          <TableHead>Votes</TableHead>
                          <TableHead>Vote %</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {candidate.election_history.map((history) => (
                          <TableRow key={`${history.election_id}-${history.position_id}`}>
                            <TableCell>
                              <Link
                                href={`/elections/${history.election_id}`}
                                className="font-medium hover:text-primary transition-colors"
                              >
                                {history.election_title}
                              </Link>
                            </TableCell>
                            <TableCell>{history.position_title}</TableCell>
                            <TableCell>
                              <Badge variant={history.is_winner ? "default" : "secondary"}>
                                {history.is_winner ? "Won" : `Rank #${history.rank}`}
                              </Badge>
                            </TableCell>
                            <TableCell>{history.votes_received.toLocaleString()}</TableCell>
                            <TableCell>{history.vote_percentage.toFixed(1)}%</TableCell>
                            <TableCell>
                              {format(new Date(history.election_date), "MMM d, yyyy")}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-12">
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
