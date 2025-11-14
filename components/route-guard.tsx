"use client"

import { ReactNode } from "react"
import { usePermissions } from "@/lib/permission-context"
import { Card } from "@/components/ui/card"

interface RouteGuardProps {
  children: ReactNode
  permission?: string
  permissions?: string[]
  requireAll?: boolean
  fallback?: ReactNode
}

export function RouteGuard({
  children,
  permission,
  permissions,
  requireAll = false,
  fallback,
}: RouteGuardProps) {
  const {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    permissions: userPermissions,
  } = usePermissions()

  let hasAccess = false

  if (permission) {
    hasAccess = hasPermission(permission)
    // Debug logging
    if (!hasAccess) {
      console.warn(`🚫 RouteGuard: Access denied. Required permission: "${permission}"`)
      console.log("Your permissions:", userPermissions)
      console.log(`Has "${permission}":`, userPermissions.includes(permission))
    }
  } else if (permissions) {
    hasAccess = requireAll ? hasAllPermissions(permissions) : hasAnyPermission(permissions)
    if (!hasAccess) {
      console.warn(`🚫 RouteGuard: Access denied. Required permissions:`, permissions)
      console.log("Your permissions:", userPermissions)
    }
  } else {
    // If no permission specified, allow access
    hasAccess = true
  }

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-6 text-center max-w-md">
          <h2 className="text-xl font-semibold text-foreground mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}
