"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ImageUpload } from "@/components/ui/image-upload"
import { CandidateProfileSelector } from "@/components/elections/candidate-profile-selector"
import { Plus, Edit, Trash2, User, UserPlus } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import {
  useCreateCandidate,
  useUpdateCandidate,
  useDeleteCandidate,
} from "@/hooks/elections"
import { useAssignCandidateToElection } from "@/hooks/candidates"
import type { Candidate, CandidateProfile } from "@/lib/types"

const candidateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  party: z.string().optional(),
  bio: z.string().optional(),
  manifesto: z.string().optional(),
  photo_url: z.string().optional(),
  display_order: z.coerce.number().optional(),
})

type CandidateFormData = z.infer<typeof candidateSchema>

interface CandidatesManagerProps {
  electionId: string
  positionId: string
  candidates: Candidate[]
  canEdit: boolean
}

export function CandidatesManager({
  electionId,
  positionId,
  candidates,
  canEdit,
}: CandidatesManagerProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null)
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null)
  const [selectedProfile, setSelectedProfile] = useState<CandidateProfile | null>(null)

  const createCandidate = useCreateCandidate()
  const updateCandidate = useUpdateCandidate()
  const deleteCandidate = useDeleteCandidate()
  const assignCandidate = useAssignCandidateToElection()

  const form = useForm<CandidateFormData>({
    resolver: zodResolver(candidateSchema),
    defaultValues: {
      name: "",
      party: "",
      bio: "",
      manifesto: "",
      photo_url: "",
      display_order: candidates.length + 1,
    },
  })

  // When a candidate profile is selected, populate the form with their data
  const handleProfileSelect = (profileId: string, profile?: CandidateProfile) => {
    setSelectedProfileId(profileId)
    setSelectedProfile(profile || null)

    if (profile) {
      form.reset({
        name: profile.name,
        party: profile.party || profile.party_name || "",
        bio: profile.bio || "",
        manifesto: profile.manifesto || "",
        photo_url: profile.photo_url || "",
        display_order: candidates.length + 1,
      })
    }
  }

  const onSubmit = async (data: CandidateFormData) => {
    const cleanData = {
      ...data,
      photo_url: data.photo_url || undefined,
    }

    if (editingCandidate) {
      // Update existing candidate
      updateCandidate.mutate(
        {
          electionId,
          positionId,
          candidateId: editingCandidate.id,
          data: cleanData,
        },
        {
          onSuccess: () => {
            setEditingCandidate(null)
            form.reset()
          },
        }
      )
    } else if (selectedProfileId && selectedProfile) {
      // Assign a candidate profile to this position
      assignCandidate.mutate(
        {
          candidate_profile_id: selectedProfileId,
          position_id: positionId,
          display_name: data.name !== selectedProfile.name ? data.name : undefined,
          campaign_photo_url: data.photo_url !== selectedProfile.photo_url ? data.photo_url : undefined,
          campaign_manifesto: data.manifesto !== selectedProfile.manifesto ? data.manifesto : undefined,
        },
        {
          onSuccess: () => {
            setIsAddDialogOpen(false)
            setSelectedProfileId(null)
            setSelectedProfile(null)
            form.reset({
              name: "",
              party: "",
              bio: "",
              manifesto: "",
              photo_url: "",
              display_order: candidates.length + 2,
            })
          },
        }
      )
    } else {
      // Create a new candidate directly (legacy fallback)
      createCandidate.mutate(
        {
          electionId,
          positionId,
          data: cleanData,
        },
        {
          onSuccess: () => {
            setIsAddDialogOpen(false)
            form.reset({
              name: "",
              party: "",
              bio: "",
              manifesto: "",
              photo_url: "",
              display_order: candidates.length + 2,
            })
          },
        }
      )
    }
  }

  const handleEdit = (candidate: Candidate) => {
    setEditingCandidate(candidate)
    setSelectedProfileId(null)
    setSelectedProfile(null)
    form.reset({
      name: candidate.name,
      party: candidate.party || "",
      bio: candidate.bio || "",
      manifesto: candidate.manifesto || "",
      photo_url: candidate.photo_url || "",
      display_order: candidate.display_order,
    })
  }

  const handleDelete = (candidateId: string) => {
    if (confirm("Are you sure you want to remove this candidate?")) {
      deleteCandidate.mutate({ electionId, positionId, candidateId })
    }
  }

  const handleCloseDialog = () => {
    setIsAddDialogOpen(false)
    setEditingCandidate(null)
    setSelectedProfileId(null)
    setSelectedProfile(null)
    form.reset()
  }

  const sortedCandidates = [...candidates].sort((a, b) => a.display_order - b.display_order)

  // Get IDs of candidates already in this position (to exclude from selector)
  const existingCandidateIds = candidates.map(c => c.id)

  const isPending = createCandidate.isPending || updateCandidate.isPending || assignCandidate.isPending

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-muted-foreground">Candidates</h4>
        {canEdit && (
          <Dialog open={isAddDialogOpen || !!editingCandidate} onOpenChange={(open) => {
            if (!open) handleCloseDialog()
            else setIsAddDialogOpen(true)
          }}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1">
                <UserPlus className="h-3 w-3" />
                Add Candidate
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingCandidate ? "Edit Candidate" : "Add Candidate"}
                </DialogTitle>
                <DialogDescription>
                  {editingCandidate
                    ? "Update the candidate's information"
                    : "Select an existing candidate or create a new one for this position"}
                </DialogDescription>
              </DialogHeader>

              {/* Candidate Profile Selector - only show when adding new */}
              {!editingCandidate && (
                <div className="space-y-2 pb-4 border-b">
                  <label className="text-sm font-medium">Select Candidate Profile</label>
                  <CandidateProfileSelector
                    value={selectedProfileId || undefined}
                    onChange={handleProfileSelect}
                    placeholder="Search and select a candidate..."
                    excludeIds={existingCandidateIds}
                  />
                  {selectedProfile && (
                    <p className="text-xs text-muted-foreground">
                      Selected candidate's details are pre-filled below. You can customize for this election.
                    </p>
                  )}
                </div>
              )}

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {selectedProfile ? "Display Name (for this election)" : "Full Name"}
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {selectedProfile && (
                    <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                      Party: {selectedProfile.party_name || selectedProfile.party || "Independent"}
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="photo_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {selectedProfile ? "Campaign Photo (optional override)" : "Photo"}
                        </FormLabel>
                        <FormControl>
                          <ImageUpload
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Upload candidate photo"
                            maxSize={5}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Biography</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Brief background about the candidate..."
                            className="min-h-[80px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="manifesto"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {selectedProfile ? "Campaign Manifesto (for this election)" : "Manifesto"}
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Key policies and promises..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={handleCloseDialog}>
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isPending}
                    >
                      {isPending
                        ? "Saving..."
                        : editingCandidate
                        ? "Update"
                        : selectedProfile
                        ? "Add to Position"
                        : "Add Candidate"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {sortedCandidates.length === 0 ? (
        <div className="text-center py-6 text-sm text-muted-foreground">
          No candidates added yet
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {sortedCandidates.map((candidate, index) => (
              <motion.div
                key={candidate.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={candidate.photo_url} alt={candidate.name} />
                        <AvatarFallback>
                          <User className="h-6 w-6" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h5 className="font-medium truncate">{candidate.name}</h5>
                        {candidate.party && (
                          <Badge variant="secondary" className="text-xs mt-1">
                            {candidate.party}
                          </Badge>
                        )}
                        {candidate.bio && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {candidate.bio}
                          </p>
                        )}
                      </div>
                      {canEdit && (
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => handleEdit(candidate)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDelete(candidate.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
