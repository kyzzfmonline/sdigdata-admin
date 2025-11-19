"use client"

import { useState, useEffect, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Sparkles,
  Clock,
  Send,
} from "lucide-react"
import type { Form, FormField, FormResponseData } from "@/lib/types"
import { cn } from "@/lib/utils"
import { FormFieldRenderer } from "./form-field-renderer"
import confetti from "canvas-confetti"

interface BeautifulPublicFormProps {
  form: Form
  onSubmit: (data: FormResponseData, attachments: Record<string, string>) => Promise<void>
  isSubmitting?: boolean
}

export function BeautifulPublicForm({ form, onSubmit, isSubmitting = false }: BeautifulPublicFormProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<FormResponseData>({})
  const [attachments, setAttachments] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [startTime] = useState(Date.now())
  const [elapsedTime, setElapsedTime] = useState(0)

  const branding = form.schema?.branding
  const fields = form.schema?.fields || []
  const primaryColor = branding?.primary_color || "hsl(var(--primary))"

  // Group fields into steps (10 fields per step for long forms)
  const fieldsPerStep = 10
  const steps: FormField[][] = []
  for (let i = 0; i < fields.length; i += fieldsPerStep) {
    steps.push(fields.slice(i, i + fieldsPerStep))
  }

  const currentFields = steps[currentStep] || []
  const totalSteps = steps.length
  const progress = ((currentStep + 1) / totalSteps) * 100

  // Track elapsed time
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [startTime])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleFieldChange = useCallback((fieldId: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }))
    if (errors[fieldId]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[fieldId]
        return newErrors
      })
    }
  }, [errors])

  const handleAttachmentChange = useCallback((fieldId: string, url: string) => {
    setAttachments((prev) => ({ ...prev, [fieldId]: url }))
  }, [])

  const validateCurrentStep = (): boolean => {
    const newErrors: Record<string, string> = {}

    currentFields.forEach((field) => {
      if (field.required) {
        const value = formData[field.id]
        if (value === undefined || value === null || value === "") {
          newErrors[field.id] = "This field is required"
        }
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateCurrentStep()) {
      if (currentStep < totalSteps - 1) {
        setCurrentStep(currentStep + 1)
        window.scrollTo({ top: 0, behavior: "smooth" })
      }
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return

    // Validate all fields
    const allErrors: Record<string, string> = {}
    fields.forEach((field) => {
      if (field.required) {
        const value = formData[field.id]
        if (value === undefined || value === null || value === "") {
          allErrors[field.id] = "This field is required"
        }
      }
    })

    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors)
      // Go to first step with error
      const firstErrorField = Object.keys(allErrors)[0]
      const errorStepIndex = steps.findIndex((step) =>
        step.some((f: FormField) => f.id === firstErrorField)
      )
      if (errorStepIndex !== -1) {
        setCurrentStep(errorStepIndex)
      }
      return
    }

    await onSubmit(formData, attachments)
  }

  const requiredFieldsCount = fields.filter((f) => f.required).length
  const completionPercentage = requiredFieldsCount > 0
    ? Math.round((Object.keys(formData).length / requiredFieldsCount) * 100)
    : 0

  return (
    <div
      className="min-h-screen"
      style={{
        background: branding?.banner_url
          ? `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url(${branding.banner_url})`
          : "linear-gradient(135deg, hsl(var(--primary)/20) 0%, hsl(var(--background)) 100%)"
      }}
    >
      {/* Header */}
      <div className="bg-background/95 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              {branding?.logo_url && (
                <img
                  src={branding.logo_url}
                  alt="Logo"
                  className="h-10 w-auto object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = "none"
                  }}
                />
              )}
              <div>
                <h1 className="text-2xl font-bold" style={{ color: primaryColor }}>
                  {form.title}
                </h1>
                {form.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {form.description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Badge variant="outline" className="flex items-center gap-2">
                <Clock className="w-3 h-3" />
                {formatTime(elapsedTime)}
              </Badge>
              <Badge
                variant={completionPercentage === 100 ? "success" : "secondary"}
                className="flex items-center gap-2"
              >
                {completionPercentage}% Complete
              </Badge>
            </div>
          </div>

          {/* Progress Bar */}
          {totalSteps > 1 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Step {currentStep + 1} of {totalSteps}
                </span>
                <span className="font-medium" style={{ color: primaryColor }}>
                  {Math.round(progress)}%
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </div>
      </div>

      {/* Form Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {branding?.header_text && (
          <Card className="p-6 mb-6 border-l-4" style={{ borderLeftColor: primaryColor }}>
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 mt-0.5" style={{ color: primaryColor }} />
              <p className="text-sm">{branding.header_text}</p>
            </div>
          </Card>
        )}

        <Card className="p-8 shadow-xl">
          <div className="space-y-6">
            {/* Step Indicator for multi-step */}
            {totalSteps > 1 && (
              <div className="flex items-center justify-center gap-2 mb-8">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={cn(
                      "h-2 rounded-full transition-all duration-300",
                      index === currentStep ? "w-12" : "w-2",
                      index <= currentStep ? "bg-primary" : "bg-muted"
                    )}
                    style={index <= currentStep ? { backgroundColor: primaryColor } : {}}
                  />
                ))}
              </div>
            )}

            {/* Current Step Fields */}
            <div className="space-y-6">
              {currentFields.map((field) => (
                <div key={field.id} className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <FormFieldRenderer
                    field={field}
                    value={formData[field.id]}
                    error={errors[field.id]}
                    onChange={(value) => handleFieldChange(field.id, value)}
                    onAttachmentChange={(url) => handleAttachmentChange(field.id, url)}
                    primaryColor={primaryColor}
                  />
                </div>
              ))}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-6 border-t">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>

              {currentStep === totalSteps - 1 ? (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="gap-2"
                  style={{ backgroundColor: primaryColor }}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit Response
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  className="gap-2"
                  style={{ backgroundColor: primaryColor }}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </Card>

        {branding?.footer_text && (
          <Card className="p-4 mt-6 bg-muted/50 text-center text-sm text-muted-foreground">
            {branding.footer_text}
          </Card>
        )}
      </div>
    </div>
  )
}

