"use client"

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react"
import type { UserRole, UserPermission } from "@/lib/types"

interface PermissionContextType {
  permissions: string[]
  roles: UserRole[]
  loading: boolean
  hasPermission: (permission: string) => boolean
  hasAnyPermission: (permissions: string[]) => boolean
  hasAllPermissions: (permissions: string[]) => boolean
  hasRole: (roleName: string) => boolean
  hasAdminAccess: () => boolean
  hasSupervisorAccess: () => boolean
  refreshPermissions: () => Promise<void>
  setPermissionsFromLogin: (loginData: { permissions: UserPermission[]; roles: UserRole[] }) => void
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined)

interface PermissionProviderProps {
  children: ReactNode
}

export const PermissionProvider: React.FC<PermissionProviderProps> = ({ children }) => {
  const [permissions, setPermissions] = useState<Set<string>>(new Set())
  const [roles, setRoles] = useState<UserRole[]>([])
  const [loading, setLoading] = useState(true)

  // Initialize permissions from login data in localStorage with expiration check
  useEffect(() => {
    const loginData = localStorage.getItem("login_data")
    if (loginData) {
      try {
        const parsed = JSON.parse(loginData)
        // Check if data is expired (24 hours)
        const now = Date.now()
        const expiryTime = parsed.timestamp + 24 * 60 * 60 * 1000 // 24 hours

        if (now > expiryTime) {
          localStorage.removeItem("login_data")
          console.log("Login data expired, fetching fresh permissions")
          fetchUserPermissions()
          return
        }

        if (parsed.permissions && parsed.roles) {
          setPermissions(new Set(parsed.permissions.map((p: UserPermission) => p.name)))
          setRoles(parsed.roles)
          setLoading(false)
          return
        }
      } catch (error) {
        console.error("Failed to parse login data:", error)
        localStorage.removeItem("login_data")
      }
    }
    // Fallback to fetching
    fetchUserPermissions()
  }, [])

  // Also check if user object has role/permission data
  useEffect(() => {
    const userData = localStorage.getItem("user_data")
    if (userData) {
      try {
        const user = JSON.parse(userData)
        if (user.roles && user.permissions) {
          setPermissions(new Set(user.permissions.map((p: UserPermission) => p.name)))
          setRoles(user.roles)
          setLoading(false)
        }
      } catch (error) {
        console.error("Failed to parse user data:", error)
      }
    }
  }, [])

  const fetchUserPermissions = async () => {
    try {
      const token = localStorage.getItem("access_token")
      if (!token) {
        setLoading(false)
        return
      }

      // Use backend API directly, not Next.js API route
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
      const response = await fetch(`${apiUrl}/users/me/permissions`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        // Backend returns {success, data: {permissions[], roles[]}}
        if (data.success && data.data) {
          setPermissions(new Set(data.data.permissions.map((p: UserPermission) => p.name)))
          setRoles(data.data.roles)
        }
      } else {
        console.error("Failed to fetch permissions:", response.status, response.statusText)
      }
    } catch (error) {
      console.error("Failed to fetch permissions:", error)
    } finally {
      setLoading(false)
    }
  }

  // Permission checking functions
  const hasPermission = (permission: string): boolean => {
    return permissions.has(permission)
  }

  const hasAnyPermission = (permissionList: string[]): boolean => {
    return permissionList.some((permission) => permissions.has(permission))
  }

  const hasAllPermissions = (permissionList: string[]): boolean => {
    return permissionList.every((permission) => permissions.has(permission))
  }

  const hasRole = (roleName: string): boolean => {
    return roles.some((role) => role.name === roleName)
  }

  // Check if user has admin-level access (super_admin, system_admin, org_admin)
  const hasAdminAccess = (): boolean => {
    const adminRoles = ["super_admin", "system_admin", "org_admin"]
    return roles.some((role) => adminRoles.includes(role.name))
  }

  // Check if user has supervisor-level access or higher
  const hasSupervisorAccess = (): boolean => {
    const supervisorRoles = [
      "super_admin",
      "system_admin",
      "org_admin",
      "data_manager",
      "supervisor",
    ]
    return roles.some((role) => supervisorRoles.includes(role.name))
  }

  const refreshPermissions = async (): Promise<void> => {
    await fetchUserPermissions()
  }

  const setPermissionsFromLogin = (loginData: {
    permissions: UserPermission[]
    roles: UserRole[]
  }) => {
    if (loginData.permissions && loginData.roles) {
      setPermissions(new Set(loginData.permissions.map((p) => p.name)))
      setRoles(loginData.roles)
      setLoading(false)
    }
  }

  const value: PermissionContextType = {
    permissions: Array.from(permissions),
    roles,
    loading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAdminAccess,
    hasSupervisorAccess,
    refreshPermissions,
    setPermissionsFromLogin,
  }

  return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>
}

export const usePermissions = (): PermissionContextType => {
  const context = useContext(PermissionContext)
  if (!context) {
    throw new Error("usePermissions must be used within PermissionProvider")
  }
  return context
}
