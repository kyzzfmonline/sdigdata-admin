"use client"

import { useEffect } from "react"
import { usePermissions } from "@/lib/permission-context"

/**
 * Permission Debug Console Logger
 *
 * Add this component anywhere in your app to log permission info to console.
 * Useful for debugging permission issues.
 *
 * Usage: <PermissionDebugConsole />
 */
export function PermissionDebugConsole() {
  const { permissions, roles, loading } = usePermissions()

  useEffect(() => {
    console.group("🔐 Permission Debug Info")
    console.log("Loading:", loading)
    console.log("Roles Count:", roles.length)
    console.log("Permissions Count:", permissions.length)

    if (roles.length > 0) {
      console.log(
        "Roles:",
        roles.map((r) => `${r.name} (level ${r.level})`)
      )
    }

    if (permissions.length > 0) {
      console.log("All Permissions:", permissions)

      // Group by resource
      const grouped = permissions.reduce(
        (acc, perm) => {
          const [resource] = perm.split(".")
          if (!acc[resource]) acc[resource] = []
          acc[resource].push(perm)
          return acc
        },
        {} as Record<string, string[]>
      )

      console.log("Grouped by Resource:", grouped)

      // Check RBAC permissions
      const hasRolesAdmin = permissions.includes("roles.admin")
      const hasPermsAdmin = permissions.includes("permissions.admin")
      const hasUsersAdmin = permissions.includes("users.admin")

      console.log("\n📊 RBAC Access:")
      console.log(`  Roles Management: ${hasRolesAdmin ? "✅" : "❌"} (roles.admin)`)
      console.log(`  Permissions Management: ${hasPermsAdmin ? "✅" : "❌"} (permissions.admin)`)
      console.log(`  User-Role Management: ${hasUsersAdmin ? "✅" : "❌"} (users.admin)`)
    } else {
      console.warn("⚠️ No permissions found!")
    }

    // Check localStorage
    const loginData = localStorage.getItem("login_data")
    if (loginData) {
      try {
        const parsed = JSON.parse(loginData)
        const age = Date.now() - parsed.timestamp
        const hoursOld = (age / (1000 * 60 * 60)).toFixed(1)
        console.log(`\n💾 Cache Info:`)
        console.log(`  Age: ${hoursOld} hours`)
        console.log(`  Expired: ${age > 24 * 60 * 60 * 1000 ? "Yes ⚠️" : "No ✅"}`)
      } catch (e) {
        console.error("Failed to parse login_data:", e)
      }
    } else {
      console.warn("⚠️ No login_data in localStorage")
    }

    console.groupEnd()
  }, [permissions, roles, loading])

  // This component doesn't render anything
  return null
}
