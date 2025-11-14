"use client"

import { useEffect, useState } from "react"
import { LayoutWrapper } from "@/components/layout-wrapper"
import { RouteGuard } from "@/components/route-guard"
import { rbacAPI } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import type { RoleWithCounts, CreateRoleInput, UpdateRoleInput } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, Pencil, Trash2, Shield, Users, Key, Loader } from "lucide-react"
import { useRouter } from "next/navigation"

export default function RolesPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [roles, setRoles] = useState<RoleWithCounts[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedRole, setSelectedRole] = useState<RoleWithCounts | null>(null)
  const [formData, setFormData] = useState<CreateRoleInput>({
    name: "",
    description: "",
    level: 10,
  })

  // Load roles
  useEffect(() => {
    loadRoles()
  }, [])

  const loadRoles = async () => {
    try {
      setLoading(true)
      const response = await rbacAPI.getRoles()
      console.log("Roles API Response:", response.data)

      // Backend returns: {success: true, data: {roles: [...], count: N}}
      let rolesData = []
      if (response.data.data?.roles && Array.isArray(response.data.data.roles)) {
        rolesData = response.data.data.roles
      } else if (Array.isArray(response.data.data)) {
        rolesData = response.data.data
      } else if (Array.isArray(response.data)) {
        rolesData = response.data
      } else {
        console.error("Unexpected roles response structure:", response.data)
      }

      setRoles(rolesData)
    } catch (error: any) {
      console.error("Failed to load roles:", error)
      toast({
        title: "Error",
        description: error.response?.data?.detail || error.message || "Failed to load roles",
        variant: "destructive",
      })
      setRoles([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Role name is required",
        variant: "destructive",
      })
      return
    }

    try {
      await rbacAPI.createRole(formData)
      toast({
        title: "Success",
        description: "Role created successfully",
      })
      setShowCreateDialog(false)
      setFormData({ name: "", description: "", level: 10 })
      loadRoles()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to create role",
        variant: "destructive",
      })
    }
  }

  const handleUpdate = async () => {
    if (!selectedRole || !formData.name.trim()) return

    try {
      const updateData: UpdateRoleInput = {
        name: formData.name,
        description: formData.description,
        level: formData.level,
      }
      await rbacAPI.updateRole(selectedRole.id, updateData)
      toast({
        title: "Success",
        description: "Role updated successfully",
      })
      setShowEditDialog(false)
      setSelectedRole(null)
      setFormData({ name: "", description: "", level: 10 })
      loadRoles()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to update role",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async () => {
    if (!selectedRole) return

    try {
      await rbacAPI.deleteRole(selectedRole.id)
      toast({
        title: "Success",
        description: "Role deleted successfully",
      })
      setShowDeleteDialog(false)
      setSelectedRole(null)
      loadRoles()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to delete role",
        variant: "destructive",
      })
    }
  }

  const openEditDialog = (role: RoleWithCounts) => {
    setSelectedRole(role)
    setFormData({
      name: role.name,
      description: role.description || "",
      level: role.level,
    })
    setShowEditDialog(true)
  }

  const openDeleteDialog = (role: RoleWithCounts) => {
    setSelectedRole(role)
    setShowDeleteDialog(true)
  }

  return (
    <RouteGuard permission="roles:admin">
      <LayoutWrapper>
        <div className="p-8">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                <Shield className="w-8 h-8" />
                Roles Management
              </h1>
              <p className="text-muted-foreground mt-1">
                Create and manage roles with custom permissions
              </p>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Role
            </Button>
          </div>

          {/* Roles Table */}
          <Card>
            <div className="p-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : roles.length === 0 ? (
                <div className="text-center py-12">
                  <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No roles found</p>
                  <Button onClick={() => setShowCreateDialog(true)} className="mt-4">
                    Create First Role
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-center">Level</TableHead>
                      <TableHead className="text-center">
                        <Users className="w-4 h-4 inline mr-1" />
                        Users
                      </TableHead>
                      <TableHead className="text-center">
                        <Key className="w-4 h-4 inline mr-1" />
                        Permissions
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roles.map((role) => (
                      <TableRow key={role.id}>
                        <TableCell className="font-medium">{role.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {role.description || "—"}
                        </TableCell>
                        <TableCell className="text-center">{role.level}</TableCell>
                        <TableCell className="text-center">{role.user_count}</TableCell>
                        <TableCell className="text-center">{role.permission_count}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/rbac/roles/${role.id}`)}
                            >
                              <Key className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => openEditDialog(role)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDeleteDialog(role)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </Card>

          {/* Create Dialog */}
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Role</DialogTitle>
                <DialogDescription>Create a new role with custom permissions</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Role Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Data Analyst"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of this role..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="level">Level</Label>
                  <Input
                    id="level"
                    type="number"
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: Number(e.target.value) })}
                    min="1"
                    max="100"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Higher levels have more authority (1-100)
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate}>Create Role</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Dialog */}
          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Role</DialogTitle>
                <DialogDescription>Update role details</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-name">Role Name *</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-level">Level</Label>
                  <Input
                    id="edit-level"
                    type="number"
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: Number(e.target.value) })}
                    min="1"
                    max="100"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdate}>Update Role</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Role</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete the role "{selectedRole?.name}"? This will remove
                  all role assignments and cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDelete}>
                  Delete Role
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </LayoutWrapper>
    </RouteGuard>
  )
}