// Success Page Component
interface SuccessPageProps {
  formTitle: string
  branding?: Form["schema"]["branding"]
  onNewResponse: () => void
}

export function SuccessPage({ formTitle, branding, onNewResponse }: SuccessPageProps) {
  const primaryColor = branding?.primary_color || "hsl(var(--primary))"

  useEffect(() => {
    // Trigger confetti
    const duration = 3000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 }

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min
    }

    const interval = setInterval(function () {
      const timeLeft = animationEnd - Date.now()

      if (timeLeft <= 0) {
        return clearInterval(interval)
      }

      const particleCount = 50 * (timeLeft / duration)

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      })
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      })
    }, 250)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 to-background">
      <Card className="p-12 max-w-2xl w-full text-center shadow-2xl">
        {branding?.logo_url && (
          <img
            src={branding.logo_url}
            alt="Logo"
            className="h-16 w-auto object-contain mx-auto mb-6"
          />
        )}

        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-success/10 mb-6 animate-in zoom-in duration-500">
          <CheckCircle2 className="w-12 h-12 text-success" />
        </div>

        <h1 className="text-4xl font-bold mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
          Response Submitted Successfully!
        </h1>

        <p className="text-lg text-muted-foreground mb-2 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
          Thank you for completing <span className="font-semibold" style={{ color: primaryColor }}>{formTitle}</span>
        </p>

        <p className="text-sm text-muted-foreground mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
          Your response has been recorded and will be reviewed by our team.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
          <Button
            onClick={onNewResponse}
            size="lg"
            style={{ backgroundColor: primaryColor }}
            className="w-full sm:w-auto"
          >
            Submit Another Response
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => window.close()}
            className="w-full sm:w-auto"
          >
            Close
          </Button>
        </div>

        {branding?.footer_text && (
          <p className="text-xs text-muted-foreground mt-8 pt-8 border-t">
            {branding.footer_text}
          </p>
        )}
      </Card>
    </div>
  )
}
