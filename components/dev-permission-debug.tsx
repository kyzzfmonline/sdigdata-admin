"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { usePermissions } from "@/lib/permission-context"
import { RefreshCw, Trash2, Eye, EyeOff } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

/**
 * Developer Utility: Permission Debug Component
 *
 * This component helps debug permission issues during development.
 *
 * Usage:
 * 1. Import in your layout or dashboard page
 * 2. Add <DevPermissionDebug /> component
 * 3. Use the buttons to refresh or clear permission cache
 * 4. Remove before deploying to production
 */
export function DevPermissionDebug() {
  const { permissions, roles, refreshPermissions } = usePermissions()
  const { toast } = useToast()
  const [showDetails, setShowDetails] = useState(false)

  const handleRefresh = async () => {
    try {
      await refreshPermissions()
      toast({
        title: "Permissions Refreshed",
        description: "Fetched latest permissions from server",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh permissions",
        variant: "destructive",
      })
    }
  }

  const handleClearCache = () => {
    localStorage.removeItem("login_data")
    localStorage.removeItem("user_data")
    toast({
      title: "Cache Cleared",
      description: "Reloading page to fetch fresh permissions...",
    })
    setTimeout(() => {
      window.location.reload()
    }, 1000)
  }

  return (
    <Card className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-sm flex items-center gap-2">
            🔧 Developer: Permission Debug
            <span className="text-xs font-normal text-muted-foreground">
              ({permissions.length} permissions, {roles.length} roles)
            </span>
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Use these tools if permissions aren't showing after database changes
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setShowDetails(!showDetails)}>
          {showDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </Button>
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          className="flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Permissions
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleClearCache}
          className="flex items-center gap-2 text-orange-600 hover:text-orange-700"
        >
          <Trash2 className="w-4 h-4" />
          Clear Cache & Reload
        </Button>
      </div>

      {showDetails && (
        <div className="mt-4 space-y-3">
          <div>
            <h4 className="text-sm font-semibold mb-2">Your Roles:</h4>
            {roles.length === 0 ? (
              <p className="text-xs text-muted-foreground">No roles assigned</p>
            ) : (
              <div className="flex flex-wrap gap-1">
                {roles.map((role) => (
                  <span
                    key={role.id}
                    className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded"
                  >
                    {role.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-2">Your Permissions:</h4>
            {permissions.length === 0 ? (
              <p className="text-xs text-muted-foreground">No permissions assigned</p>
            ) : (
              <div className="max-h-40 overflow-y-auto">
                <div className="grid grid-cols-2 gap-1">
                  {permissions.map((perm) => (
                    <span
                      key={perm}
                      className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 rounded font-mono"
                    >
                      {perm}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="pt-3 border-t">
            <p className="text-xs text-muted-foreground">
              <strong>RBAC Access:</strong>
            </p>
            <ul className="text-xs text-muted-foreground mt-1 space-y-1">
              <li>
                ✓ Roles page:{" "}
                {permissions.includes("roles:admin") ? "✅ Yes" : "❌ No (need roles:admin)"}
              </li>
              <li>
                ✓ Permissions page:{" "}
                {permissions.includes("permissions:admin")
                  ? "✅ Yes"
                  : "❌ No (need permissions:admin)"}
              </li>
              <li>
                ✓ User-role management:{" "}
                {permissions.includes("users:admin") ? "✅ Yes" : "❌ No (need users:admin)"}
              </li>
            </ul>
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground mt-3 pt-3 border-t">
        ⚠️ Remove this component before deploying to production
      </p>
    </Card>
  )
}
