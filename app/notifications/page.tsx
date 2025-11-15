"use client"

/**
 * Notifications Center Page
 * View, manage, and configure notifications
 */

import { useState } from "react"
import { LayoutWrapper } from "@/components/layout-wrapper"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  useNotifications,
  useNotificationStats,
  useNotificationPreferences,
  useUpdateNotificationPreferences,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  useArchiveNotification,
  useDeleteNotification,
  useBulkMarkAsRead,
  useBulkArchive,
  useBulkDeleteNotifications,
  type Notification,
  type NotificationType,
} from "@/hooks/notifications/use-notifications"
import {
  Bell,
  Check,
  Archive,
  Trash2,
  Settings,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Info,
  Bell,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { format } from "date-fns"
import { Checkbox } from "@/components/ui/checkbox"

export default function NotificationsPage() {
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([])
  const [filterType, setFilterType] = useState<NotificationType | "all">("all")
  const [filterPriority, setFilterPriority] = useState<string>("all")
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false)

  const { data: notifications, isLoading: notificationsLoading } = useNotifications({
    type: filterType !== "all" ? [filterType] : undefined,
    priority: filterPriority !== "all" ? [filterPriority as any] : undefined,
  })
  const { data: stats } = useNotificationStats()
  const { data: preferences } = useNotificationPreferences()
  const updatePreferences = useUpdateNotificationPreferences()

  const markAsRead = useMarkNotificationAsRead()
  const markAllAsRead = useMarkAllNotificationsAsRead()
  const archiveNotification = useArchiveNotification()
  const deleteNotification = useDeleteNotification()
  const bulkMarkAsRead = useBulkMarkAsRead()
  const bulkArchive = useBulkArchive()
  const bulkDelete = useBulkDeleteNotifications()

  const unreadNotifications = notifications?.filter((n) => !n.is_read) || []
  const archivedNotifications = notifications?.filter((n) => n.is_archived) || []

  const toggleSelection = (notificationId: string) => {
    setSelectedNotifications((prev) =>
      prev.includes(notificationId)
        ? prev.filter((id) => id !== notificationId)
        : [...prev, notificationId]
    )
  }

  const toggleSelectAll = () => {
    if (selectedNotifications.length === notifications?.length) {
      setSelectedNotifications([])
    } else {
      setSelectedNotifications(notifications?.map((n) => n.id) || [])
    }
  }

  const handleMarkAsRead = async (notificationId: string) => {
    await markAsRead.mutateAsync(notificationId)
  }

  const handleArchive = async (notificationId: string) => {
    await archiveNotification.mutateAsync(notificationId)
  }

  const handleDelete = async (notificationId: string) => {
    await deleteNotification.mutateAsync(notificationId)
  }

  const handleBulkMarkAsRead = async () => {
    await bulkMarkAsRead.mutateAsync(selectedNotifications)
    setSelectedNotifications([])
  }

  const handleBulkArchive = async () => {
    await bulkArchive.mutateAsync(selectedNotifications)
    setSelectedNotifications([])
  }

  const handleBulkDelete = async () => {
    await bulkDelete.mutateAsync(selectedNotifications)
    setSelectedNotifications([])
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
      case "high":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400"
      case "normal":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
      case "low":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
    }
  }

  const getTypeIcon = (type: NotificationType) => {
    switch (type) {
      case "security_alert":
        return <AlertCircle className="h-4 w-4 text-red-600" />
      case "approval_request":
        return <Clock className="h-4 w-4 text-blue-600" />
      case "form_submission":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      default:
        return <Info className="h-4 w-4 text-gray-600" />
    }
  }

  const renderNotification = (notification: Notification) => (
    <Card
      key={notification.id}
      className={`${
        !notification.is_read ? "border-l-4 border-l-primary bg-muted/20" : ""
      } hover:shadow-md transition-shadow`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Checkbox
            checked={selectedNotifications.includes(notification.id)}
            onCheckedChange={() => toggleSelection(notification.id)}
          />
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                {getTypeIcon(notification.type)}
                <h4 className={`font-medium ${!notification.is_read ? "font-semibold" : ""}`}>
                  {notification.title}
                </h4>
                <Badge className={getPriorityColor(notification.priority)}>
                  {notification.priority}
                </Badge>
                {!notification.is_read && (
                  <Badge variant="default" className="text-xs">
                    New
                  </Badge>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {format(new Date(notification.created_at), "PPp")}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-3">{notification.message}</p>
            {notification.action_url && (
              <Button variant="link" size="sm" className="p-0 h-auto">
                {notification.action_label || "View Details"}
              </Button>
            )}
            <div className="flex items-center gap-2 mt-3">
              {!notification.is_read && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleMarkAsRead(notification.id)}
                  disabled={markAsRead.isPending}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Mark as Read
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleArchive(notification.id)}
                disabled={archiveNotification.isPending}
              >
                <Archive className="h-4 w-4 mr-1" />
                Archive
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(notification.id)}
                disabled={deleteNotification.isPending}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <LayoutWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Bell className="h-8 w-8" />
              Notifications
            </h1>
            <p className="text-muted-foreground mt-1">
              Stay updated with your latest notifications
            </p>
          </div>
          <Button onClick={() => setIsPreferencesOpen(true)}>
            <Settings className="mr-2 h-4 w-4" />
            Preferences
          </Button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total</CardTitle>
                <Bell className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_notifications}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unread</CardTitle>
                <Bell className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.unread_count}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Urgent</CardTitle>
                <AlertCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {stats.unread_by_priority.urgent}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">High</CardTitle>
                <AlertCircle className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {stats.unread_by_priority.high}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters and Bulk Actions */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex gap-4 flex-1">
                <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="form_submission">Form Submission</SelectItem>
                    <SelectItem value="form_assigned">Form Assigned</SelectItem>
                    <SelectItem value="security_alert">Security Alert</SelectItem>
                    <SelectItem value="approval_request">Approval Request</SelectItem>
                    <SelectItem value="comment">Comment</SelectItem>
                    <SelectItem value="mention">Mention</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterPriority} onValueChange={setFilterPriority}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="All Priorities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {selectedNotifications.length > 0 && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkMarkAsRead}
                    disabled={bulkMarkAsRead.isPending}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Mark as Read ({selectedNotifications.length})
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkArchive}
                    disabled={bulkArchive.isPending}
                  >
                    <Archive className="h-4 w-4 mr-1" />
                    Archive
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkDelete}
                    disabled={bulkDelete.isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="all" className="space-y-4">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="all">All ({notifications?.length || 0})</TabsTrigger>
              <TabsTrigger value="unread">Unread ({unreadNotifications.length})</TabsTrigger>
              <TabsTrigger value="archived">Archived ({archivedNotifications.length})</TabsTrigger>
            </TabsList>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={toggleSelectAll}>
                {selectedNotifications.length === notifications?.length
                  ? "Deselect All"
                  : "Select All"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => markAllAsRead.mutate()}
                disabled={markAllAsRead.isPending || unreadNotifications.length === 0}
              >
                <Check className="h-4 w-4 mr-1" />
                Mark All as Read
              </Button>
            </div>
          </div>

          {/* All Notifications */}
          <TabsContent value="all" className="space-y-4">
            {notificationsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            ) : notifications && notifications.length > 0 ? (
              notifications.map(renderNotification)
            ) : (
              <div className="text-center py-12">
                <Bell className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold">No notifications</h3>
                <p className="text-sm text-muted-foreground mt-2">You're all caught up!</p>
              </div>
            )}
          </TabsContent>

          {/* Unread Notifications */}
          <TabsContent value="unread" className="space-y-4">
            {unreadNotifications.length > 0 ? (
              unreadNotifications.map(renderNotification)
            ) : (
              <div className="text-center py-12">
                <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
                <h3 className="mt-4 text-lg font-semibold">All caught up!</h3>
                <p className="text-sm text-muted-foreground mt-2">No unread notifications</p>
              </div>
            )}
          </TabsContent>

          {/* Archived Notifications */}
          <TabsContent value="archived" className="space-y-4">
            {archivedNotifications.length > 0 ? (
              archivedNotifications.map(renderNotification)
            ) : (
              <div className="text-center py-12">
                <Archive className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold">No archived notifications</h3>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Preferences Dialog */}
        <Dialog open={isPreferencesOpen} onOpenChange={setIsPreferencesOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Notification Preferences</DialogTitle>
              <DialogDescription>Manage how you receive notifications</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              {preferences && (
                <>
                  {/* Global Settings */}
                  <div>
                    <h4 className="font-medium mb-4">Global Settings</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Email Notifications</Label>
                          <p className="text-sm text-muted-foreground">
                            Receive notifications via email
                          </p>
                        </div>
                        <Switch
                          checked={preferences.email_enabled}
                          onCheckedChange={(checked) =>
                            updatePreferences.mutate({ email_enabled: checked })
                          }
                        />
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Push Notifications</Label>
                          <p className="text-sm text-muted-foreground">
                            Receive browser push notifications
                          </p>
                        </div>
                        <Switch
                          checked={preferences.push_enabled}
                          onCheckedChange={(checked) =>
                            updatePreferences.mutate({ push_enabled: checked })
                          }
                        />
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>In-App Notifications</Label>
                          <p className="text-sm text-muted-foreground">
                            Show notifications in the app
                          </p>
                        </div>
                        <Switch
                          checked={preferences.in_app_enabled}
                          onCheckedChange={(checked) =>
                            updatePreferences.mutate({ in_app_enabled: checked })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Digest Settings */}
                  <div>
                    <h4 className="font-medium mb-4">Digest Settings</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Daily Digest</Label>
                          <p className="text-sm text-muted-foreground">
                            Receive a daily summary of notifications
                          </p>
                        </div>
                        <Switch
                          checked={preferences.digest_enabled}
                          onCheckedChange={(checked) =>
                            updatePreferences.mutate({
                              digest_enabled: checked,
                              digest_frequency: "daily",
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Quiet Hours */}
                  {preferences.quiet_hours && (
                    <div>
                      <h4 className="font-medium mb-4">Quiet Hours</h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Enable Quiet Hours</Label>
                            <p className="text-sm text-muted-foreground">
                              Pause non-urgent notifications during specified hours
                            </p>
                          </div>
                          <Switch
                            checked={preferences.quiet_hours.enabled}
                            onCheckedChange={(checked) =>
                              updatePreferences.mutate({
                                quiet_hours: {
                                  ...preferences.quiet_hours!,
                                  enabled: checked,
                                },
                              })
                            }
                          />
                        </div>
                        {preferences.quiet_hours.enabled && (
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Start Time</Label>
                              <p className="text-sm text-muted-foreground">
                                {preferences.quiet_hours.start_time}
                              </p>
                            </div>
                            <div>
                              <Label>End Time</Label>
                              <p className="text-sm text-muted-foreground">
                                {preferences.quiet_hours.end_time}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
            <DialogFooter>
              <Button onClick={() => setIsPreferencesOpen(false)}>Done</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </LayoutWrapper>
  )
}
