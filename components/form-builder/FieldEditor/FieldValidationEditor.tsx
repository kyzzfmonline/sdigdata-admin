/**
 * Field Validation Editor
 * Advanced validation rules editor
 */

"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Trash2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { FormField } from "@/lib/types"

interface FieldValidationEditorProps {
  field: FormField
  onUpdate: (id: string, updates: Partial<FormField>) => void
}

export function FieldValidationEditor({ field, onUpdate }: FieldValidationEditorProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [regexPattern, setRegexPattern] = useState(field.validation?.pattern || "")
  const [regexError, setRegexError] = useState("")

  // Validate regex pattern
  const validateRegex = (pattern: string) => {
    if (!pattern) {
      setRegexError("")
      return true
    }

    try {
      new RegExp(pattern)
      setRegexError("")
      return true
    } catch (error) {
      setRegexError("Invalid regular expression")
      return false
    }
  }

  const handleRegexChange = (pattern: string) => {
    setRegexPattern(pattern)
    if (validateRegex(pattern)) {
      onUpdate(field.id, {
        validation: {
          ...field.validation,
          pattern: pattern || undefined,
        },
      })
    }
  }

  // Common regex patterns
  const commonPatterns = [
    {
      label: "Email",
      pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
      description: "Valid email address",
    },
    {
      label: "Phone (Ghana)",
      pattern: "^\\+233[0-9]{9}$",
      description: "Ghana phone number (+233XXXXXXXXX)",
    },
    {
      label: "URL",
      pattern: "^https?://[^\\s/$.?#].[^\\s]*$",
      description: "Valid HTTP/HTTPS URL",
    },
    {
      label: "Alphanumeric",
      pattern: "^[a-zA-Z0-9]+$",
      description: "Letters and numbers only",
    },
    {
      label: "Letters Only",
      pattern: "^[a-zA-Z\\s]+$",
      description: "Letters and spaces only",
    },
    {
      label: "Numbers Only",
      pattern: "^[0-9]+$",
      description: "Digits only",
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Validation Rules</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs"
        >
          {showAdvanced ? "Hide" : "Show"} Advanced
        </Button>
      </div>

      {/* Basic Validation Info */}
      <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md">
        <p className="text-xs text-blue-700 dark:text-blue-300">
          <strong>Validation ensures data quality.</strong> Set rules to validate user input before
          submission.
        </p>
      </div>

      {/* Text/Textarea Length Validation */}
      {(field.type === "text" || field.type === "textarea") && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Length Validation</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor={`${field.id}-val-minLength`} className="text-xs">
                Minimum Length
              </Label>
              <Input
                id={`${field.id}-val-minLength`}
                type="number"
                value={field.validation?.minLength ?? ""}
                onChange={(e) =>
                  onUpdate(field.id, {
                    validation: {
                      ...field.validation,
                      minLength: e.target.value ? Number.parseInt(e.target.value) : undefined,
                    },
                  })
                }
                placeholder="No limit"
                className="text-sm"
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${field.id}-val-maxLength`} className="text-xs">
                Maximum Length
              </Label>
              <Input
                id={`${field.id}-val-maxLength`}
                type="number"
                value={field.validation?.maxLength ?? ""}
                onChange={(e) =>
                  onUpdate(field.id, {
                    validation: {
                      ...field.validation,
                      maxLength: e.target.value ? Number.parseInt(e.target.value) : undefined,
                    },
                  })
                }
                placeholder={field.type === "text" ? "255" : "5000"}
                className="text-sm"
                min="1"
              />
            </div>
          </div>
        </div>
      )}

      {/* Number Range Validation */}
      {(field.type === "number" || field.type === "range" || field.type === "rating") && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Range Validation</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor={`${field.id}-val-min`} className="text-xs">
                Minimum Value
              </Label>
              <Input
                id={`${field.id}-val-min`}
                type="number"
                value={field.validation?.min ?? ""}
                onChange={(e) =>
                  onUpdate(field.id, {
                    validation: {
                      ...field.validation,
                      min: e.target.value ? Number.parseInt(e.target.value) : undefined,
                    },
                  })
                }
                placeholder="No limit"
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${field.id}-val-max`} className="text-xs">
                Maximum Value
              </Label>
              <Input
                id={`${field.id}-val-max`}
                type="number"
                value={field.validation?.max ?? ""}
                onChange={(e) =>
                  onUpdate(field.id, {
                    validation: {
                      ...field.validation,
                      max: e.target.value ? Number.parseInt(e.target.value) : undefined,
                    },
                  })
                }
                placeholder="No limit"
                className="text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* Advanced Validation (Pattern Matching) */}
      {showAdvanced &&
        (field.type === "text" || field.type === "textarea" || field.type === "email") && (
          <div className="space-y-3 p-4 border border-border rounded-md bg-muted/30">
            <h4 className="text-sm font-medium">Pattern Matching (Regex)</h4>

            {/* Common Patterns */}
            <div className="space-y-2">
              <Label className="text-xs">Quick Patterns</Label>
              <div className="grid grid-cols-2 gap-2">
                {commonPatterns.map((preset) => (
                  <Button
                    key={preset.label}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleRegexChange(preset.pattern)}
                    className="text-xs justify-start h-auto p-2"
                    title={preset.description}
                  >
                    <div className="text-left">
                      <div className="font-medium">{preset.label}</div>
                      <div className="text-[10px] text-muted-foreground">{preset.description}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            {/* Custom Pattern */}
            <div className="space-y-2">
              <Label htmlFor={`${field.id}-regex`} className="text-xs">
                Custom Pattern (Regular Expression)
              </Label>
              <Textarea
                id={`${field.id}-regex`}
                value={regexPattern}
                onChange={(e) => handleRegexChange(e.target.value)}
                placeholder="^[a-zA-Z0-9]+$"
                className="text-xs font-mono"
                rows={2}
              />
              {regexError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">{regexError}</AlertDescription>
                </Alert>
              )}
              <p className="text-xs text-muted-foreground">
                JavaScript regular expression pattern (without delimiters)
              </p>
            </div>

            {/* Pattern Test */}
            {regexPattern && !regexError && (
              <div className="space-y-2">
                <Label className="text-xs">Test Pattern</Label>
                <Input
                  placeholder="Enter text to test pattern..."
                  className="text-sm"
                  onChange={(e) => {
                    try {
                      const regex = new RegExp(regexPattern)
                      const matches = regex.test(e.target.value)
                      e.target.className = matches
                        ? "text-sm border-green-500"
                        : "text-sm border-red-500"
                    } catch {
                      // Invalid regex
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Border turns green if pattern matches, red if it doesn't
                </p>
              </div>
            )}
          </div>
        )}

      {/* Validation Summary */}
      {(field.validation?.minLength ||
        field.validation?.maxLength ||
        field.validation?.min !== undefined ||
        field.validation?.max !== undefined ||
        field.validation?.pattern) && (
        <div className="p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md">
          <p className="text-xs font-medium text-green-700 dark:text-green-300 mb-2">
            Active Validation Rules:
          </p>
          <ul className="text-xs text-green-700 dark:text-green-300 space-y-1">
            {field.validation?.minLength && (
              <li>• Minimum length: {field.validation.minLength} characters</li>
            )}
            {field.validation?.maxLength && (
              <li>• Maximum length: {field.validation.maxLength} characters</li>
            )}
            {field.validation?.min !== undefined && (
              <li>• Minimum value: {field.validation.min}</li>
            )}
            {field.validation?.max !== undefined && (
              <li>• Maximum value: {field.validation.max}</li>
            )}
            {field.validation?.pattern && <li>• Custom pattern matching enabled</li>}
          </ul>
        </div>
      )}

      {/* Help Text */}
      <div className="p-3 bg-muted/50 rounded-md text-xs text-muted-foreground">
        <p>
          <strong>Tip:</strong> Validation rules help ensure data quality by checking user input
          before submission. Users will see error messages if their input doesn't match the rules.
        </p>
      </div>
    </div>
  )
}
