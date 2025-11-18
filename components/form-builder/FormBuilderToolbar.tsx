/**
 * Form Builder Toolbar
 * Top toolbar with save, publish, preview, and undo/redo actions
 */

"use client"

import { Button } from "@/components/ui/button"
import {
  Save,
  Send,
  Eye,
  EyeOff,
  Undo2,
  Redo2,
  Clock,
  Loader,
  Palette,
  Lock,
  LockOpen,
  History,
  HelpCircle,
  BookTemplate,
} from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useFormBuilderContext } from "./FormBuilderProvider"
import { Badge } from "@/components/ui/badge"
import { useSaveAsTemplate } from "@/hooks/use-templates"
import { useState } from "react"

interface FormBuilderToolbarProps {
  onSave: (publish?: boolean) => Promise<void>
  isSaving: boolean
}

// Template categories - should match backend categories
const TEMPLATE_CATEGORIES = [
  "survey",
  "registration",
  "feedback",
  "inspection",
  "assessment",
  "data_collection",
  "application",
  "report",
  "other",
] as const

export function FormBuilderToolbar({ onSave, isSaving }: FormBuilderToolbarProps) {
  const {
    title,
    fields,
    isDirty,
    showPreview,
    setShowPreview,
    showBrandingEditor,
    setShowBrandingEditor,
    canUndo,
    canRedo,
    undo,
    redo,
    lockStatus,
    formId,
  } = useFormBuilderContext()

  const saveAsTemplate = useSaveAsTemplate()
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [templateData, setTemplateData] = useState({
    name: "",
    description: "",
    category: "data_collection",
    is_public: false,
    tags: "",
  })

  const canSave = title.trim() && fields.length > 0
  const isExistingForm = formId && formId !== "new"

  const handleSaveAsTemplate = async () => {
    if (!isExistingForm) return

    await saveAsTemplate.mutateAsync({
      formId,
      data: {
        name: templateData.name,
        description: templateData.description || undefined,
        category: templateData.category,
        is_public: templateData.is_public,
        tags: templateData.tags ? templateData.tags.split(",").map((t) => t.trim()) : undefined,
      },
    })

    setShowTemplateDialog(false)
    // Reset form
    setTemplateData({
      name: "",
      description: "",
      category: "data_collection",
      is_public: false,
      tags: "",
    })
  }

  return (
    <div className="bg-card border-b border-border sticky top-0 z-10 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Left Section - Form Info */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold truncate" title={title || "Untitled Form"}>
                {title || "Untitled Form"}
              </h2>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>
                  {fields.length} field{fields.length !== 1 ? "s" : ""}
                </span>
                {isDirty && (
                  <>
                    <span>•</span>
                    <span className="text-orange-600 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Unsaved changes
                    </span>
                  </>
                )}
                {lockStatus?.is_locked && (
                  <>
                    <span>•</span>
                    <Badge variant="outline" className="text-xs">
                      <Lock className="w-3 h-3 mr-1" />
                      Locked
                    </Badge>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Middle Section - Actions */}
          <div className="flex items-center gap-2">
            {/* Undo/Redo */}
            <div className="flex items-center gap-1 border-r border-border pr-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={undo}
                disabled={!canUndo}
                title="Undo (Ctrl+Z)"
                aria-label="Undo last action"
              >
                <Undo2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={redo}
                disabled={!canRedo}
                title="Redo (Ctrl+Y)"
                aria-label="Redo last action"
              >
                <Redo2 className="w-4 h-4" />
              </Button>
            </div>

            {/* Branding Toggle */}
            <Button
              onClick={() => setShowBrandingEditor(!showBrandingEditor)}
              variant={showBrandingEditor ? "default" : "outline"}
              size="sm"
              className="gap-2"
              aria-label={showBrandingEditor ? "Hide branding editor" : "Show branding editor"}
              aria-pressed={showBrandingEditor}
            >
              <Palette className="w-4 h-4" />
              <span className="hidden sm:inline">Branding</span>
            </Button>

            {/* Preview Toggle */}
            <Button
              onClick={() => setShowPreview(!showPreview)}
              variant={showPreview ? "default" : "outline"}
              size="sm"
              className="gap-2"
              aria-label={showPreview ? "Exit preview mode" : "Preview form"}
              aria-pressed={showPreview}
            >
              {showPreview ? (
                <>
                  <EyeOff className="w-4 h-4" />
                  <span className="hidden sm:inline">Edit</span>
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  <span className="hidden sm:inline">Preview</span>
                </>
              )}
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
                      <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Ctrl+S</kbd>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Toggle preview</span>
                      <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Ctrl+P</kbd>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Undo</span>
                      <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Ctrl+Z</kbd>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Redo</span>
                      <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Ctrl+Y</kbd>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-border text-xs text-muted-foreground">
                    Use <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Cmd</kbd> instead of{" "}
                    <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Ctrl</kbd> on Mac
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Right Section - Save/Publish */}
          <div className="flex items-center gap-2">
            {/* Save as Template Button - Only for existing forms */}
            {isExistingForm && (
              <Button
                onClick={() => setShowTemplateDialog(true)}
                disabled={!canSave}
                variant="outline"
                size="sm"
                className="gap-2"
                aria-label="Save form as template"
                title="Save this form as a reusable template"
              >
                <BookTemplate className="w-4 h-4" />
                <span className="hidden lg:inline">Save as Template</span>
              </Button>
            )}

            <Button
              onClick={() => onSave(false)}
              disabled={!canSave || isSaving}
              variant="secondary"
              size="sm"
              className="gap-2"
              aria-label="Save form as draft"
            >
              {isSaving ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  <span className="hidden sm:inline">Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span className="hidden sm:inline">Save Draft</span>
                </>
              )}
            </Button>

            <Button
              onClick={() => onSave(true)}
              disabled={!canSave || isSaving}
              size="sm"
              className="gap-2"
              aria-label="Publish form"
            >
              {isSaving ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  <span className="hidden sm:inline">Publishing...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Publish</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Validation Warnings */}
        {!canSave && (
          <div className="mt-3 p-2 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-md">
            <div className="flex items-center gap-2 text-xs text-orange-700 dark:text-orange-300">
              <div className="flex items-center gap-2 flex-wrap">
                {!title.trim() && (
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-orange-500 rounded-full" />
                    Title required
                  </span>
                )}
                {fields.length === 0 && (
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-orange-500 rounded-full" />
                    Add at least one field
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Save as Template Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Save as Template</DialogTitle>
            <DialogDescription>
              Save this form as a reusable template. Templates can be used to quickly create new forms
              with the same structure.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Template Name */}
            <div className="space-y-2">
              <Label htmlFor="template-name">
                Template Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="template-name"
                placeholder="e.g., Community Survey Template"
                value={templateData.name}
                onChange={(e) => setTemplateData({ ...templateData, name: e.target.value })}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="template-description">Description</Label>
              <Textarea
                id="template-description"
                placeholder="Describe what this template is for..."
                value={templateData.description}
                onChange={(e) => setTemplateData({ ...templateData, description: e.target.value })}
                rows={3}
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="template-category">
                Category <span className="text-destructive">*</span>
              </Label>
              <Select
                value={templateData.category}
                onValueChange={(value) => setTemplateData({ ...templateData, category: value })}
              >
                <SelectTrigger id="template-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEMPLATE_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category
                        .split("_")
                        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(" ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="template-tags">Tags</Label>
              <Input
                id="template-tags"
                placeholder="e.g., survey, feedback, public (comma-separated)"
                value={templateData.tags}
                onChange={(e) => setTemplateData({ ...templateData, tags: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">Separate multiple tags with commas</p>
            </div>

            {/* Public Toggle */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="template-public"
                checked={templateData.is_public}
                onCheckedChange={(checked) =>
                  setTemplateData({ ...templateData, is_public: checked as boolean })
                }
              />
              <Label htmlFor="template-public" className="text-sm font-normal cursor-pointer">
                Make this template public (visible to all users in your organization)
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveAsTemplate}
              disabled={!templateData.name.trim() || saveAsTemplate.isPending}
            >
              {saveAsTemplate.isPending ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <BookTemplate className="w-4 h-4 mr-2" />
                  Save Template
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
