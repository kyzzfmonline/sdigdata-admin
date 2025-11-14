/**
 * Security utilities for input sanitization and XSS prevention
 */

import DOMPurify from "isomorphic-dompurify"

/**
 * Sanitize HTML string to prevent XSS attacks
 */
export const sanitizeHtml = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [], // Strip all HTML tags
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  })
}

/**
 * Sanitize text for safe display (allows basic formatting)
 */
export const sanitizeText = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ["b", "i", "em", "strong", "br"],
    ALLOWED_ATTR: [],
  })
}

/**
 * Sanitize URL to prevent javascript: and data: protocols
 */
export const sanitizeUrl = (url: string): string => {
  const sanitized = DOMPurify.sanitize(url)

  // Only allow http, https, and mailto protocols
  try {
    const parsed = new URL(sanitized)
    if (!["http:", "https:", "mailto:"].includes(parsed.protocol)) {
      return ""
    }
    return sanitized
  } catch {
    // Invalid URL
    return ""
  }
}

/**
 * Sanitize form field object
 */
export const sanitizeFormField = <T extends Record<string, any>>(field: T): T => {
  const sanitized: any = { ...field }

  // Sanitize string fields
  if ("label" in sanitized && typeof sanitized.label === "string") {
    sanitized.label = sanitizeHtml(sanitized.label)
  }

  if ("placeholder" in sanitized && typeof sanitized.placeholder === "string") {
    sanitized.placeholder = sanitizeHtml(sanitized.placeholder)
  }

  if ("helpText" in sanitized && typeof sanitized.helpText === "string") {
    sanitized.helpText = sanitizeText(sanitized.helpText)
  }

  // Sanitize options
  if ("options" in sanitized && Array.isArray(sanitized.options)) {
    sanitized.options = sanitized.options.map((opt: any) => ({
      ...opt,
      label: typeof opt.label === "string" ? sanitizeHtml(opt.label) : opt.label,
      value: typeof opt.value === "string" ? sanitizeHtml(opt.value) : opt.value,
    }))
  }

  return sanitized as T
}

/**
 * Validate field ID format (alphanumeric, underscore, hyphen only)
 */
export const isValidFieldId = (id: string): boolean => {
  return /^[a-zA-Z0-9_-]+$/.test(id)
}

/**
 * Generate secure field ID using crypto
 */
export const generateFieldId = (): string => {
  if (typeof window !== "undefined" && window.crypto) {
    return `field_${crypto.randomUUID()}`
  }
  // Fallback for server-side rendering
  return `field_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Validate form data against potential security issues
 */
export const validateFormSecurity = (data: any): { isValid: boolean; violations: string[] } => {
  const violations: string[] = []

  const checkString = (value: string, fieldName: string) => {
    // Check for script tags
    if (/<script[\s\S]*?>[\s\S]*?<\/script>/gi.test(value)) {
      violations.push(`${fieldName}: Script tags detected`)
    }

    // Check for event handlers
    if (/on\w+\s*=\s*["']?[^"']*["']?/gi.test(value)) {
      violations.push(`${fieldName}: Event handler detected`)
    }

    // Check for data URIs (potential XSS vector)
    if (/data:text\/html/gi.test(value)) {
      violations.push(`${fieldName}: Data URI detected`)
    }
  }

  const checkObject = (obj: any, path = "") => {
    for (const key in obj) {
      const value = obj[key]
      const currentPath = path ? `${path}.${key}` : key

      if (typeof value === "string") {
        checkString(value, currentPath)
      } else if (typeof value === "object" && value !== null) {
        checkObject(value, currentPath)
      }
    }
  }

  checkObject(data)

  return {
    isValid: violations.length === 0,
    violations,
  }
}

/**
 * Rate limiter for client-side operations
 */
export class ClientRateLimiter {
  private timestamps: number[] = []
  private maxRequests: number
  private windowMs: number

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests
    this.windowMs = windowMs
  }

  canProceed(): boolean {
    const now = Date.now()

    // Remove timestamps outside the window
    this.timestamps = this.timestamps.filter((ts) => now - ts < this.windowMs)

    if (this.timestamps.length >= this.maxRequests) {
      return false
    }

    this.timestamps.push(now)
    return true
  }

  reset(): void {
    this.timestamps = []
  }
}
