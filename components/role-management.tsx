"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useUsers, useRoles, useUserRoles, useAssignRole, useRemoveRole } from "@/hooks/use-users"
import { useToast } from "@/hooks/use-toast"
import { useStore } from "@/lib/store"
import { usePermissions } from "@/lib/permission-context"
import { UserPlus, UserMinus, Shield, Loader2 } from "lucide-react"
import type { User, Role } from "@/lib/types"

export function RoleManagement() {
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [selectedRoleId, setSelectedRoleId] = useState<string>("")
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false)
  const [roleToRemove, setRoleToRemove] = useState<string>("")

  const { userPermissions, userRoles: currentUserRoles } = useStore()
  const { hasAnyPermission, hasAdminAccess, hasRole } = usePermissions()

  const { data: users = [], isLoading: usersLoading, error: usersError } = useUsers()
  const { data: roles = [], isLoading: rolesLoading, error: rolesError } = useRoles()
  const { data: userAssignedRoles = [], error: userRolesError } = useUserRoles(selectedUserId)

  // Determine which roles the current user can assign based on their role level
  const getAssignableRoles = () => {
    if (hasRole("super_admin")) {
      // Super admin can assign any role
      return roles
    } else if (hasRole("system:admin")) {
      // System admin can assign roles below super_admin
      return roles.filter((role) => role.name !== "super_admin")
    } else if (hasRole("org_admin")) {
      // Org admin can only assign basic roles
      return roles.filter((role) => ["agent", "viewer", "supervisor"].includes(role.name))
    }
    // Fallback for permission-based access
    return roles.filter((role) => ["agent", "viewer"].includes(role.name))
  }

  const assignableRoles = getAssignableRoles()

  const assignRole = useAssignRole()
  const removeRole = useRemoveRole()
  const { toast } = useToast()

  // Check if user can manage roles - allow admin roles or specific permissions
  const canManageRoles = hasAdminAccess() || hasAnyPermission(["roles:admin", "permissions:admin"])

  if (!canManageRoles) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-muted-foreground">
            You don't have permission to manage user roles and permissions.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Required: Admin role (super_admin, system_admin, org_admin) or
            roles.admin/permissions.admin permission
          </p>
        </CardContent>
      </Card>
    )
  }

  // Show loading state while checking permissions
  const { loading } = usePermissions()
  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="ml-2">Checking permissions...</span>
        </CardContent>
      </Card>
    )
  }

  const handleAssignRole = () => {
    if (!selectedUserId || !selectedRoleId) {
      toast({
        title: "Error",
        description: "Please select both a user and a role",
        variant: "destructive",
      })
      return
    }

    assignRole.mutate(
      { userId: selectedUserId, roleId: selectedRoleId },
      {
        onSuccess: () => {
          setIsAssignDialogOpen(false)
          setSelectedRoleId("")
        },
      }
    )
  }

  const handleRemoveRole = () => {
    if (!selectedUserId || !roleToRemove) return

    removeRole.mutate(
      { userId: selectedUserId, roleId: roleToRemove },
      {
        onSuccess: () => {
          setIsRemoveDialogOpen(false)
          setRoleToRemove("")
        },
      }
    )
  }

  const getRoleBadgeVariant = (level: number) => {
    if (level >= 100) return "destructive"
    if (level >= 50) return "default"
    return "secondary"
  }

  if (usersLoading || rolesLoading) {
    return (
      <Card>
        <CardContent className="p-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="ml-2">Loading role management...</span>
        </CardContent>
      </Card>
    )
  }

  if (usersError || rolesError) {
    const error = (usersError || rolesError) as any
    const isApiNotImplemented = error?.response?.status === 404
    const isUnauthorized = error?.response?.status === 401 || error?.response?.status === 403

    // Log error details for debugging
    console.error("Role management error:", {
      usersError,
      rolesError,
      status: error?.response?.status,
      message: error?.response?.data?.message || error?.message,
    })

    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {isApiNotImplemented
              ? "Role Management Not Available"
              : isUnauthorized
                ? "Authentication Required"
                : "Unable to Load Role Management"}
          </h3>
          <p className="text-muted-foreground mb-4">
            {isApiNotImplemented
              ? "The role management system has not been implemented on the backend yet."
              : isUnauthorized
                ? "Your session may have expired. Please log out and log back in to access role management."
                : "The role management system is not available. This may be because:"}
          </p>
          {!isApiNotImplemented && !isUnauthorized && (
            <ul className="text-sm text-muted-foreground text-left max-w-md mx-auto space-y-1">
              <li>• Your session has expired</li>
              <li>• There's a network connectivity issue</li>
              <li>• The backend API is not responding</li>
            </ul>
          )}
          {isUnauthorized && (
            <Button onClick={() => (window.location.href = "/login")} className="mt-4">
              Go to Login
            </Button>
          )}
          <p className="text-xs text-muted-foreground mt-4 font-mono">
            Error: {error?.response?.data?.message || error?.message || "Unknown error"}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Role Management
          </CardTitle>
          <CardDescription>
            Assign and remove roles from users to control their permissions and access levels.
            {hasRole("super_admin") && (
              <span className="block text-sm text-green-600 mt-1">
                Super Admin: Full access to assign any role
              </span>
            )}
            {hasRole("system:admin") && !hasRole("super_admin") && (
              <span className="block text-sm text-blue-600 mt-1">
                System Admin: Can assign all roles except super_admin
              </span>
            )}
            {hasRole("org_admin") && !hasRole("system:admin") && (
              <span className="block text-sm text-orange-600 mt-1">
                Org Admin: Limited to basic roles (agent, viewer, supervisor)
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* User Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select User</label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a user to manage roles..." />
              </SelectTrigger>
              <SelectContent>
                {users.map((user: User) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.username} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedUserId && (
            <>
              {/* Current User Roles */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Current Roles</h3>
                  <div className="flex gap-2">
                    <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="flex items-center gap-2">
                          <UserPlus className="w-4 h-4" />
                          Assign Role
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Assign Role</DialogTitle>
                          <DialogDescription>
                            Select a role to assign to this user.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a role..." />
                            </SelectTrigger>
                            <SelectContent>
                              {assignableRoles
                                .filter(
                                  (role) =>
                                    !userAssignedRoles.some((userRole) => userRole.id === role.id)
                                )
                                .map((role: Role) => (
                                  <SelectItem key={role.id} value={role.id}>
                                    {role.name} - {role.description}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <DialogFooter>
                          <Button onClick={handleAssignRole} disabled={assignRole.isPending}>
                            {assignRole.isPending && (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            )}
                            Assign Role
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                {userAssignedRoles.length > 0 ? (
                  <div className="space-y-2">
                    {userAssignedRoles.map((role) => (
                      <div
                        key={role.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Badge variant={getRoleBadgeVariant(role.level)}>{role.name}</Badge>
                          <span className="text-sm text-muted-foreground">{role.description}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setRoleToRemove(role.id)
                            setIsRemoveDialogOpen(true)
                          }}
                          className="text-destructive hover:text-destructive"
                        >
                          <UserMinus className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No roles assigned to this user.
                  </div>
                )}
              </div>

              {/* Available Roles */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Available Roles</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {assignableRoles
                    .filter(
                      (role) => !userAssignedRoles.some((userRole) => userRole.id === role.id)
                    )
                    .map((role: Role) => (
                      <Card key={role.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Badge variant={getRoleBadgeVariant(role.level)} className="mb-2">
                              {role.name}
                            </Badge>
                            <p className="text-sm text-muted-foreground">{role.description}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Level: {role.level}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedRoleId(role.id)
                              setIsAssignDialogOpen(true)
                            }}
                            disabled={assignRole.isPending}
                          >
                            <UserPlus className="w-4 h-4" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Remove Role Confirmation Dialog */}
      <Dialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Role</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this role from the user? This may affect their
              permissions.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRemoveDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveRole}
              disabled={removeRole.isPending}
            >
              {removeRole.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Remove Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
