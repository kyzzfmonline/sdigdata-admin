import type { UserRole, UserPermission } from "@/lib/types"

export class PermissionChecker {
  private userPermissions: UserPermission[] = []
  private userRoles: UserRole[] = []

  constructor(permissions: UserPermission[], roles: UserRole[]) {
    this.userPermissions = permissions
    this.userRoles = roles
  }

  /**
   * Check if user has a specific permission
   */
  hasPermission(resource: string, action: string): boolean {
    return this.userPermissions.some((perm) => perm.resource === resource && perm.action === action)
  }

  /**
   * Check if user has a specific role
   */
  hasRole(roleName: string): boolean {
    return this.userRoles.some((role) => role.name === roleName)
  }

  /**
   * Get the highest role level of the user
   */
  getHighestRoleLevel(): number {
    return Math.max(...this.userRoles.map((role) => role.level), 0)
  }

  /**
   * Check if user can access admin panel
   */
  canAccessAdminPanel(): boolean {
    return this.hasRole("super_admin") || this.hasRole("system_admin") || this.hasRole("org_admin")
  }

  /**
   * Check if user can manage users
   */
  canManageUsers(): boolean {
    return this.hasPermission("users", "admin") || this.hasPermission("users", "create")
  }

  /**
   * Check if user can manage forms
   */
  canManageForms(): boolean {
    return this.hasPermission("forms", "admin") || this.hasPermission("forms", "create")
  }

  /**
   * Check if user can view responses
   */
  canViewResponses(): boolean {
    return this.hasPermission("responses", "read")
  }

  /**
   * Check if user can export data
   */
  canExportData(): boolean {
    return this.hasPermission("responses", "export")
  }

  /**
   * Check if user can view analytics
   */
  canViewAnalytics(): boolean {
    return this.hasPermission("analytics", "view")
  }

  /**
   * Check if user can publish forms
   */
  canPublishForms(): boolean {
    return this.hasPermission("forms", "publish")
  }

  /**
   * Check if user can assign forms
   */
  canAssignForms(): boolean {
    return this.hasPermission("forms", "assign")
  }

  /**
   * Check if user has system admin permissions
   */
  isSystemAdmin(): boolean {
    return this.hasPermission("system", "admin")
  }

  /**
   * Check if user can run cleanup operations
   */
  canRunCleanup(): boolean {
    return this.hasPermission("system", "cleanup")
  }

  /**
   * Check if user can manage roles and permissions
   */
  canManageRoles(): boolean {
    return this.hasPermission("roles", "admin") || this.hasPermission("permissions", "admin")
  }

  /**
   * Get all permissions for a specific resource
   */
  getPermissionsForResource(resource: string): UserPermission[] {
    return this.userPermissions.filter((perm) => perm.resource === resource)
  }

  /**
   * Check if user has any permission for a resource
   */
  hasAnyPermissionForResource(resource: string): boolean {
    return this.userPermissions.some((perm) => perm.resource === resource)
  }

  /**
   * Get user roles sorted by level (highest first)
   */
  getRolesSortedByLevel(): UserRole[] {
    return [...this.userRoles].sort((a, b) => b.level - a.level)
  }

  /**
   * Check if user has admin-level access (level >= 100)
   */
  hasAdminAccess(): boolean {
    return this.getHighestRoleLevel() >= 100
  }

  /**
   * Check if user has moderator-level access (level >= 50)
   */
  hasModeratorAccess(): boolean {
    return this.getHighestRoleLevel() >= 50
  }
}
