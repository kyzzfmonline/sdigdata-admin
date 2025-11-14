"use client"

import React, { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { LayoutWrapper } from "@/components/layout-wrapper"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useStore } from "@/lib/store"
import { usePermissions } from "@/lib/permission-context"
import { useCleanupForms } from "@/hooks/use-forms"
import { useCleanupResponses } from "@/hooks/use-responses"
import { useCleanupUsers } from "@/hooks/use-users"
import {
  useCurrentUser,
  useUpdateCurrentUser,
  useChangePassword,
  useNotificationPreferences,
  useUpdateNotificationPreferences,
  useThemePreferences,
  useUpdateThemePreferences,
} from "@/hooks/use-users"
import { useToast } from "@/hooks/use-toast"
import { z } from "zod"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Loader2,
  User,
  Bell,
  Palette,
  Shield,
  Database,
  Lock,
  Mail,
  Settings,
  AlertTriangle,
  CheckCircle2,
  Info,
  Moon,
  Sun,
  Monitor,
  Trash2,
  Save,
  Key,
  FileText,
  Activity,
} from "lucide-react"

// Validation schemas
const profileSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must be less than 50 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  email: z.string().email("Please enter a valid email address"),
})

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password must be less than 128 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        "Password must contain uppercase, lowercase, numbers, and special characters"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

const notificationSchema = z.object({
  email_notifications: z.boolean(),
  form_assignments: z.boolean(),
  responses: z.boolean(),
  system_updates: z.boolean(),
})

const themeSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
  compact_mode: z.boolean(),
})

type ProfileFormData = z.infer<typeof profileSchema>
type PasswordFormData = z.infer<typeof passwordSchema>
type NotificationFormData = z.infer<typeof notificationSchema>
type ThemeFormData = z.infer<typeof themeSchema>

