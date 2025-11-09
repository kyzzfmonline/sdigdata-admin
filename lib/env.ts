import { envSchema } from "./validations"
import { logger } from "./logger"

/**
 * Environment variable validation
 *
 * This module validates that all required environment variables are present
 * and properly formatted according to the envSchema from validations.ts
 */

interface EnvConfig {
  NEXT_PUBLIC_API_URL: string
  NODE_ENV: "development" | "production" | "test"
}

let validatedEnv: EnvConfig | null = null

/**
 * Validate environment variables on app startup
 * Throws an error if validation fails
 */
export function validateEnv(): EnvConfig {
  // Return cached result if already validated
  if (validatedEnv) {
    return validatedEnv
  }

  const env = {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NODE_ENV: process.env.NODE_ENV || "development",
  }

  try {
    const result = envSchema.parse(env)

    validatedEnv = {
      NEXT_PUBLIC_API_URL: result.NEXT_PUBLIC_API_URL,
      NODE_ENV: result.NODE_ENV || "development",
    }

    logger.info("Environment variables validated successfully", {
      apiUrl: validatedEnv.NEXT_PUBLIC_API_URL,
      nodeEnv: validatedEnv.NODE_ENV,
    })

    return validatedEnv
  } catch (error) {
    logger.error("Environment validation failed", {
      error: error instanceof Error ? error.message : "Unknown error",
      env: {
        NEXT_PUBLIC_API_URL: env.NEXT_PUBLIC_API_URL ? "[SET]" : "[MISSING]",
        NODE_ENV: env.NODE_ENV,
      },
    })

    // In production, we should fail fast
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "Critical environment variables are missing or invalid. Please check your .env configuration."
      )
    }

    // In development, log a warning but don't crash
    console.warn(
      "\n⚠️  WARNING: Environment validation failed!\n" +
        "   Required environment variables:\n" +
        "   - NEXT_PUBLIC_API_URL: API base URL (e.g., http://localhost:8000)\n" +
        "\n" +
        "   Please create a .env.local file with these variables.\n" +
        "   See .env.example for reference.\n"
    )

    // Return defaults for development
    return {
      NEXT_PUBLIC_API_URL: "http://localhost:8000",
      NODE_ENV: "development",
    }
  }
}

/**
 * Get the validated environment config
 * Must be called after validateEnv()
 */
export function getEnv(): EnvConfig {
  if (!validatedEnv) {
    return validateEnv()
  }
  return validatedEnv
}

/**
 * Check if we're in production
 */
export function isProduction(): boolean {
  return getEnv().NODE_ENV === "production"
}

/**
 * Check if we're in development
 */
export function isDevelopment(): boolean {
  return getEnv().NODE_ENV === "development"
}

/**
 * Check if we're in test mode
 */
export function isTest(): boolean {
  return getEnv().NODE_ENV === "test"
}
