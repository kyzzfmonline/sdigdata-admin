"use client"

import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ImageUpload } from "@/components/ui/image-upload"
import { useCreateCandidateProfile, useUpdateCandidateProfile } from "@/hooks/candidates"
import { useParties } from "@/hooks/parties"
import type { CandidateProfile, CreateCandidateProfileInput, CandidateProfileStatus } from "@/lib/types"

const candidateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  date_of_birth: z.date().optional(),
  party_id: z.string().optional(),
  status: z.enum(["active", "inactive", "suspended", "deceased"]),
  photo_url: z.string().optional(),
  email: z.string().email("Must be a valid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  bio: z.string().optional(),
  manifesto: z.string().optional(),
})

type CandidateFormData = z.infer<typeof candidateSchema>

interface CandidateFormProps {
  candidate?: CandidateProfile
}

export function CandidateForm({ candidate }: CandidateFormProps) {
  const router = useRouter()
  const createCandidate = useCreateCandidateProfile()
  const updateCandidate = useUpdateCandidateProfile()
  const { data: partiesData } = useParties({ status: "active" })

  const parties = partiesData?.parties || []
  const isEditing = !!candidate

  const form = useForm<CandidateFormData>({
    resolver: zodResolver(candidateSchema),
    defaultValues: candidate
      ? {
          name: candidate.name,
          date_of_birth: candidate.date_of_birth ? new Date(candidate.date_of_birth) : undefined,
          party_id: candidate.party_id || "",
          status: candidate.status,
          photo_url: candidate.photo_url || "",
          email: candidate.email || "",
          phone: candidate.phone || "",
          bio: candidate.bio || "",
          manifesto: candidate.manifesto || "",
        }
      : {
          name: "",
          date_of_birth: undefined,
          party_id: "",
          status: "active" as CandidateProfileStatus,
          photo_url: "",
          email: "",
          phone: "",
          bio: "",
          manifesto: "",
        },
  })

  const onSubmit = async (data: CandidateFormData) => {
    const candidateData: CreateCandidateProfileInput = {
      name: data.name,
      date_of_birth: data.date_of_birth?.toISOString().split("T")[0],
      party_id: data.party_id || undefined,
      photo_url: data.photo_url || undefined,
      email: data.email || undefined,
      phone: data.phone || undefined,
      bio: data.bio || undefined,
      manifesto: data.manifesto || undefined,
    }

    if (isEditing && candidate) {
      updateCandidate.mutate(
        { id: candidate.id, data: { ...candidateData, status: data.status } },
        {
          onSuccess: () => {
            router.push(`/candidates/${candidate.id}`)
          },
        }
      )
    } else {
      createCandidate.mutate(candidateData, {
        onSuccess: (newCandidate) => {
          router.push(`/candidates/${newCandidate.id}`)
        },
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs defaultValue="basic">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Basic details about the candidate
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., John Dramani Mahama" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="date_of_birth"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Date of Birth</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date > new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="suspended">Suspended</SelectItem>
                            <SelectItem value="deceased">Deceased</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="party_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Political Party</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select party (or leave empty for Independent)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">Independent</SelectItem>
                          {parties.map((party) => (
                            <SelectItem key={party.id} value={party.id}>
                              {party.name} {party.abbreviation ? `(${party.abbreviation})` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Leave empty if the candidate is independent
                      </FormDescription>
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
                      <FormDescription>
                        Official portrait photo of the candidate
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="details" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Contact & Biography</CardTitle>
                <CardDescription>
                  Additional information about the candidate
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="contact@candidate.com" type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="+233 XX XXX XXXX" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Biography</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Brief biography of the candidate..."
                          className="min-h-[120px]"
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
                      <FormLabel>Manifesto</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Campaign manifesto and key policies..."
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-4 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/candidates")}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={createCandidate.isPending || updateCandidate.isPending}
          >
            {createCandidate.isPending || updateCandidate.isPending
              ? "Saving..."
              : isEditing
              ? "Save Changes"
              : "Create Profile"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
