/**
 * Notifications Hooks
 * React Query hooks for managing in-app notifications, preferences, and real-time updates
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api"
import { queryKeys } from "@/lib/query-client"
import { toast } from "sonner"

// Types
export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  priority: "low" | "normal" | "high" | "urgent"
  category: string
  action_url?: string
  action_label?: string
  metadata?: Record<string, any>
  is_read: boolean
  is_archived: boolean
  read_at?: string
  created_at: string
  expires_at?: string
}

export type NotificationType =
  | "form_submission"
  | "form_assigned"
  | "form_shared"
  | "comment"
  | "mention"
  | "approval_request"
  | "approval_response"
  | "system"
  | "security_alert"
  | "deadline_reminder"
  | "report_ready"
  | "export_complete"
  | "task_assigned"
  | "role_changed"
  | "permission_changed"

export interface NotificationPreferences {
  id: string
  user_id: string
  email_enabled: boolean
  push_enabled: boolean
  in_app_enabled: boolean
  preferences_by_type: Record<
    NotificationType,
    {
      email: boolean
      push: boolean
      in_app: boolean
    }
  >
  quiet_hours?: {
    enabled: boolean
    start_time: string // HH:MM format
    end_time: string
    timezone: string
  }
  digest_enabled: boolean
  digest_frequency?: "daily" | "weekly"
  created_at: string
  updated_at?: string
}

export interface UpdateNotificationPreferencesRequest {
  email_enabled?: boolean
  push_enabled?: boolean
  in_app_enabled?: boolean
  preferences_by_type?: Record<
    NotificationType,
    {
      email?: boolean
      push?: boolean
      in_app?: boolean
    }
  >
  quiet_hours?: {
    enabled: boolean
    start_time: string
    end_time: string
    timezone: string
  }
  digest_enabled?: boolean
  digest_frequency?: "daily" | "weekly"
}

export interface NotificationFilters {
  type?: NotificationType[]
  priority?: ("low" | "normal" | "high" | "urgent")[]
  is_read?: boolean
  is_archived?: boolean
  date_range?: {
    start: string
    end: string
  }
  limit?: number
  offset?: number
}

export interface NotificationStats {
  total_notifications: number
  unread_count: number
  unread_by_priority: {
    low: number
    normal: number
    high: number
    urgent: number
  }
  unread_by_type: Record<NotificationType, number>
  recent_activity: Array<{
    date: string
    count: number
  }>
}

export interface CreateNotificationRequest {
  user_id?: string // If not provided, sends to current user
  type: NotificationType
  title: string
  message: string
  priority?: "low" | "normal" | "high" | "urgent"
  category?: string
  action_url?: string
  action_label?: string
  metadata?: Record<string, any>
  expires_at?: string
}

// Get notifications
export function useNotifications(filters?: NotificationFilters) {
  return useQuery({
    queryKey: queryKeys.notifications.all(filters),
    queryFn: async () => {
      const response = await apiClient.get("/notifications", {
        params: filters,
      })
      return response.data.data as Notification[]
    },
    refetchInterval: 30000, // Refetch every 30 seconds for updates
  })
}

// Get unread notifications
export function useUnreadNotifications(limit?: number) {
  return useQuery({
    queryKey: ["notifications", "unread", limit],
    queryFn: async () => {
      const response = await apiClient.get("/notifications/unread", {
        params: limit ? { limit } : undefined,
      })
      return response.data.data as Notification[]
    },
    refetchInterval: 15000, // Refetch every 15 seconds
  })
}

// Get recent notifications
export function useRecentNotifications(limit: number = 10) {
  return useQuery({
    queryKey: queryKeys.notifications.recent,
    queryFn: async () => {
      const response = await apiClient.get("/notifications/recent", {
        params: { limit },
      })
      return response.data.data as Notification[]
    },
    refetchInterval: 30000,
  })
}

// Get single notification
export function useNotification(notificationId: string | undefined) {
  return useQuery({
    queryKey: notificationId ? ["notifications", "detail", notificationId] : [],
    queryFn: async () => {
      if (!notificationId) throw new Error("Notification ID is required")
      const response = await apiClient.get(`/notifications/${notificationId}`)
      return response.data.data as Notification
    },
    enabled: !!notificationId,
  })
}

// Get notification statistics
export function useNotificationStats() {
  return useQuery({
    queryKey: ["notifications", "stats"],
    queryFn: async () => {
      const response = await apiClient.get("/notifications/stats")
      return response.data.data as NotificationStats
    },
    refetchInterval: 60000, // Refetch every minute
  })
}

// Get notification preferences
export function useNotificationPreferences() {
  return useQuery({
    queryKey: ["notifications", "preferences"],
    queryFn: async () => {
      const response = await apiClient.get("/notifications/preferences")
      return response.data.data as NotificationPreferences
    },
  })
}

// Update notification preferences
export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: UpdateNotificationPreferencesRequest) => {
      const response = await apiClient.put("/notifications/preferences", data)
      return response.data.data as NotificationPreferences
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", "preferences"] })
      toast.success("Notification preferences updated successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update notification preferences")
    },
  })
}

// Mark notification as read
export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (notificationId: string) => {
      await apiClient.post(`/notifications/${notificationId}/read`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to mark notification as read")
    },
  })
}

// Mark all notifications as read
export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post("/notifications/read-all")
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
      toast.success(`Marked ${data.updated_count} notification(s) as read`)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to mark all as read")
    },
  })
}

// Mark notification as unread
export function useMarkNotificationAsUnread() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (notificationId: string) => {
      await apiClient.post(`/notifications/${notificationId}/unread`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to mark notification as unread")
    },
  })
}

// Archive notification
export function useArchiveNotification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (notificationId: string) => {
      await apiClient.post(`/notifications/${notificationId}/archive`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
      toast.success("Notification archived")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to archive notification")
    },
  })
}

// Delete notification
export function useDeleteNotification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (notificationId: string) => {
      await apiClient.delete(`/notifications/${notificationId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
      toast.success("Notification deleted")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete notification")
    },
  })
}

// Delete all read notifications
export function useDeleteAllReadNotifications() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.delete("/notifications/read")
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
      toast.success(`Deleted ${data.deleted_count} notification(s)`)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete notifications")
    },
  })
}

// Create notification (admin/system)
export function useCreateNotification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateNotificationRequest) => {
      const response = await apiClient.post("/notifications", data)
      return response.data.data as Notification
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
      toast.success("Notification sent successfully")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to send notification")
    },
  })
}

// Bulk mark as read
export function useBulkMarkAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (notificationIds: string[]) => {
      const response = await apiClient.post("/notifications/bulk-read", {
        notification_ids: notificationIds,
      })
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
      toast.success(`Marked ${data.updated_count} notification(s) as read`)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to mark notifications as read")
    },
  })
}

// Bulk archive
export function useBulkArchive() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (notificationIds: string[]) => {
      const response = await apiClient.post("/notifications/bulk-archive", {
        notification_ids: notificationIds,
      })
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
      toast.success(`Archived ${data.archived_count} notification(s)`)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to archive notifications")
    },
  })
}

// Bulk delete
export function useBulkDeleteNotifications() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (notificationIds: string[]) => {
      const response = await apiClient.post("/notifications/bulk-delete", {
        notification_ids: notificationIds,
      })
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
      toast.success(`Deleted ${data.deleted_count} notification(s)`)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete notifications")
    },
  })
}

// Snooze notification
export function useSnoozeNotification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { notification_id: string; snooze_until: string }) => {
      const response = await apiClient.post(`/notifications/${data.notification_id}/snooze`, {
        snooze_until: data.snooze_until,
      })
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
      toast.success("Notification snoozed")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to snooze notification")
    },
  })
}

// Test notification delivery
export function useTestNotification() {
  return useMutation({
    mutationFn: async (data: {
      type: NotificationType
      channels: Array<"email" | "push" | "in_app">
    }) => {
      const response = await apiClient.post("/notifications/test", data)
      return response.data.data
    },
    onSuccess: () => {
      toast.success("Test notification sent")
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to send test notification")
    },
  })
}

// Get notification templates (admin)
export function useNotificationTemplates() {
  return useQuery({
    queryKey: ["notifications", "templates"],
    queryFn: async () => {
      const response = await apiClient.get("/notifications/templates")
      return response.data.data
    },
  })
}
