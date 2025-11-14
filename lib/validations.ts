import { z } from "zod"

/**
 * Authentication Schemas
 */

export const loginSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must not exceed 50 characters")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Username can only contain letters, numbers, hyphens, and underscores"
    ),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must not exceed 128 characters"),
})

export const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(50, "Username must not exceed 50 characters")
      .regex(
        /^[a-zA-Z0-9_-]+$/,
        "Username can only contain letters, numbers, hyphens, and underscores"
      ),
    email: z
      .string()
      .email("Invalid email address")
      .max(255, "Email must not exceed 255 characters"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password must not exceed 128 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
    confirmPassword: z.string(),
    role: z.enum(["admin", "agent", "viewer"], {
      errorMap: () => ({ message: "Invalid role" }),
    }),
    organization_id: z.string().uuid("Invalid organization ID"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password must not exceed 128 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

/**
 * User Schemas
 */

export const userSchema = z.object({
  id: z.string().uuid(),
  username: z.string().min(3).max(50),
  email: z.string().email().max(255),
  role: z.enum(["admin", "agent", "viewer"]),
  organization_id: z.string().uuid().optional(),
  created_at: z.string().datetime(),
  last_login: z.string().datetime().optional(),
  status: z.enum(["active", "inactive"]).optional(),
})

export const createUserSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
  role: z.enum(["admin", "agent", "viewer"]),
  organization_id: z.string().uuid(),
})

export const updateUserSchema = z.object({
  email: z.string().email().max(255).optional(),
  status: z.enum(["active", "inactive"]).optional(),
})

/**
 * Form Field Schemas
 */

export const formFieldValidationSchema = z
  .object({
    minLength: z.number().int().positive().optional(),
    maxLength: z.number().int().positive().optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    pattern: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.minLength && data.maxLength) {
        return data.minLength <= data.maxLength
      }
      return true
    },
    {
      message: "minLength must be less than or equal to maxLength",
    }
  )
  .refine(
    (data) => {
      if (data.min !== undefined && data.max !== undefined) {
        return data.min <= data.max
      }
      return true
    },
    {
      message: "min must be less than or equal to max",
    }
  )

export const formFieldSchema = z
  .object({
    id: z.string().min(1, "Field ID is required"),
    type: z.enum([
      "text",
      "textarea",
      "email",
      "number",
      "date",
      "select",
      "radio",
      "checkbox",
      "gps",
      "file",
      "phone",
      "url",
      "color",
      "range",
      "rating",
      "signature",
    ]),
    label: z.string().min(1, "Label is required").max(255, "Label must not exceed 255 characters"),
    required: z.boolean(),
    placeholder: z.string().max(255).optional(),
    helpText: z.string().max(500).optional(),
    options: z
      .array(
        z.object({
          label: z.string(),
          value: z.string(),
        })
      )
      .optional(),
    accept: z.string().optional(),
    validation: formFieldValidationSchema.optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    step: z.number().positive().optional(),
    defaultValue: z.any().optional(),
  })
  .refine(
    (data) => {
      // Validate that select/radio fields have options
      if (["select", "radio", "checkbox"].includes(data.type)) {
        return data.options && data.options.length > 0
      }
      return true
    },
    {
      message: "Select, radio, and checkbox fields must have options",
      path: ["options"],
    }
  )

export const formBrandingSchema = z.object({
  logo_url: z.string().url().optional(),
  banner_url: z.string().url().optional(),
  primary_color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format")
    .optional(),
  accent_color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format")
    .optional(),
  header_text: z.string().max(500).optional(),
  footer_text: z.string().max(500).optional(),
})

export const formSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, "Title is required").max(255, "Title must not exceed 255 characters"),
  organization_id: z.string().uuid(),
  status: z.enum(["draft", "published"]),
  version: z.number().int().positive(),
  schema: z.object({
    fields: z.array(formFieldSchema).min(1, "Form must have at least one field"),
    branding: formBrandingSchema.optional(),
  }),
  created_by: z.string().uuid(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime().optional(),
  published_at: z.string().datetime().optional(),
})

