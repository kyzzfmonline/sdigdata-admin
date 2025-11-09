/**
 * Logging Service
 *
 * Provides structured logging with PII redaction and conditional logging
 * based on environment configuration.
 */

type LogLevel = "debug" | "info" | "warn" | "error"

interface LogContext {
  [key: string]: unknown
}

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: LogContext
  environment: string
}

/**
 * Sensitive field patterns for PII redaction
 */
const SENSITIVE_PATTERNS = [
  /password/i,
  /token/i,
  /secret/i,
  /apikey/i,
  /api_key/i,
  /authorization/i,
  /cookie/i,
  /session/i,
  /ssn/i,
  /social_security/i,
  /credit_card/i,
  /cvv/i,
  /pin/i,
]

/**
 * Email pattern for redaction
 */
const EMAIL_PATTERN = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g

/**
 * Check if a field name contains sensitive information
 */
function isSensitiveField(fieldName: string): boolean {
  return SENSITIVE_PATTERNS.some((pattern) => pattern.test(fieldName))
}

/**
 * Redact PII from a string value
 */
function redactString(value: string): string {
  // Redact email addresses
  return value.replace(EMAIL_PATTERN, "[REDACTED_EMAIL]")
}

/**
 * Redact PII from context object
 */
function redactPII(context: LogContext): LogContext {
  const redacted: LogContext = {}

  for (const [key, value] of Object.entries(context)) {
    if (isSensitiveField(key)) {
      redacted[key] = "[REDACTED]"
    } else if (typeof value === "string") {
      redacted[key] = redactString(value)
    } else if (Array.isArray(value)) {
      redacted[key] = value.map((item) => (typeof item === "string" ? redactString(item) : item))
    } else if (value && typeof value === "object") {
      redacted[key] = redactPII(value as LogContext)
    } else {
      redacted[key] = value
    }
  }

  return redacted
}

/**
 * Format log entry for output
 */
function formatLogEntry(entry: LogEntry): string {
  const { level, message, timestamp, context, environment } = entry

  const levelStr = level.toUpperCase().padEnd(5)
  let output = `[${timestamp}] ${levelStr} ${message}`

  if (context && Object.keys(context).length > 0) {
    output += ` | ${JSON.stringify(context)}`
  }

  if (environment === "development") {
    return output
  }

  // In production, return JSON format for log aggregation
  return JSON.stringify(entry)
}

/**
 * Get current environment
 */
function getEnvironment(): string {
  return process.env.NODE_ENV || "development"
}

/**
 * Check if logging is enabled for the given level
 */
function isLevelEnabled(level: LogLevel): boolean {
  const env = getEnvironment()

  // In test environment, suppress all logs except errors
  if (env === "test") {
    return level === "error"
  }

  // In production, suppress debug logs
  if (env === "production") {
    return level !== "debug"
  }

  // In development, all levels are enabled
  return true
}

/**
 * Core logging function
 */
function log(level: LogLevel, message: string, context?: LogContext): void {
  if (!isLevelEnabled(level)) {
    return
  }

  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    environment: getEnvironment(),
  }

  if (context) {
    entry.context = redactPII(context)
  }

  const formattedLog = formatLogEntry(entry)

  // Use appropriate console method
  switch (level) {
    case "error":
      console.error(formattedLog)
      break
    case "warn":
      console.warn(formattedLog)
      break
    case "info":
    case "debug":
      if (getEnvironment() === "development") {
        // In development, use console.log for info/debug
        console.log(formattedLog)
      }
      break
  }
}

/**
 * Logger instance
 */
export const logger = {
  /**
   * Log debug information (development only)
   */
  debug(message: string, context?: LogContext): void {
    log("debug", message, context)
  },

  /**
   * Log informational messages
   */
  info(message: string, context?: LogContext): void {
    log("info", message, context)
  },

  /**
   * Log warning messages
   */
  warn(message: string, context?: LogContext): void {
    log("warn", message, context)
  },

  /**
   * Log error messages
   */
  error(message: string, context?: LogContext): void {
    log("error", message, context)
  },

  /**
   * Log error with Error object
   */
  errorWithException(message: string, error: Error, context?: LogContext): void {
    const errorContext = {
      ...context,
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack,
    }
    log("error", message, errorContext)
  },
}

/**
 * Default export
 */
export default logger
