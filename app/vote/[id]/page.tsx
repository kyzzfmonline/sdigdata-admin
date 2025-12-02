"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Loader, Vote, CheckCircle, AlertCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { logger } from "@/lib/logger"

interface Candidate {
  id: string
  name: string
  photo_url?: string
  party?: string
  bio?: string
  manifesto?: string
}

interface Position {
  id: string
  title: string
  description?: string
  max_selections: number
  candidates: Candidate[]
}

interface PollOption {
  id: string
  option_text: string
  description?: string
}

interface PublicElection {
  id: string
  title: string
  description?: string
  election_type: string
  voting_method: string
  verification_level: string
  require_national_id: boolean
  require_phone_otp: boolean
  status: string
  start_date: string
  end_date: string
  branding?: {
    header_text?: string
    footer_text?: string
    primary_color?: string
    logo_url?: string
  }
  positions: Position[]
  poll_options: PollOption[]
  total_votes?: number
}

interface VoteReceipt {
  election_id: string
  election_title: string
  votes_cast: number
  confirmation_code: string
}

export default function PublicElectionPage() {
  const params = useParams()
  const { toast } = useToast()
  const [election, setElection] = useState<PublicElection | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasVoted, setHasVoted] = useState(false)
  const [receipt, setReceipt] = useState<VoteReceipt | null>(null)
  const [voterToken, setVoterToken] = useState<string | null>(null)
  const [selections, setSelections] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const abortController = new AbortController()

    const fetchElection = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/public/elections/${params.id}`,
          { signal: abortController.signal }
        )
        const result = await response.json()

        if (result.success) {
          setElection(result.data)
          // For anonymous elections, get a voter token immediately
          if (result.data.verification_level === "anonymous") {
            await getVoterToken()
          }
        } else {
          setError(result.message || "Failed to load election")
        }
      } catch (err: any) {
        if (err.name === "AbortError") return
        setError(err.message || "Failed to load election")
        logger.error("Failed to fetch public election", { error: err, electionId: params.id })
      } finally {
        setIsLoading(false)
      }
    }

    fetchElection()

    return () => {
      abortController.abort()
    }
  }, [params.id])

  const getVoterToken = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/public/elections/${params.id}/verify`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      )
      const result = await response.json()
      if (result.success && result.data?.voter_token) {
        setVoterToken(result.data.voter_token)
      }
    } catch (err) {
      logger.error("Failed to get voter token", { error: err })
    }
  }

  const handleSelectionChange = (positionId: string, candidateId: string) => {
    setSelections(prev => ({
      ...prev,
      [positionId]: candidateId,
    }))
  }

  const handlePollOptionChange = (optionId: string) => {
    setSelections({ poll_option: optionId })
  }

  const handleSubmitVote = async () => {
    if (!election || !voterToken) {
      toast({
        title: "Error",
        description: "Unable to submit vote. Please refresh and try again.",
        variant: "destructive",
      })
      return
    }

    // Build votes array
    const votes: { position_id?: string; candidate_id?: string; poll_option_id?: string }[] = []

    if (election.election_type === "poll") {
      if (selections.poll_option) {
        votes.push({ poll_option_id: selections.poll_option })
      }
    } else {
      for (const position of election.positions) {
        if (selections[position.id]) {
          votes.push({
            position_id: position.id,
            candidate_id: selections[position.id],
          })
        }
      }
    }

    if (votes.length === 0) {
      toast({
        title: "No Selection",
        description: "Please make a selection before submitting.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/public/elections/${election.id}/vote`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            votes,
            voter_token: voterToken,
          }),
        }
      )

      const result = await response.json()

      if (result.success) {
        setHasVoted(true)
        setReceipt(result.data.receipt)
        toast({
          title: "Vote Submitted",
          description: "Your vote has been recorded successfully.",
        })
      } else {
        toast({
          title: "Error",
          description: result.detail?.message || result.detail || result.message || "Failed to submit vote",
          variant: "destructive",
        })
      }
    } catch (err: any) {
      logger.error("Failed to submit vote", { error: err })
      toast({
        title: "Error",
        description: "Network error. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <Loader className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !election) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              Election Not Found
            </CardTitle>
            <CardDescription>
              {error || "The election you're looking for doesn't exist or is not publicly available."}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (election.status !== "active") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Election Not Active
            </CardTitle>
            <CardDescription>
              This election is currently {election.status}. Voting is not available.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (hasVoted && receipt) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900 dark:to-emerald-800 p-4">
        <div className="max-w-lg mx-auto mt-20">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-2xl">Vote Submitted!</CardTitle>
              <CardDescription>
                Your vote has been recorded successfully
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Election</span>
                  <span className="font-medium">{receipt.election_title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Votes Cast</span>
                  <span className="font-medium">{receipt.votes_cast}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Confirmation Code</span>
                  <span className="font-mono font-bold text-primary">{receipt.confirmation_code}</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Save your confirmation code for your records.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const primaryColor = election.branding?.primary_color || "#2563eb"

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div
        className="py-8 px-4 text-white"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="max-w-3xl mx-auto text-center">
          {election.branding?.logo_url && (
            <img
              src={election.branding.logo_url}
              alt="Logo"
              className="h-16 mx-auto mb-4"
            />
          )}
          {election.branding?.header_text && (
            <p className="text-sm opacity-90 mb-2">{election.branding.header_text}</p>
          )}
          <h1 className="text-3xl font-bold">{election.title}</h1>
          {election.description && (
            <p className="mt-2 opacity-90">{election.description}</p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto p-4 space-y-6">
        {/* Poll Options */}
        {election.election_type === "poll" && election.poll_options.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Vote className="w-5 h-5" />
                Make Your Choice
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={selections.poll_option || ""}
                onValueChange={handlePollOptionChange}
              >
                <div className="space-y-3">
                  {election.poll_options.map((option) => (
                    <div
                      key={option.id}
                      className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                      onClick={() => handlePollOptionChange(option.id)}
                    >
                      <RadioGroupItem value={option.id} id={option.id} />
                      <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                        <div className="font-medium">{option.option_text}</div>
                        {option.description && (
                          <div className="text-sm text-muted-foreground">{option.description}</div>
                        )}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        )}

        {/* Election Positions */}
        {election.election_type !== "poll" && election.positions.map((position) => (
          <Card key={position.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Vote className="w-5 h-5" />
                {position.title}
              </CardTitle>
              {position.description && (
                <CardDescription>{position.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={selections[position.id] || ""}
                onValueChange={(value) => handleSelectionChange(position.id, value)}
              >
                <div className="space-y-3">
                  {position.candidates.map((candidate) => (
                    <div
                      key={candidate.id}
                      className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                      onClick={() => handleSelectionChange(position.id, candidate.id)}
                    >
                      <RadioGroupItem value={candidate.id} id={candidate.id} className="mt-1" />
                      <Label htmlFor={candidate.id} className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-3">
                          {candidate.photo_url && (
                            <img
                              src={candidate.photo_url}
                              alt={candidate.name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          )}
                          <div>
                            <div className="font-medium text-lg">{candidate.name}</div>
                            {candidate.party && (
                              <div className="text-sm text-muted-foreground">{candidate.party}</div>
                            )}
                          </div>
                        </div>
                        {candidate.bio && (
                          <p className="mt-2 text-sm text-muted-foreground">{candidate.bio}</p>
                        )}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        ))}

        {/* Submit Button */}
        <div className="flex justify-center pb-8">
          <Button
            size="lg"
            className="px-12"
            onClick={handleSubmitVote}
            disabled={isSubmitting || !voterToken}
            style={{ backgroundColor: primaryColor }}
          >
            {isSubmitting ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Vote className="w-4 h-4 mr-2" />
                Submit Vote
              </>
            )}
          </Button>
        </div>

        {/* Footer */}
        {election.branding?.footer_text && (
          <p className="text-center text-sm text-muted-foreground pb-8">
            {election.branding.footer_text}
          </p>
        )}
      </div>
    </div>
  )
}
