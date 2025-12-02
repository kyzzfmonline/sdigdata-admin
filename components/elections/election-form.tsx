"use client"

import { useState } from "react"
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
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ImageUpload } from "@/components/ui/image-upload"
import { useCreateElection, useUpdateElection } from "@/hooks/elections"
import { useStore } from "@/lib/store"
import type { Election, CreateElectionInput } from "@/lib/types"

const electionSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  election_type: z.enum(["election", "poll", "survey", "referendum"]),
  voting_method: z.enum(["single_choice", "multi_choice", "ranked_choice"]),
  verification_level: z.enum(["anonymous", "registered", "verified"]),
  require_national_id: z.boolean(),
  require_phone_otp: z.boolean(),
  results_visibility: z.enum(["real_time", "after_close"]),
  show_voter_count: z.boolean(),
  start_date: z.date(),
  end_date: z.date(),
  settings: z.object({
    allow_write_in: z.boolean().optional(),
    randomize_candidates: z.boolean().optional(),
    show_party_affiliation: z.boolean().optional(),
  }).optional(),
  branding: z.object({
    logo_url: z.string().optional(),
    primary_color: z.string().optional(),
    header_text: z.string().optional(),
    footer_text: z.string().optional(),
  }).optional(),
}).refine((data) => data.end_date > data.start_date, {
  message: "End date must be after start date",
  path: ["end_date"],
})

type ElectionFormData = z.infer<typeof electionSchema>

interface ElectionFormProps {
  election?: Election
}

