"use client"

/**
 * Permission Groups Page
 * View and manage permission groups
 */

import { useState } from "react"
import { LayoutWrapper } from "@/components/layout-wrapper"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  usePermissionGroups,
  useCreatePermissionGroup,
  useDeletePermissionGroup,
  type PermissionGroupCreate,
} from "@/hooks/rbac/use-permission-groups"
import { Lock, Plus, Pencil, Trash2, Search, Key } from "lucide-react"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import { useForm } from "react-hook-form"

export default function PermissionGroupsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  const { data: groups, isLoading } = usePermissionGroups()
  const createGroupMutation = useCreatePermissionGroup()
  const deleteGroupMutation = useDeletePermissionGroup()

  // Filter groups based on search
  const filteredGroups = groups?.filter(
    (group) =>
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Form handling
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PermissionGroupCreate>()

  const onCreateGroup = async (data: PermissionGroupCreate) => {
    try {
      await createGroupMutation.mutateAsync(data)
      setIsCreateDialogOpen(false)
      reset()
    } catch (error) {
      // Error handled by mutation
    }
  }

  const onDeleteGroup = async (groupId: string) => {
    try {
      await deleteGroupMutation.mutateAsync(groupId)
    } catch (error) {
      // Error handled by mutation
    }
  }

  return (
    <LayoutWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Permission Groups</h1>
            <p className="text-muted-foreground mt-1">
              Organize permissions into logical groups for easier management
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Group
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit(onCreateGroup)}>
                <DialogHeader>
                  <DialogTitle>Create Permission Group</DialogTitle>
                  <DialogDescription>
                    Create a new permission group to organize related permissions
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Group Name *</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Form Management"
                      {...register("name", { required: "Group name is required" })}
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive">{errors.name.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe the purpose of this permission group..."
                      rows={3}
                      {...register("description")}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsCreateDialogOpen(false)
                      reset()
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createGroupMutation.isPending}>
                    {createGroupMutation.isPending ? "Creating..." : "Create Group"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Groups</CardTitle>
              <Lock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{groups?.length ?? 0}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">Permission groups in system</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Permissions</CardTitle>
              <Key className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">
                  {groups?.reduce((sum, g) => sum + (g.permission_count ?? 0), 0) ?? 0}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">Across all groups</p>
            </CardContent>
          </Card>
        </div>

        {/* Groups Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Permission Groups</CardTitle>
                <CardDescription>Manage permission groups and their assignments</CardDescription>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search groups..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filteredGroups && filteredGroups.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Group Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-center">Permissions</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGroups.map((group) => (
                    <TableRow key={group.id}>
                      <TableCell>
                        <Link
                          href={`/rbac/permission-groups/${group.id}`}
                          className="font-medium hover:underline flex items-center gap-2"
                        >
                          <Lock className="h-4 w-4 text-muted-foreground" />
                          {group.name}
                        </Link>
                      </TableCell>
                      <TableCell className="max-w-md">
                        <p className="text-sm text-muted-foreground truncate">
                          {group.description || "No description"}
                        </p>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="gap-1">
                          <Key className="h-3 w-3" />
                          {group.permission_count ?? 0}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {group.organization_id ? (
                          <Badge variant="secondary">Org Specific</Badge>
                        ) : (
                          <Badge variant="outline">Global</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/rbac/permission-groups/${group.id}`}>
                            <Button variant="ghost" size="sm">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </Link>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Permission Group</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete the group "{group.name}"? This
                                  action cannot be undone. Roles using this group may lose
                                  associated permissions.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => onDeleteGroup(group.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <Lock className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold">No permission groups found</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  {searchQuery
                    ? "Try adjusting your search query"
                    : "Get started by creating your first permission group"}
                </p>
                {!searchQuery && (
                  <Button onClick={() => setIsCreateDialogOpen(true)} className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Permission Group
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-base">About Permission Groups</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              Permission groups help you organize related permissions together for easier
              management. Instead of assigning individual permissions, you can assign entire groups
              to roles.
            </p>
            <p>
              For example, a "Form Management" group might include permissions like forms:create,
              forms:read, forms:update, and forms:delete.
            </p>
          </CardContent>
        </Card>
      </div>
    </LayoutWrapper>
  )
}
