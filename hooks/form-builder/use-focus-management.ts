/**
 * Focus Management Hook
 * Manages focus state and provides utilities for accessible focus handling
 */

import { useCallback, useRef, useEffect } from "react"

export interface FocusManagementOptions {
  /**
   * ID of the currently selected field
   */
  selectedFieldId: string | null

  /**
   * Whether to auto-focus when selection changes
   */
  autoFocus?: boolean

  /**
   * Callback when focus trap is activated
   */
  onFocusTrap?: (active: boolean) => void
}

export function useFocusManagement(options: FocusManagementOptions) {
  const { selectedFieldId, autoFocus = true, onFocusTrap } = options

  const previousFocusRef = useRef<HTMLElement | null>(null)
  const focusTrapRef = useRef<HTMLElement | null>(null)

  /**
   * Store the currently focused element
   */
  const storeFocus = useCallback(() => {
    previousFocusRef.current = document.activeElement as HTMLElement
  }, [])

  /**
   * Restore focus to the previously focused element
   */
  const restoreFocus = useCallback(() => {
    if (previousFocusRef.current && document.body.contains(previousFocusRef.current)) {
      previousFocusRef.current.focus()
      previousFocusRef.current = null
    }
  }, [])

  /**
   * Focus an element by selector
   */
  const focusElement = useCallback((selector: string) => {
    const element = document.querySelector(selector) as HTMLElement
    if (element) {
      element.focus()
      return true
    }
    return false
  }, [])

  /**
   * Focus the selected field
   */
  const focusSelectedField = useCallback(() => {
    if (!selectedFieldId) return false

    // Try to focus the field editor
    const fieldEditor = document.querySelector(
      `[data-field-id="${selectedFieldId}"]`
    ) as HTMLElement

    if (fieldEditor) {
      // Find the first focusable element within the field editor
      const focusable = fieldEditor.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement

      if (focusable) {
        focusable.focus()
        return true
      }

      // Fallback: make the field editor itself focusable and focus it
      fieldEditor.setAttribute("tabindex", "0")
      fieldEditor.focus()
      return true
    }

    return false
  }, [selectedFieldId])

  /**
   * Auto-focus the selected field when it changes
   */
  useEffect(() => {
    if (autoFocus && selectedFieldId) {
      // Small delay to allow DOM updates
      const timeoutId = setTimeout(() => {
        focusSelectedField()
      }, 100)

      return () => clearTimeout(timeoutId)
    }
  }, [selectedFieldId, autoFocus, focusSelectedField])

  /**
   * Set up focus trap for modal-like interactions
   */
  const setupFocusTrap = useCallback(
    (element: HTMLElement | null) => {
      if (!element) {
        focusTrapRef.current = null
        onFocusTrap?.(false)
        return
      }

      focusTrapRef.current = element
      onFocusTrap?.(true)

      // Store current focus
      storeFocus()

      // Get all focusable elements within the trap
      const focusableElements = element.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )

      if (focusableElements.length === 0) return

      const firstElement = focusableElements[0] as HTMLElement
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

      // Focus first element
      firstElement.focus()

      // Handle Tab key to trap focus
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key !== "Tab") return

        if (event.shiftKey) {
          // Shift+Tab: focus last element if on first
          if (document.activeElement === firstElement) {
            event.preventDefault()
            lastElement.focus()
          }
        } else {
          // Tab: focus first element if on last
          if (document.activeElement === lastElement) {
            event.preventDefault()
            firstElement.focus()
          }
        }
      }

      element.addEventListener("keydown", handleKeyDown)

      return () => {
        element.removeEventListener("keydown", handleKeyDown)
      }
    },
    [storeFocus, onFocusTrap]
  )

  /**
   * Release focus trap
   */
  const releaseFocusTrap = useCallback(() => {
    focusTrapRef.current = null
    onFocusTrap?.(false)
    restoreFocus()
  }, [restoreFocus, onFocusTrap])

  /**
   * Get all focusable elements in a container
   */
  const getFocusableElements = useCallback((container: HTMLElement) => {
    return Array.from(
      container.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])'
      )
    )
  }, [])

  /**
   * Focus the first element in a container
   */
  const focusFirst = useCallback(
    (container: HTMLElement) => {
      const elements = getFocusableElements(container)
      if (elements.length > 0) {
        elements[0].focus()
        return true
      }
      return false
    },
    [getFocusableElements]
  )

  /**
   * Focus the last element in a container
   */
  const focusLast = useCallback(
    (container: HTMLElement) => {
      const elements = getFocusableElements(container)
      if (elements.length > 0) {
        elements[elements.length - 1].focus()
        return true
      }
      return false
    },
    [getFocusableElements]
  )

  /**
   * Check if an element is currently focused
   */
  const isFocused = useCallback((element: HTMLElement) => {
    return document.activeElement === element
  }, [])

  /**
   * Check if focus is within a container
   */
  const isFocusWithin = useCallback((container: HTMLElement) => {
    return container.contains(document.activeElement)
  }, [])

  return {
    storeFocus,
    restoreFocus,
    focusElement,
    focusSelectedField,
    setupFocusTrap,
    releaseFocusTrap,
    getFocusableElements,
    focusFirst,
    focusLast,
    isFocused,
    isFocusWithin,
  }
}
