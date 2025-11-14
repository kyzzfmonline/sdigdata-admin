/**
 * Field Editor Container
 * Main container for editing individual fields
 */

"use client"

import { motion, AnimatePresence, Reorder } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Trash2, Copy, GripVertical, ChevronDown, ChevronUp } from "lucide-react"
import { useFormBuilderContext } from "../FormBuilderProvider"
import { getFieldConfig } from "@/lib/form-builder/field-configs"
import { FieldConfigPanel } from "./FieldConfigPanel"
import { FieldOptionsEditor } from "./FieldOptionsEditor"
import { FieldValidationEditor } from "./FieldValidationEditor"
import type { FormField } from "@/lib/types"
import { useState } from "react"

interface FieldEditorContainerProps {
  field: FormField
  index: number
}

export function FieldEditorContainer({ field, index }: FieldEditorContainerProps) {
  const { updateField, removeField, duplicateField, selectedFieldId, setSelectedFieldId } =
    useFormBuilderContext()

  const [isExpanded, setIsExpanded] = useState(selectedFieldId === field.id)
  const config = getFieldConfig(field.type)
  const Icon = config.icon
  const isSelected = selectedFieldId === field.id

  // Expand when selected
  if (selectedFieldId === field.id && !isExpanded) {
    setIsExpanded(true)
  }

  const handleClick = () => {
    setSelectedFieldId(field.id)
    setIsExpanded(true)
  }

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsExpanded(!isExpanded)
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (window.confirm(`Are you sure you want to delete "${field.label}"?`)) {
      removeField(field.id)
    }
  }

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation()
    duplicateField(field.id)
  }

  return (
    <Reorder.Item
      value={field}
      id={field.id}
      className="group"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={`
          relative p-5 cursor-pointer transition-all duration-200
          hover:shadow-md
          ${isSelected ? "ring-2 ring-primary border-primary shadow-md" : "border-border hover:border-accent-foreground/20"}
        `}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        data-field-id={field.id}
        aria-label={`Edit ${field.label} field`}
        aria-expanded={isExpanded}
        aria-selected={isSelected}
        onKeyDown={(e) => {
          // Don't handle keyboard events if they originated from an input/textarea
          const target = e.target as HTMLElement
          if (
            target.tagName === "INPUT" ||
            target.tagName === "TEXTAREA" ||
            target.tagName === "SELECT" ||
            target.contentEditable === "true"
          ) {
            return
          }

          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            handleClick()
          }
        }}
      >
        {/* Drag Handle */}
        <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
          <GripVertical className="w-5 h-5 text-muted-foreground" aria-label="Drag to reorder" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between mb-3 ml-6">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Icon */}
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                <Icon className="w-4 h-4 text-primary" aria-hidden="true" />
              </div>
            </div>

            {/* Field Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Input
                  value={field.label}
                  onChange={(e) => {
                    e.stopPropagation()
                    updateField(field.id, { label: e.target.value })
                  }}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="Field label"
                  className="font-medium h-8 px-2"
                  aria-label={`Label for ${field.type} field`}
                />
                {field.required && (
                  <span
                    className="text-red-500 font-bold flex-shrink-0"
                    aria-label="Required field"
                  >
                    *
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="px-2 py-0.5 bg-muted rounded">{config.label}</span>
                <span>•</span>
                <span>Field {index + 1}</span>
              </div>
            </div>

            {/* Expand/Collapse Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleExpand}
              className="flex-shrink-0"
              aria-label={isExpanded ? "Collapse field editor" : "Expand field editor"}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>

          {/* Actions */}
          <div className="flex gap-1 ml-3 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDuplicate}
              aria-label={`Duplicate ${field.label} field`}
              title="Duplicate"
            >
              <Copy className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              aria-label={`Delete ${field.label} field`}
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Expanded Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="ml-6"
            >
              <div className="pt-4 border-t border-border space-y-6">
                {/* Basic Configuration */}
                <FieldConfigPanel field={field} onUpdate={updateField} />

                {/* Options Editor (for choice fields) */}
                {config.supportsOptions && (
                  <FieldOptionsEditor field={field} onUpdate={updateField} />
                )}

                {/* Validation Editor */}
                {config.supportsValidation && (
                  <FieldValidationEditor field={field} onUpdate={updateField} />
                )}

                {/* Field Type Info */}
                <div className="p-3 bg-muted/50 rounded-md text-xs text-muted-foreground">
                  <p className="font-semibold mb-1">{config.label}</p>
                  <p>{config.description}</p>
                  <p className="mt-2">
                    <span className="font-semibold">Example use:</span> {config.exampleUseCase}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </Reorder.Item>
  )
}
