"use client"

import { useState, useCallback, useEffect, memo } from "react"
import { motion, AnimatePresence, Reorder } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { FormBrandingEditor } from "@/components/form-branding-editor"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import type { Form, FormField, FormBranding } from "@/lib/types"
import {
  Trash2,
  Copy,
  Settings,
  GripVertical,
  Type,
  FileText,
  Mail,
  Hash,
  Calendar,
  ChevronDown,
  Circle,
  Square,
  MapPin,
  Upload,
  Phone,
  Link,
  Palette,
  Sliders,
  Star,
  PenTool,
  Eye,
  EyeOff,
  Plus,
  Sparkles,
  Save,
  Clock,
  Loader,
  HelpCircle,
} from "lucide-react"
import { useStore } from "@/lib/store"
import { toast } from "@/hooks/use-toast"
import { formFieldSchema, createFormSchema } from "@/lib/validations"
import { z } from "zod"
import { useAutosave, useDraft } from "@/hooks/use-autosave"
import { formsAPI } from "@/lib/api"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface FormBuilderProps {
  initialForm?: Form
  onSave: (form: Omit<Form, "id" | "created_at" | "updated_at" | "created_by">) => Promise<void>
}

const fieldTypes = [
  { type: "text", label: "Text Input", icon: Type, category: "Basic" },
  { type: "textarea", label: "Text Area", icon: FileText, category: "Basic" },
  { type: "email", label: "Email", icon: Mail, category: "Basic" },
  { type: "phone", label: "Phone", icon: Phone, category: "Basic" },
  { type: "url", label: "URL", icon: Link, category: "Basic" },
  { type: "number", label: "Number", icon: Hash, category: "Basic" },
  { type: "date", label: "Date", icon: Calendar, category: "Basic" },
  { type: "select", label: "Dropdown", icon: ChevronDown, category: "Choice" },
  { type: "radio", label: "Radio Buttons", icon: Circle, category: "Choice" },
  { type: "checkbox", label: "Checkboxes", icon: Square, category: "Choice" },
  { type: "range", label: "Range Slider", icon: Sliders, category: "Advanced" },
  { type: "rating", label: "Rating", icon: Star, category: "Advanced" },
  { type: "color", label: "Color Picker", icon: Palette, category: "Advanced" },
  { type: "signature", label: "Signature", icon: PenTool, category: "Advanced" },
  { type: "gps", label: "GPS Location", icon: MapPin, category: "Location" },
  { type: "file", label: "File Upload", icon: Upload, category: "Media" },
]

