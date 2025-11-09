"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useStore } from "@/lib/store"
import { usePermissions } from "@/lib/permission-context"
import { Loader } from "lucide-react"

export default function HomePage() {
  const router = useRouter()
  const { token, user } = useStore()
  const { hasRole } = usePermissions()

  useEffect(() => {
    // Redirect based on authentication status and role
    if (!token) {
      // Not authenticated - go to login
      router.push("/login")
    } else if (hasRole("agent")) {
      // Agent - go to agent dashboard
      router.push("/agent")
    } else {
      // Admin or other roles - go to admin dashboard
      router.push("/dashboard")
    }
  }, [token, user, router])

  // Show loading while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Loading SDIGdata...</p>
      </div>
    </div>
  )
}
