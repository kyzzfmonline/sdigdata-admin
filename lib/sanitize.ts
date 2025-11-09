import DOMPurify from "isomorphic-dompurify"

type SanitizeConfig = {
  ALLOWED_TAGS?: string[]
  ALLOWED_ATTR?: string[]
  ALLOW_DATA_ATTR?: boolean
  ALLOWED_URI_REGEXP?: RegExp
}

/**
 * Sanitization Configuration
 */
const DEFAULT_CONFIG: SanitizeConfig = {
  ALLOWED_TAGS: [
    "b",
    "i",
    "em",
    "strong",
    "a",
    "p",
    "br",
    "ul",
    "ol",
    "li",
    "span",
    "div",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
  ],
  ALLOWED_ATTR: ["href", "title", "target", "rel", "class"],
  ALLOW_DATA_ATTR: false,
  ALLOWED_URI_REGEXP:
    /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
}

/**
 * Strict configuration for plain text only (strips all HTML)
 */
const STRICT_CONFIG: SanitizeConfig = {
  ALLOWED_TAGS: [],
  ALLOWED_ATTR: [],
  ALLOW_DATA_ATTR: false,
}

/**
 * Configuration for user-generated content with limited formatting
 */
const USER_CONTENT_CONFIG: SanitizeConfig = {
  ALLOWED_TAGS: ["b", "i", "em", "strong", "p", "br"],
  ALLOWED_ATTR: [],
  ALLOW_DATA_ATTR: false,
}

/**
 * Sanitizes HTML content to prevent XSS attacks
 *
 * @param html - The HTML string to sanitize
 * @param config - Optional sanitization configuration (defaults to DEFAULT_CONFIG)
 * @returns Sanitized HTML string safe for rendering
 */
export function sanitizeHtml(html: string, config?: SanitizeConfig): string {
  if (!html || typeof html !== "string") {
    return ""
  }

  try {
    return DOMPurify.sanitize(html, config || DEFAULT_CONFIG) as string
  } catch (error) {
    console.error("Error sanitizing HTML:", error)
    return ""
  }
}

/**
 * Sanitizes HTML to plain text only (strips all HTML tags)
 *
 * @param html - The HTML string to sanitize
 * @returns Plain text string with all HTML removed
 */
export function sanitizeToPlainText(html: string): string {
  return sanitizeHtml(html, STRICT_CONFIG)
}

/**
 * Sanitizes user-generated content with basic formatting allowed
 *
 * @param html - The HTML string to sanitize
 * @returns Sanitized HTML with only basic formatting tags
 */
export function sanitizeUserContent(html: string): string {
  return sanitizeHtml(html, USER_CONTENT_CONFIG)
}

/**
 * Sanitizes a URL to prevent javascript: and data: URIs
 *
 * @param url - The URL to sanitize
 * @returns Sanitized URL or empty string if invalid
 */
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== "string") {
    return ""
  }

  const trimmedUrl = url.trim()

  // Block dangerous protocols
  const dangerousProtocols = /^(javascript|data|vbscript|file|about):/i
  if (dangerousProtocols.test(trimmedUrl)) {
    return ""
  }

  return trimmedUrl
}

/**
 * Sanitizes an object by sanitizing all string values
 * Useful for sanitizing form data or API responses
 *
 * @param obj - The object to sanitize
 * @param config - Optional sanitization configuration
 * @returns New object with all string values sanitized
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  config?: SanitizeConfig
): T {
  if (!obj || typeof obj !== "object") {
    return obj
  }

  const sanitized = {} as T

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      sanitized[key as keyof T] = sanitizeHtml(value, config) as T[keyof T]
    } else if (Array.isArray(value)) {
      sanitized[key as keyof T] = value.map((item) =>
        typeof item === "string" ? sanitizeHtml(item, config) : item
      ) as T[keyof T]
    } else if (value && typeof value === "object") {
      sanitized[key as keyof T] = sanitizeObject(
        value as Record<string, unknown>,
        config
      ) as T[keyof T]
    } else {
      sanitized[key as keyof T] = value as T[keyof T]
    }
  }

  return sanitized
}
