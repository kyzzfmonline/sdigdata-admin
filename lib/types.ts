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
  options?: string[]
  allowOther?: boolean
  accept?: string
  validation?: FormFieldValidation
  min?: number
  max?: number
  step?: number
  defaultValue?: any
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
  name: string
  resource: string
  action: string
  description: string
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
