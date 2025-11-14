/**
 * Extended types for form builder enhancements
 */

import type { FormField } from "./types"

//=============================================================================
// Conditional Logic Types
//=============================================================================

export type ConditionOperator =
  | "equals"
  | "not_equals"
  | "greater_than"
  | "less_than"
  | "greater_than_or_equal"
  | "less_than_or_equal"
  | "contains"
  | "not_contains"
  | "in"
  | "not_in"
  | "is_empty"
  | "is_not_empty"
  | "matches_regex"

export type ConditionalActionType =
  | "show_field"
  | "hide_field"
  | "enable_field"
  | "disable_field"
  | "set_value"
  | "calculate_value"
  | "set_required"
  | "set_optional"
  | "show_error"
  | "clear_error"

export interface Condition {
  field_id: string
  operator: ConditionOperator
  value: any
}

export interface ConditionalAction {
  type: ConditionalActionType
  target_field_id?: string
  value?: any
  error_message?: string
  formula?: string
}

export interface ConditionalRule {
  id: string
  form_id: string
  rule_name: string
  rule_type: "show_hide" | "calculate" | "validate"
  conditions: Condition[]
  actions: ConditionalAction[]
  priority: number
  is_active: boolean
  created_at: string
  updated_at?: string
  created_by?: string
}

export interface ConditionalRuleEvaluationResult {
  visible_fields: string[]
  hidden_fields: string[]
  required_fields: string[]
  calculated_values: Record<string, any>
  errors: Record<string, string>
}

//=============================================================================
// Form Template Types
//=============================================================================

export type TemplateCategory =
  | "survey"
  | "registration"
  | "feedback"
  | "inspection"
  | "health"
  | "custom"

export interface FormTemplate {
  id: string
  name: string
  description?: string
  category: TemplateCategory
  form_schema: {
    fields: FormField[]
    branding?: any
  }
  thumbnail_url?: string
  is_public: boolean
  organization_id?: string
  created_by?: string
  created_at: string
  updated_at?: string
  usage_count: number
  tags: string[]
  field_count?: number
}

//=============================================================================
// Form Versioning Types
//=============================================================================

export type FormStatus = "draft" | "published" | "archived"

export type FormChangeType =
  | "field_added"
  | "field_removed"
  | "field_modified"
  | "branding_updated"
  | "settings_updated"
  | "conditional_rule_added"
  | "conditional_rule_removed"
  | "conditional_rule_modified"

export interface FormVersion {
  id: string
  form_id: string
  version_number: number
  form_schema: any
  title: string
  description?: string
  change_summary?: string
  status: FormStatus
  created_by?: string
  created_at: string
  published_at?: string
  field_count?: number
}

export interface FormChangeLogEntry {
  id: string
  form_id: string
  version_number: number
  change_type: FormChangeType
  change_details: any
  changed_by?: string
  changed_at: string
}

export interface FormVersionComparison {
  version_a: number
  version_b: number
  differences: {
    fields_added: Array<{ id: string; label: string; type: string }>
    fields_removed: Array<{ id: string; label: string; type: string }>
    fields_modified: Array<{
      field_id: string
      changes: Record<string, { old: any; new: any }>
    }>
    branding_changes: Record<string, { old: any; new: any }>
  }
}

//=============================================================================
// Validation Rule Types
//=============================================================================

export type ValidationRuleType = "regex" | "custom" | "cross_field" | "async" | "range" | "length"

export type ValidationSeverity = "error" | "warning" | "info"

export interface ValidationRule {
  id: string
  form_id: string
  field_id: string
  rule_type: ValidationRuleType
  rule_config: Record<string, any>
  error_message: string
  severity: ValidationSeverity
  is_active: boolean
  created_at: string
}

export interface ValidationResult {
  is_valid: boolean
  errors: Record<string, { field_id: string; severity: ValidationSeverity; message: string }>
  warnings: Record<string, { field_id: string; severity: ValidationSeverity; message: string }>
}

//=============================================================================
// Form Locking Types
//=============================================================================

export interface FormLock {
  is_locked: boolean
  locked_by?: {
    id: string
    username: string
  }
  locked_by_user?: {
    id: string
    username: string
  }
  locked_by_current_user?: boolean
  locked_at?: string
  lock_expires_at?: string
}

export interface FormLockAcquireResponse {
  lock_acquired: boolean
  lock_expires_at: string
  lock_version: number
}

//=============================================================================
// Command History Types (for undo/redo)
//=============================================================================

export type CommandType =
  | "add_field"
  | "remove_field"
  | "update_field"
  | "reorder_fields"
  | "update_branding"
  | "update_title"
  | "update_description"
  | "bulk_update"

export interface Command {
  id: string
  type: CommandType
  timestamp: number
  data: {
    previous: any
    current: any
  }
  description: string
}

export interface CommandHistory {
  commands: Command[]
  currentIndex: number
}

//=============================================================================
// Form Builder State Types
//=============================================================================

export interface FormBuilderState {
  title: string
  description: string
  fields: FormField[]
  branding: any
  conditionalRules: ConditionalRule[]
  validationRules: ValidationRule[]
  isDirty: boolean
  isSaving: boolean
  lastSaved?: Date
  lockStatus?: FormLock
  currentVersion?: number
}

//=============================================================================
// Multi-Page Form Types
//=============================================================================

export interface FormPage {
  id: string
  title: string
  description?: string
  fields: string[] // Array of field IDs
  order: number
  show_conditions?: Condition[]
}

export interface MultiPageFormSchema {
  pages: FormPage[]
  fields: FormField[]
  branding?: any
  settings: {
    allow_page_navigation: boolean
    show_progress_bar: boolean
    save_on_page_change: boolean
  }
}

//=============================================================================
// Form Analytics Types
//=============================================================================

export interface FormAnalytics {
  summary: {
    total_views: number
    total_starts: number
    total_completions: number
    completion_rate: number
    avg_completion_time_seconds: number
    drop_off_rate: number
  }
  time_series: Array<{
    date: string
    views: number
    starts: number
    completions: number
    completion_rate: number
  }>
  drop_off_points: Array<{
    field_id: string
    field_label: string
    drop_off_count: number
    drop_off_rate: number
  }>
}

export interface FieldAnalytics {
  field_id: string
  field_label: string
  total_responses: number
  error_rate: number
  skip_rate: number
  avg_time_spent_seconds: number
  common_errors: Array<{
    error_type: string
    count: number
    percentage: number
  }>
}

//=============================================================================
// Export types for convenience
//=============================================================================

export type { FormField } from "./types"
