"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { ImageUpload } from "@/components/ui/image-upload"
import {
  useResultSheet,
  useBulkAddEntries,
  useUpdateSheetTotals,
  useSubmitSheet,
} from "@/hooks/collation"
import { collationAPI } from "@/lib/api"
import { toast } from "sonner"
import {
  Save,
  Send,
  User,
  FileImage,
  Calculator,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ResultSheetEntryProps {
  sheetId: string
  electionId: string
  positions: Array<{
    id: string
    title: string
    candidates: Array<{
      id: string
      name: string
      party?: string
      photo_url?: string
    }>
  }>
  pollOptions?: Array<{
    id: string
    option_text: string
  }>
}

const totalsSchema = z.object({
  total_registered_voters: z.coerce.number().min(0).optional(),
  total_votes_cast: z.coerce.number().min(0).optional(),
  total_valid_votes: z.coerce.number().min(0).optional(),
  total_rejected_votes: z.coerce.number().min(0).optional(),
})

type TotalsFormData = z.infer<typeof totalsSchema>

export function ResultSheetEntry({
  sheetId,
  electionId,
  positions,
  pollOptions,
}: ResultSheetEntryProps) {
  const [votes, setVotes] = useState<Record<string, number>>({})
  const [attachments, setAttachments] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)

  const { data: sheet, refetch } = useResultSheet(sheetId)
  const bulkAddEntries = useBulkAddEntries()
  const updateTotals = useUpdateSheetTotals()
  const submitSheet = useSubmitSheet()

  const form = useForm<TotalsFormData>({
    resolver: zodResolver(totalsSchema),
    defaultValues: {
      total_registered_voters: undefined,
      total_votes_cast: undefined,
      total_valid_votes: undefined,
      total_rejected_votes: undefined,
    },
  })

  // Load existing entries
  useEffect(() => {
    if (sheet?.entries_by_position) {
      const existingVotes: Record<string, number> = {}
      Object.values(sheet.entries_by_position).forEach((entries: any[]) => {
        entries.forEach((entry) => {
          if (entry.candidate_id) {
            existingVotes[entry.candidate_id] = entry.votes
          } else if (entry.poll_option_id) {
            existingVotes[`poll_${entry.poll_option_id}`] = entry.votes
          }
        })
      })
      setVotes(existingVotes)
    }

    if (sheet) {
      form.reset({
        total_registered_voters: sheet.total_registered_voters || undefined,
        total_votes_cast: sheet.total_votes_cast || undefined,
        total_valid_votes: sheet.total_valid_votes || undefined,
        total_rejected_votes: sheet.total_rejected_votes || undefined,
      })
    }
  }, [sheet, form])

  // Calculate totals
  const calculatedTotal = Object.values(votes).reduce((sum, v) => sum + (v || 0), 0)

  const handleVoteChange = (candidateId: string, value: string) => {
    const numValue = parseInt(value) || 0
    setVotes((prev) => ({
      ...prev,
      [candidateId]: numValue,
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Build entries array
      const entries: Array<{
        position_id?: string
        candidate_id?: string
        poll_option_id?: string
        votes: number
      }> = []

      // Add candidate votes
      positions.forEach((position) => {
        position.candidates.forEach((candidate) => {
          if (votes[candidate.id] !== undefined) {
            entries.push({
              position_id: position.id,
              candidate_id: candidate.id,
              votes: votes[candidate.id],
            })
          }
        })
      })

      // Add poll option votes
      pollOptions?.forEach((option) => {
        const key = `poll_${option.id}`
        if (votes[key] !== undefined) {
          entries.push({
            poll_option_id: option.id,
            votes: votes[key],
          })
        }
      })

      if (entries.length > 0) {
        await bulkAddEntries.mutateAsync({ sheetId, entries })
      }

      // Save totals
      const totalsData = form.getValues()
      if (
        totalsData.total_registered_voters !== undefined ||
        totalsData.total_votes_cast !== undefined ||
        totalsData.total_valid_votes !== undefined ||
        totalsData.total_rejected_votes !== undefined
      ) {
        await updateTotals.mutateAsync({
          sheetId,
          data: totalsData,
        })
      }

      // Save attachments
      for (const url of attachments) {
        if (url) {
          await collationAPI.addAttachment(sheetId, {
            attachment_type: "pink_sheet",
            file_url: url,
          })
        }
      }

      toast.success("Result sheet saved successfully")
      refetch()
    } catch (error) {
      toast.error("Failed to save result sheet")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSubmit = async () => {
    // First save
    await handleSave()

    // Then submit
    try {
      await submitSheet.mutateAsync(sheetId)
      toast.success("Result sheet submitted for verification")
      refetch()
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to submit result sheet")
    }
  }

  const isEditable = sheet?.status === "draft"
  const hasDiscrepancy =
    calculatedTotal !== (form.watch("total_valid_votes") || 0) &&
    form.watch("total_valid_votes") !== undefined

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{sheet?.polling_station_name || "Result Sheet"}</CardTitle>
              <CardDescription>
                {sheet?.electoral_area_name}, {sheet?.constituency_name},{" "}
                {sheet?.region_name}
              </CardDescription>
            </div>
            <Badge
              variant="secondary"
              className={cn(
                "capitalize",
                sheet?.status === "certified"
                  ? "bg-emerald-100 text-emerald-700"
                  : sheet?.status === "approved"
                  ? "bg-green-100 text-green-700"
                  : sheet?.status === "verified"
                  ? "bg-yellow-100 text-yellow-700"
                  : sheet?.status === "submitted"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-700"
              )}
            >
              {sheet?.status}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Totals Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Vote Totals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <div className="grid gap-4 md:grid-cols-4">
              <FormField
                control={form.control}
                name="total_registered_voters"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Registered Voters</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        disabled={!isEditable}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="total_votes_cast"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Votes Cast</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        disabled={!isEditable}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="total_valid_votes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valid Votes</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        disabled={!isEditable}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="total_rejected_votes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rejected Votes</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        disabled={!isEditable}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </Form>

          {/* Calculated vs Entered */}
          <div className="mt-4 p-3 rounded-lg bg-muted">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Calculated Total (sum of entries):</span>
              <span className="font-bold">{calculatedTotal.toLocaleString()}</span>
            </div>
            {hasDiscrepancy && (
              <div className="flex items-center gap-2 mt-2 text-yellow-600">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm">
                  Calculated total differs from entered valid votes
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Vote Entries by Position */}
      <Accordion type="multiple" defaultValue={positions.map((p) => p.id)}>
        {positions.map((position) => (
          <AccordionItem key={position.id} value={position.id}>
            <Card className="mb-4">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{position.title}</span>
                  <Badge variant="outline">
                    {position.candidates.length} candidates
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {position.candidates.map((candidate, index) => (
                      <div
                        key={candidate.id}
                        className={cn(
                          "flex items-center gap-4 p-3 rounded-lg",
                          index % 2 === 0 ? "bg-muted/50" : ""
                        )}
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={candidate.photo_url} />
                          <AvatarFallback>
                            <User className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{candidate.name}</p>
                          {candidate.party && (
                            <p className="text-sm text-muted-foreground">
                              {candidate.party}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min={0}
                            value={votes[candidate.id] || ""}
                            onChange={(e) =>
                              handleVoteChange(candidate.id, e.target.value)
                            }
                            className="w-24 text-right"
                            placeholder="0"
                            disabled={!isEditable}
                          />
                          <span className="text-sm text-muted-foreground">votes</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </AccordionContent>
            </Card>
          </AccordionItem>
        ))}
      </Accordion>

      {/* Poll Options (if any) */}
      {pollOptions && pollOptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Poll Options</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pollOptions.map((option, index) => (
                <div
                  key={option.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg",
                    index % 2 === 0 ? "bg-muted/50" : ""
                  )}
                >
                  <span className="font-medium">{option.option_text}</span>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      value={votes[`poll_${option.id}`] || ""}
                      onChange={(e) =>
                        handleVoteChange(`poll_${option.id}`, e.target.value)
                      }
                      className="w-24 text-right"
                      placeholder="0"
                      disabled={!isEditable}
                    />
                    <span className="text-sm text-muted-foreground">votes</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Attachments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileImage className="h-5 w-5" />
            Attachments
          </CardTitle>
          <CardDescription>
            Upload pink sheets or other supporting documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Pink Sheet Image</label>
              <ImageUpload
                value={attachments[0] || ""}
                onChange={(url) =>
                  setAttachments((prev) => {
                    const newArr = [...prev]
                    newArr[0] = url
                    return newArr
                  })
                }
                placeholder="Upload pink sheet"
                disabled={!isEditable}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Additional Document</label>
              <ImageUpload
                value={attachments[1] || ""}
                onChange={(url) =>
                  setAttachments((prev) => {
                    const newArr = [...prev]
                    newArr[1] = url
                    return newArr
                  })
                }
                placeholder="Upload additional document"
                disabled={!isEditable}
              />
            </div>
          </div>

          {/* Existing attachments */}
          {sheet?.attachments && (sheet.attachments as any[]).length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">Existing Attachments:</p>
              <div className="flex gap-2 flex-wrap">
                {(sheet.attachments as any[]).map((att: any) => (
                  <a
                    key={att.id}
                    href={att.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    {att.file_name || att.attachment_type}
                  </a>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      {isEditable && (
        <Card>
          <CardFooter className="flex justify-end gap-2 pt-6">
            <Button
              variant="outline"
              onClick={handleSave}
              disabled={isSaving || bulkAddEntries.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                isSaving ||
                bulkAddEntries.isPending ||
                submitSheet.isPending ||
                Object.keys(votes).length === 0
              }
            >
              <Send className="h-4 w-4 mr-2" />
              Submit for Verification
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Read-only notice */}
      {!isEditable && (
        <Card className="bg-muted/50">
          <CardContent className="flex items-center gap-2 py-4">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <span className="text-sm">
              This result sheet has been {sheet?.status} and cannot be edited.
            </span>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
