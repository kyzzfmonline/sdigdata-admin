/**
 * Form Builder
 * Main form builder component integrating all subsystems
 */

"use client"

import { useState, useCallback, useRef } from "react"
import { FormBuilderProvider } from "./FormBuilderProvider"
import { FormBuilderToolbar } from "./FormBuilderToolbar"
import { FormBuilderCanvas } from "./FormBuilderCanvas"
import { FieldPaletteContainer } from "./FieldPalette/FieldPaletteContainer"
import { FormBrandingEditor } from "@/components/form-branding-editor"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { useFormBuilderContext } from "./FormBuilderProvider"
import { formsAPI } from "@/lib/api"
import { toast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { sanitizeFormField } from "@/lib/security"
import { useStore } from "@/lib/store"
import { useKeyboardNavigation } from "@/hooks/form-builder/use-keyboard-navigation"
import { useFocusManagement } from "@/hooks/form-builder/use-focus-management"
import type { Form } from "@/lib/types"

export interface FormBuilderProps {
  /**
   * Initial form data (for editing existing forms)
   */
  initialForm?: Form

  /**
   * Callback when form is saved
   */
  onSave?: (form: Form) => Promise<void>

  /**
   * Auto-acquire form lock (default: true)
   */
  autoLock?: boolean

  /**
   * Enable autosave (default: true)
   */
  enableAutosave?: boolean

  /**
   * Autosave interval in milliseconds (default: 30000 = 30s)
   */
  autosaveInterval?: number
}

/**
 * Internal component that uses the FormBuilderContext
 */
function FormBuilderInner() {
  const {
    title,
    description,
    fields,
    branding,
    setBranding,
    showBrandingEditor,
    setShowBrandingEditor,
    showPreview,
    setShowPreview,
    isDirty,
    formId,
    lockStatus,
    selectedFieldId,
    setSelectedFieldId,
    removeField,
    duplicateField,
    moveFieldUp,
    moveFieldDown,
    undo,
    redo,
  } = useFormBuilderContext()

  const router = useRouter()
  const currentUser = useStore((state) => state.user)
  const [isSaving, setIsSaving] = useState(false)
  const handleSaveRef = useRef<((publish?: boolean) => Promise<void>) | null>(null)

  /**
   * Save form to backend
   */
  const handleSave = useCallback(
    async (publish = false) => {
      if (!title.trim()) {
        toast({
          title: "Validation Error",
          description: "Form title is required",
          variant: "destructive",
        })
        return
      }

      if (fields.length === 0) {
        toast({
          title: "Validation Error",
          description: "Add at least one field to the form",
          variant: "destructive",
        })
        return
      }

      // Check if form is locked by another user
      console.log("[LOCK DEBUG] Save attempt - lockStatus:", JSON.stringify(lockStatus, null, 2))
      if (lockStatus?.is_locked && !lockStatus.can_edit) {
        console.log("[LOCK DEBUG] BLOCKING SAVE - is_locked:", lockStatus.is_locked, "can_edit:", lockStatus.can_edit)
        toast({
          title: "Form Locked",
          description: `This form is being edited by ${lockStatus.lock?.locked_by_username || "another user"}`,
          variant: "destructive",
        })
        return
      }
      console.log("[LOCK DEBUG] Save allowed - proceeding")

      setIsSaving(true)

      try {
        // Sanitize all fields before saving
        const sanitizedFields = fields.map((field) => sanitizeFormField(field))

        if (formId && formId !== "new") {
          // Update existing form
          const updateData = {
            title: title.trim(),
            description: description?.trim() || undefined,
            form_schema: {
              fields: sanitizedFields,
              branding: branding || {},
            },
            status: publish ? ("published" as const) : ("draft" as const),
          }

          await formsAPI.update(formId, updateData)
        } else {
          // Create new form
          const createData = {
            title: title.trim(),
            description: description?.trim(),
            organization_id: currentUser?.organization_id || "",
            form_schema: {
              fields: sanitizedFields,
              branding: branding || {},
            },
            version: 1,
            status: publish ? ("published" as const) : ("draft" as const),
          }

          const response = await formsAPI.create(createData)
          const savedForm = response.data.data

          // Redirect to edit page for new forms
          router.push(`/forms/${savedForm.id}`)
        }

        toast({
          title: publish ? "Form Published" : "Form Saved",
          description: publish
            ? "Your form has been published and is now live"
            : "Your changes have been saved as a draft",
        })

        // Clear dirty state (handled by FormBuilderProvider)
      } catch (error: any) {
        console.error("Failed to save form:", error)
        toast({
          title: "Save Failed",
          description: error.response?.data?.detail || "Failed to save form. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsSaving(false)
      }
    },
    [title, description, fields, branding, formId, lockStatus, router, currentUser]
  )

  // Store handleSave in ref for keyboard navigation
  handleSaveRef.current = handleSave

  /**
   * Keyboard navigation
   */
  useKeyboardNavigation({
    fields,
    selectedFieldId,
    onSelectField: setSelectedFieldId,
    onDeleteField: removeField,
    onDuplicateField: duplicateField,
    onMoveFieldUp: moveFieldUp,
    onMoveFieldDown: moveFieldDown,
    onSave: () => handleSaveRef.current?.(false),
    onTogglePreview: () => setShowPreview(!showPreview),
    onUndo: undo,
    onRedo: redo,
    enabled: true,
  })

  /**
   * Focus management
   */
  useFocusManagement({
    selectedFieldId,
    autoFocus: true,
  })

  return (
    <div className="min-h-screen bg-background">
      {/* Toolbar */}
      <FormBuilderToolbar onSave={handleSave} isSaving={isSaving} />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Sidebar - Field Palette */}
          <div className="col-span-12 lg:col-span-3">
            <div className="sticky top-24">
              <FieldPaletteContainer />
            </div>
          </div>

          {/* Main Canvas */}
          <div className="col-span-12 lg:col-span-6">
            <FormBuilderCanvas />
          </div>

          {/* Right Sidebar - Branding Editor */}
          <div className="col-span-12 lg:col-span-3">
            {showBrandingEditor && (
              <div className="sticky top-24">
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Branding</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowBrandingEditor(false)}
                      aria-label="Close branding editor"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <FormBrandingEditor branding={branding} onUpdate={setBranding} />
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Unsaved Changes Warning */}
      {isDirty && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <Card className="px-4 py-3 shadow-lg border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
                You have unsaved changes
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleSave(false)}
                disabled={isSaving}
                className="ml-2"
              >
                Save Now
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

/**
 * Main FormBuilder component
 * Wraps the inner component with FormBuilderProvider
 */
export function FormBuilder({
  initialForm,
  onSave,
  autoLock = true,
  enableAutosave = true,
  autosaveInterval = 30000,
}: FormBuilderProps) {
  return (
    <FormBuilderProvider
      initialForm={initialForm}
      onSave={onSave}
      autoLock={autoLock}
      enableAutosave={enableAutosave}
      autosaveInterval={autosaveInterval}
    >
      <FormBuilderInner />
    </FormBuilderProvider>
  )
}
