"use client"

import { useEffect } from "react"
import { AlertTriangle, RefreshCcw, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { logger } from "@/lib/logger"

/**
 * Next.js error boundary for catching errors at the route level
 * This file automatically wraps page components
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    logger.errorWithException("Route error", error, {
      digest: error.digest,
    })

    // TODO: Log to error tracking service in production
    // Example: Sentry.captureException(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-2xl w-full p-8">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-2">Something went wrong</h1>

          <p className="text-muted-foreground mb-6">
            We encountered an unexpected error while loading this page. Please try again or return
            to the homepage.
          </p>

          {process.env.NODE_ENV === "development" && (
            <div className="w-full mb-6 p-4 bg-muted rounded-lg text-left">
              <p className="font-mono text-sm text-destructive">{error.message}</p>
              {error.digest && (
                <p className="text-xs text-muted-foreground mt-2">Error ID: {error.digest}</p>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <Button onClick={reset} variant="default">
              <RefreshCcw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button onClick={() => (window.location.href = "/")} variant="outline">
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
