import { useState, useCallback } from "react"

export interface ValidationRule<T = any> {
  validate: (value: T) => boolean | Promise<boolean>
  message: string
}

export interface FieldValidation {
  rules: ValidationRule[]
  error: string | null
  isValid: boolean
}

export interface UseFormValidationReturn<T extends Record<string, any>> {
  errors: Record<keyof T, string | null>
  isValid: boolean
  validate: (field?: keyof T) => Promise<boolean>
  validateField: (field: keyof T, value: any) => Promise<boolean>
  setError: (field: keyof T, error: string | null) => void
  clearError: (field: keyof T) => void
  clearAllErrors: () => void
  reset: () => void
}

/**
 * Form validation hook with async support
 * @param validationRules - Map of field names to validation rules
 * @param values - Form values to validate
 */
export function useFormValidation<T extends Record<string, any>>(
  validationRules: Record<keyof T, ValidationRule[]>,
  values: T
): UseFormValidationReturn<T> {
  const [errors, setErrors] = useState<Record<keyof T, string | null>>(() => {
    const initialErrors: any = {}
    Object.keys(validationRules).forEach((key) => {
      initialErrors[key] = null
    })
    return initialErrors
  })

  const validateField = useCallback(
    async (field: keyof T, value: any): Promise<boolean> => {
      const rules = validationRules[field]
      if (!rules || rules.length === 0) return true

      for (const rule of rules) {
        const isValid = await rule.validate(value)
        if (!isValid) {
          setErrors((prev) => ({ ...prev, [field]: rule.message }))
          return false
        }
      }

      setErrors((prev) => ({ ...prev, [field]: null }))
      return true
    },
    [validationRules]
  )

  const validate = useCallback(
    async (field?: keyof T): Promise<boolean> => {
      if (field) {
        return validateField(field, values[field])
      }

      // Validate all fields
      const fields = Object.keys(validationRules) as (keyof T)[]
      const results = await Promise.all(fields.map((f) => validateField(f, values[f])))

      return results.every((r) => r)
    },
    [validationRules, values, validateField]
  )

  const setError = useCallback((field: keyof T, error: string | null) => {
    setErrors((prev) => ({ ...prev, [field]: error }))
  }, [])

  const clearError = useCallback((field: keyof T) => {
    setErrors((prev) => ({ ...prev, [field]: null }))
  }, [])

  const clearAllErrors = useCallback(() => {
    const clearedErrors: any = {}
    Object.keys(errors).forEach((key) => {
      clearedErrors[key] = null
    })
    setErrors(clearedErrors)
  }, [errors])

  const reset = useCallback(() => {
    clearAllErrors()
  }, [clearAllErrors])

  const isValid = Object.values(errors).every((error) => error === null)

  return {
    errors,
    isValid,
    validate,
    validateField,
    setError,
    clearError,
    clearAllErrors,
    reset,
  }
}

// Common validation rules
export const commonRules = {
  required: (message = "This field is required"): ValidationRule => ({
    validate: (value) => {
      if (typeof value === "string") return value.trim().length > 0
      if (Array.isArray(value)) return value.length > 0
      return value !== null && value !== undefined
    },
    message,
  }),

  minLength: (length: number, message?: string): ValidationRule => ({
    validate: (value: string) => value.length >= length,
    message: message || `Must be at least ${length} characters`,
  }),

  maxLength: (length: number, message?: string): ValidationRule => ({
    validate: (value: string) => value.length <= length,
    message: message || `Must be at most ${length} characters`,
  }),

  email: (message = "Invalid email address"): ValidationRule => ({
    validate: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message,
  }),

  url: (message = "Invalid URL"): ValidationRule => ({
    validate: (value: string) => {
      try {
        new URL(value)
        return true
      } catch {
        return false
      }
    },
    message,
  }),

  min: (min: number, message?: string): ValidationRule => ({
    validate: (value: number) => value >= min,
    message: message || `Must be at least ${min}`,
  }),

  max: (max: number, message?: string): ValidationRule => ({
    validate: (value: number) => value <= max,
    message: message || `Must be at most ${max}`,
  }),

  pattern: (pattern: RegExp, message = "Invalid format"): ValidationRule => ({
    validate: (value: string) => pattern.test(value),
    message,
  }),
}