export function FormBuilder({ initialForm, onSave }: FormBuilderProps) {
  const currentUser = useStore((state) => state.user)
  const [title, setTitle] = useState(initialForm?.title || "")
  const [description, setDescription] = useState(initialForm?.description || "")
  const [fields, setFields] = useState<FormField[]>(initialForm?.schema?.fields || [])
  const [branding, setBranding] = useState<FormBranding>(initialForm?.schema?.branding || {})
  const [isSaving, setIsSaving] = useState(false)
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null)
  const [showBrandingEditor, setShowBrandingEditor] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>("All")

  // Autosave setup - only for forms loaded from server
  const formId = initialForm?.id || "new-form"
  const draftKey = `form-draft-${formId}`

  // Only enable autosave for forms that came from the server
  const enableAutosave = !!initialForm

  // Check for existing draft on mount (only for server-loaded forms)
  const draft = useDraft<{
    title: string
    description: string
    fields: FormField[]
    branding: FormBranding
  }>(draftKey)

  // Load draft if available (only for server-loaded forms with unsaved changes)
  useEffect(() => {
    if (draft && initialForm && enableAutosave) {
      // Compare with server data to see if draft has changes
      const serverData = {
        title: initialForm.title,
        fields: initialForm.schema?.fields || [],
        branding: initialForm.schema?.branding || {},
      }
      const draftData = {
        title: draft.title,
        fields: draft.fields,
        branding: draft.branding,
      }

      const hasUnsavedChanges = JSON.stringify(draftData) !== JSON.stringify(serverData)

      if (hasUnsavedChanges) {
        setTitle(draft.title)
        setDescription(draft.description)
        setFields(draft.fields)
        setBranding(draft.branding)
        toast({
          title: "Draft Restored",
          description: "Your unsaved changes have been restored",
        })
      }
    }
  }, [draft, initialForm, enableAutosave])

  // Current form data for autosave
  const currentFormData = { title, description, fields, branding }

  // Autosave hook - only enabled for server-loaded forms
  const {
    isDirty,
    isSaving: isAutosaving,
    lastSaved,
    save: manualSave,
    clearDraft,
    hasDraft,
  } = useAutosave({
    data: currentFormData,
    key: draftKey,
    interval: 60000, // 60 seconds (1 minute)
    onSave: enableAutosave
      ? async (data) => {
          // Save to server for existing forms
          if (!currentUser?.organization_id || !initialForm) return

          try {
            await formsAPI.update(formId, {
              title: data.title,
              description: data.description,
              organization_id: initialForm.organization_id,
              form_schema: {
                fields: data.fields,
                branding: data.branding,
              },
              version: initialForm.version || 1,
              status: "draft",
            })
          } catch (error) {
            console.error("Autosave to server failed:", error)
            // Don't throw - autosave should not interrupt user work
          }
        }
      : undefined, // No autosave for new forms
    enabled: enableAutosave && !isSaving && (!!title.trim() || fields.length > 0), // Only autosave for server-loaded forms
  })

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case "s":
            e.preventDefault()
            manualSave()
            break
          case "p":
            e.preventDefault()
            setShowPreview(!showPreview)
            break
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [showPreview])

  const addField = useCallback((type: FormField["type"]) => {
    const fieldType = fieldTypes.find((ft) => ft.type === type)
    const newField: FormField = {
      id: `field_${Date.now()}`,
      type,
      label: `${fieldType?.label || type} Field`,
      required: false,
      placeholder: "",
      helpText: "",
      options:
        type === "select" || type === "radio" || type === "checkbox"
          ? ["Option 1", "Option 2"]
          : undefined,
      min: type === "range" ? 0 : undefined,
      max: type === "range" ? 100 : undefined,
      step: type === "range" ? 1 : undefined,
    }
    setFields((prev) => [...prev, newField])

    // Auto-focus the new field for editing
    setTimeout(() => setEditingFieldId(newField.id), 100)
  }, [])

  const updateField = useCallback((id: string, updates: Partial<FormField>) => {
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates } : f)))
  }, [])

  const removeField = useCallback(
    (id: string) => {
      setFields((prev) => prev.filter((f) => f.id !== id))
      if (editingFieldId === id) {
        setEditingFieldId(null)
      }
    },
    [editingFieldId]
  )

  const duplicateField = useCallback(
    (id: string) => {
      const fieldToDuplicate = fields.find((f) => f.id === id)
      if (fieldToDuplicate) {
        const newField = {
          ...fieldToDuplicate,
          id: `field_${Date.now()}`,
          label: `${fieldToDuplicate.label} (Copy)`,
        }
        setFields((prev) => [...prev, newField])
        setEditingFieldId(newField.id)
      }
    },
    [fields]
  )

  const handleSave = async (publish = false) => {
    // Validate title
    if (!title.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a form title",
        variant: "destructive",
      })
      return
    }

    // Validate fields exist
    if (fields.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one field to your form",
        variant: "destructive",
      })
      return
    }

    // Validate user organization
    if (!currentUser?.organization_id) {
      toast({
        title: "Authentication Error",
        description: "User organization not found. Please log in again.",
        variant: "destructive",
      })
      return
    }

    // Validate form data using Zod
    try {
      const formData = {
        title,
        schema: {
          fields,
          branding,
        },
      }

      // Validate the form structure
      createFormSchema.parse(formData)

      // Validate each field individually
      const fieldErrors: string[] = []
      fields.forEach((field, index) => {
        try {
          formFieldSchema.parse(field)
        } catch (error) {
          if (error instanceof z.ZodError) {
            fieldErrors.push(
              `Field ${index + 1} (${field.label || "Unnamed"}): ${error.errors[0]?.message}`
            )
          }
        }
      })

      if (fieldErrors.length > 0) {
        toast({
          title: "Field Validation Error",
          description: fieldErrors[0] || "Some fields have validation errors",
          variant: "destructive",
        })
        return
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0]?.message || "Please check your form data",
          variant: "destructive",
        })
        return
      }
    }

    setIsSaving(true)
    try {
      await onSave({
        title,
        description,
        organization_id: initialForm?.organization_id || currentUser.organization_id,
        form_schema: {
          fields,
          branding,
        },
        version: initialForm?.version || 1,
        status: publish ? "published" : "draft",
      } as any)

      // Clear autosave draft after successful save to prevent conflicts
      clearDraft()

      toast({
        title: "Success",
        description: publish ? "Form published successfully" : "Form saved as draft",
        variant: "success",
      })
    } catch (error) {
      toast({
        title: "Save Failed",
        description:
          error instanceof Error ? error.message : "An error occurred while saving the form",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const filteredFieldTypes =
    selectedCategory === "All"
      ? fieldTypes
      : fieldTypes.filter((ft) => ft.category === selectedCategory)

  const categories = ["All", ...Array.from(new Set(fieldTypes.map((ft) => ft.category)))]

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Professional Header Toolbar */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {initialForm ? "Edit existing form" : "Create a new form"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Branding Toggle */}
                <Button
                  onClick={() => setShowBrandingEditor(!showBrandingEditor)}
                  variant={showBrandingEditor ? "default" : "outline"}
                  size="sm"
                  className="gap-2"
                >
                  <Palette className="w-4 h-4" />
                  Branding
                </Button>

                {/* Preview Toggle */}
                <Button
                  onClick={() => setShowPreview(!showPreview)}
                  variant={showPreview ? "default" : "outline"}
                  size="sm"
                  className="gap-2"
                >
                  {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showPreview ? "Edit" : "Preview"}
                </Button>

                {/* Keyboard Shortcuts Help */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <HelpCircle className="w-4 h-4" />
                      <span className="hidden sm:inline">Shortcuts</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="end">
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm">Keyboard Shortcuts</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span>Save form</span>
                          <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+S</kbd>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Toggle preview</span>
                          <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+P</kbd>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Add new field</span>
                          <kbd className="px-2 py-1 bg-muted rounded text-xs">Enter</kbd>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Delete field</span>
                          <kbd className="px-2 py-1 bg-muted rounded text-xs">Del</kbd>
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Status Bar */}
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Autosave Status */}
                  {isAutosaving ? (
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <span className="text-muted-foreground">Saving...</span>
                    </div>
                  ) : isDirty ? (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-orange-500" />
                      <span className="text-orange-600">Unsaved changes</span>
                    </div>
                  ) : lastSaved ? (
                    <div className="flex items-center gap-2 text-sm">
                      <Save className="w-4 h-4 text-green-500" />
                      <span className="text-green-600">Saved {lastSaved.toLocaleTimeString()}</span>
                    </div>
                  ) : hasDraft ? (
                    <div className="flex items-center gap-2 text-sm">
                      <Save className="w-4 h-4 text-blue-500" />
                      <span className="text-blue-600">Draft loaded</span>
                    </div>
                  ) : null}

                  {/* Form Stats & Validation */}
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">
                      {fields.length} field{fields.length !== 1 ? "s" : ""}
                    </span>
                    {title && (
                      <span className="text-muted-foreground">• {title.length} characters</span>
                    )}
                    {description && (
                      <span className="text-muted-foreground">
                        • {description.length} desc chars
                      </span>
                    )}

                    {/* Validation Indicators */}
                    <div className="flex items-center gap-2">
                      {!title.trim() && (
                        <div className="flex items-center gap-1 text-orange-600">
                          <div className="w-2 h-2 bg-orange-500 rounded-full" />
                          <span className="text-xs">Title required</span>
                        </div>
                      )}
                      {fields.length === 0 && (
                        <div className="flex items-center gap-1 text-orange-600">
                          <div className="w-2 h-2 bg-orange-500 rounded-full" />
                          <span className="text-xs">Add fields</span>
                        </div>
                      )}
                      {title.trim() && fields.length > 0 && (
                        <div className="flex items-center gap-1 text-green-600">
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          <span className="text-xs">Ready to save</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Clear Draft Button */}
                {hasDraft && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearDraft}
                    className="text-destructive hover:text-destructive gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear Draft
                  </Button>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 lg:grid-cols-4 gap-8"
        >
          {/* Enhanced Field Palette */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="space-y-6 sticky top-6"
            >
              <Card className="p-6 shadow-sm border bg-card">
                <div className="mb-4">
                  <h3 className="text-lg font-medium text-foreground">Field Library</h3>
                </div>

                {/* Category Filter */}
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <Button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        variant={selectedCategory === category ? "default" : "outline"}
                        size="sm"
                        className="text-xs"
                      >
                        {category}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  <AnimatePresence>
                    {filteredFieldTypes.map((fieldType, index) => (
                      <motion.div
                        key={fieldType.type}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2, delay: index * 0.05 }}
                      >
                        <Button
                          onClick={() => addField(fieldType.type as FormField["type"])}
                          variant="outline"
                          className="w-full justify-start h-auto p-3 hover:bg-muted transition-colors"
                          aria-label={`Add ${fieldType.label} field`}
                        >
                          <fieldType.icon className="w-4 h-4 mr-3 text-primary" />
                          <div className="text-left">
                            <div className="font-medium">{fieldType.label}</div>
                            <div className="text-xs text-muted-foreground">
                              {fieldType.category}
                            </div>
                          </div>
                        </Button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Enhanced Form Builder Canvas */}
          <div className="lg:col-span-3 space-y-6">
            <AnimatePresence>
              {showBrandingEditor && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <FormBrandingEditor
                    branding={branding}
                    onUpdate={(updates) => setBranding(updates)}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="shadow-sm border bg-card">
                <div className="p-8">
                  <div className="mb-8">
                    <label
                      htmlFor="form-title"
                      className="block text-sm font-medium text-foreground mb-3"
                    >
                      Form Title
                    </label>
                    <Input
                      id="form-title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter an engaging form title..."
                      className="text-2xl font-medium border border-border focus:border-primary h-16 px-4"
                      aria-describedby="form-title-help"
                    />
                    <p id="form-title-help" className="text-sm text-muted-foreground mt-2">
                      This will be displayed at the top of your form
                    </p>
                  </div>

                  <div className="mb-8">
                    <label
                      htmlFor="form-description"
                      className="block text-sm font-medium text-foreground mb-3"
                    >
                      Form Description
                    </label>
                    <Textarea
                      id="form-description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Provide additional context or instructions for your form..."
                      className="min-h-20 border border-border focus:border-primary px-4 py-3"
                      aria-describedby="form-description-help"
                    />
                    <p id="form-description-help" className="text-sm text-muted-foreground mt-2">
                      Optional description that will be displayed below the title
                    </p>
                  </div>

                  <div className="space-y-4">
                    {fields.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-12 text-center border-2 border-dashed border-border rounded-xl bg-gradient-to-br from-primary/5 to-secondary/5"
                      >
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                          <Plus className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                          Start Building Your Form
                        </h3>
                        <p className="text-muted-foreground mb-4">
                          Choose a field from the library to begin creating your form
                        </p>
                        <Button onClick={() => addField("text")} className="shadow-lg">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Your First Field
                        </Button>
                      </motion.div>
                    ) : showPreview ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-6"
                      >
                        <div className="text-center mb-8">
                          <h2 className="text-2xl font-bold text-foreground mb-2">Form Preview</h2>
                          <p className="text-muted-foreground">
                            This is how your form will appear to users
                          </p>
                        </div>
                        <Card className="p-8 bg-card border-2">
                          <div className="space-y-6">
                            {fields.map((field, index) => (
                              <FormFieldPreview key={field.id} field={field} />
                            ))}
                          </div>
                        </Card>
                      </motion.div>
                    ) : (
                      <Reorder.Group
                        axis="y"
                        values={fields}
                        onReorder={setFields}
                        className="space-y-4"
                      >
                        <AnimatePresence>
                          {fields.map((field, index) => (
                            <Reorder.Item
                              key={field.id}
                              value={field}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              transition={{ duration: 0.3, delay: index * 0.1 }}
                            >
                              <FieldEditor
                                field={field}
                                isEditing={editingFieldId === field.id}
                                onEdit={() => setEditingFieldId(field.id)}
                                onUpdate={(updates) => updateField(field.id, updates)}
                                onDuplicate={() => duplicateField(field.id)}
                                onRemove={() => removeField(field.id)}
                              />
                            </Reorder.Item>
                          ))}
                        </AnimatePresence>
                      </Reorder.Group>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Clean Action Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex justify-center gap-3 pt-8 border-t border-border"
            >
              <Button
                onClick={() => handleSave(false)}
                disabled={isSaving}
                variant="secondary"
                size="lg"
              >
                {isSaving ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save as Draft
                  </>
                )}
              </Button>
              <Button onClick={() => handleSave(true)} disabled={isSaving} size="lg">
                {isSaving ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Publish Form
                  </>
                )}
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

interface FieldEditorProps {
  field: FormField
  isEditing: boolean
  onEdit: () => void
  onUpdate: (updates: Partial<FormField>) => void
  onDuplicate: () => void
  onRemove: () => void
}

const FieldEditor = memo(function FieldEditor({
  field,
  isEditing,
  onEdit,
  onUpdate,
  onDuplicate,
  onRemove,
}: FieldEditorProps) {
  return (
    <div
      className="border border-border bg-card rounded-lg p-5 cursor-pointer hover:bg-accent/50 hover:border-accent-foreground/20 transition-all duration-200 shadow-sm hover:shadow-md group"
      onClick={onEdit}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Input
              value={field.label}
              onChange={(e) => onUpdate({ label: e.target.value })}
              onClick={(e) => e.stopPropagation()}
              placeholder="Field label"
              className="font-medium"
            />
            <span className="px-2 py-1 bg-muted rounded text-xs text-muted-foreground">
              {field.type}
            </span>
          </div>

          {isEditing && (
            <div className="space-y-3 mt-4 pt-4 border-t border-border">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={field.required}
                  onChange={(e) => onUpdate({ required: e.target.checked })}
                  onClick={(e) => e.stopPropagation()}
                />
                <span className="text-sm">Required</span>
              </label>

              {/* Placeholder for text-based fields */}
              {(field.type === "text" ||
                field.type === "textarea" ||
                field.type === "email" ||
                field.type === "phone" ||
                field.type === "url") && (
                <Input
                  value={field.placeholder || ""}
                  onChange={(e) => onUpdate({ placeholder: e.target.value })}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="Placeholder text"
                />
              )}

              {/* Help text for all fields */}
              <Input
                value={field.helpText || ""}
                onChange={(e) => onUpdate({ helpText: e.target.value })}
                onClick={(e) => e.stopPropagation()}
                placeholder="Help text (optional)"
                className="text-sm"
              />

              {/* Options for choice fields */}
              {(field.type === "select" || field.type === "radio" || field.type === "checkbox") && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Options</label>
                    <textarea
                      value={(field.options || []).join("\n")}
                      onChange={(e) =>
                        onUpdate({
                          options: e.target.value.split("\n").filter((opt) => opt.trim()),
                        })
                      }
                      onClick={(e) => e.stopPropagation()}
                      placeholder="Enter each option on a new line"
                      className="w-full p-2 border border-border rounded text-sm"
                      rows={4}
                    />
                  </div>

                  {/* Allow Other Option Toggle */}
                  {(field.type === "radio" || field.type === "checkbox") && (
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`allow-other-${field.id}`}
                        checked={field.allowOther || false}
                        onChange={(e) => onUpdate({ allowOther: e.target.checked })}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                      />
                      <label
                        htmlFor={`allow-other-${field.id}`}
                        className="text-sm font-medium cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Allow "Other (please specify)" option
                      </label>
                    </div>
                  )}
                </div>
              )}

              {/* Number validation */}
              {field.type === "number" && (
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    value={field.validation?.min || ""}
                    onChange={(e) =>
                      onUpdate({
                        validation: {
                          ...field.validation,
                          min: e.target.value ? Number.parseInt(e.target.value) : undefined,
                        },
                      })
                    }
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Min value"
                    className="text-sm"
                  />
                  <Input
                    type="number"
                    value={field.validation?.max || ""}
                    onChange={(e) =>
                      onUpdate({
                        validation: {
                          ...field.validation,
                          max: e.target.value ? Number.parseInt(e.target.value) : undefined,
                        },
                      })
                    }
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Max value"
                    className="text-sm"
                  />
                </div>
              )}

              {/* Range slider configuration */}
              {field.type === "range" && (
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    type="number"
                    value={field.min || 0}
                    onChange={(e) => onUpdate({ min: Number.parseInt(e.target.value) || 0 })}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Min"
                    className="text-sm"
                  />
                  <Input
                    type="number"
                    value={field.max || 100}
                    onChange={(e) => onUpdate({ max: Number.parseInt(e.target.value) || 100 })}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Max"
                    className="text-sm"
                  />
                  <Input
                    type="number"
                    value={field.step || 1}
                    onChange={(e) => onUpdate({ step: Number.parseInt(e.target.value) || 1 })}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Step"
                    className="text-sm"
                  />
                </div>
              )}

              {/* File upload configuration */}
              {field.type === "file" && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Accepted file types</label>
                  <Input
                    value={field.accept || ""}
                    onChange={(e) => onUpdate({ accept: e.target.value })}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="e.g., .pdf,.doc,.jpg (leave empty for any)"
                    className="text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Comma-separated file extensions (e.g., .pdf,.docx,.jpg)
                  </p>
                </div>
              )}

              {/* GPS location info */}
              {field.type === "gps" && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-xs text-green-700">
                    Users will be prompted to share their location when filling this form
                  </p>
                </div>
              )}

              {/* Color picker info */}
              {field.type === "color" && (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-md">
                  <p className="text-xs text-purple-700">
                    Users can select a color using the browser's color picker
                  </p>
                </div>
              )}

              {/* Rating configuration */}
              {field.type === "rating" && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Maximum rating</label>
                  <Input
                    type="number"
                    value={field.max || 5}
                    onChange={(e) => onUpdate({ max: Number.parseInt(e.target.value) || 5 })}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="5"
                    min="1"
                    max="10"
                    className="text-sm w-20"
                  />
                </div>
              )}

              {/* Signature info */}
              {field.type === "signature" && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-md">
                  <p className="text-xs text-orange-700">
                    Users can draw their signature using touch or mouse
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-1 ml-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onDuplicate()
            }}
          >
            <Copy className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
})