export default function SettingsPage() {
  const { user } = useStore()
  const { hasAdminAccess, roles } = usePermissions()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("account")

  // Admin cleanup hooks
  const cleanupForms = useCleanupForms()
  const cleanupResponses = useCleanupResponses()
  const cleanupUsers = useCleanupUsers()

  // User profile hooks
  const { data: currentUser, isLoading: userLoading } = useCurrentUser()
  const updateProfile = useUpdateCurrentUser()
  const changePassword = useChangePassword()
  const { data: notificationPrefs, isLoading: notifLoading } = useNotificationPreferences()
  const updateNotifications = useUpdateNotificationPreferences()
  const { data: themePrefs, isLoading: themeLoading } = useThemePreferences()
  const updateTheme = useUpdateThemePreferences()

  // Forms
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: "",
      email: "",
    },
  })

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  const notificationForm = useForm<NotificationFormData>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      email_notifications: true,
      form_assignments: true,
      responses: true,
      system_updates: true,
    },
  })

  const themeForm = useForm<ThemeFormData>({
    resolver: zodResolver(themeSchema),
    defaultValues: {
      theme: "system",
      compact_mode: false,
    },
  })

  // Update form defaults when data loads
  useEffect(() => {
    if (currentUser) {
      profileForm.reset({
        username: (currentUser as any).username || "",
        email: (currentUser as any).email || "",
      })
    }
  }, [currentUser])

  useEffect(() => {
    if (notificationPrefs) {
      notificationForm.reset(notificationPrefs)
    }
  }, [notificationPrefs])

  useEffect(() => {
    if (themePrefs) {
      themeForm.reset({
        theme: (themePrefs.theme as "light" | "dark" | "system") || "system",
        compact_mode: themePrefs.compact_mode ?? false,
      })
    }
  }, [themePrefs])

  // Handlers
  const handleCleanupForms = () => {
    if (
      confirm(
        "⚠️ WARNING: This will permanently delete all soft-deleted forms.\n\nThis action cannot be undone. Are you absolutely sure?"
      )
    ) {
      cleanupForms.mutate()
    }
  }

  const handleCleanupResponses = () => {
    if (
      confirm(
        "⚠️ WARNING: This will permanently delete all soft-deleted responses.\n\nThis action cannot be undone. Are you absolutely sure?"
      )
    ) {
      cleanupResponses.mutate()
    }
  }

  const handleCleanupUsers = () => {
    if (
      confirm(
        "⚠️ WARNING: This will permanently delete all soft-deleted user accounts.\n\nThis action cannot be undone. Are you absolutely sure?"
      )
    ) {
      cleanupUsers.mutate()
    }
  }

  const onProfileSubmit = (data: ProfileFormData) => {
    updateProfile.mutate(data, {
      onSuccess: () => {
        toast({
          title: "Profile Updated",
          description: "Your profile information has been updated successfully.",
        })
        profileForm.reset(data)
      },
      onError: (error: any) => {
        toast({
          title: "Update Failed",
          description: error.response?.data?.detail || "Failed to update profile",
          variant: "destructive",
        })
      },
    })
  }

  const onPasswordSubmit = (data: PasswordFormData) => {
    changePassword.mutate(
      {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      },
      {
        onSuccess: () => {
          toast({
            title: "Password Changed",
            description: "Your password has been updated successfully.",
          })
          passwordForm.reset()
        },
        onError: (error: any) => {
          toast({
            title: "Password Change Failed",
            description: error.response?.data?.detail || "Failed to change password",
            variant: "destructive",
          })
        },
      }
    )
  }

  const onNotificationSubmit = (data: NotificationFormData) => {
    updateNotifications.mutate(data, {
      onSuccess: () => {
        toast({
          title: "Preferences Saved",
          description: "Your notification preferences have been updated.",
        })
      },
    })
  }

  const onThemeSubmit = (data: ThemeFormData) => {
    updateTheme.mutate(data, {
      onSuccess: () => {
        toast({
          title: "Preferences Saved",
          description: "Your appearance settings have been updated.",
        })
      },
    })
  }

  const getThemeIcon = (theme: string) => {
    switch (theme) {
      case "light":
        return <Sun className="w-4 h-4" />
      case "dark":
        return <Moon className="w-4 h-4" />
      default:
        return <Monitor className="w-4 h-4" />
    }
  }

  return (
    <LayoutWrapper>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Settings className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Settings</h1>
              <p className="text-muted-foreground mt-1">
                Manage your account, preferences, and system configuration
              </p>
            </div>
          </div>

          {/* User Info Card */}
          <Card className="mt-6 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">
                    {user?.username?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-foreground">{user?.username}</h3>
                  <p className="text-sm text-muted-foreground">{user?.email || "No email set"}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {roles.map((role) => (
                      <Badge key={role.id} variant="secondary" className="text-xs">
                        <Shield className="w-3 h-3 mr-1" />
                        {role.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Settings Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 h-auto p-1">
            <TabsTrigger value="account" className="flex items-center gap-2 py-3">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Account</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2 py-3">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2 py-3">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2 py-3">
              <Palette className="w-4 h-4" />
              <span className="hidden sm:inline">Appearance</span>
            </TabsTrigger>
            {hasAdminAccess() && (
              <TabsTrigger value="admin" className="flex items-center gap-2 py-3">
                <Database className="w-4 h-4" />
                <span className="hidden sm:inline">Admin</span>
              </TabsTrigger>
            )}
          </TabsList>

          {/* Account Tab */}
          <TabsContent value="account" className="space-y-6">
            {/* Profile Information */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>
                      Update your personal details and account information
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6">
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={profileForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <User className="w-4 h-4 text-muted-foreground" />
                              Username
                            </FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Enter username" />
                            </FormControl>
                            <FormDescription>
                              Your unique identifier across the platform
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profileForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-muted-foreground" />
                              Email Address
                            </FormLabel>
                            <FormControl>
                              <Input {...field} type="email" placeholder="Enter email address" />
                            </FormControl>
                            <FormDescription>
                              Used for notifications and account recovery
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex items-center gap-3 pt-4">
                      <Button
                        type="submit"
                        disabled={updateProfile.isPending || !profileForm.formState.isDirty}
                      >
                        {updateProfile.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                      {profileForm.formState.isDirty && (
                        <Button type="button" variant="outline" onClick={() => profileForm.reset()}>
                          Cancel
                        </Button>
                      )}
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Change Password */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <CardTitle>Security</CardTitle>
                    <CardDescription>
                      Update your password to keep your account secure
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6">
                <Alert className="mb-6">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Password must be at least 8 characters and include uppercase, lowercase,
                    numbers, and special characters (@$!%*?&).
                  </AlertDescription>
                </Alert>

                <Form {...passwordForm}>
                  <form
                    onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
                    className="space-y-6"
                  >
                    <FormField
                      control={passwordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Key className="w-4 h-4 text-muted-foreground" />
                            Current Password
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="password"
                              placeholder="Enter current password"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={passwordForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Lock className="w-4 h-4 text-muted-foreground" />
                              New Password
                            </FormLabel>
                            <FormControl>
                              <Input {...field} type="password" placeholder="Enter new password" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={passwordForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
                              Confirm New Password
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="password"
                                placeholder="Confirm new password"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex items-center gap-3 pt-4">
                      <Button type="submit" disabled={changePassword.isPending}>
                        {changePassword.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <Lock className="w-4 h-4 mr-2" />
                            Change Password
                          </>
                        )}
                      </Button>
                      {passwordForm.formState.isDirty && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => passwordForm.reset()}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <CardTitle>Security & Privacy</CardTitle>
                    <CardDescription>
                      Manage your security settings and integrations
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6">
                <div className="grid gap-4">
                  {/* Sessions */}
                  <a
                    href="/settings/sessions"
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Monitor className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">Active Sessions</h3>
                        <p className="text-sm text-muted-foreground">
                          View and manage your active login sessions across devices
                        </p>
                      </div>
                    </div>
                    <svg
                      className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </a>

                  {/* API Keys */}
                  <a
                    href="/settings/api-keys"
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                        <Key className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">API Keys</h3>
                        <p className="text-sm text-muted-foreground">
                          Create and manage API keys for programmatic access
                        </p>
                      </div>
                    </div>
                    <svg
                      className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </a>

                  {/* Webhooks */}
                  <a
                    href="/settings/webhooks"
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
                        <Activity className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">Webhooks</h3>
                        <p className="text-sm text-muted-foreground">
                          Configure webhooks to receive real-time notifications
                        </p>
                      </div>
                    </div>
                    <svg
                      className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </a>

                  {/* Audit Logs */}
                  <a
                    href="/settings/audit-logs"
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center group-hover:bg-amber-200 dark:group-hover:bg-amber-900/50 transition-colors">
                        <FileText className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">Audit Logs</h3>
                        <p className="text-sm text-muted-foreground">
                          Track all security-relevant actions and system events
                        </p>
                      </div>
                    </div>
                    <svg
                      className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </a>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <CardTitle>Notification Preferences</CardTitle>
                    <CardDescription>Choose what notifications you want to receive</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6">
                <Form {...notificationForm}>
                  <form
                    onSubmit={notificationForm.handleSubmit(onNotificationSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={notificationForm.control}
                      name="email_notifications"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-muted-foreground" />
                              <FormLabel className="text-base font-medium">
                                Email Notifications
                              </FormLabel>
                            </div>
                            <FormDescription>
                              Receive notifications via email for important updates
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={notificationForm.control}
                      name="form_assignments"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <Settings className="w-4 h-4 text-muted-foreground" />
                              <FormLabel className="text-base font-medium">
                                Form Assignments
                              </FormLabel>
                            </div>
                            <FormDescription>
                              Get notified when forms are assigned to you
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={notificationForm.control}
                      name="responses"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
                              <FormLabel className="text-base font-medium">
                                Response Notifications
                              </FormLabel>
                            </div>
                            <FormDescription>
                              Get notified when new responses are submitted
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={notificationForm.control}
                      name="system_updates"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <Info className="w-4 h-4 text-muted-foreground" />
                              <FormLabel className="text-base font-medium">
                                System Updates
                              </FormLabel>
                            </div>
                            <FormDescription>
                              Receive notifications about system updates and maintenance
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <div className="flex items-center gap-3 pt-4">
                      <Button
                        type="submit"
                        disabled={
                          updateNotifications.isPending || !notificationForm.formState.isDirty
                        }
                      >
                        {updateNotifications.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Save Preferences
                          </>
                        )}
                      </Button>
                      {notificationForm.formState.isDirty && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => notificationForm.reset()}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                    <Palette className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <CardTitle>Appearance Settings</CardTitle>
                    <CardDescription>Customize how the application looks and feels</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6">
                <Form {...themeForm}>
                  <form onSubmit={themeForm.handleSubmit(onThemeSubmit)} className="space-y-6">
                    <FormField
                      control={themeForm.control}
                      name="theme"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium">Color Theme</FormLabel>
                          <div className="grid grid-cols-3 gap-4 mt-2">
                            {["light", "dark", "system"].map((theme) => (
                              <div
                                key={theme}
                                onClick={() => field.onChange(theme)}
                                className={`
                                  relative rounded-lg border-2 p-4 cursor-pointer transition-all
                                  ${
                                    field.value === theme
                                      ? "border-primary bg-primary/5"
                                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                                  }
                                `}
                              >
                                <div className="flex flex-col items-center gap-2">
                                  {getThemeIcon(theme)}
                                  <span className="text-sm font-medium capitalize">{theme}</span>
                                  {field.value === theme && (
                                    <CheckCircle2 className="w-4 h-4 text-primary absolute top-2 right-2" />
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                          <FormDescription>
                            Choose your preferred color theme or follow system settings
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Separator />

                    <FormField
                      control={themeForm.control}
                      name="compact_mode"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base font-medium">Compact Mode</FormLabel>
                            <FormDescription>
                              Use a more compact layout to fit more content on screen
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <div className="flex items-center gap-3 pt-4">
                      <Button
                        type="submit"
                        disabled={updateTheme.isPending || !themeForm.formState.isDirty}
                      >
                        {updateTheme.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Save Preferences
                          </>
                        )}
                      </Button>
                      {themeForm.formState.isDirty && (
                        <Button type="button" variant="outline" onClick={() => themeForm.reset()}>
                          Cancel
                        </Button>
                      )}
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Admin Tab */}
          {hasAdminAccess() && (
            <TabsContent value="admin" className="space-y-6">
              <Card className="border-destructive/20">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                      <Database className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <CardTitle className="text-destructive">Data Cleanup</CardTitle>
                      <CardDescription>
                        Permanently remove soft-deleted records from the database
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <Separator />
                <CardContent className="pt-6 space-y-6">
                  {/* Warning Alert */}
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Warning:</strong> These operations permanently delete data from the
                      database. This action cannot be undone. Make sure to backup your data before
                      proceeding.
                    </AlertDescription>
                  </Alert>

                  {/* Cleanup Actions */}
                  <div className="space-y-4">
                    {/* Forms Cleanup */}
                    <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/20 bg-destructive/5">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Trash2 className="w-4 h-4 text-destructive" />
                          <h3 className="font-semibold text-foreground">Clean Deleted Forms</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Permanently remove all soft-deleted forms and their associated data
                        </p>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleCleanupForms}
                        disabled={cleanupForms.isPending}
                        className="ml-4"
                      >
                        {cleanupForms.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Cleaning...
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Clean Forms
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Responses Cleanup */}
                    <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/20 bg-destructive/5">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Trash2 className="w-4 h-4 text-destructive" />
                          <h3 className="font-semibold text-foreground">Clean Deleted Responses</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Permanently remove all soft-deleted responses
                        </p>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleCleanupResponses}
                        disabled={cleanupResponses.isPending}
                        className="ml-4"
                      >
                        {cleanupResponses.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Cleaning...
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Clean Responses
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Users Cleanup */}
                    <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/20 bg-destructive/5">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Trash2 className="w-4 h-4 text-destructive" />
                          <h3 className="font-semibold text-foreground">Clean Deleted Users</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Permanently remove all soft-deleted user accounts
                        </p>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleCleanupUsers}
                        disabled={cleanupUsers.isPending}
                        className="ml-4"
                      >
                        {cleanupUsers.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Cleaning...
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Clean Users
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Info Alert */}
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Soft-deleted records are normally excluded from queries but can be recovered
                      if needed. Use these cleanup operations only when you're certain the data is
                      no longer required.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </LayoutWrapper>
  )
}
