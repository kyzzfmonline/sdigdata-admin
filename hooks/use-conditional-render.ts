"use client"

import { usePermissions } from "@/lib/permission-context"

export const useConditionalRender = () => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, hasRole } = usePermissions()

  return {
    // Show element only if user has permission
    ifPerm: (permission: string) => hasPermission(permission),
    ifAnyPerm: (permissions: string[]) => hasAnyPermission(permissions),
    ifAllPerms: (permissions: string[]) => hasAllPermissions(permissions),
    ifRole: (role: string) => hasRole(role),

    // Hide element if user has permission (inverse)
    unlessPerm: (permission: string) => !hasPermission(permission),
    unlessRole: (role: string) => !hasRole(role),

    // Complex conditions
    ifPermAndRole: (permission: string, role: string) => hasPermission(permission) && hasRole(role),
    ifPermOrRole: (permission: string, role: string) => hasPermission(permission) || hasRole(role),
  }
}
