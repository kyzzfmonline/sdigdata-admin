"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { LayoutWrapper } from "@/components/layout-wrapper"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FormRenderer } from "@/components/form-renderer"
import { templatesAPI } from "@/lib/api"
import type { FormTemplate } from "@/lib/types-extended"
import { ArrowLeft, Copy, Loader2, Grid3x3, Tag, Calendar } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

export default function TemplatePreviewPage() {
  const params = useParams()
  const router = useRouter()
  const templateId = params.id as string
  const [localTemplate, setLocalTemplate] = useState<FormTemplate | null>(null)

  // Try to get template from localStorage first (for quick preview)
  useEffect(() => {
    const stored = localStorage.getItem("template-preview")
    if (stored) {
      try {
        const template = JSON.parse(stored)
        if (template.id === templateId) {
          setLocalTemplate(template)
        }
      } catch (e) {
        console.error("Failed to parse template from localStorage", e)
      }
    }
  }, [templateId])

  // Fetch template from API
  const { data: templateData, isLoading } = useQuery({
    queryKey: ["template", templateId],
    queryFn: async () => {
      const response = await templatesAPI.getById(templateId)
      return response.data.data as FormTemplate
    },
  })

  const template = templateData || localTemplate

  const handleUseTemplate = () => {
    if (!template) return
    const title = prompt(`Enter a title for your new form:`, `${template.name} - Copy`)
    if (title) {
      // Navigate to the templates page which will handle the mutation
      router.push(`/templates?use=${template.id}&title=${encodeURIComponent(title)}`)
    }
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      survey: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      registration: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      feedback: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
      inspection: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      health: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      custom: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
    }
    return colors[category] || colors.custom
  }

  if (isLoading && !localTemplate) {
    return (
      <LayoutWrapper>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </LayoutWrapper>
    )
  }

  if (!template) {
    return (
      <LayoutWrapper>
        <div className="p-8">
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold text-foreground mb-4">Template Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The template you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => router.push("/templates")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Templates
            </Button>
          </div>
        </div>
      </LayoutWrapper>
    )
  }

  return (
    <LayoutWrapper>
      <div className="p-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" onClick={() => router.push("/templates")} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Templates
          </Button>

          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={getCategoryColor(template.category)}>{template.category}</Badge>
                {template.is_public && <Badge variant="outline">Public</Badge>}
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-2">{template.name}</h1>
              {template.description && (
                <p className="text-muted-foreground">{template.description}</p>
              )}
            </div>
            <Button onClick={handleUseTemplate} size="lg">
              <Copy className="w-4 h-4 mr-2" />
              Use This Template
            </Button>
          </div>
        </div>

        {/* Template Info */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <Grid3x3 className="w-4 h-4 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium text-foreground">
                    {template.field_count || template.form_schema.fields.length}
                  </div>
                  <div className="text-xs text-muted-foreground">Fields</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Copy className="w-4 h-4 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium text-foreground">{template.usage_count}</div>
                  <div className="text-xs text-muted-foreground">Uses</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium text-foreground">
                    {formatDistanceToNow(new Date(template.created_at))} ago
                  </div>
                  <div className="text-xs text-muted-foreground">Created</div>
                </div>
              </div>
              {template.tags && template.tags.length > 0 && (
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium text-foreground">
                      {template.tags.length}
                    </div>
                    <div className="text-xs text-muted-foreground">Tags</div>
                  </div>
                </div>
              )}
            </div>

            {template.tags && template.tags.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap mt-4 pt-4 border-t">
                {template.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Form Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Template Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/30 rounded-lg p-6">
              <FormRenderer
                formId={template.id}
                formTitle={template.name}
                fields={template.form_schema.fields}
                branding={template.form_schema.branding}
                onSubmit={async (data, attachments) => {
                  console.log("Preview submission:", data, attachments)
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Use Template CTA */}
        <div className="mt-6 text-center">
          <Button onClick={handleUseTemplate} size="lg">
            <Copy className="w-4 h-4 mr-2" />
            Use This Template
          </Button>
        </div>
      </div>
    </LayoutWrapper>
  )
}
