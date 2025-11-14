/**
 * Form Validation Hooks
 * React Query hooks for managing custom validation rules for form fields
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api"
import { queryKeys } from "@/lib/query-client"
import { toast } from "sonner"

// Types
export interface ValidationRule {
  id: string
  form_id: string
  field_id: string
  field_name: string
  name: string
  description?: string
  rule_type: ValidationRuleType
  parameters: Record<string, any>
  error_message: string
  enabled: boolean
  priority: number // Order of validation execution
  created_at: string
  updated_at?: string
}

export type ValidationRuleType =
  | "required"
  | "min_length"
  | "max_length"
  | "min_value"
  | "max_value"
  | "pattern" // Regex
  | "email"
  | "url"
  | "phone"
  | "date_range"
  | "file_size"
  | "file_type"
  | "custom_function" // JavaScript validation
  | "unique" // Check uniqueness in responses
  | "comparison" // Compare with another field
  | "conditional" // Validation depends on other fields

export interface CreateValidationRuleRequest {
  form_id: string
  field_id: string
  name: string
  description?: string
  rule_type: ValidationRuleType
  parameters: Record<string, any>
  error_message: string
  enabled?: boolean
  priority?: number
}

export interface UpdateValidationRuleRequest {
  name?: string
  description?: string
  rule_type?: ValidationRuleType
  parameters?: Record<string, any>
  error_message?: string
  enabled?: boolean
  priority?: number
}

export interface ValidateFieldRequest {
  field_id: string
  value: any
  context?: Record<string, any> // Other field values for contextual validation
}

export interface ValidateFieldResponse {
  valid: boolean
  errors: Array<{
    rule_id: string
    rule_name: string
    error_message: string
  }>
}

export interface ValidateFormRequest {
  form_data: Record<string, any>
}

export interface ValidateFormResponse {
  valid: boolean
  field_errors: Record<
    string,
    Array<{
      rule_id: string
      rule_name: string
      error_message: string
    }>
  >
  summary: {
    total_fields: number
    valid_fields: number
    invalid_fields: number
  }
}

export interface ValidationStats {
  total_rules: number
  enabled_rules: number
  rules_by_type: Record<ValidationRuleType, number>
  rules_by_field: Record<string, number>
  most_validated_fields: Array<{
    field_id: string
    field_name: string
    rule_count: number
  }>
}

// Get all validation rules for a form
export function useValidationRules(formId: string | undefined) {
  return useQuery({
    queryKey: formId ? queryKeys.forms.validationRules(formId) : [],
    queryFn: async () => {
      if (!formId) throw new Error("Form ID is required")
      const response = await apiClient.get(`/forms/${formId}/validation-rules`)
      return response.data.data as ValidationRule[]
    },
    enabled: !!formId,
  })
}

// Get single validation rule
export function useValidationRule(formId: string | undefined, ruleId: string | undefined) {
  return useQuery({
    queryKey: formId && ruleId ? ["forms", "detail", formId, "validation-rules", ruleId] : [],
    queryFn: async () => {
      if (!formId || !ruleId) {
        throw new Error("Form ID and rule ID are required")
      }
      const response = await apiClient.get(`/forms/${formId}/validation-rules/${ruleId}`)
      return response.data.data as ValidationRule
    },
    enabled: !!formId && !!ruleId,
  })
}

// Get validation rules for a specific field
export function useFieldValidationRules(formId: string | undefined, fieldId: string | undefined) {
  return useQuery({
    queryKey: formId && fieldId ? ["forms", "detail", formId, "field-validations", fieldId] : [],
    queryFn: async () => {
      if (!formId || !fieldId) {
        throw new Error("Form ID and field ID are required")
      }
      const response = await apiClient.get(`/forms/${formId}/validation-rules/by-field/${fieldId}`)
      return response.data.data as ValidationRule[]
    },
    enabled: !!formId && !!fieldId,
  })
}

// Get validation statistics
export function useValidationStats(formId: string | undefined) {
  return useQuery({
    queryKey: formId ? ["forms", "detail", formId, "validation-stats"] : [],
    queryFn: async () => {
      if (!formId) throw new Error("Form ID is required")
      const response = await apiClient.get(`/forms/${formId}/validation-rules/stats`)
      return response.data.data as ValidationStats
    },
    enabled: !!formId,
  })
}

// Create validation rule
export function useCreateValidationRule(formId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateValidationRuleRequest) => {
      const response = await apiClient.post(`/forms/${formId}/validation-rules`, data)
      return response.data.data as ValidationRule
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.forms.validationRules(formId) })
      toast.success("Validation rule created successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create validation rule")
    },
  })
}

// Update validation rule
export function useUpdateValidationRule(formId: string, ruleId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: UpdateValidationRuleRequest) => {
      const response = await apiClient.put(`/forms/${formId}/validation-rules/${ruleId}`, data)
      return response.data.data as ValidationRule
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.forms.validationRules(formId) })
      toast.success("Validation rule updated successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update validation rule")
    },
  })
}

// Delete validation rule
export function useDeleteValidationRule(formId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (ruleId: string) => {
      await apiClient.delete(`/forms/${formId}/validation-rules/${ruleId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.forms.validationRules(formId) })
      toast.success("Validation rule deleted successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete validation rule")
    },
  })
}

// Toggle rule enabled/disabled
export function useToggleValidationRule(formId: string, ruleId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (enabled: boolean) => {
      const response = await apiClient.patch(`/forms/${formId}/validation-rules/${ruleId}/toggle`, {
        enabled,
      })
      return response.data.data as ValidationRule
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.forms.validationRules(formId) })
      toast.success(data.enabled ? "Rule enabled" : "Rule disabled")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to toggle rule")
    },
  })
}

// Validate single field
export function useValidateField(formId: string) {
  return useMutation({
    mutationFn: async (data: ValidateFieldRequest) => {
      const response = await apiClient.post(`/forms/${formId}/validate-field`, data)
      return response.data.data as ValidateFieldResponse
    },
  })
}

// Validate entire form
export function useValidateForm(formId: string) {
  return useMutation({
    mutationFn: async (data: ValidateFormRequest) => {
      const response = await apiClient.post(`/forms/${formId}/validate`, data)
      return response.data.data as ValidateFormResponse
    },
  })
}

// Test validation rule
export function useTestValidationRule(formId: string, ruleId: string) {
  return useMutation({
    mutationFn: async (data: { test_value: any; context?: Record<string, any> }) => {
      const response = await apiClient.post(
        `/forms/${formId}/validation-rules/${ruleId}/test`,
        data
      )
      return response.data.data as {
        valid: boolean
        error_message?: string
      }
    },
  })
}

// Duplicate validation rule
export function useDuplicateValidationRule(formId: string, ruleId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data?: { field_id?: string; name?: string }) => {
      const response = await apiClient.post(
        `/forms/${formId}/validation-rules/${ruleId}/duplicate`,
        data
      )
      return response.data.data as ValidationRule
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.forms.validationRules(formId) })
      toast.success("Validation rule duplicated successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to duplicate rule")
    },
  })
}

// Reorder validation rules
export interface ReorderValidationRulesRequest {
  rule_priorities: Array<{ rule_id: string; priority: number }>
}

export function useReorderValidationRules(formId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: ReorderValidationRulesRequest) => {
      const response = await apiClient.post(`/forms/${formId}/validation-rules/reorder`, data)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.forms.validationRules(formId) })
      toast.success("Validation rules reordered successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to reorder rules")
    },
  })
}

// Bulk create validation rules
export function useBulkCreateValidationRules(formId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { rules: CreateValidationRuleRequest[] }) => {
      const response = await apiClient.post(`/forms/${formId}/validation-rules/bulk`, data)
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.forms.validationRules(formId) })
      toast.success(`${data.created_count} validation rule(s) created successfully`)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create validation rules")
    },
  })
}

// Bulk enable/disable rules
export function useBulkToggleValidationRules(formId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { rule_ids: string[]; enabled: boolean }) => {
      const response = await apiClient.post(`/forms/${formId}/validation-rules/bulk-toggle`, data)
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.forms.validationRules(formId) })
      toast.success(`${data.updated_count} rule(s) ${data.enabled ? "enabled" : "disabled"}`)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to toggle rules")
    },
  })
}

// Copy validation rules from another form
export function useCopyValidationRules(formId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      source_form_id: string
      field_mapping?: Record<string, string> // Map source field IDs to target field IDs
    }) => {
      const response = await apiClient.post(`/forms/${formId}/validation-rules/copy`, data)
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.forms.validationRules(formId) })
      toast.success(`${data.copied_count} validation rule(s) copied successfully`)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to copy validation rules")
    },
  })
}
