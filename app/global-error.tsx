"use client"

import { useEffect } from "react"
import { AlertTriangle } from "lucide-react"
import { logger } from "@/lib/logger"

/**
 * Global error boundary for catching errors in the root layout
 * This is a last resort error handler
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log critical error
    logger.errorWithException("Global error - critical application failure", error, {
      digest: error.digest,
      level: "fatal",
    })

    // TODO: Log to error tracking service
    // Example: Sentry.captureException(error, { level: 'fatal' })
  }, [error])

  return (
    <html lang="en">
      <body>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <div
            style={{
              maxWidth: "32rem",
              textAlign: "center",
              padding: "2rem",
              border: "1px solid #e5e7eb",
              borderRadius: "0.5rem",
            }}
          >
            <AlertTriangle size={48} style={{ margin: "0 auto 1rem", color: "#ef4444" }} />
            <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "0.5rem" }}>
              Application Error
            </h1>
            <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>
              A critical error occurred. Please refresh the page to continue.
            </p>
            <button
              onClick={reset}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "0.375rem",
                cursor: "pointer",
                fontSize: "1rem",
              }}
            >
              Refresh Page
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
