"use client"

import React, { ReactNode } from "react"
import { usePermissions } from "@/lib/permission-context"
import { Loader2 } from "lucide-react"

interface PermissionGuardProps {
  permission: string
  fallback?: ReactNode
  children: ReactNode
}

interface RoleGuardProps {
  role: string
  fallback?: ReactNode
  children: ReactNode
}

interface AnyPermissionGuardProps {
  permissions: string[]
  fallback?: ReactNode
  children: ReactNode
}

interface AllPermissionsGuardProps {
  permissions: string[]
  fallback?: ReactNode
  children: ReactNode
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permission,
  fallback = null,
  children,
}) => {
  const { hasPermission, loading } = usePermissions()

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
        <span className="text-sm text-muted-foreground">Loading permissions...</span>
      </div>
    )
  }

  if (!hasPermission(permission)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ role, fallback = null, children }) => {
  const { hasRole, loading } = usePermissions()

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
        <span className="text-sm text-muted-foreground">Loading permissions...</span>
      </div>
    )
  }

  if (!hasRole(role)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

export const AnyPermissionGuard: React.FC<AnyPermissionGuardProps> = ({
  permissions,
  fallback = null,
  children,
}) => {
  const { hasAnyPermission, loading } = usePermissions()

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
        <span className="text-sm text-muted-foreground">Loading permissions...</span>
      </div>
    )
  }

  if (!hasAnyPermission(permissions)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

export const AllPermissionsGuard: React.FC<AllPermissionsGuardProps> = ({
  permissions,
  fallback = null,
  children,
}) => {
  const { hasAllPermissions, loading } = usePermissions()

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
        <span className="text-sm text-muted-foreground">Loading permissions...</span>
      </div>
    )
  }

  if (!hasAllPermissions(permissions)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
