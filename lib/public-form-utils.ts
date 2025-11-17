/**
 * Utility functions for public form handling
 */

import type { FormField } from "./types"

export interface ValidationError {
  field: string
  messages: string[]
}

export interface ValidationResult {
  isValid: boolean
  errors: Record<string, string[]>
}

/**
 * Validate form data against form schema
 */
export function validateFormData(
  fields: FormField[],
  data: Record<string, any>
): ValidationResult {
  const errors: Record<string, string[]> = {}

  fields.forEach((field) => {
    const value = data[field.id]
    const fieldErrors: string[] = []

    // Check required fields
    if (field.required && (value === undefined || value === null || value === "")) {
      fieldErrors.push("This field is required")
    }

    // Skip further validation if field is empty and not required
    if (!value && !field.required) {
      return
    }

    // Type-specific validation
    switch (field.type) {
      case "email":
        if (value && !isValidEmail(value)) {
          fieldErrors.push("Invalid email address")
        }
        break

      case "number":
        if (value && isNaN(Number(value))) {
          fieldErrors.push("Must be a number")
        }
        if (field.min !== undefined && Number(value) < field.min) {
          fieldErrors.push(`Must be at least ${field.min}`)
        }
        if (field.max !== undefined && Number(value) > field.max) {
          fieldErrors.push(`Must be at most ${field.max}`)
        }
        break

      case "text":
      case "textarea":
        if (field.validation?.minLength && value.length < field.validation.minLength) {
          fieldErrors.push(`Must be at least ${field.validation.minLength} characters`)
        }
        if (field.validation?.maxLength && value.length > field.validation.maxLength) {
          fieldErrors.push(`Must be at most ${field.validation.maxLength} characters`)
        }
        if (field.validation?.pattern) {
          const regex = new RegExp(field.validation.pattern)
          if (!regex.test(value)) {
            fieldErrors.push("Invalid format")
          }
        }
        break

      case "select":
      case "radio":
        if (value && field.options) {
          const validValues = field.options.map((opt) => opt.value)
          if (!validValues.includes(value)) {
            fieldErrors.push("Invalid selection")
          }
        }
        break

      case "checkbox":
        if (field.options && Array.isArray(value)) {
          const validValues = field.options.map((opt) => opt.value)
          const invalidValues = value.filter((v) => !validValues.includes(v))
          if (invalidValues.length > 0) {
            fieldErrors.push("Invalid selections")
          }
        }
        break

      case "file":
      case "image":
        // File validation handled separately (size, type, etc.)
        break
    }

    if (fieldErrors.length > 0) {
      errors[field.id] = fieldErrors
    }
  })

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Save form draft to localStorage
 */
export function saveDraft(formId: string, data: Record<string, any>): void {
  try {
    const draft = {
      data,
      savedAt: new Date().toISOString(),
    }
    localStorage.setItem(`form-draft-${formId}`, JSON.stringify(draft))
  } catch (error) {
    console.error("Failed to save draft:", error)
  }
}

/**
 * Load form draft from localStorage
 */
export function loadDraft(formId: string): Record<string, any> | null {
  try {
    const draftStr = localStorage.getItem(`form-draft-${formId}`)
    if (!draftStr) return null

    const draft = JSON.parse(draftStr)

    // Only load if less than 24 hours old
    const savedAt = new Date(draft.savedAt)
    const hoursOld = (Date.now() - savedAt.getTime()) / (1000 * 60 * 60)

    if (hoursOld < 24) {
      return draft.data
    }

    // Delete old draft
    clearDraft(formId)
    return null
  } catch (error) {
    console.error("Failed to load draft:", error)
    return null
  }
}

/**
 * Clear form draft from localStorage
 */
export function clearDraft(formId: string): void {
  try {
    localStorage.removeItem(`form-draft-${formId}`)
  } catch (error) {
    console.error("Failed to clear draft:", error)
  }
}

/**
 * Check rate limit for form submissions
 */
export interface RateLimitConfig {
  maxSubmissions: number
  windowMs: number
}

const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  maxSubmissions: 5,
  windowMs: 60 * 60 * 1000, // 1 hour
}

export function checkRateLimit(formId: string, config: RateLimitConfig = DEFAULT_RATE_LIMIT): {
  allowed: boolean
  remaining: number
  resetAt: Date
} {
  try {
    const key = `submissions-${formId}`
    const submissionsStr = localStorage.getItem(key)
    const submissions: number[] = submissionsStr ? JSON.parse(submissionsStr) : []

    // Filter to only recent submissions within the window
    const now = Date.now()
    const recentSubmissions = submissions.filter(
      (timestamp) => now - timestamp < config.windowMs
    )

    const remaining = Math.max(0, config.maxSubmissions - recentSubmissions.length)
    const allowed = recentSubmissions.length < config.maxSubmissions

    // Calculate reset time (oldest submission + window)
    const resetAt = recentSubmissions.length > 0
      ? new Date(Math.min(...recentSubmissions) + config.windowMs)
      : new Date(now + config.windowMs)

    return {
      allowed,
      remaining,
      resetAt,
    }
  } catch (error) {
    console.error("Failed to check rate limit:", error)
    // On error, allow the submission
    return {
      allowed: true,
      remaining: DEFAULT_RATE_LIMIT.maxSubmissions,
      resetAt: new Date(Date.now() + DEFAULT_RATE_LIMIT.windowMs),
    }
  }
}

/**
 * Record a submission for rate limiting
 */
export function recordSubmission(formId: string, config: RateLimitConfig = DEFAULT_RATE_LIMIT): void {
  try {
    const key = `submissions-${formId}`
    const submissionsStr = localStorage.getItem(key)
    const submissions: number[] = submissionsStr ? JSON.parse(submissionsStr) : []

    // Add current submission
    const now = Date.now()
    submissions.push(now)

    // Filter to only keep recent submissions
    const recentSubmissions = submissions.filter(
      (timestamp) => now - timestamp < config.windowMs
    )

    localStorage.setItem(key, JSON.stringify(recentSubmissions))
  } catch (error) {
    console.error("Failed to record submission:", error)
  }
}

/**
 * Sanitize user input for display
 */
export function sanitizeInput(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
}
