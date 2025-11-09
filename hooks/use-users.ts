import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { usersAPI } from "@/lib/api"
import { queryKeys } from "@/lib/query-client"
import { useToast } from "@/hooks/use-toast"
import type { User, Role, Permission, UserRole, UserPermission } from "@/lib/types"

interface UsersParams {
  role?: string
  status?: string
  search?: string
  page?: number
  limit?: number
  sort?: string
  order?: "asc" | "desc"
}

// Fetch all users with optional filters
export function useUsers(params?: UsersParams) {
  return useQuery({
    queryKey: queryKeys.users.all(params),
    queryFn: async () => {
      const response = await usersAPI.getAll(params)

      // Log the actual response structure for debugging
      console.log("Users API Response:", {
        status: response.status,
        data: response.data,
        dataType: typeof response.data,
        hasData: !!response.data?.data,
        hasUsers: !!response.data?.data?.data,
        usersType: typeof response.data?.data?.data,
        isArray: Array.isArray(response.data?.data?.data),
      })

      // Backend returns {success, data: {data: [...], pagination, filters}}
      const users = response.data?.data?.data
      if (!users || !Array.isArray(users)) {
        console.error("Invalid users response structure:", {
          fullResponse: response.data,
          extractedUsers: users,
        })
        throw new Error("Invalid response from users endpoint")
      }
      return users as User[]
    },
    retry: 1, // Only retry once for user list
    placeholderData: [], // Use empty array while loading
  })
}

// Fetch current user (me)
export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: async () => {
      const response = await usersAPI.getMe()
      return response.data.data as User
    },
    retry: 1, // Only retry once for auth
    staleTime: 10 * 60 * 1000, // 10 minutes - auth data is more stable
  })
}

// Update current user mutation
export function useUpdateCurrentUser() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await usersAPI.updateMe(data)
      return response.data.data as User
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me })
      toast({
        title: "Success",
        description: "Profile updated successfully",
      })
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      })
    },
  })
}

// Change password mutation
export function useChangePassword() {
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({
      currentPassword,
      newPassword,
    }: {
      currentPassword: string
      newPassword: string
    }) => {
      const response = await usersAPI.changePassword(currentPassword, newPassword)
      return response.data
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Password changed successfully",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to change password",
        variant: "destructive",
      })
    },
  })
}

// Notification preferences
export function useNotificationPreferences() {
  return useQuery({
    queryKey: queryKeys.users.notifications,
    queryFn: async () => {
      const response = await usersAPI.getNotifications()
      return response.data.data
    },
  })
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await usersAPI.updateNotifications(data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.notifications })
      toast({
        title: "Success",
        description: "Notification preferences updated",
      })
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update notification preferences",
        variant: "destructive",
      })
    },
  })
}

// Theme preferences
export function useThemePreferences() {
  return useQuery({
    queryKey: queryKeys.users.preferences,
    queryFn: async () => {
      const response = await usersAPI.getPreferences()
      return response.data.data
    },
  })
}

export function useUpdateThemePreferences() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await usersAPI.updatePreferences(data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.preferences })
      toast({
        title: "Success",
        description: "Theme preferences updated",
      })
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update theme preferences",
        variant: "destructive",
      })
    },
  })
}

// Delete user mutation
export function useDeleteUser() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await usersAPI.delete(id)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all() })
      toast({
        title: "Success",
        description: "User deleted successfully",
      })
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      })
    },
  })
}

// Cleanup deleted users mutation (admin only)
export function useCleanupUsers() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async () => {
      const response = await usersAPI.cleanup()
      return response.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all() })
      toast({
        title: "Success",
        description: `Cleaned up ${data.data.deleted_count} deleted users`,
      })
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to cleanup deleted users",
        variant: "destructive",
      })
    },
  })
}

// Roles and permissions hooks
export function useRoles() {
  return useQuery({
    queryKey: queryKeys.users.roles,
    queryFn: async () => {
      const response = await usersAPI.getRoles()
      const roles = response.data?.data
      if (!roles || !Array.isArray(roles)) {
        throw new Error("Invalid response from roles endpoint")
      }
      return roles as Role[]
    },
    retry: 1,
    placeholderData: [],
  })
}

export function usePermissions() {
  return useQuery({
    queryKey: queryKeys.users.permissions,
    queryFn: async () => {
      const response = await usersAPI.getPermissions()
      return response.data.data as Permission[]
    },
  })
}

export function useUserRoles(userId: string) {
  return useQuery({
    queryKey: queryKeys.users.userRoles(userId),
    queryFn: async () => {
      const response = await usersAPI.getUserRoles(userId)
      return response.data.data as UserRole[]
    },
    enabled: !!userId,
  })
}

export function useUserPermissions(userId: string) {
  return useQuery({
    queryKey: queryKeys.users.userPermissions(userId),
    queryFn: async () => {
      const response = await usersAPI.getUserPermissions(userId)
      return response.data.data as UserPermission[]
    },
    enabled: !!userId,
  })
}

export function useAssignRole() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ userId, roleId }: { userId: string; roleId: string }) => {
      const response = await usersAPI.assignRole(userId, roleId)
      return response.data
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.userRoles(userId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.users.userPermissions(userId) })
      toast({
        title: "Success",
        description: "Role assigned successfully",
      })
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to assign role",
        variant: "destructive",
      })
    },
  })
}

export function useRemoveRole() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ userId, roleId }: { userId: string; roleId: string }) => {
      const response = await usersAPI.removeRole(userId, roleId)
      return response.data
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.userRoles(userId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.users.userPermissions(userId) })
      toast({
        title: "Success",
        description: "Role removed successfully",
      })
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove role",
        variant: "destructive",
      })
    },
  })
}
