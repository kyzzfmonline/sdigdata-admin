"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { authAPI, rbacAPI } from "@/lib/api"
import type { User, RoleWithCounts, UserRole, UserPermission } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { Plus, Trash2, Shield, Key, X } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useStore } from "@/lib/store"
import { registerSchema, type RegisterInput } from "@/lib/validations"
import { useUsers, useDeleteUser } from "@/hooks/use-users"
import { DataTable, DataTableColumnHeader } from "@/components/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { usePermissions } from "@/lib/permission-context"
import { PermissionGuard } from "@/components/permission-guards"
import { useConditionalRender } from "@/hooks/use-conditional-render"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export function UserManagementTable() {
  const [showAddForm, setShowAddForm] = useState(false)
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null)
  const [manageRolesUser, setManageRolesUser] = useState<User | null>(null)
  const [userRoles, setUserRoles] = useState<UserRole[]>([])
  const [availableRoles, setAvailableRoles] = useState<RoleWithCounts[]>([])
  const [userPermissions, setUserPermissions] = useState<UserPermission[]>([])
  const [loadingRoles, setLoadingRoles] = useState(false)
  const [selectedRoleToAssign, setSelectedRoleToAssign] = useState<string>("")
  const { data: users = [], isLoading } = useUsers()
  const deleteUser = useDeleteUser()
  const { toast } = useToast()
  const { user } = useStore()
  const { hasPermission, hasAnyPermission } = usePermissions()
  const { ifPerm, ifAnyPerm } = useConditionalRender()

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    mode: "onBlur",
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "agent",
      organization_id: user?.organization_id || "",
    },
  })

  useEffect(() => {
    if (user?.organization_id) {
      form.setValue("organization_id", user.organization_id)
    }
  }, [user, form])

  const onSubmit = async (data: RegisterInput) => {
    if (!user?.organization_id) {
      toast({
        title: "Error",
        description: "Current user's organization ID not found. Cannot create user.",
        variant: "destructive",
      })
      return
    }

    // API only supports admin and agent roles for registration
    if (data.role !== "admin" && data.role !== "agent") {
      toast({
        title: "Error",
        description: "Only admin and agent roles can be created via registration.",
        variant: "destructive",
      })
      return
    }

    try {
      await authAPI.register({
        username: data.username,
        password: data.password,
        role: data.role as "admin" | "agent",
        organization_id: data.organization_id,
      })
      toast({
        title: "User created successfully",
        variant: "success",
      })
      form.reset({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "agent",
        organization_id: user.organization_id,
      })
      setShowAddForm(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create user",
        variant: "destructive",
      })
    }
  }

  const handleDelete = () => {
    if (!deleteUserId) return
    deleteUser.mutate(deleteUserId, {
      onSettled: () => setDeleteUserId(null),
    })
  }

  const handleBulkDelete = (selectedUsers: User[]) => {
    const canDeleteUsers = hasPermission("users.delete")
    if (!canDeleteUsers) {
      toast({
        title: "Permission Denied",
        description: "You do not have permission to delete users",
        variant: "destructive",
      })
      return
    }

    if (
      confirm(
        `Are you sure you want to delete ${selectedUsers.length} user(s)? This action cannot be undone.`
      )
    ) {
      selectedUsers.forEach((userItem) => {
        deleteUser.mutate(userItem.id)
      })
    }
  }

  const handleRowDoubleClick = (userItem: User) => {
    if (hasPermission("users:admin")) {
      openManageRolesDialog(userItem)
    } else {
      toast({
        title: "Permission Denied",
        description: "You need users:admin permission to manage user roles",
        variant: "destructive",
      })
    }
  }

  const openManageRolesDialog = async (userItem: User) => {
    setManageRolesUser(userItem)
    setLoadingRoles(true)
    setSelectedRoleToAssign("")

    try {
      // Load user's current roles
      const rolesResponse = await rbacAPI.getUserRoles(userItem.id)
      setUserRoles(rolesResponse.data.data || [])

      // Load all available roles
      const allRolesResponse = await rbacAPI.getRoles()
      setAvailableRoles(allRolesResponse.data.data || [])

      // Load user's effective permissions
      const permsResponse = await rbacAPI.getUserPermissions(userItem.id)
      setUserPermissions(permsResponse.data.data || [])
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to load role data",
        variant: "destructive",
      })
    } finally {
      setLoadingRoles(false)
    }
  }

  const handleAssignRole = async () => {
    if (!manageRolesUser || !selectedRoleToAssign) return

    try {
      await rbacAPI.assignRoleToUser(manageRolesUser.id, { role_id: selectedRoleToAssign })
      toast({
        title: "Success",
        description: "Role assigned successfully",
      })
      setSelectedRoleToAssign("")
      // Reload roles
      const rolesResponse = await rbacAPI.getUserRoles(manageRolesUser.id)
      setUserRoles(rolesResponse.data.data || [])
      // Reload permissions
      const permsResponse = await rbacAPI.getUserPermissions(manageRolesUser.id)
      setUserPermissions(permsResponse.data.data || [])
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to assign role",
        variant: "destructive",
      })
    }
  }

  const handleRevokeRole = async (roleId: string) => {
    if (!manageRolesUser) return

    try {
      await rbacAPI.revokeRoleFromUser(manageRolesUser.id, roleId)
      toast({
        title: "Success",
        description: "Role revoked successfully",
      })
      // Reload roles
      const rolesResponse = await rbacAPI.getUserRoles(manageRolesUser.id)
      setUserRoles(rolesResponse.data.data || [])
      // Reload permissions
      const permsResponse = await rbacAPI.getUserPermissions(manageRolesUser.id)
      setUserPermissions(permsResponse.data.data || [])
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to revoke role",
        variant: "destructive",
      })
    }
  }

  // Get unassigned roles
  const unassignedRoles = availableRoles.filter(
    (role) => !userRoles.some((ur) => ur.id === role.id)
  )

  // Group permissions by resource
  const groupedPermissions = userPermissions.reduce(
    (acc, perm) => {
      if (!acc[perm.resource]) {
        acc[perm.resource] = []
      }
      acc[perm.resource].push(perm)
      return acc
    },
    {} as Record<string, UserPermission[]>
  )

  // Check permissions
  const canManageUsers = hasAnyPermission(["users:admin", "users.create", "users.read"])
  const canCreateUsers = hasPermission("users.create")

  if (!canManageUsers) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">You do not have permission to manage users.</p>
        </CardContent>
      </Card>
    )
  }

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "username",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Username" />,
      cell: ({ row }) => {
        return <span className="font-medium">{row.getValue("username")}</span>
      },
    },
    {
      accessorKey: "email",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
      cell: ({ row }) => {
        return <span>{row.getValue("email")}</span>
      },
    },
    {
      accessorKey: "role",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Legacy Role" />,
      cell: ({ row }) => {
        const role = row.getValue("role") as string
        return (
          <Badge
            variant={role === "admin" ? "destructive" : role === "agent" ? "default" : "secondary"}
          >
            {role}
          </Badge>
        )
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
      },
    },
    {
      accessorKey: "roles",
      header: ({ column }) => <DataTableColumnHeader column={column} title="RBAC Roles" />,
      cell: ({ row }) => {
        const userRoles = row.original.roles as UserRole[] | undefined
        if (!userRoles || userRoles.length === 0) {
          return <span className="text-muted-foreground text-sm">No roles</span>
        }
        return (
          <div className="flex gap-1 flex-wrap">
            {userRoles.slice(0, 2).map((role) => (
              <Badge key={role.id} variant="outline" className="text-xs">
                {role.name}
              </Badge>
            ))}
            {userRoles.length > 2 && (
              <Badge variant="secondary" className="text-xs">
                +{userRoles.length - 2}
              </Badge>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
      cell: ({ row }) => {
        const createdAt = row.getValue("created_at") as string
        return <span>{new Date(createdAt).toLocaleDateString()}</span>
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const userItem = row.original
        const canDeleteUsers = hasPermission("users.delete")
        const canManageRoles = hasPermission("users:admin")

        return (
          <div className="flex items-center justify-end gap-1">
            {canManageRoles && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openManageRolesDialog(userItem)}
                title="Manage Roles"
              >
                <Shield className="w-4 h-4" />
              </Button>
            )}
            {canDeleteUsers && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteUserId(userItem.id)}
                className="text-destructive hover:text-destructive"
                title="Delete User"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Users</h1>
          <p className="text-muted-foreground mt-1">Manage system users and permissions</p>
        </div>
        {canCreateUsers && (
          <Button onClick={() => setShowAddForm(!showAddForm)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add User
          </Button>
        )}
      </div>

      {showAddForm && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Create New User</h2>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter username" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="Enter email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input {...field} type="password" placeholder="Enter password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input {...field} type="password" placeholder="Confirm password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="agent">Agent</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Creating..." : "Create User"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </Card>
      )}

      <DataTable
        columns={columns}
        data={users}
        searchKey="username"
        searchPlaceholder="Search users..."
        onRowDoubleClick={handleRowDoubleClick}
        bulkActions={
          hasPermission("users.delete")
            ? [
                {
                  label: "Delete Selected",
                  action: handleBulkDelete,
                  variant: "destructive",
                },
              ]
            : []
        }
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteUserId} onOpenChange={() => setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user and all associated
              data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Manage Roles Dialog */}
      <Dialog open={!!manageRolesUser} onOpenChange={() => setManageRolesUser(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Manage Roles - {manageRolesUser?.username}
            </DialogTitle>
            <DialogDescription>
              Assign and revoke roles for this user. Changes take effect immediately.
            </DialogDescription>
          </DialogHeader>

          {loadingRoles ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">Loading roles...</div>
            </div>
          ) : (
            <Tabs defaultValue="roles" className="mt-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="roles">
                  <Shield className="w-4 h-4 mr-2" />
                  Roles ({userRoles.length})
                </TabsTrigger>
                <TabsTrigger value="permissions">
                  <Key className="w-4 h-4 mr-2" />
                  Permissions ({userPermissions.length})
                </TabsTrigger>
              </TabsList>

              {/* Roles Tab */}
              <TabsContent value="roles" className="space-y-4 mt-4">
                {/* Assign New Role */}
                <Card className="p-4">
                  <h3 className="font-semibold mb-3">Assign New Role</h3>
                  <div className="flex gap-2">
                    <Select value={selectedRoleToAssign} onValueChange={setSelectedRoleToAssign}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select a role to assign..." />
                      </SelectTrigger>
                      <SelectContent>
                        {unassignedRoles.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground">
                            All roles assigned
                          </div>
                        ) : (
                          unassignedRoles.map((role) => (
                            <SelectItem key={role.id} value={role.id}>
                              {role.name}
                              {role.description && (
                                <span className="text-xs text-muted-foreground ml-2">
                                  - {role.description}
                                </span>
                              )}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <Button onClick={handleAssignRole} disabled={!selectedRoleToAssign}>
                      Assign
                    </Button>
                  </div>
                </Card>

                {/* Current Roles */}
                <div>
                  <h3 className="font-semibold mb-3">Current Roles</h3>
                  {userRoles.length === 0 ? (
                    <Card className="p-8">
                      <div className="text-center text-muted-foreground">
                        <Shield className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No roles assigned</p>
                      </div>
                    </Card>
                  ) : (
                    <div className="space-y-2">
                      {userRoles.map((role) => (
                        <Card key={role.id} className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold">{role.name}</h4>
                                <Badge variant="outline" className="text-xs">
                                  Level {role.level}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {role.description || "No description"}
                              </p>
                              <p className="text-xs text-muted-foreground mt-2">
                                Assigned: {new Date(role.assigned_at).toLocaleDateString()}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRevokeRole(role.id)}
                              className="text-red-600 hover:text-red-700"
                              title="Revoke Role"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Permissions Tab */}
              <TabsContent value="permissions" className="space-y-4 mt-4">
                <div className="text-sm text-muted-foreground mb-4">
                  These are the effective permissions granted through assigned roles
                </div>

                {Object.keys(groupedPermissions).length === 0 ? (
                  <Card className="p-8">
                    <div className="text-center text-muted-foreground">
                      <Key className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No permissions</p>
                    </div>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(groupedPermissions).map(([resource, perms]) => (
                      <Card key={resource} className="p-4">
                        <h3 className="font-semibold mb-3 capitalize">{resource}</h3>
                        <div className="space-y-2">
                          {perms.map((perm, idx) => (
                            <div
                              key={idx}
                              className="flex items-start gap-3 p-2 bg-muted/30 rounded"
                            >
                              <Key className="w-4 h-4 mt-0.5 text-primary" />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">{perm.name}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {perm.action}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {perm.description}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setManageRolesUser(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