export const createFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  schema: z.object({
    fields: z.array(formFieldSchema).min(1, "Form must have at least one field"),
    branding: formBrandingSchema.optional(),
  }),
})

export const updateFormSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  schema: z
    .object({
      fields: z.array(formFieldSchema).min(1),
      branding: formBrandingSchema.optional(),
    })
    .optional(),
})

/**
 * GPS Schemas
 */

export const gpsCoordinatesSchema = z.object({
  latitude: z
    .number()
    .min(-90, "Latitude must be between -90 and 90")
    .max(90, "Latitude must be between -90 and 90"),
  longitude: z
    .number()
    .min(-180, "Longitude must be between -180 and 180")
    .max(180, "Longitude must be between -180 and 180"),
  accuracy: z.number().positive("Accuracy must be positive"),
})

/**
 * Form Response Schemas
 */

export const formResponseSchema = z.object({
  id: z.string().uuid(),
  form_id: z.string().uuid(),
  submitted_by: z.string().uuid(),
  submitted_at: z.string().datetime(),
  data: z.record(z.any()),
  attachments: z.record(z.string().url()).optional(),
})

export const createFormResponseSchema = z.object({
  form_id: z.string().uuid(),
  data: z.record(z.any()),
  attachments: z.record(z.string().url()).optional(),
})

/**
 * File Upload Schemas
 */

export const presignRequestSchema = z.object({
  filename: z
    .string()
    .min(1, "Filename is required")
    .max(255, "Filename must not exceed 255 characters")
    .regex(/^[a-zA-Z0-9._-]+$/, "Filename contains invalid characters"),
  content_type: z
    .string()
    .min(1, "Content type is required")
    .regex(/^[a-z]+\/[a-z0-9.+-]+$/i, "Invalid content type"),
})

export const presignedUrlResponseSchema = z.object({
  upload_url: z.string().url(),
  file_url: z.string().url(),
})

/**
 * Assignment Schemas
 */

export const assignFormSchema = z.object({
  agent_ids: z.array(z.string().uuid()).min(1, "At least one agent must be selected"),
  due_date: z.string().datetime().optional(),
  target_responses: z.number().int().positive().optional(),
})

/**
 * Query Parameter Schemas
 */

export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
})

export const sortSchema = z.object({
  sort: z.string().optional(),
  order: z.enum(["asc", "desc"]).default("desc"),
})

export const searchSchema = z.object({
  search: z.string().max(255).optional(),
})

export const userQuerySchema = paginationSchema
  .merge(sortSchema)
  .merge(searchSchema)
  .extend({
    role: z.enum(["admin", "agent", "viewer"]).optional(),
    status: z.enum(["active", "inactive"]).optional(),
  })

export const formQuerySchema = paginationSchema.merge(sortSchema).extend({
  organization_id: z.string().uuid().optional(),
  status: z.enum(["draft", "published"]).optional(),
})

export const responseQuerySchema = paginationSchema.merge(sortSchema).extend({
  form_id: z.string().uuid().optional(),
})

/**
 * Environment Variable Schema
 */

export const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url("Invalid API URL"),
  NODE_ENV: z.enum(["development", "production", "test"]).optional(),
})

/**
 * Type exports for use in components
 */

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type CreateFormInput = z.infer<typeof createFormSchema>
export type UpdateFormInput = z.infer<typeof updateFormSchema>
export type CreateFormResponseInput = z.infer<typeof createFormResponseSchema>
export type AssignFormInput = z.infer<typeof assignFormSchema>
export type UserQueryParams = z.infer<typeof userQuerySchema>
export type FormQueryParams = z.infer<typeof formQuerySchema>
export type ResponseQueryParams = z.infer<typeof responseQuerySchema>