interface FormFieldPreviewProps {
  field: FormField
}

const FormFieldPreview = memo(function FormFieldPreview({ field }: FormFieldPreviewProps) {
  const renderFieldInput = () => {
    switch (field.type) {
      case "text":
      case "email":
      case "phone":
      case "url":
        return (
          <Input type={field.type} placeholder={field.placeholder} disabled className="bg-muted" />
        )
      case "textarea":
        return (
          <textarea
            placeholder={field.placeholder}
            disabled
            className="w-full p-2 border border-border rounded bg-muted resize-none"
            rows={3}
          />
        )
      case "number":
        return <Input type="number" placeholder={field.placeholder} disabled className="bg-muted" />
      case "date":
        return <Input type="date" disabled className="bg-muted" />
      case "select":
        return (
          <select disabled className="w-full p-2 border border-border rounded bg-muted">
            <option value="">Select an option</option>
            {field.options?.map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
        )
      case "radio":
        return (
          <div className="space-y-2">
            <RadioGroup className="space-y-2">
              {field.options?.map((option, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-md bg-muted/50 cursor-not-allowed opacity-75 max-w-md"
                >
                  <RadioGroupItem value={option} disabled />
                  <Label className="text-sm font-medium text-muted-foreground cursor-not-allowed flex-1">
                    {option}
                  </Label>
                </div>
              ))}

              {/* Other option - only show if enabled */}
              {field.allowOther && (
                <div className="flex items-center gap-3 p-3 rounded-md bg-muted/50 cursor-not-allowed opacity-75 max-w-md">
                  <RadioGroupItem value="other" disabled />
                  <Label className="text-sm font-medium text-muted-foreground cursor-not-allowed flex-1">
                    Other (please specify)
                  </Label>
                </div>
              )}
            </RadioGroup>

            {/* Custom input for "Other" option */}
            {field.allowOther && (
              <div className="ml-7 mt-2">
                <Input
                  type="text"
                  placeholder="Please specify..."
                  disabled
                  className="max-w-md bg-muted/50"
                />
              </div>
            )}
          </div>
        )
      case "checkbox":
        return (
          <div className="space-y-2">
            {field.options?.map((option, index) => (
              <div key={index} className="relative">
                <Checkbox disabled className="peer sr-only" />
                <Label className="flex items-center gap-3 p-3 rounded-md bg-muted/50 cursor-not-allowed opacity-75 max-w-md">
                  <div className="w-4 h-4 rounded border-2 border-muted-foreground/50 flex items-center justify-center flex-shrink-0">
                    <div className="w-2 h-2 bg-muted-foreground/50 opacity-0 peer-checked:opacity-100 transition-opacity" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">{option}</span>
                </Label>
              </div>
            ))}

            {/* Other option - only show if enabled */}
            {field.allowOther && (
              <div className="relative">
                <Checkbox disabled className="peer sr-only" />
                <Label className="flex items-center gap-3 p-3 rounded-md bg-muted/50 cursor-not-allowed opacity-75 max-w-md">
                  <div className="w-4 h-4 rounded border-2 border-muted-foreground/50 flex items-center justify-center flex-shrink-0">
                    <div className="w-2 h-2 bg-muted-foreground/50 opacity-0 peer-checked:opacity-100 transition-opacity" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">
                    Other (please specify)
                  </span>
                </Label>
              </div>
            )}

            {/* Custom input for "Other" option */}
            {field.allowOther && (
              <div className="ml-7 mt-2">
                <Input
                  type="text"
                  placeholder="Please specify..."
                  disabled
                  className="max-w-md bg-muted/50"
                />
              </div>
            )}
          </div>
        )
      case "range":
        return (
          <input
            type="range"
            min={field.min || 0}
            max={field.max || 100}
            step={field.step || 1}
            disabled
            className="w-full"
          />
        )
      case "rating":
        return (
          <div className="flex gap-1">
            {Array.from({ length: field.max || 5 }, (_, i) => (
              <Star key={i} className="w-5 h-5 text-muted-foreground" />
            ))}
          </div>
        )
      case "file":
        return (
          <div className="p-4 border-2 border-dashed border-muted-foreground/25 rounded bg-muted/50 text-center">
            <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Click to upload or drag and drop</p>
            {field.accept && (
              <p className="text-xs text-muted-foreground mt-1">Accepted: {field.accept}</p>
            )}
          </div>
        )
      case "color":
        return <Input type="color" disabled className="w-20 h-10 bg-muted border-0 p-1" />
      case "gps":
        return (
          <div className="p-4 border border-border rounded bg-muted/50">
            <MapPin className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-center text-muted-foreground">
              Location will be captured here
            </p>
          </div>
        )
      case "signature":
        return (
          <div className="p-4 border border-border rounded bg-muted/50">
            <PenTool className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-center text-muted-foreground">
              Signature pad will appear here
            </p>
          </div>
        )
      default:
        return <div className="text-muted-foreground">Unsupported field type</div>
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-foreground">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {renderFieldInput()}
      {field.helpText && <p className="text-xs text-muted-foreground">{field.helpText}</p>}
    </div>
  )
})
