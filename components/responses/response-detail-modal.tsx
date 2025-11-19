"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Award,
  Calendar,
  User,
  Download,
  ExternalLink,
  MapPin,
  FileText,
  Image as ImageIcon,
  Copy,
  Check,
} from "lucide-react"
import type { FormResponse, Form } from "@/lib/types"
import { formatRelativeTime, formatFullDate, isImageUrl, isUrl } from "@/lib/date-utils"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"

interface ResponseDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  response: FormResponse | null
  formData?: Form
}

export function ResponseDetailModal({
  open,
  onOpenChange,
  response,
  formData,
}: ResponseDetailModalProps) {
  const [copiedId, setCopiedId] = useState(false)
  const { toast } = useToast()

  if (!response) return null

  const qualityScore = (response as any).quality_score
  const fieldLabels =
    formData?.schema?.fields?.reduce(
      (acc: Record<string, any>, field: any) => {
        acc[field.id] = {
          label: field.label || field.id,
          type: field.type,
          options: field.options,
        }
        return acc
      },
      {}
    ) || {}

  const handleCopyId = () => {
    navigator.clipboard.writeText(response.id)
    setCopiedId(true)
    setTimeout(() => setCopiedId(false), 2000)
    toast({
      title: "Copied",
      description: "Response ID copied to clipboard",
    })
  }

  const handleExportPDF = () => {
    // TODO: Implement PDF export
    toast({
      title: "Export PDF",
      description: "PDF export will be available soon",
    })
  }

  const getQualityBadgeVariant = (score?: number): "success" | "warning" | "destructive" | "secondary" => {
    if (score === undefined || score === null) return "secondary"
    if (score >= 80) return "success"
    if (score >= 60) return "warning"
    return "destructive"
  }

  const renderFieldValue = (key: string, value: any): React.JSX.Element => {
    const fieldInfo = fieldLabels[key]
    const fieldType = fieldInfo?.type

    // Handle null/undefined
    if (value === null || value === undefined || value === "") {
      return <span className="text-muted-foreground italic">No value provided</span>
    }

    // Handle booleans
    if (typeof value === "boolean") {
      return (
        <Badge variant={value ? "success" : "secondary"} className="font-normal">
          {value ? "Yes" : "No"}
        </Badge>
      )
    }

    // Handle arrays
    if (Array.isArray(value)) {
      // Image array
      if (value.some((v) => typeof v === "string" && isImageUrl(v))) {
        return (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {value.map((url, index) => (
              <div key={index} className="relative group">
                <img
                  src={url}
                  alt={`Image ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg border"
                />
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg"
                >
                  <ExternalLink className="w-6 h-6 text-white" />
                </a>
              </div>
            ))}
          </div>
        )
      }

      // Regular array
      return (
        <div className="space-y-2">
          {value.map((item, index) => (
            <div key={index} className="flex items-start gap-2">
              <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                {index + 1}
              </div>
              <div className="flex-1 bg-muted px-3 py-2 rounded-lg">
                {typeof item === "object" ? renderFieldValue(key, item) : String(item)}
              </div>
            </div>
          ))}
        </div>
      )
    }

    // Handle strings
    if (typeof value === "string") {
      // Image URL
      if (isImageUrl(value)) {
        return (
          <div className="space-y-3">
            <div className="relative group inline-block">
              <img
                src={value}
                alt="Response"
                className="max-h-96 rounded-lg border shadow-sm"
                onError={(e) => {
                  e.currentTarget.style.display = "none"
                  e.currentTarget.nextElementSibling?.classList.remove("hidden")
                }}
              />
              <a
                href={value}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg"
              >
                <ExternalLink className="w-8 h-8 text-white" />
              </a>
            </div>
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              <ImageIcon className="w-3 h-3" />
              Open in new tab
            </a>
          </div>
        )
      }

      // File URL
      if (isUrl(value)) {
        return (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary hover:underline bg-primary/5 px-3 py-2 rounded-lg"
          >
            <FileText className="w-4 h-4" />
            <span className="break-all">{value}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )
      }

      // Date string
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
        return (
          <div className="space-y-1">
            <div className="font-medium">{formatRelativeTime(value)}</div>
            <div className="text-sm text-muted-foreground">{formatFullDate(value)}</div>
          </div>
        )
      }

      // Long text
      if (value.length > 200) {
        return (
          <div className="bg-muted p-4 rounded-lg border">
            <p className="whitespace-pre-wrap">{value}</p>
          </div>
        )
      }

      // Regular string
      return <span className="font-medium">{value}</span>
    }

    // Handle objects
    if (typeof value === "object") {
      // GPS coordinates
      if ("latitude" in value && "longitude" in value) {
        const { latitude, longitude, accuracy } = value
        return (
          <Card className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Latitude</p>
                <p className="font-mono font-semibold">{latitude.toFixed(6)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Longitude</p>
                <p className="font-mono font-semibold">{longitude.toFixed(6)}</p>
              </div>
            </div>
            {accuracy && (
              <div>
                <p className="text-sm text-muted-foreground">Accuracy</p>
                <p className="font-semibold">{accuracy.toFixed(2)}m</p>
              </div>
            )}
            <Separator />
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm" className="flex-1">
                <a
                  href={`https://www.google.com/maps?q=${latitude},${longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  View on Google Maps
                </a>
              </Button>
              <Button asChild variant="outline" size="sm" className="flex-1">
                <a
                  href={`https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}&zoom=15`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  View on OSM
                </a>
              </Button>
            </div>
          </Card>
        )
      }

      // Generic object
      return (
        <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto border font-mono">
          {JSON.stringify(value, null, 2)}
        </pre>
      )
    }

    // Numbers
    return <span className="font-semibold">{String(value)}</span>
  }

  const groupedFields = formData?.schema?.fields?.reduce(
    (acc: Record<string, any[]>, field: any) => {
      const group = field.group || "General"
      if (!acc[group]) acc[group] = []
      acc[group].push(field)
      return acc
    },
    {}
  ) || { General: [] }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl">Response Details</DialogTitle>
          <DialogDescription>
            Complete submission from {response.submitted_by || "Anonymous"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <Tabs defaultValue="data" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="data">Response Data</TabsTrigger>
              <TabsTrigger value="metadata">Metadata</TabsTrigger>
            </TabsList>

            <TabsContent value="data" className="space-y-6 mt-6">
              {/* Header Card */}
              <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold">{formData?.title || "Unknown Form"}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Submitted {formatRelativeTime(response.submitted_at)}
                    </p>
                  </div>
                  {qualityScore !== undefined && qualityScore !== null && (
                    <Badge variant={getQualityBadgeVariant(qualityScore)} className="text-lg px-4 py-2">
                      <Award className="w-5 h-5 mr-2" />
                      {qualityScore.toFixed(0)}% Quality
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <code className="bg-background px-3 py-1 rounded border text-xs">
                    {response.id.slice(0, 16)}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyId}
                    className="h-8 w-8 p-0"
                  >
                    {copiedId ? (
                      <Check className="w-4 h-4 text-success" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </Card>

              {/* Field Groups */}
              {Object.entries(groupedFields).map(([group, fields]) => (
                <div key={group} className="space-y-4">
                  <h4 className="text-lg font-semibold text-primary">{group}</h4>
                  <div className="space-y-4">
                    {fields.map((field: any) => {
                      const value = response.data[field.id]
                      if (value === undefined || value === null) return null

                      return (
                        <Card key={field.id} className="p-6">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <h5 className="font-semibold text-foreground">{field.label}</h5>
                              {field.required && (
                                <Badge variant="outline" className="ml-2">
                                  Required
                                </Badge>
                              )}
                            </div>
                            {field.description && (
                              <p className="text-sm text-muted-foreground">{field.description}</p>
                            )}
                            <div className="pt-2">{renderFieldValue(field.id, value)}</div>
                          </div>
                        </Card>
                      )
                    })}
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="metadata" className="space-y-4 mt-6">
              <Card className="p-6">
                <h4 className="font-semibold mb-4">Submission Information</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Submitted By</p>
                      <p className="font-medium">{response.submitted_by || "Anonymous"}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Submission Time</p>
                      <p className="font-medium">{formatFullDate(response.submitted_at)}</p>
                      <p className="text-sm text-muted-foreground">{formatRelativeTime(response.submitted_at)}</p>
                    </div>
                  </div>
                  {(response as any).duration_seconds && (
                    <>
                      <Separator />
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Completion Time</p>
                          <p className="font-medium">
                            {Math.floor((response as any).duration_seconds / 60)} minutes{" "}
                            {(response as any).duration_seconds % 60} seconds
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </Card>

              {(response as any).metadata && (
                <Card className="p-6">
                  <h4 className="font-semibold mb-4">Technical Metadata</h4>
                  <pre className="text-xs bg-muted p-4 rounded overflow-x-auto">
                    {JSON.stringify((response as any).metadata, null, 2)}
                  </pre>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex items-center justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleExportPDF}>
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
