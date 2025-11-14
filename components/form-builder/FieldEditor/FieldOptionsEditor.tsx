/**
 * Field Options Editor
 * Editor for select, radio, and checkbox field options
 */

"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Trash2, GripVertical } from "lucide-react"
import { Reorder } from "framer-motion"
import type { FormField } from "@/lib/types"

interface FieldOptionsEditorProps {
  field: FormField
  onUpdate: (id: string, updates: Partial<FormField>) => void
}

export function FieldOptionsEditor({ field, onUpdate }: FieldOptionsEditorProps) {
  const options = field.options || []
  const [newOptionLabel, setNewOptionLabel] = useState("")

  const handleOptionChange = (index: number, key: "label" | "value", value: string) => {
    const newOptions = [...options]
    newOptions[index] = { ...newOptions[index], [key]: value }
    onUpdate(field.id, { options: newOptions })
  }

  const handleAddOption = () => {
    const optionNumber = options.length + 1
    const label = newOptionLabel.trim() || `Option ${optionNumber}`
    const value =
      newOptionLabel
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_]/g, "") || `option_${optionNumber}`

    const newOptions = [...options, { label, value: value || `option_${optionNumber}` }]
    onUpdate(field.id, { options: newOptions })
    setNewOptionLabel("")
  }

  const handleRemoveOption = (index: number) => {
    if (options.length <= 1 && field.type !== "checkbox") {
      alert("You must have at least one option")
      return
    }
    const newOptions = options.filter((_, i) => i !== index)
    onUpdate(field.id, { options: newOptions })
  }

  const handleReorderOptions = (newOptions: typeof options) => {
    onUpdate(field.id, { options: newOptions })
  }

  const handleToggleAllowOther = (checked: boolean) => {
    onUpdate(field.id, { allowOther: checked })
  }

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium mb-3 block">Options</Label>
        <p className="text-xs text-muted-foreground mb-3">
          {field.type === "checkbox"
            ? "Users can select multiple options"
            : "Users can select one option"}
        </p>
      </div>

      {/* Options List */}
      <div className="space-y-2">
        <Reorder.Group
          axis="y"
          values={options}
          onReorder={handleReorderOptions}
          className="space-y-2"
        >
          {options.map((option, index) => (
            <Reorder.Item key={`${field.id}-option-${index}`} value={option} className="group">
              <div className="flex items-start gap-2 p-3 border border-border rounded-md bg-card hover:bg-accent/50 transition-colors">
                {/* Drag Handle */}
                <div className="flex-shrink-0 mt-2 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity">
                  <GripVertical className="w-4 h-4 text-muted-foreground" />
                </div>

                {/* Option Number */}
                <div className="flex-shrink-0 w-6 h-9 flex items-center justify-center text-sm font-medium text-muted-foreground">
                  {index + 1}
                </div>

                {/* Option Label */}
                <div className="flex-1 space-y-2">
                  <Input
                    value={option.label}
                    onChange={(e) => handleOptionChange(index, "label", e.target.value)}
                    placeholder="Option label"
                    className="text-sm"
                    aria-label={`Option ${index + 1} label`}
                  />
                  <Input
                    value={option.value}
                    onChange={(e) => handleOptionChange(index, "value", e.target.value)}
                    placeholder="Option value"
                    className="text-xs font-mono bg-muted/50"
                    aria-label={`Option ${index + 1} value`}
                  />
                </div>

                {/* Remove Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveOption(index)}
                  className="flex-shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                  aria-label={`Remove option ${index + 1}`}
                  disabled={options.length <= 1 && field.type !== "checkbox"}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      </div>

      {/* Add Option */}
      <div className="flex gap-2">
        <Input
          value={newOptionLabel}
          onChange={(e) => setNewOptionLabel(e.target.value)}
          placeholder="New option label..."
          className="text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              handleAddOption()
            }
          }}
          aria-label="New option label"
        />
        <Button
          onClick={handleAddOption}
          size="sm"
          variant="outline"
          className="flex-shrink-0"
          aria-label="Add option"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add
        </Button>
      </div>

      {/* Quick Add Presets */}
      {field.type === "radio" && options.length === 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Quick start:</p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                onUpdate(field.id, {
                  options: [
                    { label: "Yes", value: "yes" },
                    { label: "No", value: "no" },
                  ],
                })
              }
              className="text-xs"
            >
              Yes/No
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                onUpdate(field.id, {
                  options: [
                    { label: "Agree", value: "agree" },
                    { label: "Neutral", value: "neutral" },
                    { label: "Disagree", value: "disagree" },
                  ],
                })
              }
              className="text-xs"
            >
              Agree/Neutral/Disagree
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                onUpdate(field.id, {
                  options: [
                    { label: "Male", value: "male" },
                    { label: "Female", value: "female" },
                    { label: "Other", value: "other" },
                    { label: "Prefer not to say", value: "prefer_not_to_say" },
                  ],
                })
              }
              className="text-xs"
            >
              Gender
            </Button>
          </div>
        </div>
      )}

      {/* Allow "Other" option */}
      {(field.type === "radio" || field.type === "checkbox") && (
        <div className="flex items-center space-x-2 pt-2 border-t border-border">
          <Checkbox
            id={`${field.id}-allow-other`}
            checked={field.allowOther || false}
            onCheckedChange={handleToggleAllowOther}
          />
          <Label htmlFor={`${field.id}-allow-other`} className="text-sm cursor-pointer">
            Allow "Other (please specify)" option
          </Label>
        </div>
      )}

      {/* Validation Info */}
      <div className="p-3 bg-muted/50 rounded-md text-xs text-muted-foreground">
        <p>
          <strong>Option value:</strong> The value stored in the database (must be unique)
        </p>
        <p className="mt-1">
          <strong>Option label:</strong> The text displayed to users
        </p>
        {field.type === "checkbox" && (
          <p className="mt-1">
            <strong>Checkbox:</strong> Users can select multiple options
          </p>
        )}
      </div>
    </div>
  )
}
