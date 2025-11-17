"use client"

/**
 * Public Form Renderer
 * Renders a form for public users (no authentication required)
 */

import { useState, useEffect } from "react"
import type { FormField } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader, Send, AlertCircle, Save } from "lucide-react"
import { validateFormData, saveDraft, type ValidationResult } from "@/lib/public-form-utils"

interface PublicFormRendererProps {
  fields: FormField[]
  onSubmit: (data: Record<string, any>) => Promise<void>
  initialData?: Record<string, any>
  disabled?: boolean
  showSaveDraft?: boolean
  onSaveDraft?: (data: Record<string, any>) => void
}

export function PublicFormRenderer({
  fields,
  onSubmit,
  initialData = {},
  disabled = false,
  showSaveDraft = true,
  onSaveDraft,
}: PublicFormRendererProps) {
  const [formData, setFormData] = useState<Record<string, any>>(initialData)
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [submitting, setSubmitting] = useState(false)
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  // Update form data when a field changes
  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }))
    setTouched((prev) => ({ ...prev, [fieldId]: true }))

    // Clear error for this field when user starts typing
    if (errors[fieldId]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[fieldId]
        return newErrors
      })
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate all fields
    const validation = validateFormData(fields, formData)

    if (!validation.isValid) {
      setErrors(validation.errors)
      // Scroll to first error
      const firstErrorField = Object.keys(validation.errors)[0]
      const element = document.getElementById(`field-${firstErrorField}`)
      element?.scrollIntoView({ behavior: "smooth", block: "center" })
      return
    }

    setSubmitting(true)
    try {
      await onSubmit(formData)
    } catch (error) {
      console.error("Submission error:", error)
    } finally {
      setSubmitting(false)
    }
  }

  // Handle save draft
  const handleSaveDraft = () => {
    if (onSaveDraft) {
      onSaveDraft(formData)
    }
  }

  // Render individual field
  const renderField = (field: FormField) => {
    const value = formData[field.id]
    const fieldErrors = errors[field.id]
    const hasError = !!fieldErrors && fieldErrors.length > 0

    return (
      <div key={field.id} id={`field-${field.id}`} className="space-y-2">
        <Label htmlFor={field.id} className="flex items-center gap-1">
          {field.label}
          {field.required && <span className="text-destructive">*</span>}
        </Label>

        {field.helpText && (
          <p className="text-sm text-muted-foreground">{field.helpText}</p>
        )}

        {/* Render field based on type */}
        {field.type === "text" && (
          <Input
            id={field.id}
            type="text"
            value={value || ""}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            disabled={disabled}
            className={hasError ? "border-destructive" : ""}
          />
        )}

        {field.type === "email" && (
          <Input
            id={field.id}
            type="email"
            value={value || ""}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            disabled={disabled}
            className={hasError ? "border-destructive" : ""}
          />
        )}

        {field.type === "number" && (
          <Input
            id={field.id}
            type="number"
            value={value || ""}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            min={field.min}
            max={field.max}
            step={field.step}
            disabled={disabled}
            className={hasError ? "border-destructive" : ""}
          />
        )}

        {field.type === "textarea" && (
          <Textarea
            id={field.id}
            value={value || ""}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            disabled={disabled}
            rows={4}
            className={hasError ? "border-destructive" : ""}
          />
        )}

        {field.type === "select" && field.options && (
          <Select
            value={value || ""}
            onValueChange={(val) => handleFieldChange(field.id, val)}
            disabled={disabled}
          >
            <SelectTrigger className={hasError ? "border-destructive" : ""}>
              <SelectValue placeholder={field.placeholder || "Select an option"} />
            </SelectTrigger>
            <SelectContent>
              {field.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {field.type === "radio" && field.options && (
          <RadioGroup
            value={value || ""}
            onValueChange={(val) => handleFieldChange(field.id, val)}
            disabled={disabled}
          >
            {field.options.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={`${field.id}-${option.value}`} />
                <Label htmlFor={`${field.id}-${option.value}`} className="font-normal">
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        )}

        {field.type === "checkbox" && field.options && (
          <div className="space-y-2">
            {field.options.map((option) => {
              const checked = Array.isArray(value) && value.includes(option.value)
              return (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${field.id}-${option.value}`}
                    checked={checked}
                    onCheckedChange={(isChecked) => {
                      const currentValues = Array.isArray(value) ? value : []
                      const newValues = isChecked
                        ? [...currentValues, option.value]
                        : currentValues.filter((v) => v !== option.value)
                      handleFieldChange(field.id, newValues)
                    }}
                    disabled={disabled}
                  />
                  <Label htmlFor={`${field.id}-${option.value}`} className="font-normal">
                    {option.label}
                  </Label>
                </div>
              )
            })}
          </div>
        )}

        {field.type === "date" && (
          <Input
            id={field.id}
            type="date"
            value={value || ""}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            disabled={disabled}
            className={hasError ? "border-destructive" : ""}
          />
        )}

        {/* Show field errors */}
        {hasError && (
          <div className="flex items-start gap-2 text-sm text-destructive">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              {fieldErrors.map((error, idx) => (
                <p key={idx}>{error}</p>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Render all fields */}
      {fields.map((field) => renderField(field))}

      {/* Global validation errors */}
      {Object.keys(errors).length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please fix the errors above before submitting.
          </AlertDescription>
        </Alert>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-3 pt-4">
        <Button
          type="submit"
          disabled={disabled || submitting}
          className="gap-2"
        >
          {submitting ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Submit
            </>
          )}
        </Button>

        {showSaveDraft && !submitting && (
          <Button
            type="button"
            variant="outline"
            onClick={handleSaveDraft}
            disabled={disabled}
            className="gap-2"
          >
            <Save className="w-4 h-4" />
            Save Draft
          </Button>
        )}
      </div>
    </form>
  )
}
