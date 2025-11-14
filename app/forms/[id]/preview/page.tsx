"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { LayoutWrapper } from "@/components/layout-wrapper"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MediaUploader } from "@/components/media-uploader"
import { formsAPI } from "@/lib/api"
import type { Form, FormField } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { Loader } from "lucide-react"

export default function PreviewFormPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [form, setForm] = useState<Form | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [formData, setFormData] = useState<Record<string, any>>({})

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const response = await formsAPI.getById(params.id as string)
        setForm(response.data.data)
        // Initialize form data
        const initialData: Record<string, any> = {}
        response.data.data.schema?.fields?.forEach((field: FormField) => {
          initialData[field.id] = ""
        })
        setFormData(initialData)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load form",
          variant: "destructive",
        })
        router.push("/forms")
      } finally {
        setIsLoading(false)
      }
    }

    fetchForm()
  }, [params.id, router, toast])

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData({ ...formData, [fieldId]: value })
  }

  const renderField = (field: FormField) => {
    const value = formData[field.id]

    switch (field.type) {
      case "text":
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
          />
        )
      case "number":
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            min={field.validation?.min}
            max={field.validation?.max}
          />
        )
      case "date":
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
          />
        )
      case "select":
        return (
          <select
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-md"
          >
            <option value="">Select an option</option>
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )
      case "checkbox":
        return (
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={value}
              onChange={(e) => handleFieldChange(field.id, e.target.checked)}
            />
            <span>{field.label}</span>
          </label>
        )
      case "file":
        return (
          <MediaUploader
            accept={field.accept || "*/*"}
            label="Upload File"
            onUploadSuccess={(url) => handleFieldChange(field.id, url)}
          />
        )
      case "gps":
        return (
          <div className="p-3 border border-border rounded-md bg-muted text-muted-foreground">
            GPS location capture would be enabled on mobile
          </div>
        )
      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <LayoutWrapper>
        <div className="p-8 flex items-center justify-center h-screen">
          <Loader className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      </LayoutWrapper>
    )
  }

  if (!form) {
    return (
      <LayoutWrapper>
        <div className="p-8 text-center">
          <p className="text-muted-foreground">Form not found</p>
        </div>
      </LayoutWrapper>
    )
  }

  return (
    <LayoutWrapper>
      <div className="p-8 max-w-2xl">
        {form?.schema?.branding?.banner_url && (
          <div className="mb-6 rounded-lg overflow-hidden">
            <img
              src={form.schema.branding.banner_url || "/placeholder.svg"}
              alt="Form banner"
              className="w-full h-32 object-cover"
            />
          </div>
        )}

        <div className="mb-6 flex items-center gap-4">
          {form?.schema?.branding?.logo_url && (
            <img
              src={form.schema.branding.logo_url || "/placeholder.svg"}
              alt="Form logo"
              className="h-12 object-contain"
            />
          )}
          <div>
            <h1 className="text-3xl font-bold text-foreground">{form?.title}</h1>
            <p className="text-muted-foreground mt-1">Preview mode</p>
          </div>
        </div>

        <Card
          className="p-8"
          style={
            form?.schema?.branding?.primary_color
              ? { borderColor: form.schema.branding.primary_color }
              : undefined
          }
        >
          <form className="space-y-6">
            {form?.schema?.fields?.map((field) => (
              <div key={field.id}>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {field.label}
                  {field.required && <span className="text-red-600 ml-1">*</span>}
                </label>
                {renderField(field)}
              </div>
            ))}

            <div className="flex gap-3 pt-4">
              <Button onClick={() => router.back()}>Back</Button>
            </div>
          </form>
        </Card>
      </div>
    </LayoutWrapper>
  )
}
