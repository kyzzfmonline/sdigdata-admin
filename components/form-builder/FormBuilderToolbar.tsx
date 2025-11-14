/**
 * Form Builder Toolbar
 * Top toolbar with save, publish, preview, and undo/redo actions
 */

"use client"

import { Button } from "@/components/ui/button"
import {
  Save,
  Sparkles,
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
} from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useFormBuilderContext } from "./FormBuilderProvider"
import { Badge } from "@/components/ui/badge"

interface FormBuilderToolbarProps {
  onSave: (publish?: boolean) => Promise<void>
  isSaving: boolean
}

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

  const canSave = title.trim() && fields.length > 0

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
                  <Sparkles className="w-4 h-4" />
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
    </div>
  )
}
