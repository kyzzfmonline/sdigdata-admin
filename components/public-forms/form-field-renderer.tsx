"use client"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { MediaUploader } from "@/components/media-uploader"
import { GPSCapture } from "@/components/gps-capture"
import type { FormField } from "@/lib/types"
import { AlertCircle, CheckCircle2, HelpCircle, Star } from "lucide-react"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface FormFieldRendererProps {
  field: FormField
  value: any
  error?: string
  onChange: (value: any) => void
  onAttachmentChange?: (url: string) => void
  primaryColor?: string
}

export function FormFieldRenderer({
  field,
  value,
  error,
  onChange,
  onAttachmentChange,
  primaryColor = "hsl(var(--primary))",
}: FormFieldRendererProps) {
  const hasValue = value !== undefined && value !== null && value !== ""
  const showSuccess = hasValue && !error && field.required

  const renderLabel = () => (
    <div className="flex items-center gap-2 mb-2">
      <Label htmlFor={field.id} className="text-base font-medium">
        {field.label}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {field.helpText && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <HelpCircle className="w-4 h-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-sm">{field.helpText}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  )

  const renderValidationFeedback = () => {
    if (error) {
      return (
        <div className="flex items-center gap-2 mt-2 text-destructive text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )
    }

    if (showSuccess) {
      return (
        <div className="flex items-center gap-2 mt-2 text-success text-sm">
          <CheckCircle2 className="w-4 h-4" />
          <span>Looks good!</span>
        </div>
      )
    }

    return null
  }

  const fieldClassName = cn(
    "transition-all duration-200",
    error && "border-destructive focus-visible:ring-destructive",
    showSuccess && "border-success focus-visible:ring-success"
  )

  // Text-based fields
  if (
    field.type === "text" ||
    field.type === "email" ||
    field.type === "phone" ||
    field.type === "url"
  ) {
    return (
      <div>
        {renderLabel()}
        <Input
          id={field.id}
          type={field.type === "email" ? "email" : field.type === "phone" ? "tel" : field.type === "url" ? "url" : "text"}
          placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className={fieldClassName}
          style={showSuccess ? { borderColor: primaryColor } : {}}
        />
        {renderValidationFeedback()}
      </div>
    )
  }

  // Long text (textarea)
  if (field.type === "textarea") {
    return (
      <div>
        {renderLabel()}
        <Textarea
          id={field.id}
          placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          rows={6}
          className={fieldClassName}
          style={showSuccess ? { borderColor: primaryColor } : {}}
        />
        {renderValidationFeedback()}
      </div>
    )
  }

  // Number
  if (field.type === "number") {
    return (
      <div>
        {renderLabel()}
        <Input
          id={field.id}
          type="number"
          placeholder={field.placeholder || "Enter number..."}
          value={value || ""}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
          className={fieldClassName}
          style={showSuccess ? { borderColor: primaryColor } : {}}
        />
        {renderValidationFeedback()}
      </div>
    )
  }

  // Select
  if (field.type === "select") {
    const options = field.options || []
    return (
      <div>
        {renderLabel()}
        <Select value={value || ""} onValueChange={onChange}>
          <SelectTrigger className={fieldClassName} style={showSuccess ? { borderColor: primaryColor } : {}}>
            <SelectValue placeholder={field.placeholder || "Select an option..."} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {renderValidationFeedback()}
      </div>
    )
  }

  // Radio
  if (field.type === "radio") {
    const options = field.options || []
    return (
      <div>
        {renderLabel()}
        <RadioGroup value={value || ""} onValueChange={onChange} className="space-y-3">
          {options.map((option) => (
            <div
              key={option.value}
              className={cn(
                "flex items-center space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer hover:bg-accent",
                value === option.value && "border-primary bg-accent"
              )}
              style={value === option.value ? { borderColor: primaryColor } : {}}
              onClick={() => onChange(option.value)}
            >
              <RadioGroupItem value={option.value} id={`${field.id}-${option.value}`} />
              <Label
                htmlFor={`${field.id}-${option.value}`}
                className="flex-1 cursor-pointer font-normal"
              >
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
        {renderValidationFeedback()}
      </div>
    )
  }

  // Checkbox (multiple options)
  if (field.type === "checkbox") {
    const options = field.options

    if (!options || options.length === 0) {
      // Single checkbox
      return (
        <div>
          <div
            className={cn(
              "flex items-center space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer hover:bg-accent",
              value && "border-primary bg-accent"
            )}
            style={value ? { borderColor: primaryColor } : {}}
            onClick={() => onChange(!value)}
          >
            <Checkbox
              id={field.id}
              checked={!!value}
              onCheckedChange={onChange}
            />
            <Label htmlFor={field.id} className="flex-1 cursor-pointer font-medium">
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
          </div>
          {renderValidationFeedback()}
        </div>
      )
    }

    // Multi-checkbox
    const selectedValues = Array.isArray(value) ? value : []
    return (
      <div>
        {renderLabel()}
        <div className="space-y-3">
          {options.map((option) => {
            const isChecked = selectedValues.includes(option.value)
            return (
              <div
                key={option.value}
                className={cn(
                  "flex items-center space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer hover:bg-accent",
                  isChecked && "border-primary bg-accent"
                )}
                style={isChecked ? { borderColor: primaryColor } : {}}
                onClick={() => {
                  const newValue = isChecked
                    ? selectedValues.filter((v) => v !== option.value)
                    : [...selectedValues, option.value]
                  onChange(newValue)
                }}
              >
                <Checkbox
                  id={`${field.id}-${option.value}`}
                  checked={isChecked}
                  onCheckedChange={(checked) => {
                    const newValue = checked
                      ? [...selectedValues, option.value]
                      : selectedValues.filter((v) => v !== option.value)
                    onChange(newValue)
                  }}
                />
                <Label
                  htmlFor={`${field.id}-${option.value}`}
                  className="flex-1 cursor-pointer font-normal"
                >
                  {option.label}
                </Label>
              </div>
            )
          })}
        </div>
        {renderValidationFeedback()}
      </div>
    )
  }

  // Date
  if (field.type === "date") {
    return (
      <div>
        {renderLabel()}
        <Input
          id={field.id}
          type="date"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className={fieldClassName}
          style={showSuccess ? { borderColor: primaryColor } : {}}
        />
        {renderValidationFeedback()}
      </div>
    )
  }

  // File Upload
  if (field.type === "file") {
    return (
      <div>
        {renderLabel()}
        <MediaUploader
          onUploadSuccess={(url: string) => {
            onChange(url)
            if (onAttachmentChange) {
              onAttachmentChange(url)
            }
          }}
          accept={field.accept}
        />
        {value && (
          <div className="mt-2 text-sm text-muted-foreground">
            File uploaded: {typeof value === "string" ? value.split("/").pop() : ""}
          </div>
        )}
        {renderValidationFeedback()}
      </div>
    )
  }

  // GPS
  if (field.type === "gps") {
    return (
      <div>
        {renderLabel()}
        <GPSCapture
          value={value}
          onCapture={onChange}
          required={field.required}
        />
        {renderValidationFeedback()}
      </div>
    )
  }

  // Rating
  if (field.type === "rating") {
    const maxRating = field.max || 5
    const currentRating = Number(value) || 0

    return (
      <div>
        {renderLabel()}
        <div className="flex items-center gap-2">
          {Array.from({ length: maxRating }).map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => onChange(index + 1)}
              className="transition-all hover:scale-110"
            >
              <Star
                className={cn(
                  "w-8 h-8",
                  index < currentRating
                    ? "fill-yellow-400 text-yellow-400"
                    : "fill-none text-muted-foreground"
                )}
              />
            </button>
          ))}
          {currentRating > 0 && (
            <Badge variant="outline" className="ml-4">
              {currentRating} / {maxRating}
            </Badge>
          )}
        </div>
        {renderValidationFeedback()}
      </div>
    )
  }

  // Color
  if (field.type === "color") {
    return (
      <div>
        {renderLabel()}
        <div className="flex items-center gap-4">
          <Input
            id={field.id}
            type="color"
            value={value || "#000000"}
            onChange={(e) => onChange(e.target.value)}
            className="w-20 h-12 p-1 cursor-pointer"
          />
          <Input
            type="text"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder="#000000"
            className="flex-1"
          />
        </div>
        {renderValidationFeedback()}
      </div>
    )
  }

  // Range
  if (field.type === "range") {
    const min = field.min || 0
    const max = field.max || 100
    const step = field.step || 1

    return (
      <div>
        {renderLabel()}
        <div className="space-y-4">
          <input
            type="range"
            id={field.id}
            min={min}
            max={max}
            step={step}
            value={value || min}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, ${primaryColor} 0%, ${primaryColor} ${
                ((value || min) - min) / (max - min) * 100
              }%, hsl(var(--muted)) ${((value || min) - min) / (max - min) * 100}%, hsl(var(--muted)) 100%)`,
            }}
          />
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{min}</span>
            <Badge variant="secondary" className="text-base px-4 py-2">
              {value || min}
            </Badge>
            <span>{max}</span>
          </div>
        </div>
        {renderValidationFeedback()}
      </div>
    )
  }

  // Default fallback
  return (
    <div>
      {renderLabel()}
      <Card className="p-4 text-center text-muted-foreground">
        <p>Unsupported field type: {field.type}</p>
      </Card>
    </div>
  )
}
