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
import { useCreateParty, useUpdateParty } from "@/hooks/parties"
import type { PoliticalParty, CreatePartyInput, PartyStatus } from "@/lib/types"

const partySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  abbreviation: z.string().optional(),
  description: z.string().optional(),
  slogan: z.string().optional(),
  founded_date: z.date().optional(),
  status: z.enum(["active", "inactive", "suspended", "dissolved"]),
  logo_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  color_primary: z.string().optional(),
  color_secondary: z.string().optional(),
  website: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  headquarters_address: z.string().optional(),
  email: z.string().email("Must be a valid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  leader_name: z.string().optional(),
  registration_number: z.string().optional(),
})

type PartyFormData = z.infer<typeof partySchema>

interface PartyFormProps {
  party?: PoliticalParty
}

export function PartyForm({ party }: PartyFormProps) {
  const router = useRouter()
  const createParty = useCreateParty()
  const updateParty = useUpdateParty()

  const isEditing = !!party

  const form = useForm<PartyFormData>({
    resolver: zodResolver(partySchema),
    defaultValues: party
      ? {
          name: party.name,
          abbreviation: party.abbreviation || "",
          description: party.description || "",
          slogan: party.slogan || "",
          founded_date: party.founded_date ? new Date(party.founded_date) : undefined,
          status: party.status,
          logo_url: party.logo_url || "",
          color_primary: party.color_primary || "",
          color_secondary: party.color_secondary || "",
          website: party.website || "",
          headquarters_address: party.headquarters_address || "",
          email: party.email || "",
          phone: party.phone || "",
          leader_name: party.leader_name || "",
          registration_number: party.registration_number || "",
        }
      : {
          name: "",
          abbreviation: "",
          description: "",
          slogan: "",
          founded_date: undefined,
          status: "active" as PartyStatus,
          logo_url: "",
          color_primary: "#006B3F",
          color_secondary: "#FFD700",
          website: "",
          headquarters_address: "",
          email: "",
          phone: "",
          leader_name: "",
          registration_number: "",
        },
  })

  const onSubmit = async (data: PartyFormData) => {
    const baseData: CreatePartyInput = {
      name: data.name,
      abbreviation: data.abbreviation || undefined,
      description: data.description || undefined,
      slogan: data.slogan || undefined,
      founded_date: data.founded_date?.toISOString().split("T")[0],
      logo_url: data.logo_url || undefined,
      color_primary: data.color_primary || undefined,
      color_secondary: data.color_secondary || undefined,
      website: data.website || undefined,
      headquarters_address: data.headquarters_address || undefined,
      email: data.email || undefined,
      phone: data.phone || undefined,
      leader_name: data.leader_name || undefined,
      registration_number: data.registration_number || undefined,
    }

    if (isEditing && party) {
      updateParty.mutate(
        { id: party.id, data: { ...baseData, status: data.status } },
        {
          onSuccess: () => {
            router.push(`/parties/${party.id}`)
          },
        }
      )
    } else {
      createParty.mutate(baseData, {
        onSuccess: (newParty) => {
          router.push(`/parties/${newParty.id}`)
        },
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs defaultValue="basic">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="branding">Branding</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Party Information</CardTitle>
                <CardDescription>
                  Basic details about the political party
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Party Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., National Democratic Congress" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="abbreviation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Abbreviation</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., NDC" className="font-mono uppercase" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="slogan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slogan</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Together We Build" {...field} />
                      </FormControl>
                      <FormDescription>
                        Party's motto or campaign slogan
                      </FormDescription>
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
                          placeholder="Brief description of the party's history, values, and objectives..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="founded_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Founded Date</FormLabel>
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
                            <SelectItem value="dissolved">Dissolved</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="leader_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Party Leader</FormLabel>
                        <FormControl>
                          <Input placeholder="Name of current party leader" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="registration_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Registration Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Official registration number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="branding" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Branding & Identity</CardTitle>
                <CardDescription>
                  Visual identity and branding elements
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="logo_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Logo URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/logo.png" {...field} />
                      </FormControl>
                      <FormDescription>
                        URL to the party's official logo
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="color_primary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primary Color</FormLabel>
                        <FormControl>
                          <div className="flex gap-2">
                            <Input
                              type="color"
                              className="w-12 h-10 p-1 cursor-pointer"
                              value={field.value || "#006B3F"}
                              onChange={field.onChange}
                            />
                            <Input
                              placeholder="#006B3F"
                              value={field.value || ""}
                              onChange={field.onChange}
                              className="flex-1 font-mono"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="color_secondary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Secondary Color</FormLabel>
                        <FormControl>
                          <div className="flex gap-2">
                            <Input
                              type="color"
                              className="w-12 h-10 p-1 cursor-pointer"
                              value={field.value || "#FFD700"}
                              onChange={field.onChange}
                            />
                            <Input
                              placeholder="#FFD700"
                              value={field.value || ""}
                              onChange={field.onChange}
                              className="flex-1 font-mono"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Color Preview */}
                {(form.watch("color_primary") || form.watch("color_secondary")) && (
                  <div className="mt-4 p-4 rounded-lg border">
                    <p className="text-sm text-muted-foreground mb-2">Color Preview</p>
                    <div className="flex gap-2">
                      <div
                        className="w-16 h-16 rounded-lg border"
                        style={{ backgroundColor: form.watch("color_primary") || "#006B3F" }}
                      />
                      <div
                        className="w-16 h-16 rounded-lg border"
                        style={{ backgroundColor: form.watch("color_secondary") || "#FFD700" }}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>
                  How to reach the party headquarters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input placeholder="https://www.party.org" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="headquarters_address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Headquarters Address</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="123 Party Street, Accra, Ghana"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Email</FormLabel>
                        <FormControl>
                          <Input placeholder="info@party.org" type="email" {...field} />
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
                        <FormLabel>Contact Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="+233 XX XXX XXXX" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-4 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/parties")}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={createParty.isPending || updateParty.isPending}
          >
            {createParty.isPending || updateParty.isPending
              ? "Saving..."
              : isEditing
              ? "Save Changes"
              : "Register Party"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
