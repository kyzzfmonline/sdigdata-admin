/**
 * Conditional Logic Hooks
 * React Query hooks for managing form conditional logic rules (show/hide fields, enable/disable, etc.)
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api"
import { queryKeys } from "@/lib/query-client"
import { toast } from "sonner"

// Types
export interface ConditionalRule {
  id: string
  form_id: string
  name: string
  description?: string
  priority: number // Higher priority rules execute first
  enabled: boolean
  conditions: Condition[]
  actions: Action[]
  logic_operator: "AND" | "OR" // How to combine multiple conditions
  created_at: string
  updated_at?: string
}

export interface Condition {
  field_id: string
  field_name: string
  operator: ConditionOperator
  value: any
  value_type?: "static" | "field" | "variable" // Compare against static value, another field, or variable
}

export type ConditionOperator =
  | "equals"
  | "not_equals"
  | "greater_than"
  | "less_than"
  | "greater_than_or_equal"
  | "less_than_or_equal"
  | "contains"
  | "not_contains"
  | "starts_with"
  | "ends_with"
  | "is_empty"
  | "is_not_empty"
  | "in"
  | "not_in"
  | "matches_regex"

export interface Action {
  type: ActionType
  target_field_ids: string[]
  parameters?: Record<string, any>
}

export type ActionType =
  | "show"
  | "hide"
  | "enable"
  | "disable"
  | "set_value"
  | "set_required"
  | "set_optional"
  | "set_options" // For select/radio fields
  | "calculate" // For computed fields
  | "validate"
  | "show_message"

export interface CreateRuleRequest {
  form_id: string
  name: string
  description?: string
  priority?: number
  conditions: Omit<Condition, "field_name">[]
  actions: Action[]
  logic_operator?: "AND" | "OR"
  enabled?: boolean
}

export interface UpdateRuleRequest {
  name?: string
  description?: string
  priority?: number
  conditions?: Omit<Condition, "field_name">[]
  actions?: Action[]
  logic_operator?: "AND" | "OR"
  enabled?: boolean
}

export interface TestRuleRequest {
  form_data: Record<string, any> // Current form values to test against
}

export interface TestRuleResponse {
  conditions_met: boolean
  actions_to_execute: Action[]
  evaluation_details: {
    condition_results: Array<{
      condition: Condition
      result: boolean
      reason: string
    }>
    final_result: boolean
  }
}

export interface RuleStats {
  total_rules: number
  enabled_rules: number
  disabled_rules: number
  rules_by_action_type: Record<ActionType, number>
  most_complex_rule: {
    id: string
    name: string
    condition_count: number
    action_count: number
  }
}

// Get all conditional rules for a form
export function useConditionalRules(formId: string | undefined) {
  return useQuery({
    queryKey: formId ? queryKeys.forms.conditionalRules(formId) : [],
    queryFn: async () => {
      if (!formId) throw new Error("Form ID is required")
      const response = await apiClient.get(`/forms/${formId}/conditional-rules`)
      return response.data.data as ConditionalRule[]
    },
    enabled: !!formId,
  })
}

// Get single conditional rule
export function useConditionalRule(formId: string | undefined, ruleId: string | undefined) {
  return useQuery({
    queryKey: formId && ruleId ? ["forms", "detail", formId, "conditional-rules", ruleId] : [],
    queryFn: async () => {
      if (!formId || !ruleId) {
        throw new Error("Form ID and rule ID are required")
      }
      const response = await apiClient.get(`/forms/${formId}/conditional-rules/${ruleId}`)
      return response.data.data as ConditionalRule
    },
    enabled: !!formId && !!ruleId,
  })
}

// Get active rules (enabled rules only)
export function useActiveConditionalRules(formId: string | undefined) {
  return useQuery({
    queryKey: formId ? ["forms", "detail", formId, "conditional-rules", "active"] : [],
    queryFn: async () => {
      if (!formId) throw new Error("Form ID is required")
      const response = await apiClient.get(`/forms/${formId}/conditional-rules/active`)
      return response.data.data as ConditionalRule[]
    },
    enabled: !!formId,
  })
}

// Get rule statistics
export function useConditionalRuleStats(formId: string | undefined) {
  return useQuery({
    queryKey: formId ? ["forms", "detail", formId, "conditional-rules", "stats"] : [],
    queryFn: async () => {
      if (!formId) throw new Error("Form ID is required")
      const response = await apiClient.get(`/forms/${formId}/conditional-rules/stats`)
      return response.data.data as RuleStats
    },
    enabled: !!formId,
  })
}

// Create conditional rule
export function useCreateConditionalRule(formId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateRuleRequest) => {
      const response = await apiClient.post(`/forms/${formId}/conditional-rules`, data)
      return response.data.data as ConditionalRule
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.forms.conditionalRules(formId) })
      toast.success("Conditional rule created successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create conditional rule")
    },
  })
}

// Update conditional rule
export function useUpdateConditionalRule(formId: string, ruleId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: UpdateRuleRequest) => {
      const response = await apiClient.put(`/forms/${formId}/conditional-rules/${ruleId}`, data)
      return response.data.data as ConditionalRule
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.forms.conditionalRules(formId) })
      toast.success("Conditional rule updated successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update conditional rule")
    },
  })
}

// Delete conditional rule
export function useDeleteConditionalRule(formId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (ruleId: string) => {
      await apiClient.delete(`/forms/${formId}/conditional-rules/${ruleId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.forms.conditionalRules(formId) })
      toast.success("Conditional rule deleted successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete conditional rule")
    },
  })
}

// Toggle rule enabled/disabled
export function useToggleConditionalRule(formId: string, ruleId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (enabled: boolean) => {
      const response = await apiClient.patch(
        `/forms/${formId}/conditional-rules/${ruleId}/toggle`,
        { enabled }
      )
      return response.data.data as ConditionalRule
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.forms.conditionalRules(formId) })
      toast.success(data.enabled ? "Rule enabled" : "Rule disabled")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to toggle rule")
    },
  })
}

// Test rule against form data
export function useTestConditionalRule(formId: string, ruleId: string) {
  return useMutation({
    mutationFn: async (data: TestRuleRequest) => {
      const response = await apiClient.post(
        `/forms/${formId}/conditional-rules/${ruleId}/test`,
        data
      )
      return response.data.data as TestRuleResponse
    },
  })
}

// Duplicate rule
export function useDuplicateConditionalRule(formId: string, ruleId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data?: { name?: string }) => {
      const response = await apiClient.post(
        `/forms/${formId}/conditional-rules/${ruleId}/duplicate`,
        data
      )
      return response.data.data as ConditionalRule
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.forms.conditionalRules(formId) })
      toast.success("Rule duplicated successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to duplicate rule")
    },
  })
}

// Reorder rules (update priorities)
export interface ReorderRulesRequest {
  rule_priorities: Array<{ rule_id: string; priority: number }>
}

export function useReorderConditionalRules(formId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: ReorderRulesRequest) => {
      const response = await apiClient.post(`/forms/${formId}/conditional-rules/reorder`, data)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.forms.conditionalRules(formId) })
      toast.success("Rules reordered successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to reorder rules")
    },
  })
}

// Validate rule (check for conflicts, circular dependencies, etc.)
export function useValidateConditionalRule(formId: string) {
  return useMutation({
    mutationFn: async (ruleData: CreateRuleRequest | UpdateRuleRequest) => {
      const response = await apiClient.post(`/forms/${formId}/conditional-rules/validate`, ruleData)
      return response.data.data as {
        valid: boolean
        errors: string[]
        warnings: string[]
      }
    },
  })
}

// Get rules affecting a specific field
export function useRulesAffectingField(formId: string | undefined, fieldId: string | undefined) {
  return useQuery({
    queryKey: formId && fieldId ? ["forms", "detail", formId, "field-rules", fieldId] : [],
    queryFn: async () => {
      if (!formId || !fieldId) {
        throw new Error("Form ID and field ID are required")
      }
      const response = await apiClient.get(`/forms/${formId}/conditional-rules/by-field/${fieldId}`)
      return response.data.data as ConditionalRule[]
    },
    enabled: !!formId && !!fieldId,
  })
}

// Bulk enable/disable rules
export function useBulkToggleRules(formId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { rule_ids: string[]; enabled: boolean }) => {
      const response = await apiClient.post(`/forms/${formId}/conditional-rules/bulk-toggle`, data)
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.forms.conditionalRules(formId) })
      toast.success(`${data.updated_count} rule(s) ${data.enabled ? "enabled" : "disabled"}`)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to toggle rules")
    },
  })
}
