"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { LayoutWrapper } from "@/components/layout-wrapper"
import { FormRenderer } from "@/components/form-renderer"
import { formsAPI, responsesAPI } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import type { Form, FormResponseData } from "@/lib/types"
import { Loader, CheckCircle2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { logger } from "@/lib/logger"

export default function SubmitFormPage() {
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
        const response = await formsAPI.getById(params.id as string)
        setForm(response.data.data)
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.response?.data?.detail || "Failed to load form",
          variant: "destructive",
        })
        router.push("/agent")
      } finally {
        setIsLoading(false)
      }
    }

    fetchForm()
  }, [params.id, router, toast])

  const handleSubmit = async (data: FormResponseData, attachments: Record<string, string>) => {
    if (!form) return

    setIsSubmitting(true)

    try {
      await responsesAPI.create({
        form_id: form.id,
        data,
        attachments,
      })

      setSubmitted(true)
      toast({
        title: "Success",
        description: "Response submitted successfully",
      })
    } catch (error: any) {
      logger.error("Form submission failed", {
        formId: form.id,
        errorStatus: error.response?.status,
        errorMessage: error.message,
      })

      // Handle validation errors (422)
      if (error.response?.status === 422) {
        const details = error.response?.data?.detail
        if (Array.isArray(details)) {
          const errorMessages = details
            .map((err: any) => `${err.loc.join(".")}: ${err.msg}`)
            .join(", ")
          toast({
            title: "Validation Error",
            description: errorMessages,
            variant: "destructive",
          })
        } else {
          toast({
            title: "Validation Error",
            description: details || "Please check your inputs",
            variant: "destructive",
          })
        }
      } else {
        toast({
          title: "Error",
          description:
            error.response?.data?.detail || "Failed to submit response. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      setIsSubmitting(false)
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

  if (submitted) {
    return (
      <LayoutWrapper>
        <div className="p-8 max-w-2xl mx-auto">
          <Card className="p-12 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">Response Submitted!</h2>
            <p className="text-muted-foreground mb-6">
              Your response has been recorded successfully.
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => router.push("/agent")}>Back to My Forms</Button>
              <Button variant="outline" onClick={() => setSubmitted(false)}>
                Submit Another Response
              </Button>
            </div>
          </Card>
        </div>
      </LayoutWrapper>
    )
  }

  return (
    <LayoutWrapper>
      <div className="p-8">
        <FormRenderer
          formId={form.id}
          formTitle={form.title}
          description={form.description}
          fields={form.schema?.fields || []}
          branding={form.schema?.branding}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </div>
    </LayoutWrapper>
  )
}
