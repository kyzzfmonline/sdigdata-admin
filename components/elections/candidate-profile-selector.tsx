"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Check, ChevronsUpDown, Plus, Search, User, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ImageUpload } from "@/components/ui/image-upload"
import { PartySelector } from "@/components/ui/party-selector"
import { useCandidateProfiles, useCreateCandidateProfile } from "@/hooks/candidates"
import { useParties } from "@/hooks/parties"
import type { CandidateProfile } from "@/lib/types"

const quickCreateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  party_id: z.string().optional(),
  photo_url: z.string().optional(),
  bio: z.string().optional(),
})

type QuickCreateFormData = z.infer<typeof quickCreateSchema>

interface CandidateProfileSelectorProps {
  value?: string
  onChange: (candidateId: string, candidate?: CandidateProfile) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  excludeIds?: string[] // Candidates to exclude (already assigned)
}

export function CandidateProfileSelector({
  value,
  onChange,
  placeholder = "Select candidate",
  disabled = false,
  className,
  excludeIds = [],
}: CandidateProfileSelectorProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [partyFilter, setPartyFilter] = useState<string | undefined>()
  const [showQuickCreate, setShowQuickCreate] = useState(false)

  const { data: candidatesData, isLoading } = useCandidateProfiles({
    search: searchQuery || undefined,
    party: partyFilter,
    status: "active",
    limit: 50,
  })
  const { data: partiesData } = useParties({ status: "active" })
  const createCandidateProfile = useCreateCandidateProfile()

  const candidates = candidatesData?.profiles || []
  const parties = partiesData?.parties || []

  // Filter out excluded candidates
  const availableCandidates = candidates.filter(
    (c) => !excludeIds.includes(c.id)
  )

  // Find selected candidate for display
  const selectedCandidate = candidates.find((c) => c.id === value)

  const form = useForm<QuickCreateFormData>({
    resolver: zodResolver(quickCreateSchema),
    defaultValues: {
      name: "",
      party_id: "",
      photo_url: "",
      bio: "",
    },
  })

  const handleQuickCreate = async (data: QuickCreateFormData) => {
    // Get the party name from the selected party
    const selectedParty = parties.find((p) => p.id === data.party_id)

    createCandidateProfile.mutate(
      {
        name: data.name,
        party_id: data.party_id || undefined,
        party: selectedParty?.name,
        photo_url: data.photo_url || undefined,
        bio: data.bio || undefined,
      },
      {
        onSuccess: (newCandidate) => {
          setShowQuickCreate(false)
          form.reset()
          // Automatically select the newly created candidate
          onChange(newCandidate.id, newCandidate)
          setOpen(false)
        },
      }
    )
  }

  const handleSelect = (candidate: CandidateProfile) => {
    onChange(candidate.id, candidate)
    setOpen(false)
    setSearchQuery("")
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("w-full justify-between", className)}
            disabled={disabled || isLoading}
          >
            {selectedCandidate ? (
              <div className="flex items-center gap-2 truncate">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={selectedCandidate.photo_url} alt={selectedCandidate.name} />
                  <AvatarFallback>
                    <User className="h-3 w-3" />
                  </AvatarFallback>
                </Avatar>
                <span className="truncate">{selectedCandidate.name}</span>
                {selectedCandidate.party_name && (
                  <Badge variant="secondary" className="text-xs">
                    {selectedCandidate.party_abbreviation || selectedCandidate.party_name}
                  </Badge>
                )}
              </div>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command shouldFilter={false}>
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <input
                placeholder="Search candidates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <CommandList>
              {isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : availableCandidates.length === 0 ? (
                <CommandEmpty>
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">No candidates found</p>
                    <Button
                      variant="link"
                      size="sm"
                      className="mt-2"
                      onClick={() => {
                        setShowQuickCreate(true)
                        setOpen(false)
                      }}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Create new candidate
                    </Button>
                  </div>
                </CommandEmpty>
              ) : (
                <>
                  <CommandGroup heading="Available Candidates">
                    {availableCandidates.map((candidate) => (
                      <CommandItem
                        key={candidate.id}
                        value={candidate.id}
                        onSelect={() => handleSelect(candidate)}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={candidate.photo_url} alt={candidate.name} />
                            <AvatarFallback>
                              <User className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col min-w-0">
                            <span className="font-medium truncate">{candidate.name}</span>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {candidate.party_name && (
                                <span className="truncate">
                                  {candidate.party_abbreviation || candidate.party_name}
                                </span>
                              )}
                              {candidate.total_elections > 0 && (
                                <span>• {candidate.total_elections} elections</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Check
                          className={cn(
                            "ml-2 h-4 w-4",
                            value === candidate.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  <CommandSeparator />
                </>
              )}
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    setShowQuickCreate(true)
                    setOpen(false)
                  }}
                  className="cursor-pointer"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  <span>Create new candidate</span>
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Quick Create Dialog */}
      <Dialog open={showQuickCreate} onOpenChange={setShowQuickCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Candidate</DialogTitle>
            <DialogDescription>
              Quickly create a new candidate profile. You can add more details later.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleQuickCreate)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter candidate name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="party_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Party Affiliation</FormLabel>
                    <FormControl>
                      <PartySelector
                        value={field.value}
                        onChange={(partyId) => field.onChange(partyId)}
                        placeholder="Select party (optional)"
                        showIndependent={true}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="photo_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Photo</FormLabel>
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
                    <FormLabel>Brief Bio (Optional)</FormLabel>
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

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowQuickCreate(false)
                    form.reset()
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createCandidateProfile.isPending}
                >
                  {createCandidateProfile.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create & Select"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  )
}
