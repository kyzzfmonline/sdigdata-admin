"use client"

import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { LayoutWrapper } from "@/components/layout-wrapper"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FormCard } from "@/components/standardized-cards"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useStore } from "@/lib/store"
import { usePermissions } from "@/lib/permission-context"
import { useCleanupForms } from "@/hooks/use-forms"
import { useCleanupResponses } from "@/hooks/use-responses"
import { useCleanupUsers } from "@/hooks/use-users"
import { RoleManagement } from "@/components/role-management"
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
import { Loader2, User, Bell, Palette, Shield, Database } from "lucide-react"

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
  const { hasAdminAccess } = usePermissions()
  const { toast } = useToast()

  // Admin cleanup hooks
  const cleanupForms = useCleanupForms()
  const cleanupResponses = useCleanupResponses()
  const cleanupUsers = useCleanupUsers()

  // User profile hooks
  const { data: currentUser } = useCurrentUser()
  const updateProfile = useUpdateCurrentUser()
  const changePassword = useChangePassword()
  const { data: notificationPrefs } = useNotificationPreferences()
  const updateNotifications = useUpdateNotificationPreferences()
  const { data: themePrefs } = useThemePreferences()
  const updateTheme = useUpdateThemePreferences()

  // Forms
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: currentUser?.username || "",
      email: currentUser?.email || "",
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
      email_notifications: notificationPrefs?.email_notifications ?? true,
      form_assignments: notificationPrefs?.form_assignments ?? true,
      responses: notificationPrefs?.responses ?? true,
      system_updates: notificationPrefs?.system_updates ?? true,
    },
  })

  const themeForm = useForm<ThemeFormData>({
    resolver: zodResolver(themeSchema),
    defaultValues: {
      theme: (themePrefs?.theme as "light" | "dark" | "system") || "system",
      compact_mode: themePrefs?.compact_mode ?? false,
    },
  })

  // Update form defaults when data loads
  React.useEffect(() => {
    if (currentUser) {
      profileForm.reset({
        username: currentUser.username,
        email: currentUser.email,
      })
    }
  }, [currentUser, profileForm])

  React.useEffect(() => {
    if (notificationPrefs) {
      notificationForm.reset(notificationPrefs)
    }
  }, [notificationPrefs, notificationForm])

  React.useEffect(() => {
    if (themePrefs) {
      themeForm.reset({
        theme: themePrefs.theme,
        compact_mode: themePrefs.compact_mode,
      })
    }
  }, [themePrefs, themeForm])

  // Handlers
  const handleCleanupForms = () => {
    if (
      confirm(
        "Are you sure you want to permanently delete all soft-deleted forms? This action cannot be undone."
      )
    ) {
      cleanupForms.mutate()
    }
  }

  const handleCleanupResponses = () => {
    if (
      confirm(
        "Are you sure you want to permanently delete all soft-deleted responses? This action cannot be undone."
      )
    ) {
      cleanupResponses.mutate()
    }
  }

  const handleCleanupUsers = () => {
    if (
      confirm(
        "Are you sure you want to permanently delete all soft-deleted users? This action cannot be undone."
      )
    ) {
      cleanupUsers.mutate()
    }
  }

  const onProfileSubmit = (data: ProfileFormData) => {
    updateProfile.mutate(data, {
      onSuccess: () => {
        profileForm.reset(data)
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
          passwordForm.reset()
        },
      }
    )
  }

  const onNotificationSubmit = (data: NotificationFormData) => {
    updateNotifications.mutate(data)
  }

  const onThemeSubmit = (data: ThemeFormData) => {
    updateTheme.mutate(data)
  }

  return (
    <LayoutWrapper>
      <PageHeader
        title="Settings"
        description="Manage your account settings and preferences"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Settings" }]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="profile" className="space-y-8">
          <TabsList className="grid w-full max-w-3xl mx-auto grid-cols-3 lg:grid-cols-5">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Appearance
            </TabsTrigger>
            {hasAdminAccess() && (
              <>
                <TabsTrigger value="roles" className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Roles
                </TabsTrigger>
                <TabsTrigger value="admin" className="flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  Admin
                </TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <FormCard
              title="Profile Information"
              description="Update your account details and manage your profile."
              icon={User}
            >
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={profileForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button type="submit" disabled={updateProfile.isPending}>
                    {updateProfile.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Update Profile
                  </Button>
                </form>
              </Form>
            </FormCard>

            <FormCard
              title="Change Password"
              description="Update your password to keep your account secure."
              icon={User}
            >
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Password</FormLabel>
                        <FormControl>
                          <Input {...field} type="password" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <Input {...field} type="password" />
                        </FormControl>
                        <FormDescription>
                          Password must be 8-128 characters with uppercase, lowercase, numbers, and
                          special characters.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm New Password</FormLabel>
                        <FormControl>
                          <Input {...field} type="password" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={changePassword.isPending}>
                    {changePassword.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Change Password
                  </Button>
                </form>
              </Form>
            </FormCard>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <FormCard
              title="Notification Preferences"
              description="Choose what notifications you want to receive."
              icon={Bell}
            >
              <Form {...notificationForm}>
                <form
                  onSubmit={notificationForm.handleSubmit(onNotificationSubmit)}
                  className="space-y-6"
                >
                  <FormField
                    control={notificationForm.control}
                    name="email_notifications"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Email Notifications</FormLabel>
                          <FormDescription>Receive notifications via email</FormDescription>
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
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Form Assignments</FormLabel>
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
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Response Notifications</FormLabel>
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
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">System Updates</FormLabel>
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
                  <Button type="submit" disabled={updateNotifications.isPending}>
                    {updateNotifications.isPending && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    Save Preferences
                  </Button>
                </form>
              </Form>
            </FormCard>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-6">
            <FormCard
              title="Appearance Settings"
              description="Customize how the application looks and feels."
              icon={Palette}
            >
              <Form {...themeForm}>
                <form onSubmit={themeForm.handleSubmit(onThemeSubmit)} className="space-y-6">
                  <FormField
                    control={themeForm.control}
                    name="theme"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Theme</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a theme" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="light">Light</SelectItem>
                            <SelectItem value="dark">Dark</SelectItem>
                            <SelectItem value="system">System</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Choose your preferred theme or follow system settings.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={themeForm.control}
                    name="compact_mode"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Compact Mode</FormLabel>
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
                  <Button type="submit" disabled={updateTheme.isPending}>
                    {updateTheme.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Save Preferences
                  </Button>
                </form>
              </Form>
            </FormCard>
          </TabsContent>

          {hasAdminAccess() && (
            <TabsContent value="roles" className="space-y-6">
              <RoleManagement />
            </TabsContent>
          )}

          {hasAdminAccess() && (
            <TabsContent value="admin" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    Data Cleanup
                  </CardTitle>
                  <CardDescription>
                    Permanently remove soft-deleted records from the database. This action cannot be
                    undone.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium">Clean up Deleted Forms</h3>
                        <p className="text-sm text-muted-foreground">
                          Permanently remove all soft-deleted forms and their associated data
                        </p>
                      </div>
                      <Button
                        variant="destructive"
                        onClick={handleCleanupForms}
                        disabled={cleanupForms.isPending}
                      >
                        {cleanupForms.isPending ? "Cleaning..." : "Clean Forms"}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium">Clean up Deleted Responses</h3>
                        <p className="text-sm text-muted-foreground">
                          Permanently remove all soft-deleted responses
                        </p>
                      </div>
                      <Button
                        variant="destructive"
                        onClick={handleCleanupResponses}
                        disabled={cleanupResponses.isPending}
                      >
                        {cleanupResponses.isPending ? "Cleaning..." : "Clean Responses"}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium">Clean up Deleted Users</h3>
                        <p className="text-sm text-muted-foreground">
                          Permanently remove all soft-deleted user accounts
                        </p>
                      </div>
                      <Button
                        variant="destructive"
                        onClick={handleCleanupUsers}
                        disabled={cleanupUsers.isPending}
                      >
                        {cleanupUsers.isPending ? "Cleaning..." : "Clean Users"}
                      </Button>
                    </div>
                  </div>

                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-5 w-5 text-yellow-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">Warning</h3>
                        <div className="mt-2 text-sm text-yellow-700">
                          <p>
                            These operations permanently delete data from the database. Make sure to
                            backup your data before proceeding. Soft-deleted records are normally
                            excluded from queries but can be recovered if needed.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </LayoutWrapper>
  )
}
