"use client"

import type React from "react"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { MediaUploader } from "@/components/media-uploader"
import { GPSCapture } from "@/components/gps-capture"
import type { FormField, GPSCoordinates, FormResponseData } from "@/lib/types"
import { Loader, Save, Clock } from "lucide-react"
import { z } from "zod"
import { toast } from "@/hooks/use-toast"
import { useAutosave, useDraft } from "@/hooks/use-autosave"

interface FormRendererProps {
  formId: string
  formTitle: string
  description?: string
  fields: FormField[]
  branding?: {
    logo_url?: string
    banner_url?: string
    primary_color?: string
    header_text?: string
    footer_text?: string
  }
  onSubmit: (data: FormResponseData, attachments: Record<string, string>) => Promise<void>
  isSubmitting?: boolean
  isPublic?: boolean
}

export function FormRenderer({
  formId,
  formTitle,
  description,
  fields,
  branding,
  onSubmit,
  isSubmitting = false,
  isPublic = false,
}: FormRendererProps) {
  const [formData, setFormData] = useState<FormResponseData>({})
  const [attachments, setAttachments] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Autosave setup for form responses
  const responseKey = `form-response-${formId}`

  // Check for existing draft response
  const draftResponse = useDraft<{
    formData: FormResponseData
    attachments: Record<string, string>
  }>(responseKey)

  // Load draft response on mount
  useEffect(() => {
    if (draftResponse && !isPublic) {
      setFormData(draftResponse.formData)
      setAttachments(draftResponse.attachments)
      toast({
        title: "Draft Loaded",
        description: "Your previous response has been restored",
      })
    }
  }, [draftResponse, isPublic])

  // Current response data for autosave
  const currentResponseData = { formData, attachments }

  // Autosave hook (only for non-public forms to avoid conflicts)
  const {
    isDirty,
    isSaving: isAutosaving,
    lastSaved,
    clearDraft,
    hasDraft,
  } = useAutosave({
    data: currentResponseData,
    key: responseKey,
    interval: 60000, // 60 seconds (1 minute) for responses
    enabled: !isPublic && Object.keys(formData).length > 0, // Only autosave if not public and there's data
  })

  const handleFieldChange = useCallback(
    (fieldId: string, value: any) => {
      setFormData((prev) => ({ ...prev, [fieldId]: value }))
      // Clear error when user starts typing
      if (errors[fieldId]) {
        setErrors((prev) => ({ ...prev, [fieldId]: "" }))
      }
    },
    [errors]
  )

  const handleFileUpload = useCallback(
    (fieldId: string, fileUrl: string) => {
      setAttachments((prev) => ({ ...prev, [fieldId]: fileUrl }))
      // Clear error when file is uploaded
      if (errors[fieldId]) {
        setErrors((prev) => ({ ...prev, [fieldId]: "" }))
      }
    },
    [errors]
  )

  /**
   * Create Zod schema for a field based on its configuration
   */
  const createFieldSchema = useCallback((field: FormField): z.ZodTypeAny => {
    let schema: z.ZodTypeAny

    switch (field.type) {
      case "text":
      case "textarea":
        schema = z.string()
        if (field.validation?.minLength) {
          schema = (schema as z.ZodString).min(
            field.validation.minLength,
            `${field.label} must be at least ${field.validation.minLength} characters`
          )
        }
        if (field.validation?.maxLength) {
          schema = (schema as z.ZodString).max(
            field.validation.maxLength,
            `${field.label} must be at most ${field.validation.maxLength} characters`
          )
        }
        if (field.validation?.pattern) {
          schema = (schema as z.ZodString).regex(
            new RegExp(field.validation.pattern),
            `${field.label} format is invalid`
          )
        }
        break

      case "email":
        schema = z.string().email(`${field.label} must be a valid email address`)
        break

      case "phone":
        schema = z
          .string()
          .regex(
            /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/,
            `${field.label} must be a valid phone number`
          )
        break

      case "url":
        schema = z.string().url(`${field.label} must be a valid URL`)
        break

      case "number":
      case "range":
      case "rating":
        schema = z.number({
          required_error: `${field.label} is required`,
          invalid_type_error: `${field.label} must be a number`,
        })
        if (field.validation?.min !== undefined || field.min !== undefined) {
          const min = field.validation?.min ?? field.min ?? 0
          schema = (schema as z.ZodNumber).min(min, `${field.label} must be at least ${min}`)
        }
        if (field.validation?.max !== undefined || field.max !== undefined) {
          const max = field.validation?.max ?? field.max ?? 100
          schema = (schema as z.ZodNumber).max(max, `${field.label} must be at most ${max}`)
        }
        break

      case "date":
        schema = z.string().refine((val) => !isNaN(Date.parse(val)), {
          message: `${field.label} must be a valid date`,
        })
        break

      case "select":
        if (field.options && field.options.length > 0) {
          schema = z.enum(field.options as [string, ...string[]], {
            errorMap: () => ({ message: `Please select a valid option for ${field.label}` }),
          })
        } else {
          schema = z.string()
        }
        break

      case "radio":
        // For radio buttons, allow any string if allowOther is enabled, otherwise restrict to options
        if (field.allowOther) {
          schema = z.string().min(1, `${field.label} is required`)
        } else if (field.options && field.options.length > 0) {
          schema = z.enum(field.options as [string, ...string[]], {
            errorMap: () => ({ message: `Please select a valid option for ${field.label}` }),
          })
        } else {
          schema = z.string()
        }
        break

      case "checkbox":
        schema = z
          .array(z.string())
          .min(field.required ? 1 : 0, `${field.label} requires at least one selection`)
        break

      case "gps":
        schema = z.object({
          latitude: z
            .number()
            .min(-90, "Latitude must be between -90 and 90")
            .max(90, "Latitude must be between -90 and 90"),
          longitude: z
            .number()
            .min(-180, "Longitude must be between -180 and 180")
            .max(180, "Longitude must be between -180 and 180"),
          accuracy: z.number().positive("Accuracy must be positive"),
        })
        break

      case "file":
        schema = z.string().url(`${field.label} must be uploaded`)
        break

      case "color":
        schema = z.string().regex(/^#[0-9A-Fa-f]{6}$/, `${field.label} must be a valid color`)
        break

      case "signature":
        schema = z.string().min(1, `${field.label} is required`)
        break

      default:
        schema = z.string()
    }

    // Make field optional if not required
    if (!field.required) {
      schema = schema.optional()
    }

    return schema
  }, [])

  const validateField = useCallback(
    (field: FormField): string | null => {
      const value = field.type === "file" ? attachments[field.id] : formData[field.id]

      try {
        const fieldSchema = createFieldSchema(field)
        fieldSchema.parse(value)
        return null
      } catch (error) {
        if (error instanceof z.ZodError) {
          return error.errors[0]?.message || `${field.label} is invalid`
        }
        return `${field.label} is invalid`
      }
    },
    [attachments, formData, createFieldSchema]
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate all fields
    const newErrors: Record<string, string> = {}
    fields.forEach((field) => {
      const error = validateField(field)
      if (error) {
        newErrors[field.id] = error
      }
    })

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)

      // Show toast notification for validation errors
      toast({
        title: "Validation Error",
        description: `Please fix ${Object.keys(newErrors).length} error${Object.keys(newErrors).length > 1 ? "s" : ""} before submitting`,
        variant: "destructive",
      })

      // Scroll to first error
      const firstErrorField = document.getElementById(`field-${Object.keys(newErrors)[0]}`)
      firstErrorField?.scrollIntoView?.({ behavior: "smooth", block: "center" })
      return
    }

    try {
      await onSubmit(formData, attachments)
      toast({
        title: "Success",
        description: "Form submitted successfully",
        variant: "success",
      })
    } catch (error) {
      toast({
        title: "Submission Failed",
        description:
          error instanceof Error ? error.message : "An error occurred while submitting the form",
        variant: "destructive",
      })
    }
  }

  const renderField = (field: FormField) => {
    const value = formData[field.id]
    const error = errors[field.id]

    switch (field.type) {
      case "text":
        return (
          <Input
            id={field.id}
            type="text"
            value={value || ""}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={`w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:border-gray-500 focus:ring-1 focus:ring-gray-500 transition-colors bg-white ${error ? "border-red-300 focus:border-red-500 focus:ring-red-500" : ""}`}
          />
        )

      case "textarea":
        return (
          <Textarea
            id={field.id}
            value={value || ""}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            rows={4}
            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:border-gray-500 focus:ring-1 focus:ring-gray-500 transition-colors bg-white resize-none ${error ? "border-red-300 focus:border-red-500 focus:ring-red-500" : ""}`}
          />
        )

      case "email":
        return (
          <Input
            id={field.id}
            type="email"
            value={value || ""}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder || "name@example.com"}
            className={`w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:border-gray-500 focus:ring-1 focus:ring-gray-500 transition-colors bg-white ${error ? "border-red-300 focus:border-red-500 focus:ring-red-500" : ""}`}
          />
        )

      case "number":
        return (
          <Input
            id={field.id}
            type="number"
            value={value || ""}
            onChange={(e) =>
              handleFieldChange(field.id, e.target.value ? parseFloat(e.target.value) : "")
            }
            placeholder={field.placeholder}
            min={field.validation?.min}
            max={field.validation?.max}
            className={`w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:border-gray-500 focus:ring-1 focus:ring-gray-500 transition-colors bg-white ${error ? "border-red-300 focus:border-red-500 focus:ring-red-500" : ""}`}
          />
        )

      case "date":
        return (
          <Input
            id={field.id}
            type="date"
            value={value || ""}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            className={`w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:border-gray-500 focus:ring-1 focus:ring-gray-500 transition-colors bg-white ${error ? "border-red-300 focus:border-red-500 focus:ring-red-500" : ""}`}
          />
        )

      case "select":
        return (
          <select
            id={field.id}
            value={value || ""}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            className={`w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:border-gray-500 focus:ring-1 focus:ring-gray-500 transition-colors bg-white ${error ? "border-red-300 focus:border-red-500 focus:ring-red-500" : ""}`}
          >
            <option value="">Select an option</option>
            {field.options?.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        )

      case "radio":
        const isRadioOtherSelected = value && !field.options?.includes(value) && value !== ""
        const radioValue = isRadioOtherSelected ? "other" : value || ""

        return (
          <div className="space-y-3">
            <RadioGroup
              value={radioValue}
              onValueChange={(newValue) => {
                handleFieldChange(field.id, newValue)
              }}
              className="space-y-3"
            >
              {field.options?.map((opt) => (
                <div
                  key={opt}
                  className="flex items-center gap-3 p-3 rounded-md border border-gray-200 hover:border-gray-300 cursor-pointer transition-colors bg-white hover:bg-gray-50"
                >
                  <RadioGroupItem value={opt} id={`${field.id}-${opt}`} />
                  <Label
                    htmlFor={`${field.id}-${opt}`}
                    className="text-sm font-medium text-gray-900 cursor-pointer flex-1"
                  >
                    {opt}
                  </Label>
                </div>
              ))}

              {/* Other option - only show if enabled */}
              {field.allowOther && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-md border border-gray-200 hover:border-gray-300 cursor-pointer transition-colors bg-white hover:bg-gray-50">
                    <RadioGroupItem value="other" id={`${field.id}-other`} />
                    <Label
                      htmlFor={`${field.id}-other`}
                      className="text-sm font-medium text-gray-900 cursor-pointer flex-1"
                    >
                      Other (please specify)
                    </Label>
                  </div>

                  {/* Custom input for "Other" option */}
                  {radioValue === "other" && (
                    <div className="ml-12">
                      <Input
                        type="text"
                        placeholder="Please specify..."
                        value={isRadioOtherSelected && value !== "other" ? value : ""}
                        onChange={(e) => {
                          const customValue = e.target.value.trim()
                          handleFieldChange(field.id, customValue || "other")
                        }}
                        className={`w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:border-gray-500 focus:ring-1 focus:ring-gray-500 transition-colors bg-white ${error ? "border-red-300 focus:border-red-500 focus:ring-red-500" : ""}`}
                      />
                    </div>
                  )}
                </div>
              )}
            </RadioGroup>
          </div>
        )

      case "checkbox":
        const checkboxValues = value || []
        const hasOtherSelected = checkboxValues.some(
          (val: string) => !field.options?.includes(val) && val !== ""
        )
        const otherValue = hasOtherSelected
          ? checkboxValues.find((val: string) => !field.options?.includes(val))
          : ""

        return (
          <div className="space-y-3">
            {field.options?.map((opt) => (
              <Label
                key={opt}
                htmlFor={`${field.id}-${opt}`}
                className="flex items-center gap-3 p-3 rounded-md border border-gray-200 hover:border-gray-300 cursor-pointer transition-colors bg-white hover:bg-gray-50"
              >
                <Checkbox
                  id={`${field.id}-${opt}`}
                  checked={checkboxValues.includes(opt)}
                  onCheckedChange={(checked) => {
                    const currentValues = checkboxValues
                    const newValues = checked
                      ? [...currentValues, opt]
                      : currentValues.filter((v: string) => v !== opt)
                    handleFieldChange(field.id, newValues)
                  }}
                />
                <span className="text-sm font-medium text-gray-900">{opt}</span>
              </Label>
            ))}

            {/* Other option */}
            {field.allowOther && (
              <div className="space-y-3">
                <Label
                  htmlFor={`${field.id}-other`}
                  className="flex items-center gap-3 p-3 rounded-md border border-gray-200 hover:border-gray-300 cursor-pointer transition-colors bg-white hover:bg-gray-50"
                >
                  <Checkbox
                    id={`${field.id}-other`}
                    checked={hasOtherSelected}
                    onCheckedChange={(checked) => {
                      const currentValues = checkboxValues
                      let newValues
                      if (checked) {
                        // Add "other" placeholder, will be replaced when user types
                        newValues = [...currentValues, "other"]
                      } else {
                        // Remove the custom value
                        newValues = currentValues.filter(
                          (v: string) => field.options?.includes(v) || v === ""
                        )
                      }
                      handleFieldChange(field.id, newValues)
                    }}
                  />
                  <span className="text-sm font-medium text-gray-900">Other (please specify)</span>
                </Label>

                {/* Custom input for "Other" option */}
                {hasOtherSelected && (
                  <div className="ml-12">
                    <Input
                      type="text"
                      placeholder="Please specify..."
                      value={otherValue || ""}
                      onChange={(e) => {
                        const currentValues = checkboxValues
                        const filteredValues = currentValues.filter((v: string) =>
                          field.options?.includes(v)
                        )
                        const newValues = e.target.value.trim()
                          ? [...filteredValues, e.target.value]
                          : filteredValues
                        handleFieldChange(field.id, newValues)
                      }}
                      className={`w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:border-gray-500 focus:ring-1 focus:ring-gray-500 transition-colors bg-white ${error ? "border-red-300 focus:border-red-500 focus:ring-red-500" : ""}`}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )

        return (
          <div className="space-y-2">
            {field.options?.map((opt) => (
              <div key={opt} className="relative">
                <Checkbox
                  id={`${field.id}-${opt}`}
                  checked={checkboxValues.includes(opt)}
                  onCheckedChange={(checked) => {
                    const currentValues = checkboxValues
                    const newValues = checked
                      ? [...currentValues, opt]
                      : currentValues.filter((v: string) => v !== opt)
                    handleFieldChange(field.id, newValues)
                  }}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={`${field.id}-${opt}`}
                  className="flex items-center gap-3 p-3 rounded-md border border-border bg-card hover:bg-accent hover:border-accent-foreground/20 cursor-pointer transition-all duration-200 peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:ring-1 peer-checked:ring-primary/20 max-w-md"
                >
                  <div className="w-4 h-4 rounded border-2 border-muted-foreground peer-checked:border-primary peer-checked:bg-primary flex items-center justify-center flex-shrink-0">
                    <div className="w-2 h-2 bg-primary opacity-0 peer-checked:opacity-100 transition-opacity" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{opt}</span>
                </Label>
              </div>
            ))}

            {/* Other option */}
            <div className="relative">
              <Checkbox
                id={`${field.id}-other`}
                checked={hasOtherSelected}
                onCheckedChange={(checked) => {
                  const currentValues = checkboxValues
                  let newValues
                  if (checked) {
                    // Add "other" placeholder, will be replaced when user types
                    newValues = [...currentValues, "other"]
                  } else {
                    // Remove the custom value
                    newValues = currentValues.filter(
                      (v: string) => field.options?.includes(v) || v === ""
                    )
                  }
                  handleFieldChange(field.id, newValues)
                }}
                className="peer sr-only"
              />
              <Label
                htmlFor={`${field.id}-other`}
                className="flex items-center gap-3 p-3 rounded-md border border-border bg-card hover:bg-accent hover:border-accent-foreground/20 cursor-pointer transition-all duration-200 peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:ring-1 peer-checked:ring-primary/20 max-w-md"
              >
                <div className="w-4 h-4 rounded border-2 border-muted-foreground peer-checked:border-primary peer-checked:bg-primary flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 bg-primary opacity-0 peer-checked:opacity-100 transition-opacity" />
                </div>
                <span className="text-sm font-medium text-foreground">Other (please specify)</span>
              </Label>
            </div>

            {/* Custom input for "Other" option */}
            {hasOtherSelected && (
              <div className="ml-7 mt-2">
                <Input
                  type="text"
                  placeholder="Please specify..."
                  value={otherValue || ""}
                  onChange={(e) => {
                    const currentValues = checkboxValues
                    const filteredValues = currentValues.filter((v: string) =>
                      field.options?.includes(v)
                    )
                    const newValues = e.target.value.trim()
                      ? [...filteredValues, e.target.value]
                      : filteredValues
                    handleFieldChange(field.id, newValues)
                  }}
                  className="max-w-md"
                />
              </div>
            )}
          </div>
        )

      case "gps":
        return (
          <GPSCapture
            value={value as GPSCoordinates}
            onCapture={(coords) => handleFieldChange(field.id, coords)}
            required={field.required}
          />
        )

      case "file":
        if (isPublic) {
          return (
            <div className="space-y-2">
              <Label
                htmlFor={field.id}
                className="block text-base font-semibold text-foreground mb-3"
              >
                {field.label}
                {field.required && <span className="text-red-600 ml-1">*</span>}
              </Label>
              <div className="p-4 border-2 border-dashed border-muted-foreground/25 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">
                  File uploads are not available in public forms. Please contact the form
                  administrator for assistance.
                </p>
              </div>
            </div>
          )
        }
        return (
          <MediaUploader
            accept={field.accept || "*/*"}
            label={`Upload ${field.label}`}
            onUploadSuccess={(url) => handleFileUpload(field.id, url)}
            maxSize={5 * 1024 * 1024} // 5MB
          />
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Header Section */}
        <div className="mb-12 text-center">
          {branding?.banner_url && (
            <div className="mb-8 rounded-lg overflow-hidden shadow-sm">
              <img
                src={branding.banner_url}
                alt="Form banner"
                className="w-full h-40 object-cover"
              />
            </div>
          )}

          <div className="max-w-2xl mx-auto">
            {branding?.logo_url && (
              <div className="mb-6 flex justify-center">
                <img src={branding.logo_url} alt="Form logo" className="h-12 object-contain" />
              </div>
            )}
            <h1 className="text-3xl font-semibold text-gray-900 mb-4">{formTitle}</h1>
            {description && <p className="text-lg text-gray-600 leading-relaxed">{description}</p>}
            {branding?.header_text && <p className="text-gray-500 mt-3">{branding.header_text}</p>}
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <form onSubmit={handleSubmit} className="divide-y divide-gray-100">
            {fields.map((field, index) => (
              <div key={field.id} id={`field-${field.id}`} className="px-8 py-8">
                <div className="max-w-2xl mx-auto">
                  <Label
                    htmlFor={field.id}
                    className="block text-lg font-medium text-gray-900 mb-3"
                  >
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  {field.helpText && (
                    <p className="text-gray-600 mb-4 text-sm leading-relaxed">{field.helpText}</p>
                  )}
                  <div className="space-y-3">{renderField(field)}</div>
                  {errors[field.id] && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-700">{errors[field.id]}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Footer Section */}
            {(branding?.footer_text ||
              (!isPublic && (isDirty || isAutosaving || lastSaved || hasDraft))) && (
              <div className="px-8 py-6 bg-gray-50 border-t border-gray-200">
                <div className="max-w-2xl mx-auto">
                  {branding?.footer_text && (
                    <p className="text-gray-600 text-center mb-4">{branding.footer_text}</p>
                  )}

                  {/* Autosave Status for non-public forms */}
                  {!isPublic && (isDirty || isAutosaving || lastSaved || hasDraft) && (
                    <div className="flex items-center justify-center gap-2 text-sm mb-4">
                      {isAutosaving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                          <span className="text-gray-600">Saving draft...</span>
                        </>
                      ) : isDirty ? (
                        <>
                          <Clock className="w-4 h-4 text-orange-500" />
                          <span className="text-orange-600">Unsaved changes</span>
                        </>
                      ) : lastSaved ? (
                        <>
                          <Save className="w-4 h-4 text-green-500" />
                          <span className="text-green-600">
                            Draft saved {lastSaved.toLocaleTimeString()}
                          </span>
                        </>
                      ) : hasDraft ? (
                        <>
                          <Save className="w-4 h-4 text-blue-500" />
                          <span className="text-blue-600">Draft loaded</span>
                        </>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Form Completeness Indicator */}
            <div className="px-8 py-8 bg-gray-50 border-t border-gray-200">
              <div className="max-w-2xl mx-auto">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-medium text-gray-900">Form Progress</span>
                  <span className="text-gray-600 font-medium">
                    {(() => {
                      const requiredFields = fields.filter((f) => f.required)
                      const filledRequiredFields = requiredFields.filter((field) => {
                        const value =
                          field.type === "file" ? attachments[field.id] : formData[field.id]
                        if (field.type === "checkbox") {
                          return Array.isArray(value) && value.length > 0
                        }
                        return value !== undefined && value !== null && value !== ""
                      })
                      return `${filledRequiredFields.length}/${requiredFields.length} required fields completed`
                    })()}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
                  <div
                    className="bg-gray-600 h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${(() => {
                        const requiredFields = fields.filter((f) => f.required)
                        if (requiredFields.length === 0) return 100
                        const filledRequiredFields = requiredFields.filter((field) => {
                          const value =
                            field.type === "file" ? attachments[field.id] : formData[field.id]
                          if (field.type === "checkbox") {
                            return Array.isArray(value) && value.length > 0
                          }
                          return value !== undefined && value !== null && value !== ""
                        })
                        return Math.round(
                          (filledRequiredFields.length / requiredFields.length) * 100
                        )
                      })()}%`,
                    }}
                  />
                </div>
                {Object.keys(errors).length > 0 && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
                    <p className="text-sm text-red-700 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                        <span className="w-2 h-2 bg-red-600 rounded-full" />
                      </span>
                      {Object.keys(errors).length} validation error
                      {Object.keys(errors).length > 1 ? "s" : ""} to fix
                    </p>
                  </div>
                )}

                <div className="flex gap-4 justify-center">
                  {!isPublic && hasDraft && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={clearDraft}
                      className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      Clear Draft
                    </Button>
                  )}
                  <Button
                    type="submit"
                    className="px-8 py-2 bg-gray-900 hover:bg-gray-800 text-white font-medium transition-colors duration-200"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Response"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
