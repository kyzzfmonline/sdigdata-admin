/**
 * Form Builder Context Provider
 * Provides form builder state and operations to all child components
 */

"use client"

import React, { createContext, useContext, type ReactNode } from "react"
import type { FormField, FormBranding, Form } from "@/lib/types"
import type { ConditionalRule, ValidationRule } from "@/lib/types-extended"
import type { LockStatus } from "@/hooks/forms/use-form-locking"
import { useFormBuilder } from "@/hooks/form-builder/use-form-builder"

interface FormBuilderContextValue {
  // Core state
  title: string
  description: string
  fields: FormField[]
  branding: FormBranding
  selectedFieldId: string | null
  selectedField: FormField | null

  // Feature state
  conditionalRules: ConditionalRule[]
  validationRules: ValidationRule[]
  lockStatus: LockStatus | null
  currentVersion: number

  // UI state
  isSaving: boolean
  isLoadingRules: boolean
  showPreview: boolean
  showBrandingEditor: boolean
  isDirty: boolean

  // Field operations
  addField: (type: FormField["type"], config?: Partial<FormField>) => string | undefined
  updateField: (id: string, updates: Partial<FormField>) => void
  removeField: (id: string) => void
  duplicateField: (id: string) => string | undefined
  reorderFields: (newOrder: FormField[]) => void
  moveFieldUp: (id: string) => void
  moveFieldDown: (id: string) => void
  setSelectedFieldId: (id: string | null) => void

  // Form operations
  setTitle: (title: string) => void
  setDescription: (description: string) => void
  setBranding: (branding: FormBranding) => void
  updateTitle: (title: string) => void
  updateDescription: (description: string) => void
  updateBranding: (updates: Partial<FormBranding>) => void

  // UI operations
  setShowPreview: (show: boolean) => void
  setShowBrandingEditor: (show: boolean) => void

  // History operations
  undo: () => any
  redo: () => any
  canUndo: boolean
  canRedo: boolean
  clearHistory: () => void

  // Validation
  validateFieldIds: () => { isValid: boolean; duplicates: string[] }

  // Save operations
  markAsSaved: () => void

  // Metadata
  formId?: string
}

const FormBuilderContext = createContext<FormBuilderContextValue | null>(null)

interface FormBuilderProviderProps {
  children: ReactNode
  initialForm?: Form
  onSave?: (formData: any) => Promise<void>
  autoLock?: boolean
  enableAutosave?: boolean
  autosaveInterval?: number
}

export function FormBuilderProvider({
  children,
  initialForm,
  onSave,
  autoLock = true,
  enableAutosave = true,
  autosaveInterval = 30000,
}: FormBuilderProviderProps) {
  const formBuilder = useFormBuilder({
    initialForm,
    onSave,
    autoLock,
    enableAutosave,
    autosaveInterval,
  })

  return <FormBuilderContext.Provider value={formBuilder}>{children}</FormBuilderContext.Provider>
}

/**
 * Hook to access form builder context
 */
export function useFormBuilderContext() {
  const context = useContext(FormBuilderContext)

  if (!context) {
    throw new Error("useFormBuilderContext must be used within FormBuilderProvider")
  }

  return context
}

/**
 * Optional hook that returns null if used outside provider
 */
export function useOptionalFormBuilderContext() {
  return useContext(FormBuilderContext)
}
