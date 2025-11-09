"use client"

import { useEffect, useRef, useState, useCallback } from "react"

interface UseAutosaveOptions<T> {
  data: T
  key: string
  interval?: number
  onSave?: (data: T) => Promise<void> | void
  enabled?: boolean
}

interface UseAutosaveReturn {
  isDirty: boolean
  isSaving: boolean
  lastSaved: Date | null
  save: () => Promise<void>
  clearDraft: () => void
  hasDraft: boolean
}

/**
 * Custom hook for autosaving data to localStorage with dirty state detection
 * and navigation guards to prevent data loss
 *
 * @param options Configuration options
 * @returns Autosave state and control functions
 */
export function useAutosave<T>({
  data,
  key,
  interval = 30000, // 30 seconds default
  onSave,
  enabled = true,
}: UseAutosaveOptions<T>): UseAutosaveReturn {
  const [isDirty, setIsDirty] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [hasDraft, setHasDraft] = useState(false)
  const initialDataRef = useRef<T>(data)
  const saveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // Check for existing draft on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const draft = localStorage.getItem(key)
      setHasDraft(!!draft)
    }
  }, [key])

  // Detect changes and mark as dirty
  useEffect(() => {
    const hasChanged = JSON.stringify(data) !== JSON.stringify(initialDataRef.current)
    setIsDirty(hasChanged)
  }, [data])

  // Save function
  const save = useCallback(async () => {
    if (!enabled || !isDirty) return

    setIsSaving(true)
    try {
      // Save to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem(key, JSON.stringify(data))
      }

      // Call optional save callback
      if (onSave) {
        await onSave(data)
      }

      setLastSaved(new Date())
      setIsDirty(false)
      setHasDraft(true)
    } catch (error) {
      console.error("Autosave failed:", error)
    } finally {
      setIsSaving(false)
    }
  }, [data, enabled, isDirty, key, onSave])

  // Autosave at interval
  useEffect(() => {
    if (!enabled || !isDirty) return

    saveTimeoutRef.current = setTimeout(() => {
      save()
    }, interval)

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [data, enabled, isDirty, interval, save])

  // Clear draft
  const clearDraft = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(key)
      setHasDraft(false)
      setIsDirty(false)
      initialDataRef.current = data
    }
  }, [key, data])

  // Navigation guard - warn before leaving with unsaved changes
  useEffect(() => {
    if (!enabled || !isDirty) return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ""
      return ""
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [enabled, isDirty])

  return {
    isDirty,
    isSaving,
    lastSaved,
    save,
    clearDraft,
    hasDraft,
  }
}

/**
 * Hook to load draft data from localStorage
 *
 * @param key LocalStorage key
 * @returns Draft data if available, null otherwise
 */
export function useDraft<T>(key: string): T | null {
  const [draft, setDraft] = useState<T | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(key)
      if (stored) {
        try {
          setDraft(JSON.parse(stored))
        } catch (error) {
          console.error("Failed to parse draft:", error)
        }
      }
    }
  }, [key])

  return draft
}

/**
 * Hook for debounced value changes
 *
 * @param value The value to debounce
 * @param delay Delay in milliseconds
 * @returns Debounced value
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}
