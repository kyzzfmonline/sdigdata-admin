"use client"

import { useEffect, useState } from "react"
import { LayoutWrapper } from "@/components/layout-wrapper"
import { RouteGuard } from "@/components/route-guard"
import { rbacAPI } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import type { UserPermission, CreatePermissionInput } from "@/lib/types"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Trash2, Key, Loader, Search, Filter } from "lucide-react"

export default function PermissionsPage() {
  const { toast } = useToast()
  const [permissions, setPermissions] = useState<UserPermission[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedPermission, setSelectedPermission] = useState<UserPermission | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [resourceFilter, setResourceFilter] = useState<string>("all")
  const [actionFilter, setActionFilter] = useState<string>("all")
  const [formData, setFormData] = useState<CreatePermissionInput>({
    name: "",
    resource: "",
    action: "",
    description: "",
  })

  // Load permissions
  useEffect(() => {
    loadPermissions()
  }, [])

  const loadPermissions = async () => {
    try {
      setLoading(true)
      const response = await rbacAPI.getPermissions()
      console.log("Permissions API Response:", response.data)

      // Backend returns: {success: true, data: {permissions: [...], count: N}}
      let perms = []
      if (response.data.data?.permissions && Array.isArray(response.data.data.permissions)) {
        perms = response.data.data.permissions
      } else if (Array.isArray(response.data.data)) {
        perms = response.data.data
      } else if (Array.isArray(response.data)) {
        perms = response.data
      } else {
        console.error("Unexpected permissions response structure:", response.data)
      }

      setPermissions(perms)
    } catch (error: any) {
      console.error("Failed to load permissions:", error)
      toast({
        title: "Error",
        description: error.response?.data?.detail || error.message || "Failed to load permissions",
        variant: "destructive",
      })
      setPermissions([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    // Validation
    if (!formData.name.trim() || !formData.resource.trim() || !formData.action.trim()) {
      toast({
        title: "Validation Error",
        description: "Name, resource, and action are required",
        variant: "destructive",
      })
      return
    }

    try {
      await rbacAPI.createPermission(formData)
      toast({
        title: "Success",
        description: "Permission created successfully",
      })
      setShowCreateDialog(false)
      setFormData({ name: "", resource: "", action: "", description: "" })
      loadPermissions()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to create permission",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async () => {
    if (!selectedPermission?.id) return

    try {
      await rbacAPI.deletePermission(selectedPermission.id)
      toast({
        title: "Success",
        description: "Permission deleted successfully",
      })
      setShowDeleteDialog(false)
      setSelectedPermission(null)
      loadPermissions()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to delete permission",
        variant: "destructive",
      })
    }
  }

  const openDeleteDialog = (permission: UserPermission) => {
    setSelectedPermission(permission)
    setShowDeleteDialog(true)
  }

  // Get unique resources and actions for filters
  const uniqueResources = Array.from(new Set(permissions.map((p) => p.resource))).sort()
  const uniqueActions = Array.from(new Set(permissions.map((p) => p.action))).sort()

  // Filter and search permissions
  const filteredPermissions = permissions.filter((perm) => {
    const matchesSearch =
      searchTerm === "" ||
      perm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      perm.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
      perm.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      perm.description.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesResource = resourceFilter === "all" || perm.resource === resourceFilter
    const matchesAction = actionFilter === "all" || perm.action === actionFilter

    return matchesSearch && matchesResource && matchesAction
  })

  // Group permissions by resource
  const groupedPermissions = filteredPermissions.reduce(
    (acc, perm) => {
      if (!acc[perm.resource]) {
        acc[perm.resource] = []
      }
      acc[perm.resource].push(perm)
      return acc
    },
    {} as Record<string, UserPermission[]>
  )

  const hasFilters = resourceFilter !== "all" || actionFilter !== "all" || searchTerm !== ""

  return (
    <RouteGuard permission="permissions:admin">
      <LayoutWrapper>
        <div className="p-8">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                <Key className="w-8 h-8" />
                Permissions Management
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage system permissions and access controls
              </p>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Permission
            </Button>
          </div>

          {/* Filters */}
          <Card className="p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search permissions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-none shadow-none focus-visible:ring-0"
                />
              </div>

              {/* Resource Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Select value={resourceFilter} onValueChange={setResourceFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by resource" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Resources</SelectItem>
                    {uniqueResources.map((resource) => (
                      <SelectItem key={resource} value={resource}>
                        {resource}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Action Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    {uniqueActions.map((action) => (
                      <SelectItem key={action} value={action}>
                        {action}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {hasFilters && (
              <div className="mt-3 pt-3 border-t flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredPermissions.length} of {permissions.length} permissions
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("")
                    setResourceFilter("all")
                    setActionFilter("all")
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </Card>

          {/* Permissions Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card className="p-4">
              <div className="text-sm text-muted-foreground mb-1">Total Permissions</div>
              <div className="text-2xl font-bold">{permissions.length}</div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-muted-foreground mb-1">Resources</div>
              <div className="text-2xl font-bold">{uniqueResources.length}</div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-muted-foreground mb-1">Action Types</div>
              <div className="text-2xl font-bold">{uniqueActions.length}</div>
            </Card>
          </div>

          {/* Permissions List (Grouped) */}
          {loading ? (
            <Card>
              <div className="flex items-center justify-center py-12">
                <Loader className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            </Card>
          ) : Object.keys(groupedPermissions).length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <Key className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">
                  {hasFilters ? "No permissions match your filters" : "No permissions found"}
                </p>
                {!hasFilters && (
                  <Button onClick={() => setShowCreateDialog(true)} className="mt-4">
                    Create First Permission
                  </Button>
                )}
              </div>
            </Card>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedPermissions).map(([resource, perms]) => (
                <Card key={resource} className="p-6">
                  <div className="mb-4">
                    <h2 className="text-xl font-semibold capitalize">{resource}</h2>
                    <p className="text-sm text-muted-foreground">
                      {perms.length} {perms.length === 1 ? "permission" : "permissions"}
                    </p>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {perms.map((permission) => (
                        <TableRow key={permission.id}>
                          <TableCell className="font-medium">{permission.name}</TableCell>
                          <TableCell>
                            <span className="px-2 py-1 bg-muted rounded text-sm">
                              {permission.action}
                            </span>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {permission.description || "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDeleteDialog(permission)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              ))}
            </div>
          )}

          {/* Create Dialog */}
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Permission</DialogTitle>
                <DialogDescription>Add a new permission to the system</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Permission Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., forms.create"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Use format: resource.action (e.g., forms.create, users.admin)
                  </p>
                </div>
                <div>
                  <Label htmlFor="resource">Resource *</Label>
                  <Input
                    id="resource"
                    value={formData.resource}
                    onChange={(e) => setFormData({ ...formData, resource: e.target.value })}
                    placeholder="e.g., forms, users, roles"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    The resource this permission applies to
                  </p>
                </div>
                <div>
                  <Label htmlFor="action">Action *</Label>
                  <Input
                    id="action"
                    value={formData.action}
                    onChange={(e) => setFormData({ ...formData, action: e.target.value })}
                    placeholder="e.g., create, read, update, delete, admin"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    The action allowed by this permission
                  </p>
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of what this permission grants..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate}>Create Permission</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Permission</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete the permission "{selectedPermission?.name}"? This
                  will remove it from all roles and cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDelete}>
                  Delete Permission
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </LayoutWrapper>
    </RouteGuard>
  )
}
