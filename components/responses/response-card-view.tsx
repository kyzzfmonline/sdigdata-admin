"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Eye,
  Trash2,
  Download,
  MapPin,
  Paperclip,
  User,
  Calendar,
  Award,
  Star,
  StarOff,
} from "lucide-react"
import type { FormResponse } from "@/lib/types"
import { formatRelativeTime, formatFullDate } from "@/lib/date-utils"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface ResponseCardViewProps {
  responses: FormResponse[]
  selectedResponses: FormResponse[]
  onToggleSelect: (response: FormResponse) => void
  onView: (response: FormResponse) => void
  onDelete: (response: FormResponse) => void
  formTitlesMap: Record<string, string>
  formData?: any
}

export function ResponseCardView({
  responses,
  selectedResponses,
  onToggleSelect,
  onView,
  onDelete,
  formTitlesMap,
  formData,
}: ResponseCardViewProps) {
  const [starredResponses, setStarredResponses] = useState<Set<string>>(new Set())

  const toggleStar = (responseId: string) => {
    const updated = new Set(starredResponses)
    if (updated.has(responseId)) {
      updated.delete(responseId)
    } else {
      updated.add(responseId)
    }
    setStarredResponses(updated)
  }

  const getQualityBadgeVariant = (score?: number): "success" | "warning" | "destructive" | "secondary" => {
    if (score === undefined || score === null) return "secondary"
    if (score >= 80) return "success"
    if (score >= 60) return "warning"
    return "destructive"
  }

  const hasAttachments = (response: FormResponse) => {
    if (!response.data) return false
    return Object.values(response.data).some(
      (value) =>
        (typeof value === "string" && (value.startsWith("http") || value.includes("."))) ||
        Array.isArray(value)
    )
  }

  const hasLocationData = (response: FormResponse) => {
    if (!response.data) return false
    return Object.values(response.data).some(
      (value) =>
        value &&
        typeof value === "object" &&
        "latitude" in value &&
        "longitude" in value
    )
  }

  const getPreviewFields = (response: FormResponse) => {
    if (!response.data || !formData?.schema?.fields) return []

    const fields = formData.schema.fields.slice(0, 3)
    return fields.map((field) => ({
      label: field.label,
      value: response.data[field.id],
    })).filter((f) => f.value !== undefined && f.value !== null)
  }

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return "-"
    if (typeof value === "boolean") return value ? "Yes" : "No"
    if (Array.isArray(value)) return `${value.length} items`
    if (typeof value === "object") {
      if ("latitude" in value && "longitude" in value) {
        return `${value.latitude.toFixed(4)}, ${value.longitude.toFixed(4)}`
      }
      return "Object"
    }
    const str = String(value)
    return str.length > 50 ? str.substring(0, 50) + "..." : str
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {responses.map((response) => {
        const isSelected = selectedResponses.some((r) => r.id === response.id)
        const isStarred = starredResponses.has(response.id)
        const qualityScore = (response as any).quality_score
        const previewFields = getPreviewFields(response)

        return (
          <Card
            key={response.id}
            className={cn(
              "p-4 transition-all hover:shadow-md cursor-pointer",
              isSelected && "ring-2 ring-primary"
            )}
            onClick={() => onView(response)}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-2 flex-1">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => onToggleSelect(response)}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold truncate" title={formTitlesMap[response.form_id]}>
                    {formTitlesMap[response.form_id] || "Unknown Form"}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {response.id.slice(0, 8)}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 -mt-1"
                onClick={(e) => {
                  e.stopPropagation()
                  toggleStar(response.id)
                }}
              >
                {isStarred ? (
                  <Star className="w-4 h-4 fill-warning text-warning" />
                ) : (
                  <StarOff className="w-4 h-4 text-muted-foreground" />
                )}
              </Button>
            </div>

            {/* Metadata */}
            <div className="space-y-2 mb-3">
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground truncate">
                  {response.submitted_by || "Anonymous"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground" title={formatFullDate(response.submitted_at)}>
                  {formatRelativeTime(response.submitted_at)}
                </span>
              </div>
            </div>

            {/* Preview Fields */}
            {previewFields.length > 0 && (
              <div className="space-y-1.5 mb-3 pb-3 border-b">
                {previewFields.map((field: any, index: number) => (
                  <div key={index} className="text-sm">
                    <span className="text-muted-foreground">{field.label}:</span>{" "}
                    <span className="font-medium">{formatValue(field.value)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Indicators */}
            <div className="flex items-center gap-2 mb-3">
              {qualityScore !== undefined && qualityScore !== null && (
                <Badge variant={getQualityBadgeVariant(qualityScore)} className="flex items-center gap-1">
                  <Award className="w-3 h-3" />
                  {qualityScore.toFixed(0)}%
                </Badge>
              )}
              {hasAttachments(response) && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Paperclip className="w-3 h-3" />
                  Files
                </Badge>
              )}
              {hasLocationData(response) && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  GPS
                </Badge>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={(e) => {
                  e.stopPropagation()
                  onView(response)
                }}
              >
                <Eye className="w-4 h-4 mr-2" />
                View
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(response)
                }}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
