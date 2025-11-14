export interface User {
  id: string
  username: string
  email: string
  role?:
    | "super_admin"
    | "system_admin"
    | "org_admin"
    | "data_manager"
    | "supervisor"
    | "admin"
    | "agent"
    | "viewer"
  organization_id?: string
  created_at: string
  last_login?: string
  status?: "active" | "inactive"
  // Extended fields that might be returned by /users/me
  roles?: UserRole[]
  permissions?: UserPermission[]
}

export interface FormFieldValidation {
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  pattern?: string
}

export interface FormField {
  id: string
  type:
    | "text"
    | "textarea"
    | "email"
    | "number"
    | "date"
    | "select"
    | "radio"
    | "checkbox"
    | "gps"
    | "file"
    | "phone"
    | "url"
    | "color"
    | "range"
    | "rating"
    | "signature"
  label: string
  required: boolean
  placeholder?: string
  helpText?: string
  options?: FormFieldOption[]
  allowOther?: boolean
  accept?: string
  validation?: FormFieldValidation
  min?: number
  max?: number
  step?: number
  defaultValue?: any
}

export interface FormFieldOption {
  label: string
  value: string
}

export interface FormBranding {
  logo_url?: string
  banner_url?: string
  primary_color?: string
  accent_color?: string
  header_text?: string
  footer_text?: string
}

export interface Form {
  id: string
  title: string
  description?: string
  organization_id: string
  status: "draft" | "published"
  version: number
  schema: {
    fields: FormField[]
    branding?: FormBranding
  }
  created_by: string
  created_at: string
  updated_at?: string
  published_at?: string
}

export interface GPSCoordinates {
  latitude: number
  longitude: number
  accuracy: number
}

export interface FormResponseData {
  [key: string]: any
}

export interface FormResponse {
  id: string
  form_id: string
  submitted_by: string
  submitted_at: string
  data: FormResponseData
  attachments?: Record<string, string>
}

export interface AuthState {
  token: string | null
  user: User | null
  isLoading: boolean
  error: string | null
}

// Roles and Permissions
export interface Role {
  id: string
  name: string
  description: string
  level: number
  is_system_role: boolean
  organization_id?: string
  created_at: string
}

export interface Permission {
  id: string
  name: string
  resource: string
  action: string
  description: string
  created_at: string
}

export interface UserRole {
  id: string
  name: string
  description: string
  level: number
  assigned_at: string
  expires_at?: string
}

export interface UserPermission {
  id?: string
  name: string
  resource: string
  action: string
  description: string
  created_at?: string
}

// User preferences
export interface NotificationPreferences {
  email_notifications: boolean
  form_assignments: boolean
  responses: boolean
  system_updates: boolean
}

export interface ThemePreferences {
  theme: "light" | "dark" | "system"
  compact_mode: boolean
}

export interface PresignedUrlResponse {
  upload_url: string
  file_url: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
  user: User
  permissions: UserPermission[]
  roles: UserRole[]
}

export interface Organization {
  id: string
  name: string
  logo_url?: string
  primary_color?: string
  created_at: string
}

// API Input Types
export interface CreateFormInput {
  title: string
  description?: string
  organization_id: string
  form_schema: {
    fields: FormField[]
    branding?: FormBranding
  }
  version: number
  status: "draft" | "published"
}

export interface UpdateFormInput extends Partial<CreateFormInput> {}

export interface CreateResponseInput {
  form_id: string
  data: FormResponseData
  attachments?: Record<string, string>
}

export interface UpdateUserInput {
  username?: string
  email?: string
}

export interface UpdatePreferencesInput {
  theme?: ThemePreferences
  notifications?: NotificationPreferences
}

export interface UpdateNotificationPreferencesInput extends Partial<NotificationPreferences> {}

// API Response Types
export interface APIResponse<T = any> {
  success: boolean
  data: T | null
  message?: string
  errors?: Record<string, string[]>
  timestamp?: string
}

export interface PaginatedResponse<T> {
  success: true
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
}

// RBAC Types
export interface RoleWithCounts {
  id: string
  name: string
  description?: string
  level: number
  created_at: string
  updated_at?: string
  permission_count: number
  user_count: number
}

export interface RoleWithPermissions {
  id: string
  name: string
  description?: string
  level: number
  created_at: string
  updated_at?: string
  permissions: UserPermission[]
}

export interface CreateRoleInput {
  name: string
  description?: string
  level?: number
}

export interface UpdateRoleInput {
  name?: string
  description?: string
  level?: number
}

export interface CreatePermissionInput {
  name: string
  resource: string
  action: string
  description?: string
}

export interface AssignPermissionsInput {
  permission_ids: string[]
}

export interface AssignRoleInput {
  role_id: string
}

export interface UserWithRoles {
  id: string
  username: string
  email: string
  roles: UserRole[]
}

export interface EffectivePermissions {
  user_id: string
  username: string
  permissions: UserPermission[]
}

// Session Management
export interface UserSession {
  id: string
  device: string
  ip_address: string
  location?: string
  last_active: string
  created_at: string
  is_current: boolean
  user_agent: string
}

// Two-Factor Authentication
export interface TwoFactorStatus {
  enabled: boolean
  methods: string[]
  backup_codes_remaining: number
}

export interface TwoFactorSetup {
  method: string
  secret: string
  qr_code_url: string
  backup_codes: string[]
}

// API Keys
export interface ApiKey {
  id: string
  name: string
  key_prefix: string
  created_at: string
  last_used_at?: string
  expires_at?: string
  scopes: string[]
}

export interface CreateApiKeyInput {
  name: string
  scopes: string[]
  expires_in_days?: number
}

export interface ApiKeyWithSecret extends ApiKey {
  key: string
}

// Audit Logs
export interface AuditLog {
  id: string
  user_id: string
  username: string
  action_type: string
  resource_type?: string
  resource_id?: string
  severity: "info" | "warning" | "critical"
  ip_address: string
  user_agent: string
  details: Record<string, any>
  timestamp: string
}

// Webhooks
export interface Webhook {
  id: string
  name: string
  url: string
  events: string[]
  enabled: boolean
  secret: string
  created_at: string
  last_triggered_at?: string
}

export interface CreateWebhookInput {
  name: string
  url: string
  events: string[]
  enabled?: boolean
}
