"use client"

/**
 * RBAC Dashboard Page
 * Overview of roles, permissions, and access control
 */

import { LayoutWrapper } from "@/components/layout-wrapper"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRoles } from "@/hooks/rbac/use-roles"
import { usePermissions } from "@/hooks/rbac/use-permissions"
import { usePermissionGroups } from "@/hooks/rbac/use-permission-groups"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Shield, Key, Users, Lock, Plus, ChevronRight } from "lucide-react"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"

export default function RBACDashboardPage() {
  const { data: roles, isLoading: rolesLoading } = useRoles()
  const { data: permissions, isLoading: permissionsLoading } = usePermissions()
  const { data: permissionGroups, isLoading: groupsLoading } = usePermissionGroups()

  const stats = [
    {
      title: "Total Roles",
      value: roles?.length ?? 0,
      description: "Active roles in system",
      icon: Shield,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
      href: "/rbac/roles",
    },
    {
      title: "Permissions",
      value: permissions?.length ?? 0,
      description: "Available permissions",
      icon: Key,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-900/20",
      href: "/rbac/permissions",
    },
    {
      title: "Permission Groups",
      value: permissionGroups?.length ?? 0,
      description: "Grouped permissions",
      icon: Lock,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-100 dark:bg-purple-900/20",
      href: "/rbac/permission-groups",
    },
    {
      title: "System Roles",
      value: roles?.filter((r) => r.is_system_role)?.length ?? 0,
      description: "Built-in roles",
      icon: Users,
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-100 dark:bg-orange-900/20",
      href: "/rbac/roles",
    },
  ]

  const isLoading = rolesLoading || permissionsLoading || groupsLoading

  return (
    <LayoutWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Access Control (RBAC)</h1>
            <p className="text-muted-foreground mt-1">
              Manage roles, permissions, and access control for your organization
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <Link key={index} href={stat.href}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                    <div className={`rounded-full p-2 ${stat.bgColor}`}>
                      <Icon className={`h-4 w-4 ${stat.color}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      <div className="text-2xl font-bold">{stat.value}</div>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common RBAC management tasks</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Link href="/rbac/roles?action=create">
              <Button variant="outline" className="w-full justify-start">
                <Plus className="mr-2 h-4 w-4" />
                Create New Role
              </Button>
            </Link>
            <Link href="/rbac/permissions?action=create">
              <Button variant="outline" className="w-full justify-start">
                <Plus className="mr-2 h-4 w-4" />
                Create Permission
              </Button>
            </Link>
            <Link href="/rbac/permission-groups?action=create">
              <Button variant="outline" className="w-full justify-start">
                <Plus className="mr-2 h-4 w-4" />
                Create Permission Group
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Roles */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Roles</CardTitle>
                <Link href="/rbac/roles">
                  <Button variant="ghost" size="sm">
                    View All
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </div>
              <CardDescription>Recently created or updated roles</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-5 w-20" />
                    </div>
                  ))}
                </div>
              ) : roles && roles.length > 0 ? (
                <div className="space-y-3">
                  {roles.slice(0, 5).map((role) => (
                    <Link
                      key={role.id}
                      href={`/rbac/roles/${role.id}`}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{role.name}</span>
                        {role.is_system_role && (
                          <Badge variant="secondary" className="text-xs">
                            System
                          </Badge>
                        )}
                      </div>
                      <Badge variant="outline">{role.permission_count ?? 0} perms</Badge>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No roles found</p>
              )}
            </CardContent>
          </Card>

          {/* Permission Groups */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Permission Groups</CardTitle>
                <Link href="/rbac/permission-groups">
                  <Button variant="ghost" size="sm">
                    View All
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </div>
              <CardDescription>Organized permission collections</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-5 w-20" />
                    </div>
                  ))}
                </div>
              ) : permissionGroups && permissionGroups.length > 0 ? (
                <div className="space-y-3">
                  {permissionGroups.slice(0, 5).map((group) => (
                    <Link
                      key={group.id}
                      href={`/rbac/permission-groups/${group.id}`}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{group.name}</span>
                      </div>
                      <Badge variant="outline">{group.permission_count ?? 0} perms</Badge>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No permission groups found
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Permissions Overview */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Permissions Overview</CardTitle>
                <CardDescription>All available permissions in the system</CardDescription>
              </div>
              <Link href="/rbac/permissions">
                <Button>
                  View All Permissions
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : permissions && permissions.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {/* Group permissions by resource */}
                {Object.entries(
                  permissions.reduce(
                    (acc, perm) => {
                      if (!acc[perm.resource]) acc[perm.resource] = []
                      acc[perm.resource].push(perm)
                      return acc
                    },
                    {} as Record<string, typeof permissions>
                  )
                )
                  .slice(0, 6)
                  .map(([resource, perms]) => (
                    <Card key={resource}>
                      <CardHeader className="p-4">
                        <CardTitle className="text-sm font-medium capitalize">{resource}</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <p className="text-2xl font-bold">{perms.length}</p>
                        <p className="text-xs text-muted-foreground">permissions</p>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No permissions found</p>
            )}
          </CardContent>
        </Card>
      </div>
    </LayoutWrapper>
  )
}
