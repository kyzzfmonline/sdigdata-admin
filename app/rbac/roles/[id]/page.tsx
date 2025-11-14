"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { LayoutWrapper } from "@/components/layout-wrapper"
import { RouteGuard } from "@/components/route-guard"
import { rbacAPI } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import type { RoleWithPermissions, UserPermission, UserWithRoles } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Shield,
  Key,
  Users,
  ArrowLeft,
  Loader,
  Search,
  CheckCircle2,
  XCircle,
  Save,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function RoleDetailPage() {
  const { toast } = useToast()
  const router = useRouter()
  const params = useParams()
  const roleId = params.id as string

  const [role, setRole] = useState<RoleWithPermissions | null>(null)
  const [allPermissions, setAllPermissions] = useState<UserPermission[]>([])
  const [roleUsers, setRoleUsers] = useState<UserWithRoles[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set())
  const [originalPermissions, setOriginalPermissions] = useState<Set<string>>(new Set())

  // Load role data
  useEffect(() => {
    loadRoleData()
  }, [roleId])

  const loadRoleData = async () => {
    try {
      setLoading(true)

      // Load role details with permissions
      const roleResponse = await rbacAPI.getRole(roleId)
      console.log("Role API Response:", roleResponse.data)
      const roleData = (roleResponse.data.data || roleResponse.data) as RoleWithPermissions
      setRole(roleData)

      // Set current permissions
      const currentPerms = Array.isArray(roleData.permissions) ? roleData.permissions : []
      const currentPermIds = new Set(currentPerms.map((p) => p.id!).filter((id) => id))
      setSelectedPermissions(currentPermIds)
      setOriginalPermissions(currentPermIds)

      // Load all available permissions
      const permsResponse = await rbacAPI.getPermissions()
      console.log("Permissions API Response:", permsResponse.data)
      // Backend returns: {success: true, data: {permissions: [...], count: N}}
      const perms =
        permsResponse.data.data?.permissions && Array.isArray(permsResponse.data.data.permissions)
          ? permsResponse.data.data.permissions
          : Array.isArray(permsResponse.data.data)
            ? permsResponse.data.data
            : Array.isArray(permsResponse.data)
              ? permsResponse.data
              : []
      setAllPermissions(perms)

      // Load users with this role
      const usersResponse = await rbacAPI.getRoleUsers(roleId)
      console.log("Role Users API Response:", usersResponse.data)
      // Backend returns: {success: true, data: {users: [...], count: N}}
      const users =
        usersResponse.data.data?.users && Array.isArray(usersResponse.data.data.users)
          ? usersResponse.data.data.users
          : Array.isArray(usersResponse.data.data)
            ? usersResponse.data.data
            : Array.isArray(usersResponse.data)
              ? usersResponse.data
              : []
      setRoleUsers(users)
    } catch (error: any) {
      console.error("Failed to load role data:", error)
      toast({
        title: "Error",
        description: error.response?.data?.detail || error.message || "Failed to load role data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSavePermissions = async () => {
    try {
      setSaving(true)

      // Calculate permissions to add and remove
      const toAdd = Array.from(selectedPermissions).filter((id) => !originalPermissions.has(id))
      const toRemove = Array.from(originalPermissions).filter((id) => !selectedPermissions.has(id))

      // Assign new permissions
      if (toAdd.length > 0) {
        await rbacAPI.assignPermissionsToRole(roleId, { permission_ids: toAdd })
      }

      // Revoke removed permissions
      if (toRemove.length > 0) {
        await rbacAPI.revokePermissionsFromRole(roleId, { permission_ids: toRemove })
      }

      toast({
        title: "Success",
        description: `Updated permissions for role "${role?.name}"`,
      })

      // Reload to get fresh data
      await loadRoleData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to update permissions",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const togglePermission = (permissionId: string) => {
    const newSelected = new Set(selectedPermissions)
    if (newSelected.has(permissionId)) {
      newSelected.delete(permissionId)
    } else {
      newSelected.add(permissionId)
    }
    setSelectedPermissions(newSelected)
  }

  const toggleAllInResource = (resource: string, checked: boolean) => {
    const newSelected = new Set(selectedPermissions)
    const resourcePerms = allPermissions.filter((p) => p.resource === resource)

    resourcePerms.forEach((perm) => {
      if (checked) {
        newSelected.add(perm.id!)
      } else {
        newSelected.delete(perm.id!)
      }
    })

    setSelectedPermissions(newSelected)
  }

  // Group permissions by resource
  const groupedPermissions = allPermissions.reduce(
    (acc, perm) => {
      if (!acc[perm.resource]) {
        acc[perm.resource] = []
      }
      acc[perm.resource].push(perm)
      return acc
    },
    {} as Record<string, UserPermission[]>
  )

  // Filter permissions by search
  const filteredGroupedPermissions = Object.entries(groupedPermissions).reduce(
    (acc, [resource, perms]) => {
      const filtered = perms.filter(
        (p) =>
          searchTerm === "" ||
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
      if (filtered.length > 0) {
        acc[resource] = filtered
      }
      return acc
    },
    {} as Record<string, UserPermission[]>
  )

  const hasChanges = !areSetEqual(selectedPermissions, originalPermissions)

  if (loading) {
    return (
      <RouteGuard permission="roles.admin">
        <LayoutWrapper>
          <div className="flex items-center justify-center h-screen">
            <Loader className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        </LayoutWrapper>
      </RouteGuard>
    )
  }

  if (!role) {
    return (
      <RouteGuard permission="roles.admin">
        <LayoutWrapper>
          <div className="p-8">
            <div className="text-center py-12">
              <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Role not found</p>
              <Button onClick={() => router.push("/rbac/roles")} className="mt-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Roles
              </Button>
            </div>
          </div>
        </LayoutWrapper>
      </RouteGuard>
    )
  }

  return (
    <RouteGuard permission="roles:admin">
      <LayoutWrapper>
        <div className="p-8">
          {/* Header */}
          <div className="mb-6">
            <Button variant="ghost" onClick={() => router.push("/rbac/roles")} className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Roles
            </Button>

            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                  <Shield className="w-8 h-8" />
                  {role.name}
                </h1>
                <p className="text-muted-foreground mt-1">{role.description || "No description"}</p>
                <div className="flex items-center gap-4 mt-2 text-sm">
                  <span className="text-muted-foreground">
                    Level: <span className="font-semibold">{role.level}</span>
                  </span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">
                    <Users className="w-4 h-4 inline mr-1" />
                    {roleUsers.length} {roleUsers.length === 1 ? "user" : "users"}
                  </span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">
                    <Key className="w-4 h-4 inline mr-1" />
                    {selectedPermissions.size}{" "}
                    {selectedPermissions.size === 1 ? "permission" : "permissions"}
                  </span>
                </div>
              </div>

              {hasChanges && (
                <Button onClick={handleSavePermissions} disabled={saving}>
                  {saving ? (
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="permissions" className="space-y-6">
            <TabsList>
              <TabsTrigger value="permissions">
                <Key className="w-4 h-4 mr-2" />
                Permissions
              </TabsTrigger>
              <TabsTrigger value="users">
                <Users className="w-4 h-4 mr-2" />
                Users ({roleUsers.length})
              </TabsTrigger>
            </TabsList>

            {/* Permissions Tab */}
            <TabsContent value="permissions" className="space-y-4">
              {/* Search Bar */}
              <Card className="p-4">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search permissions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="border-none shadow-none focus-visible:ring-0"
                  />
                </div>
              </Card>

              {/* Permissions Summary */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="p-4">
                  <div className="text-sm text-muted-foreground mb-1">Total Available</div>
                  <div className="text-2xl font-bold">{allPermissions.length}</div>
                </Card>
                <Card className="p-4">
                  <div className="text-sm text-muted-foreground mb-1">Assigned</div>
                  <div className="text-2xl font-bold text-green-600">
                    {selectedPermissions.size}
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="text-sm text-muted-foreground mb-1">Unassigned</div>
                  <div className="text-2xl font-bold text-muted-foreground">
                    {allPermissions.length - selectedPermissions.size}
                  </div>
                </Card>
              </div>

              {/* Grouped Permissions */}
              <div className="space-y-4">
                {Object.entries(filteredGroupedPermissions).map(([resource, permissions]) => {
                  const allSelected = permissions.every((p) => selectedPermissions.has(p.id!))
                  const someSelected = permissions.some((p) => selectedPermissions.has(p.id!))

                  return (
                    <Card key={resource} className="p-6">
                      {/* Resource Header */}
                      <div className="flex items-center justify-between mb-4 pb-4 border-b">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={allSelected}
                            onCheckedChange={(checked) =>
                              toggleAllInResource(resource, checked as boolean)
                            }
                            aria-label={`Select all ${resource} permissions`}
                          />
                          <div>
                            <h3 className="font-semibold text-lg capitalize">{resource}</h3>
                            <p className="text-sm text-muted-foreground">
                              {permissions.length}{" "}
                              {permissions.length === 1 ? "permission" : "permissions"}
                              {someSelected &&
                                ` • ${permissions.filter((p) => selectedPermissions.has(p.id!)).length} selected`}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Permission List */}
                      <div className="space-y-3">
                        {permissions.map((permission) => {
                          const isSelected = selectedPermissions.has(permission.id!)

                          return (
                            <div
                              key={permission.id}
                              className={`
                                flex items-start gap-3 p-3 rounded-lg border transition-colors
                                ${isSelected ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900" : "bg-muted/30 border-transparent"}
                              `}
                            >
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => togglePermission(permission.id!)}
                                aria-label={`Toggle ${permission.name}`}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium">{permission.name}</span>
                                  <span className="text-xs px-2 py-0.5 bg-muted rounded">
                                    {permission.action}
                                  </span>
                                  {isSelected && (
                                    <CheckCircle2 className="w-4 h-4 text-green-600 ml-auto" />
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {permission.description}
                                </p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </Card>
                  )
                })}

                {Object.keys(filteredGroupedPermissions).length === 0 && (
                  <Card className="p-12">
                    <div className="text-center">
                      <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        {searchTerm
                          ? "No permissions found matching your search"
                          : "No permissions available"}
                      </p>
                    </div>
                  </Card>
                )}
              </div>

              {/* Save Button (bottom) */}
              {hasChanges && (
                <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">Unsaved Changes</p>
                      <p className="text-sm text-muted-foreground">
                        You have unsaved permission changes
                      </p>
                    </div>
                    <Button onClick={handleSavePermissions} disabled={saving}>
                      {saving ? (
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Save Changes
                    </Button>
                  </div>
                </Card>
              )}
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users">
              <Card>
                <div className="p-6">
                  {roleUsers.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No users have this role assigned</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Username</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Total Roles</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {roleUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.username}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              {user.roles?.length || 0}{" "}
                              {user.roles?.length === 1 ? "role" : "roles"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </LayoutWrapper>
    </RouteGuard>
  )
}

// Helper function to compare sets
function areSetEqual<T>(set1: Set<T>, set2: Set<T>): boolean {
  if (set1.size !== set2.size) return false
  for (const item of set1) {
    if (!set2.has(item)) return false
  }
  return true
}
