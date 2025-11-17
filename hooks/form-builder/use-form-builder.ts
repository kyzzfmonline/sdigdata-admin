/**
 * Core Form Builder Hook
 * Manages form state, field operations, and integrates all sub-hooks
 */

import { useState, useCallback, useEffect, useRef } from "react"
import type { FormField, FormBranding, Form } from "@/lib/types"
import type { ConditionalRule, ValidationRule } from "@/lib/types-extended"
import type { LockStatus } from "@/hooks/forms/use-form-locking"
import { generateFieldId, sanitizeFormField } from "@/lib/security"
import { useFormHistory } from "./use-form-history"
import { formsAPI } from "@/lib/api"
import { toast } from "@/hooks/use-toast"
import { useStore } from "@/lib/store"

interface UseFormBuilderOptions {
  initialForm?: Form
  onSave?: (formData: any) => Promise<void>
  autoLock?: boolean
  enableAutosave?: boolean
  autosaveInterval?: number
}

export function useFormBuilder(options: UseFormBuilderOptions = {}) {
  const {
    initialForm,
    onSave,
    autoLock = true,
    enableAutosave = true,
    autosaveInterval = 30000,
  } = options
  const currentUser = useStore((state) => state.user)

  // Core form state
  const [title, setTitle] = useState(initialForm?.title || "")
  const [description, setDescription] = useState(initialForm?.description || "")
  const [fields, setFields] = useState<FormField[]>(initialForm?.schema?.fields || [])
  const [branding, setBranding] = useState<FormBranding>(initialForm?.schema?.branding || {})
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)

  // Feature state
  const [conditionalRules, setConditionalRules] = useState<ConditionalRule[]>([])
  const [validationRules, setValidationRules] = useState<ValidationRule[]>([])
  const [lockStatus, setLockStatus] = useState<LockStatus | null>(null)
  const [currentVersion, setCurrentVersion] = useState(initialForm?.version || 1)

  // UI state
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingRules, setIsLoadingRules] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showBrandingEditor, setShowBrandingEditor] = useState(false)

  const formId = initialForm?.id
  const lockCheckInterval = useRef<NodeJS.Timeout | null>(null)

  // Initialize command history with callbacks
  const {
    executeCommand,
    undo: undoCommand,
    redo: redoCommand,
    canUndo,
    canRedo,
    clearHistory,
  } = useFormHistory({
    maxHistorySize: 50,
    onUndo: (command) => {
      // Restore previous state
      switch (command.type) {
        case "add_field":
          setFields(command.data.previous)
          break
        case "remove_field":
          setFields(command.data.previous)
          break
        case "update_field":
          setFields(command.data.previous)
          break
        case "reorder_fields":
          setFields(command.data.previous)
          break
        case "update_branding":
          setBranding(command.data.previous)
          break
        case "update_title":
          setTitle(command.data.previous)
          break
        case "update_description":
          setDescription(command.data.previous)
          break
      }
    },
    onRedo: (command) => {
      // Apply current state
      switch (command.type) {
        case "add_field":
          setFields(command.data.current)
          break
        case "remove_field":
          setFields(command.data.current)
          break
        case "update_field":
          setFields(command.data.current)
          break
        case "reorder_fields":
          setFields(command.data.current)
          break
        case "update_branding":
          setBranding(command.data.current)
          break
        case "update_title":
          setTitle(command.data.current)
          break
        case "update_description":
          setDescription(command.data.current)
          break
      }
    },
  })

  // Load conditional rules and validation rules
  useEffect(() => {
    if (!formId) return

    const loadRules = async () => {
      setIsLoadingRules(true)
      try {
        const [conditionalRes, validationRes] = await Promise.all([
          formsAPI.getConditionalRules(formId),
          formsAPI.getValidationRules(formId),
        ])

        if (conditionalRes.data.success) {
          setConditionalRules(conditionalRes.data.data || [])
        }

        if (validationRes.data.success) {
          setValidationRules(validationRes.data.data || [])
        }
      } catch (error) {
        console.error("Failed to load rules:", error)
      } finally {
        setIsLoadingRules(false)
      }
    }

    loadRules()
  }, [formId])

  // Acquire lock on mount if autoLock is enabled
  useEffect(() => {
    if (!formId || !autoLock) return

    const acquireLock = async () => {
      try {
        // First acquire the lock
        await formsAPI.acquireLock(formId)

        // Then get the lock status
        const statusRes = await formsAPI.getLockStatus(formId)
        if (statusRes.data.success && statusRes.data.data) {
          setLockStatus(statusRes.data.data)
        }

        // Set up periodic lock status check
        lockCheckInterval.current = setInterval(async () => {
          try {
            const statusRes = await formsAPI.getLockStatus(formId)
            if (statusRes.data.success && statusRes.data.data) {
              setLockStatus(statusRes.data.data)
            }
          } catch (error) {
            console.error("Lock status check failed:", error)
          }
        }, 30000) // Check every 30 seconds
      } catch (error: any) {
        if (error.response?.status === 409) {
          // Form is locked by another user
          const lockedBy = error.response?.data?.locked_by
          toast({
            title: "Form Locked",
            description: `This form is currently being edited by ${lockedBy?.username || "another user"}`,
            variant: "destructive",
          })
        }
      }
    }

    acquireLock()

    return () => {
      if (lockCheckInterval.current) {
        clearInterval(lockCheckInterval.current)
      }
      // Release lock on unmount
      if (formId) {
        formsAPI.releaseLock(formId).catch(console.error)
      }
    }
  }, [formId, autoLock, currentUser])

  /**
   * Add a new field
   */
  const addField = useCallback(
    (type: FormField["type"], config?: Partial<FormField>) => {
      const newField: FormField = {
        id: generateFieldId(),
        type,
        label: config?.label || `${type} field`,
        required: config?.required || false,
        placeholder: config?.placeholder || "",
        helpText: config?.helpText || "",
        options:
          type === "select" || type === "radio" || type === "checkbox"
            ? [
                { label: "Option 1", value: "option_1" },
                { label: "Option 2", value: "option_2" },
              ]
            : undefined,
        min: type === "range" ? 0 : undefined,
        max: type === "range" ? 100 : undefined,
        step: type === "range" ? 1 : undefined,
        ...config,
      }

      // Sanitize the field
      const sanitizedField = sanitizeFormField(newField)

      const previousFields = [...fields]
      const newFields = [...fields, sanitizedField]

      setFields(newFields)
      setSelectedFieldId(sanitizedField.id)

      // Record command for undo
      executeCommand(
        "add_field",
        { previous: previousFields, current: newFields },
        `Added ${type} field`
      )

      return sanitizedField.id
    },
    [fields, executeCommand]
  )

  /**
   * Update a field
   */
  const updateField = useCallback(
    (id: string, updates: Partial<FormField>) => {
      const previousFields = [...fields]
      const sanitizedUpdates = sanitizeFormField(updates as FormField)

      const newFields = fields.map((f) => (f.id === id ? { ...f, ...sanitizedUpdates } : f))

      setFields(newFields)

      executeCommand(
        "update_field",
        { previous: previousFields, current: newFields },
        `Updated field ${id}`
      )
    },
    [fields, executeCommand]
  )

  /**
   * Remove a field
   */
  const removeField = useCallback(
    (id: string) => {
      const previousFields = [...fields]
      const newFields = fields.filter((f) => f.id !== id)

      setFields(newFields)

      if (selectedFieldId === id) {
        setSelectedFieldId(null)
      }

      executeCommand(
        "remove_field",
        { previous: previousFields, current: newFields },
        `Removed field ${id}`
      )
    },
    [fields, selectedFieldId, executeCommand]
  )

  /**
   * Duplicate a field
   */
  const duplicateField = useCallback(
    (id: string) => {
      const fieldToDuplicate = fields.find((f) => f.id === id)
      if (!fieldToDuplicate) return

      const newField = {
        ...fieldToDuplicate,
        id: generateFieldId(),
        label: `${fieldToDuplicate.label} (Copy)`,
      }

      const sanitizedField = sanitizeFormField(newField)
      const previousFields = [...fields]
      const newFields = [...fields, sanitizedField]

      setFields(newFields)
      setSelectedFieldId(sanitizedField.id)

      executeCommand(
        "add_field",
        { previous: previousFields, current: newFields },
        `Duplicated field ${id}`
      )

      return sanitizedField.id
    },
    [fields, executeCommand]
  )

  /**
   * Reorder fields
   */
  const reorderFields = useCallback(
    (newOrder: FormField[]) => {
      const previousFields = [...fields]

      setFields(newOrder)

      executeCommand(
        "reorder_fields",
        { previous: previousFields, current: newOrder },
        "Reordered fields"
      )
    },
    [fields, executeCommand]
  )

  /**
   * Move field up
   */
  const moveFieldUp = useCallback(
    (id: string) => {
      const currentIndex = fields.findIndex((f) => f.id === id)
      if (currentIndex <= 0) return

      const previousFields = [...fields]
      const newFields = [...fields]
      const temp = newFields[currentIndex]
      newFields[currentIndex] = newFields[currentIndex - 1]
      newFields[currentIndex - 1] = temp

      setFields(newFields)

      executeCommand(
        "reorder_fields",
        { previous: previousFields, current: newFields },
        "Moved field up"
      )
    },
    [fields, executeCommand]
  )

  /**
   * Move field down
   */
  const moveFieldDown = useCallback(
    (id: string) => {
      const currentIndex = fields.findIndex((f) => f.id === id)
      if (currentIndex < 0 || currentIndex >= fields.length - 1) return

      const previousFields = [...fields]
      const newFields = [...fields]
      const temp = newFields[currentIndex]
      newFields[currentIndex] = newFields[currentIndex + 1]
      newFields[currentIndex + 1] = temp

      setFields(newFields)

      executeCommand(
        "reorder_fields",
        { previous: previousFields, current: newFields },
        "Moved field down"
      )
    },
    [fields, executeCommand]
  )

  /**
   * Update title with command history
   */
  const updateTitle = useCallback(
    (newTitle: string) => {
      const previousTitle = title

      setTitle(newTitle)

      executeCommand(
        "update_title",
        { previous: previousTitle, current: newTitle },
        "Updated title"
      )
    },
    [title, executeCommand]
  )

  /**
   * Update description with command history
   */
  const updateDescription = useCallback(
    (newDescription: string) => {
      const previousDescription = description

      setDescription(newDescription)

      executeCommand(
        "update_description",
        { previous: previousDescription, current: newDescription },
        "Updated description"
      )
    },
    [description, executeCommand]
  )

  /**
   * Update branding with command history
   */
  const updateBranding = useCallback(
    (updates: Partial<FormBranding>) => {
      const previousBranding = { ...branding }
      const newBranding = { ...branding, ...updates }

      setBranding(newBranding)

      executeCommand(
        "update_branding",
        { previous: previousBranding, current: newBranding },
        "Updated branding"
      )
    },
    [branding, executeCommand]
  )

  /**
   * Validate field uniqueness
   */
  const validateFieldIds = useCallback((): { isValid: boolean; duplicates: string[] } => {
    const ids = fields.map((f) => f.id)
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index)
    return {
      isValid: duplicates.length === 0,
      duplicates: [...new Set(duplicates)],
    }
  }, [fields])

  /**
   * Get selected field
   */
  const selectedField = fields.find((f) => f.id === selectedFieldId) || null

  /**
   * Check if form is dirty (has unsaved changes)
   */
  const isDirty =
    title !== initialForm?.title ||
    description !== initialForm?.description ||
    JSON.stringify(fields) !== JSON.stringify(initialForm?.schema?.fields || []) ||
    JSON.stringify(branding) !== JSON.stringify(initialForm?.schema?.branding || {})

  return {
    // Core state
    title,
    description,
    fields,
    branding,
    selectedFieldId,
    selectedField,

    // Feature state
    conditionalRules,
    validationRules,
    lockStatus,
    currentVersion,

    // UI state
    isSaving,
    isLoadingRules,
    showPreview,
    showBrandingEditor,
    isDirty,

    // Field operations
    addField,
    updateField,
    removeField,
    duplicateField,
    reorderFields,
    moveFieldUp,
    moveFieldDown,
    setSelectedFieldId,

    // Form operations (with command history)
    updateTitle,
    updateDescription,
    updateBranding,

    // Form operations (direct setters - for controlled inputs)
    setTitle,
    setDescription,
    setBranding,

    // UI operations
    setShowPreview,
    setShowBrandingEditor,

    // History operations
    undo: undoCommand,
    redo: redoCommand,
    canUndo,
    canRedo,
    clearHistory,

    // Validation
    validateFieldIds,

    // Metadata
    formId,
  }
}
