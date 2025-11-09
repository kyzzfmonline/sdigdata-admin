"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { authAPI } from "@/lib/api"
import type { User } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { Plus, Trash2 } from "lucide-react"
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

export function UserManagementTable() {
  const [showAddForm, setShowAddForm] = useState(false)
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null)
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

  const handleRowDoubleClick = (user: User) => {
    toast({
      title: "Edit User",
      description: "User editing functionality coming soon",
    })
  }

  // Check permissions
  const canManageUsers = hasAnyPermission(["users.admin", "users.create", "users.read"])
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
      header: ({ column }) => <DataTableColumnHeader column={column} title="Role" />,
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

        return (
          <div className="flex items-center justify-end">
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
    </div>
  )
}
