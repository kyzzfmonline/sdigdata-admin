/**
 * Form Builder Canvas
 * Main editing area with field list and drag-drop support
 */

"use client"

import { Reorder } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useFormBuilderContext } from "./FormBuilderProvider"
import { FieldEditorContainer } from "./FieldEditor/FieldEditorContainer"
import { FileQuestion, Sparkles } from "lucide-react"
import { FormRenderer } from "@/components/form-renderer"

export function FormBuilderCanvas() {
  const {
    title,
    setTitle,
    description,
    setDescription,
    fields,
    reorderFields,
    showPreview,
    branding,
  } = useFormBuilderContext()

  // Preview Mode
  if (showPreview) {
    return (
      <div className="space-y-6">
        {/* Preview Header */}
        <Card className="p-6 bg-gradient-to-r from-primary/5 to-purple-500/5 border-primary/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Preview Mode</h3>
              <p className="text-sm text-muted-foreground">
                This is how your form will appear to users
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <div className="px-3 py-1 bg-background rounded-md border border-border">
              {fields.length} field{fields.length !== 1 ? "s" : ""}
            </div>
            <div className="px-3 py-1 bg-background rounded-md border border-border">
              {fields.filter((f) => f.required).length} required
            </div>
          </div>
        </Card>

        {/* Form Preview */}
        <Card className="p-8">
          <FormRenderer
            formId="preview"
            formTitle={title || "Untitled Form"}
            description={description}
            fields={fields}
            branding={branding}
            onSubmit={async (data) => {
              console.log("Preview submission:", data)
              alert("This is a preview. Form submissions are disabled in preview mode.")
            }}
          />
        </Card>

        {/* Preview Tips */}
        <Card className="p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="text-xs space-y-1">
              <p className="font-medium text-blue-700 dark:text-blue-300">Preview Tips</p>
              <ul className="text-blue-700 dark:text-blue-300 space-y-0.5 list-disc list-inside">
                <li>Test all field types to ensure they work as expected</li>
                <li>Check validation rules by entering invalid data</li>
                <li>Verify conditional logic (if configured)</li>
                <li>Review branding and styling</li>
                <li>Form submissions in preview mode are simulated and not saved</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  // Edit Mode
  return (
    <div className="space-y-6">
      {/* Form Metadata Section */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="form-title" className="text-sm font-medium">
              Form Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="form-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter form title..."
              className="text-lg font-semibold"
              aria-label="Form title"
              aria-required="true"
            />
            {!title.trim() && (
              <p className="text-xs text-red-600 dark:text-red-400">Title is required</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="form-description" className="text-sm font-medium">
              Form Description
            </Label>
            <Textarea
              id="form-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a brief description of this form..."
              className="min-h-[80px] resize-none"
              aria-label="Form description"
            />
            <p className="text-xs text-muted-foreground">
              Help users understand the purpose of this form
            </p>
          </div>
        </div>
      </Card>

      {/* Fields Section */}
      {fields.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Form Fields</h3>
              <p className="text-sm text-muted-foreground">
                Drag fields to reorder • Click to configure
              </p>
            </div>
            <div className="text-sm text-muted-foreground">
              {fields.length} field{fields.length !== 1 ? "s" : ""}
            </div>
          </div>

          {/* Reorderable Field List */}
          <Reorder.Group axis="y" values={fields} onReorder={reorderFields} className="space-y-3">
            {fields.map((field, index) => (
              <FieldEditorContainer key={field.id} field={field} index={index} />
            ))}
          </Reorder.Group>
        </div>
      ) : (
        // Empty State
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <FileQuestion className="w-8 h-8 text-muted-foreground" aria-hidden="true" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">No fields yet</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Get started by adding fields from the palette on the left. Choose from basic inputs,
                choice fields, media uploads, and more.
              </p>
            </div>
            <div className="flex flex-col items-center gap-2 pt-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span>Click a field type to add</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-purple-500" />
                  <span>Drag to reorder</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Ctrl+Z</kbd> to undo •{" "}
                <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Ctrl+Y</kbd> to redo
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Helper Info */}
      {fields.length > 0 && (
        <Card className="p-4 bg-muted/30 border-dashed">
          <div className="flex gap-3 items-start">
            <div className="flex-shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-medium">Tips for building better forms:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Keep forms short and focused - only ask for essential information</li>
                <li>Use clear, descriptive field labels and help text</li>
                <li>Group related fields together logically</li>
                <li>Mark required fields with an asterisk (*)</li>
                <li>Add validation rules to ensure data quality</li>
                <li>Test your form in preview mode before publishing</li>
              </ul>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
