"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useStore } from "@/lib/store"
import { usePermissions } from "@/lib/permission-context"

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: string
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const router = useRouter()
  const { token, user, restoreUser } = useStore()
  const { hasRole } = usePermissions()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!token) {
      router.push("/login")
    } else if (token && !user) {
      // Token exists but user is not loaded, restore user
      restoreUser()
    } else if (requiredRole && !hasRole(requiredRole)) {
      router.push("/dashboard")
    }
  }, [token, user, requiredRole, router, restoreUser])

  // Prevent hydration mismatch by not rendering loading state on server
  if (!isClient) {
    return null
  }

  // Don't render anything until we know the auth state
  if (!token) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return <>{children}</>
}