export function ElectionForm({ election }: ElectionFormProps) {
  const router = useRouter()
  const { user } = useStore()
  const createElection = useCreateElection()
  const updateElection = useUpdateElection()
  const [activeTab, setActiveTab] = useState("basic")

  const isEditing = !!election

  const form = useForm<ElectionFormData>({
    resolver: zodResolver(electionSchema),
    defaultValues: election
      ? {
          title: election.title,
          description: election.description || "",
          election_type: election.election_type,
          voting_method: election.voting_method,
          verification_level: election.verification_level,
          require_national_id: election.require_national_id,
          require_phone_otp: election.require_phone_otp,
          results_visibility: election.results_visibility,
          show_voter_count: election.show_voter_count,
          start_date: new Date(election.start_date),
          end_date: new Date(election.end_date),
          settings: election.settings || {},
          branding: election.branding || {},
        }
      : {
          title: "",
          description: "",
          election_type: "election",
          voting_method: "single_choice",
          verification_level: "registered",
          require_national_id: false,
          require_phone_otp: false,
          results_visibility: "after_close",
          show_voter_count: true,
          start_date: new Date(),
          end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
          settings: {
            allow_write_in: false,
            randomize_candidates: true,
            show_party_affiliation: true,
          },
          branding: {},
        },
  })

  const onSubmit = async (data: ElectionFormData) => {
    const electionData: CreateElectionInput = {
      title: data.title,
      description: data.description,
      election_type: data.election_type,
      voting_method: data.voting_method,
      verification_level: data.verification_level,
      require_national_id: data.require_national_id,
      require_phone_otp: data.require_phone_otp,
      results_visibility: data.results_visibility,
      show_voter_count: data.show_voter_count,
      start_date: data.start_date.toISOString(),
      end_date: data.end_date.toISOString(),
      settings: data.settings,
      branding: data.branding,
    }

    if (isEditing && election) {
      updateElection.mutate(
        { id: election.id, data: electionData },
        {
          onSuccess: () => {
            router.push(`/elections/${election.id}`)
          },
        }
      )
    } else {
      createElection.mutate(electionData, {
        onSuccess: (newElection) => {
          router.push(`/elections/${newElection.id}`)
        },
      })
    }
  }

  const electionType = form.watch("election_type")
  const verificationLevel = form.watch("verification_level")

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="voting">Voting Settings</TabsTrigger>
            <TabsTrigger value="verification">Verification</TabsTrigger>
            <TabsTrigger value="branding">Branding</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Set up the essential details for your election
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 2024 Presidential Election" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the purpose of this election..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="election_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="election">Election</SelectItem>
                          <SelectItem value="poll">Poll</SelectItem>
                          <SelectItem value="survey">Survey</SelectItem>
                          <SelectItem value="referendum">Referendum</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Elections have positions and candidates. Polls and surveys have options.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="start_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Start Date</FormLabel>
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
                    name="end_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>End Date</FormLabel>
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
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="voting" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Voting Configuration</CardTitle>
                <CardDescription>
                  Configure how voters will cast their votes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="voting_method"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Voting Method</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="single_choice">Single Choice</SelectItem>
                          <SelectItem value="multi_choice">Multiple Choice</SelectItem>
                          <SelectItem value="ranked_choice">Ranked Choice</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {field.value === "single_choice" && "Voters select one option per position"}
                        {field.value === "multi_choice" && "Voters can select multiple options"}
                        {field.value === "ranked_choice" && "Voters rank options by preference (instant runoff)"}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="results_visibility"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Results Visibility</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select visibility" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="real_time">Real-time (visible during voting)</SelectItem>
                          <SelectItem value="after_close">After Close (hidden until voting ends)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="show_voter_count"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Show Voter Count</FormLabel>
                        <FormDescription>
                          Display the total number of votes cast publicly
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {electionType === "election" && (
                  <>
                    <FormField
                      control={form.control}
                      name="settings.randomize_candidates"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Randomize Candidate Order</FormLabel>
                            <FormDescription>
                              Display candidates in random order for each voter
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="settings.show_party_affiliation"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Show Party Affiliation</FormLabel>
                            <FormDescription>
                              Display party information next to candidates
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="settings.allow_write_in"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Allow Write-in Candidates</FormLabel>
                            <FormDescription>
                              Voters can add their own candidate choices
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="verification" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Voter Verification</CardTitle>
                <CardDescription>
                  Configure how voters are identified and verified
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="verification_level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Verification Level</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="anonymous">Anonymous (no verification)</SelectItem>
                          <SelectItem value="registered">Registered Users Only</SelectItem>
                          <SelectItem value="verified">Verified Identity Required</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {field.value === "anonymous" && "Anyone can vote without authentication"}
                        {field.value === "registered" && "Only logged-in users can vote"}
                        {field.value === "verified" && "Users must verify identity to vote"}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {verificationLevel === "verified" && (
                  <>
                    <FormField
                      control={form.control}
                      name="require_national_id"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Require National ID</FormLabel>
                            <FormDescription>
                              Voters must provide their national identification number
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="require_phone_otp"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Require Phone OTP</FormLabel>
                            <FormDescription>
                              Voters must verify their phone number via SMS code
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="branding" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Branding & Customization</CardTitle>
                <CardDescription>
                  Customize the appearance of your election
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="branding.logo_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Logo</FormLabel>
                      <FormControl>
                        <ImageUpload
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Upload election logo"
                          maxSize={5}
                        />
                      </FormControl>
                      <FormDescription>
                        Organization logo displayed on ballots
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="branding.primary_color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Color</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            className="w-12 h-10 p-1 cursor-pointer"
                            {...field}
                          />
                          <Input
                            placeholder="#006B3F"
                            value={field.value || ""}
                            onChange={field.onChange}
                            className="flex-1"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="branding.header_text"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Header Text</FormLabel>
                      <FormControl>
                        <Input placeholder="Welcome to the election" {...field} />
                      </FormControl>
                      <FormDescription>
                        Custom text displayed at the top of the ballot
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="branding.footer_text"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Footer Text</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Thank you for participating in this election..."
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Text displayed after voting is complete
                      </FormDescription>
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
            onClick={() => router.push("/elections")}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={createElection.isPending || updateElection.isPending}
          >
            {createElection.isPending || updateElection.isPending
              ? "Saving..."
              : isEditing
              ? "Save Changes"
              : "Create Election"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
