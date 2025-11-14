/**
 * Keyboard Navigation Hook
 * Provides comprehensive keyboard navigation for the form builder
 */

import { useEffect, useCallback, useRef } from "react"
import type { FormField } from "@/lib/types"

export interface KeyboardNavigationOptions {
  /**
   * Current list of fields
   */
  fields: FormField[]

  /**
   * Currently selected field ID
   */
  selectedFieldId: string | null

  /**
   * Callback to select a field
   */
  onSelectField: (id: string | null) => void

  /**
   * Callback to delete a field
   */
  onDeleteField: (id: string) => void

  /**
   * Callback to duplicate a field
   */
  onDuplicateField: (id: string) => void

  /**
   * Callback to move field up
   */
  onMoveFieldUp: (id: string) => void

  /**
   * Callback to move field down
   */
  onMoveFieldDown: (id: string) => void

  /**
   * Callback to save form
   */
  onSave: () => void

  /**
   * Callback to toggle preview
   */
  onTogglePreview: () => void

  /**
   * Callback to undo
   */
  onUndo: () => void

  /**
   * Callback to redo
   */
  onRedo: () => void

  /**
   * Whether keyboard navigation is enabled
   */
  enabled?: boolean
}

export function useKeyboardNavigation(options: KeyboardNavigationOptions) {
  const {
    fields,
    selectedFieldId,
    onSelectField,
    onDeleteField,
    onDuplicateField,
    onMoveFieldUp,
    onMoveFieldDown,
    onSave,
    onTogglePreview,
    onUndo,
    onRedo,
    enabled = true,
  } = options

  const lastAnnouncementRef = useRef<string>("")

  /**
   * Announce to screen readers
   */
  const announce = useCallback((message: string) => {
    // Avoid duplicate announcements
    if (message === lastAnnouncementRef.current) return

    lastAnnouncementRef.current = message

    // Create or update live region
    let liveRegion = document.getElementById("form-builder-announcements")
    if (!liveRegion) {
      liveRegion = document.createElement("div")
      liveRegion.id = "form-builder-announcements"
      liveRegion.setAttribute("role", "status")
      liveRegion.setAttribute("aria-live", "polite")
      liveRegion.setAttribute("aria-atomic", "true")
      liveRegion.className = "sr-only"
      document.body.appendChild(liveRegion)
    }

    liveRegion.textContent = message
  }, [])

  /**
   * Navigate to next field
   */
  const navigateNext = useCallback(() => {
    if (fields.length === 0) return

    const currentIndex = selectedFieldId ? fields.findIndex((f) => f.id === selectedFieldId) : -1

    const nextIndex = currentIndex >= fields.length - 1 ? 0 : currentIndex + 1
    const nextField = fields[nextIndex]

    if (nextField) {
      onSelectField(nextField.id)
      announce(`Selected ${nextField.label || "field"}, ${nextIndex + 1} of ${fields.length}`)
    }
  }, [fields, selectedFieldId, onSelectField, announce])

  /**
   * Navigate to previous field
   */
  const navigatePrevious = useCallback(() => {
    if (fields.length === 0) return

    const currentIndex = selectedFieldId ? fields.findIndex((f) => f.id === selectedFieldId) : -1

    const prevIndex = currentIndex <= 0 ? fields.length - 1 : currentIndex - 1
    const prevField = fields[prevIndex]

    if (prevField) {
      onSelectField(prevField.id)
      announce(`Selected ${prevField.label || "field"}, ${prevIndex + 1} of ${fields.length}`)
    }
  }, [fields, selectedFieldId, onSelectField, announce])

  /**
   * Navigate to first field
   */
  const navigateFirst = useCallback(() => {
    if (fields.length === 0) return

    const firstField = fields[0]
    if (firstField) {
      onSelectField(firstField.id)
      announce(`Selected first field: ${firstField.label || "field"}`)
    }
  }, [fields, onSelectField, announce])

  /**
   * Navigate to last field
   */
  const navigateLast = useCallback(() => {
    if (fields.length === 0) return

    const lastField = fields[fields.length - 1]
    if (lastField) {
      onSelectField(lastField.id)
      announce(`Selected last field: ${lastField.label || "field"}`)
    }
  }, [fields, onSelectField, announce])

  /**
   * Handle field deletion
   */
  const handleDelete = useCallback(() => {
    if (!selectedFieldId) return

    const field = fields.find((f) => f.id === selectedFieldId)
    if (field) {
      onDeleteField(selectedFieldId)
      announce(`Deleted ${field.label || "field"}`)
    }
  }, [selectedFieldId, fields, onDeleteField, announce])

  /**
   * Handle field duplication
   */
  const handleDuplicate = useCallback(() => {
    if (!selectedFieldId) return

    const field = fields.find((f) => f.id === selectedFieldId)
    if (field) {
      onDuplicateField(selectedFieldId)
      announce(`Duplicated ${field.label || "field"}`)
    }
  }, [selectedFieldId, fields, onDuplicateField, announce])

  /**
   * Handle move up
   */
  const handleMoveUp = useCallback(() => {
    if (!selectedFieldId) return

    const currentIndex = fields.findIndex((f) => f.id === selectedFieldId)
    if (currentIndex <= 0) {
      announce("Already at top")
      return
    }

    const field = fields[currentIndex]
    onMoveFieldUp(selectedFieldId)
    announce(`Moved ${field.label || "field"} up to position ${currentIndex}`)
  }, [selectedFieldId, fields, onMoveFieldUp, announce])

  /**
   * Handle move down
   */
  const handleMoveDown = useCallback(() => {
    if (!selectedFieldId) return

    const currentIndex = fields.findIndex((f) => f.id === selectedFieldId)
    if (currentIndex >= fields.length - 1) {
      announce("Already at bottom")
      return
    }

    const field = fields[currentIndex]
    onMoveFieldDown(selectedFieldId)
    announce(`Moved ${field.label || "field"} down to position ${currentIndex + 2}`)
  }, [selectedFieldId, fields, onMoveFieldDown, announce])

  /**
   * Handle keyboard events
   */
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't interfere with input fields
      const target = event.target as HTMLElement
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.contentEditable === "true"
      ) {
        // Allow global shortcuts
        const isMod = event.metaKey || event.ctrlKey

        if (isMod) {
          switch (event.key.toLowerCase()) {
            case "s":
              event.preventDefault()
              onSave()
              announce("Form saved")
              return
            case "p":
              event.preventDefault()
              onTogglePreview()
              announce("Toggled preview mode")
              return
            case "z":
              if (event.shiftKey) {
                event.preventDefault()
                onRedo()
                announce("Redo")
              } else {
                event.preventDefault()
                onUndo()
                announce("Undo")
              }
              return
            case "y":
              event.preventDefault()
              onRedo()
              announce("Redo")
              return
          }
        }

        return
      }

      const isMod = event.metaKey || event.ctrlKey

      // Global shortcuts (work anywhere)
      if (isMod) {
        switch (event.key.toLowerCase()) {
          case "s":
            event.preventDefault()
            onSave()
            announce("Form saved")
            return
          case "p":
            event.preventDefault()
            onTogglePreview()
            announce("Toggled preview mode")
            return
          case "z":
            if (event.shiftKey) {
              event.preventDefault()
              onRedo()
              announce("Redo")
            } else {
              event.preventDefault()
              onUndo()
              announce("Undo")
            }
            return
          case "y":
            event.preventDefault()
            onRedo()
            announce("Redo")
            return
        }
      }

      // Field navigation shortcuts (only when not in input)
      switch (event.key) {
        case "ArrowDown":
          if (event.altKey) {
            event.preventDefault()
            handleMoveDown()
          } else if (!event.shiftKey && !event.ctrlKey && !event.metaKey) {
            event.preventDefault()
            navigateNext()
          }
          break

        case "ArrowUp":
          if (event.altKey) {
            event.preventDefault()
            handleMoveUp()
          } else if (!event.shiftKey && !event.ctrlKey && !event.metaKey) {
            event.preventDefault()
            navigatePrevious()
          }
          break

        case "Home":
          if (!event.shiftKey && !event.ctrlKey && !event.metaKey) {
            event.preventDefault()
            navigateFirst()
          }
          break

        case "End":
          if (!event.shiftKey && !event.ctrlKey && !event.metaKey) {
            event.preventDefault()
            navigateLast()
          }
          break

        case "Delete":
        case "Backspace":
          if (selectedFieldId && !event.shiftKey && !event.ctrlKey && !event.metaKey) {
            event.preventDefault()
            handleDelete()
          }
          break

        case "d":
          if (isMod && selectedFieldId) {
            event.preventDefault()
            handleDuplicate()
          }
          break

        case "Escape":
          event.preventDefault()
          onSelectField(null)
          announce("Deselected field")
          break
      }
    },
    [
      selectedFieldId,
      navigateNext,
      navigatePrevious,
      navigateFirst,
      navigateLast,
      handleDelete,
      handleDuplicate,
      handleMoveUp,
      handleMoveDown,
      onSave,
      onTogglePreview,
      onUndo,
      onRedo,
      onSelectField,
      announce,
    ]
  )

  /**
   * Set up keyboard event listener
   */
  useEffect(() => {
    if (!enabled) return

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [enabled, handleKeyDown])

  return {
    announce,
    navigateNext,
    navigatePrevious,
    navigateFirst,
    navigateLast,
  }
}
