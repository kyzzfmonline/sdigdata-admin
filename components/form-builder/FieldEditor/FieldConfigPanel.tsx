/**
 * Field Config Panel
 * Basic configuration for all field types
 */

"use client"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { getFieldConfig } from "@/lib/form-builder/field-configs"
import type { FormField } from "@/lib/types"

interface FieldConfigPanelProps {
  field: FormField
  onUpdate: (id: string, updates: Partial<FormField>) => void
}

export function FieldConfigPanel({ field, onUpdate }: FieldConfigPanelProps) {
  const config = getFieldConfig(field.type)

  return (
    <div className="space-y-4">
      {/* Required Toggle */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id={`${field.id}-required`}
          checked={field.required}
          onCheckedChange={(checked) => onUpdate(field.id, { required: !!checked })}
          aria-label="Mark field as required"
        />
        <Label htmlFor={`${field.id}-required`} className="text-sm font-medium cursor-pointer">
          Required field
        </Label>
      </div>

      {/* Placeholder (if supported) */}
      {config.supportsPlaceholder && (
        <div className="space-y-2">
          <Label htmlFor={`${field.id}-placeholder`} className="text-sm font-medium">
            Placeholder Text
          </Label>
          <Input
            id={`${field.id}-placeholder`}
            value={field.placeholder || ""}
            onChange={(e) => onUpdate(field.id, { placeholder: e.target.value })}
            placeholder="Enter placeholder text..."
            className="text-sm"
            aria-label="Placeholder text for field"
          />
          <p className="text-xs text-muted-foreground">
            Hint text displayed when the field is empty
          </p>
        </div>
      )}

      {/* Help Text */}
      {config.supportsHelpText && (
        <div className="space-y-2">
          <Label htmlFor={`${field.id}-helpText`} className="text-sm font-medium">
            Help Text
          </Label>
          <Textarea
            id={`${field.id}-helpText`}
            value={field.helpText || ""}
            onChange={(e) => onUpdate(field.id, { helpText: e.target.value })}
            placeholder="Provide additional context or instructions..."
            className="text-sm min-h-[60px]"
            aria-label="Help text for field"
          />
          <p className="text-xs text-muted-foreground">
            Additional information displayed below the field
          </p>
        </div>
      )}

      {/* Default Value (if supported) */}
      {config.supportsDefaultValue && (
        <div className="space-y-2">
          <Label htmlFor={`${field.id}-defaultValue`} className="text-sm font-medium">
            Default Value
          </Label>
          {field.type === "textarea" ? (
            <Textarea
              id={`${field.id}-defaultValue`}
              value={field.defaultValue || ""}
              onChange={(e) => onUpdate(field.id, { defaultValue: e.target.value })}
              placeholder="Enter default value..."
              className="text-sm min-h-[60px]"
              aria-label="Default value for field"
            />
          ) : field.type === "checkbox" ? (
            <p className="text-xs text-muted-foreground">
              Default values for checkboxes are set in the options editor
            </p>
          ) : (
            <Input
              id={`${field.id}-defaultValue`}
              type={field.type === "number" ? "number" : "text"}
              value={field.defaultValue || ""}
              onChange={(e) => onUpdate(field.id, { defaultValue: e.target.value })}
              placeholder="Enter default value..."
              className="text-sm"
              aria-label="Default value for field"
            />
          )}
          <p className="text-xs text-muted-foreground">Pre-filled value when the form loads</p>
        </div>
      )}

      {/* Number-specific config */}
      {field.type === "number" && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor={`${field.id}-min`} className="text-sm font-medium">
              Minimum Value
            </Label>
            <Input
              id={`${field.id}-min`}
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
            <Label htmlFor={`${field.id}-max`} className="text-sm font-medium">
              Maximum Value
            </Label>
            <Input
              id={`${field.id}-max`}
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
      )}

      {/* Range-specific config */}
      {field.type === "range" && (
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-2">
            <Label htmlFor={`${field.id}-range-min`} className="text-sm font-medium">
              Min
            </Label>
            <Input
              id={`${field.id}-range-min`}
              type="number"
              value={field.min ?? 0}
              onChange={(e) => onUpdate(field.id, { min: Number.parseInt(e.target.value) || 0 })}
              className="text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${field.id}-range-max`} className="text-sm font-medium">
              Max
            </Label>
            <Input
              id={`${field.id}-range-max`}
              type="number"
              value={field.max ?? 100}
              onChange={(e) => onUpdate(field.id, { max: Number.parseInt(e.target.value) || 100 })}
              className="text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${field.id}-range-step`} className="text-sm font-medium">
              Step
            </Label>
            <Input
              id={`${field.id}-range-step`}
              type="number"
              value={field.step ?? 1}
              onChange={(e) => onUpdate(field.id, { step: Number.parseInt(e.target.value) || 1 })}
              className="text-sm"
              min="1"
            />
          </div>
        </div>
      )}

      {/* Rating-specific config */}
      {field.type === "rating" && (
        <div className="space-y-2">
          <Label htmlFor={`${field.id}-rating-max`} className="text-sm font-medium">
            Maximum Rating
          </Label>
          <Input
            id={`${field.id}-rating-max`}
            type="number"
            value={field.max ?? 5}
            onChange={(e) => onUpdate(field.id, { max: Number.parseInt(e.target.value) || 5 })}
            className="text-sm w-24"
            min="1"
            max="10"
          />
          <p className="text-xs text-muted-foreground">Number of stars (1-10)</p>
        </div>
      )}

      {/* File-specific config */}
      {field.type === "file" && (
        <div className="space-y-2">
          <Label htmlFor={`${field.id}-accept`} className="text-sm font-medium">
            Accepted File Types
          </Label>
          <Input
            id={`${field.id}-accept`}
            value={field.accept || ""}
            onChange={(e) => onUpdate(field.id, { accept: e.target.value })}
            placeholder="e.g., image/*,.pdf,.doc,.docx"
            className="text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Comma-separated MIME types or extensions. Leave empty for any file type.
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            <button
              type="button"
              onClick={() => onUpdate(field.id, { accept: "image/*" })}
              className="text-xs px-2 py-1 bg-muted rounded hover:bg-muted/80"
            >
              Images only
            </button>
            <button
              type="button"
              onClick={() => onUpdate(field.id, { accept: "application/pdf" })}
              className="text-xs px-2 py-1 bg-muted rounded hover:bg-muted/80"
            >
              PDF only
            </button>
            <button
              type="button"
              onClick={() => onUpdate(field.id, { accept: "image/*,application/pdf" })}
              className="text-xs px-2 py-1 bg-muted rounded hover:bg-muted/80"
            >
              Images + PDF
            </button>
          </div>
        </div>
      )}

      {/* Text-specific config */}
      {(field.type === "text" || field.type === "textarea") && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor={`${field.id}-minLength`} className="text-sm font-medium">
              Min Length
            </Label>
            <Input
              id={`${field.id}-minLength`}
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
            <Label htmlFor={`${field.id}-maxLength`} className="text-sm font-medium">
              Max Length
            </Label>
            <Input
              id={`${field.id}-maxLength`}
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
      )}

      {/* GPS info */}
      {field.type === "gps" && (
        <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            <strong>GPS Location:</strong> Users will be prompted to share their location when
            filling this field. Coordinates will be captured automatically.
          </p>
        </div>
      )}

      {/* Signature info */}
      {field.type === "signature" && (
        <div className="p-3 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-md">
          <p className="text-xs text-orange-700 dark:text-orange-300">
            <strong>Digital Signature:</strong> Users can draw their signature using touch or mouse.
            The signature will be saved as an image.
          </p>
        </div>
      )}

      {/* Color info */}
      {field.type === "color" && (
        <div className="p-3 bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 rounded-md">
          <p className="text-xs text-purple-700 dark:text-purple-300">
            <strong>Color Picker:</strong> Users can select a color using the browser's native color
            picker. The value will be stored as a hex color code.
          </p>
        </div>
      )}
    </div>
  )
}
