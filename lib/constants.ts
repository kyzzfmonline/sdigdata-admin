/**
 * Application-wide constants
 * Centralizes magic numbers and configuration values
 */

// Authentication & Tokens
export const TOKEN_EXPIRY_BUFFER_SECONDS = 5 * 60 // 5 minutes
export const LOGIN_DATA_EXPIRY_MS = 24 * 60 * 60 * 1000 // 24 hours
export const JWT_EXPIRY_HOURS = 24

// Form Builder
export const AUTOSAVE_INTERVAL_MS = 60000 // 60 seconds (1 minute)
export const FORM_TITLE_MAX_LENGTH = 255
export const FORM_DESCRIPTION_MAX_LENGTH = 1000

// Pagination
export const DEFAULT_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 100
export const MIN_PAGE_SIZE = 10

// File Upload Limits (in bytes)
export const FILE_SIZE_LIMITS = {
  IMAGE: 5 * 1024 * 1024, // 5MB
  DOCUMENT: 10 * 1024 * 1024, // 10MB
  TOTAL_PER_RESPONSE: 50 * 1024 * 1024, // 50MB
} as const

// Allowed File Types
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
] as const

export const ALLOWED_DOCUMENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const

export const ALLOWED_IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif"] as const
export const ALLOWED_DOCUMENT_EXTENSIONS = ["pdf", "doc", "docx"] as const

// API
export const API_TIMEOUT_MS = 30000 // 30 seconds
export const API_RETRY_ATTEMPTS = 3
export const API_RETRY_DELAY_MS = 1000

// Cache Times (React Query)
export const CACHE_TIME = {
  DEFAULT: 5 * 60 * 1000, // 5 minutes
  USER_PROFILE: 10 * 60 * 1000, // 10 minutes
  FORM_LIST: 2 * 60 * 1000, // 2 minutes
  ANALYTICS: 1 * 60 * 1000, // 1 minute
} as const

// Debounce Delays
export const DEBOUNCE_DELAY = {
  SEARCH: 300, // 300ms
  AUTOSAVE: 1000, // 1 second
  RESIZE: 150, // 150ms
} as const

// Roles (for permission checking)
export const ADMIN_ROLES = ["super_admin", "system_admin", "org_admin"] as const
export const SUPERVISOR_ROLES = [
  "super_admin",
  "system_admin",
  "org_admin",
  "data_manager",
  "supervisor",
] as const

// Form Field Types
export const CHOICE_FIELD_TYPES = ["select", "radio", "checkbox"] as const
export const TEXT_FIELD_TYPES = ["text", "textarea", "email", "phone", "url"] as const

// Animation Durations (ms)
export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
} as const

// Toast Auto-Dismiss
export const TOAST_DURATION = {
  ERROR: 5000,
  SUCCESS: 3000,
  INFO: 4000,
  WARNING: 4000,
} as const

// Permission Names (for type safety)
// STANDARDIZED: Now uses colon format (resource:action) to match backend
export const PERMISSIONS = {
  // Forms Permissions
  FORMS_CREATE: "forms:create",
  FORMS_READ: "forms:read",
  FORMS_UPDATE: "forms:update",
  FORMS_DELETE: "forms:delete",
  FORMS_PUBLISH: "forms:publish",
  FORMS_EDIT: "forms:edit",
  FORMS_ASSIGN: "forms:assign",
  FORMS_ADMIN: "forms:admin",

  // Responses Permissions
  RESPONSES_READ: "responses:read",
  RESPONSES_CREATE: "responses:create",
  RESPONSES_DELETE: "responses:delete",
  RESPONSES_EXPORT: "responses:export",
  RESPONSES_UPDATE: "responses:update",

  // Users Permissions
  USERS_ADMIN: "users:admin",
  USERS_CREATE: "users:create",
  USERS_READ: "users:read",
  USERS_DELETE: "users:delete",
  USERS_UPDATE: "users:update",
  USERS_MANAGE_ROLES: "users:manage_roles",

  // Roles & Permissions
  ROLES_ADMIN: "roles:admin",
  PERMISSIONS_ADMIN: "permissions:admin",

  // Analytics Permissions
  ANALYTICS_VIEW: "analytics:view",
  ANALYTICS_EXPORT: "analytics:export",

  // System Permissions
  SYSTEM_ADMIN: "system:admin",
  SYSTEM_CLEANUP: "system:cleanup",
  SYSTEM_AUDIT: "system:audit",

  // Organizations Permissions
  ORGANIZATIONS_CREATE: "organizations:create",
  ORGANIZATIONS_READ: "organizations:read",
  ORGANIZATIONS_UPDATE: "organizations:update",
  ORGANIZATIONS_DELETE: "organizations:delete",

  // Reputation Permissions
  REPUTATION_VIEW: "reputation:view",
  REPUTATION_MANAGE: "reputation:manage",

  // Translations Permissions
  TRANSLATIONS_SUBMIT: "translations:submit",
  TRANSLATIONS_REVIEW: "translations:review",
  TRANSLATIONS_MODERATE: "translations:moderate",
  TRANSLATIONS_IMPORT: "translations:import",
  TRANSLATIONS_EXPORT: "translations:export",
} as const

// All backend permissions (37 total) - matches backend exactly
export const ALL_PERMISSIONS = [
  "analytics:export",
  "analytics:view",
  "forms:admin",
  "forms:assign",
  "forms:create",
  "forms:delete",
  "forms:edit",
  "forms:publish",
  "forms:read",
  "forms:update",
  "organizations:create",
  "organizations:delete",
  "organizations:read",
  "organizations:update",
  "permissions:admin",
  "reputation:manage",
  "reputation:view",
  "responses:create",
  "responses:delete",
  "responses:export",
  "responses:read",
  "responses:update",
  "roles:admin",
  "system:admin",
  "system:audit",
  "system:cleanup",
  "translations:export",
  "translations:import",
  "translations:moderate",
  "translations:review",
  "translations:submit",
  "users:admin",
  "users:create",
  "users:delete",
  "users:manage_roles",
  "users:read",
  "users:update",
] as const

export type Permission = (typeof ALL_PERMISSIONS)[number]
