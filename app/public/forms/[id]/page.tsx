"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { FormRenderer } from "@/components/form-renderer"
import { formsAPI, responsesAPI } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import type { Form, FormResponseData } from "@/lib/types"
import { Loader, CheckCircle2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { logger } from "@/lib/logger"

export default function PublicFormPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [form, setForm] = useState<Form | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    const fetchForm = async () => {
      try {
        // Use the new public forms endpoint
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/forms/${params.id}`)
        const result = await response.json()

        if (result.success) {
          setForm(result.data)
        } else {
          throw new Error(result.message || "Failed to load form")
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to load form",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchForm()
  }, [params.id, toast])

  const handleSubmit = async (data: FormResponseData, attachments: Record<string, string>) => {
    if (!form) return

    setIsSubmitting(true)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/forms/${form.id}/responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data,
          attachments
        })
      })

      const result = await response.json()

      if (response.status === 429) {
        // Rate limit exceeded
        toast({
          title: "Rate Limit Exceeded",
          description: "Too many submissions. Please try again later.",
          variant: "destructive",
        })
      } else if (result.success) {
        setSubmitted(true)
        toast({
          title: "Success",
          description: "Response submitted successfully",
        })
      } else {
        // Handle validation errors and other API errors
        if (result.errors) {
          const errorMessages = Object.values(result.errors).join(", ")
          toast({
            title: "Validation Error",
            description: errorMessages,
            variant: "destructive",
          })
        } else {
          toast({
            title: "Error",
            description: result.message || "Failed to submit response",
            variant: "destructive",
          })
        }
      }
    } catch (error: any) {
      logger.error("Form submission failed", {
        formId: form.id,
        errorMessage: error.message,
      })

      toast({
        title: "Error",
        description: "Network error. Please check your connection and try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!form) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-xl font-semibold text-foreground mb-2">Form Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The form you're looking for doesn't exist or is not publicly available.
          </p>
          <Button onClick={() => router.push("/")}>Go Home</Button>
        </Card>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="p-12 text-center max-w-md">
          <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Response Submitted!</h2>
          <p className="text-muted-foreground mb-6">Your response has been recorded successfully.</p>
          <Button onClick={() => window.location.reload()}>Submit Another Response</Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <FormRenderer
          formId={form.id}
          formTitle={form.title}
          description={form.description}
          fields={form.schema?.fields || []}
          branding={form.schema?.branding}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          isPublic={true}
        />
      </div>
    </div>
  )
}