"use client"

/**
 * Security Settings Page
 * Manage account security, MFA, password policies, and security preferences
 */

import { useState } from "react"
import { LayoutWrapper } from "@/components/layout-wrapper"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  useAccountSecurityStatus,
  useLoginHistory,
  useChangePassword,
  useEnableMFA,
  useDisableMFA,
  type ChangePasswordRequest,
  type EnableMFARequest,
} from "@/hooks/security/use-security-settings"
import {
  Shield,
  Lock,
  Key,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Monitor,
  Smartphone,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { format } from "date-fns"
import { useForm } from "react-hook-form"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function SecuritySettingsPage() {
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false)
  const [isEnableMFAOpen, setIsEnableMFAOpen] = useState(false)
  const [mfaMethod, setMfaMethod] = useState<"totp" | "sms" | "email">("totp")

  const { data: securityStatus, isLoading: statusLoading } = useAccountSecurityStatus()
  const { data: loginHistory, isLoading: historyLoading } = useLoginHistory(30)
  const changePasswordMutation = useChangePassword()
  const enableMFAMutation = useEnableMFA()
  const disableMFAMutation = useDisableMFA()

  // Password change form
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm<ChangePasswordRequest>()

  const onChangePassword = async (data: ChangePasswordRequest) => {
    try {
      await changePasswordMutation.mutateAsync(data)
      setIsChangePasswordOpen(false)
      resetPassword()
    } catch (error) {
      // Error handled by mutation
    }
  }

  const onEnableMFA = async () => {
    try {
      const data: EnableMFARequest = { method: mfaMethod }
      await enableMFAMutation.mutateAsync(data)
      setIsEnableMFAOpen(false)
    } catch (error) {
      // Error handled by mutation
    }
  }

  const onDisableMFA = async () => {
    if (confirm("Are you sure you want to disable MFA? This will reduce your account security.")) {
      await disableMFAMutation.mutateAsync()
    }
  }

  const getSecurityScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400"
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400"
    return "text-red-600 dark:text-red-400"
  }

  const getSecurityScoreLabel = (score: number) => {
    if (score >= 80) return "Strong"
    if (score >= 60) return "Good"
    if (score >= 40) return "Fair"
    return "Weak"
  }

  return (
    <LayoutWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Security Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account security preferences and monitor security status
          </p>
        </div>

        {/* Security Score */}
        {statusLoading ? (
          <Card>
            <CardContent className="pt-6">
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        ) : securityStatus ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Security Score</CardTitle>
                  <CardDescription>Your overall account security rating</CardDescription>
                </div>
                <div
                  className={`text-right ${getSecurityScoreColor(securityStatus.security_score)}`}
                >
                  <div className="text-4xl font-bold">{securityStatus.security_score}</div>
                  <div className="text-sm font-medium">
                    {getSecurityScoreLabel(securityStatus.security_score)}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress value={securityStatus.security_score} className="h-2" />

              {securityStatus.security_recommendations.length > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Recommendations</AlertTitle>
                  <AlertDescription>
                    <ul className="mt-2 space-y-1 text-sm">
                      {securityStatus.security_recommendations.slice(0, 3).map((rec, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-muted-foreground">•</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  {securityStatus.mfa_enabled ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive" />
                  )}
                  <div>
                    <p className="text-sm font-medium">MFA</p>
                    <p className="text-xs text-muted-foreground">
                      {securityStatus.mfa_enabled ? "Enabled" : "Disabled"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Monitor className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">
                      {securityStatus.active_sessions_count} Sessions
                    </p>
                    <p className="text-xs text-muted-foreground">Active now</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  {securityStatus.account_locked ? (
                    <Lock className="h-5 w-5 text-destructive" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  )}
                  <div>
                    <p className="text-sm font-medium">Account Status</p>
                    <p className="text-xs text-muted-foreground">
                      {securityStatus.account_locked ? "Locked" : "Active"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Account Locked Warning */}
        {securityStatus?.account_locked && (
          <Alert variant="destructive">
            <Lock className="h-4 w-4" />
            <AlertTitle>Account Locked</AlertTitle>
            <AlertDescription>
              Your account has been locked due to security reasons.
              {securityStatus.account_locked_until && (
                <>
                  {" "}
                  It will be automatically unlocked at{" "}
                  {format(new Date(securityStatus.account_locked_until), "PPp")}.
                </>
              )}{" "}
              Contact support if you need immediate assistance.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* Multi-Factor Authentication */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Multi-Factor Authentication
              </CardTitle>
              <CardDescription>Add an extra layer of security to your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">MFA Status</p>
                  <p className="text-xs text-muted-foreground">
                    {securityStatus?.mfa_enabled
                      ? "Your account is protected with MFA"
                      : "MFA is currently disabled"}
                  </p>
                </div>
                <Badge variant={securityStatus?.mfa_enabled ? "default" : "secondary"}>
                  {securityStatus?.mfa_enabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>

              {securityStatus?.mfa_enabled && securityStatus.mfa_methods.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Active Methods:</p>
                  <div className="flex flex-wrap gap-2">
                    {securityStatus.mfa_methods.map((method) => (
                      <Badge key={method} variant="outline">
                        {method.toUpperCase()}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {securityStatus?.mfa_enabled ? (
                <Button
                  variant="destructive"
                  onClick={onDisableMFA}
                  disabled={disableMFAMutation.isPending}
                  className="w-full"
                >
                  {disableMFAMutation.isPending ? "Disabling..." : "Disable MFA"}
                </Button>
              ) : (
                <Dialog open={isEnableMFAOpen} onOpenChange={setIsEnableMFAOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full">Enable MFA</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Enable Multi-Factor Authentication</DialogTitle>
                      <DialogDescription>Choose your preferred MFA method</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>MFA Method</Label>
                        <div className="space-y-2">
                          <div
                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${
                              mfaMethod === "totp" ? "border-primary bg-primary/5" : "border-border"
                            }`}
                            onClick={() => setMfaMethod("totp")}
                          >
                            <input
                              type="radio"
                              checked={mfaMethod === "totp"}
                              onChange={() => setMfaMethod("totp")}
                              className="cursor-pointer"
                            />
                            <div>
                              <p className="font-medium">Authenticator App (TOTP)</p>
                              <p className="text-xs text-muted-foreground">
                                Use Google Authenticator, Authy, or similar
                              </p>
                            </div>
                          </div>
                          <div
                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${
                              mfaMethod === "sms" ? "border-primary bg-primary/5" : "border-border"
                            }`}
                            onClick={() => setMfaMethod("sms")}
                          >
                            <input
                              type="radio"
                              checked={mfaMethod === "sms"}
                              onChange={() => setMfaMethod("sms")}
                              className="cursor-pointer"
                            />
                            <div>
                              <p className="font-medium">SMS</p>
                              <p className="text-xs text-muted-foreground">
                                Receive codes via text message
                              </p>
                            </div>
                          </div>
                          <div
                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${
                              mfaMethod === "email"
                                ? "border-primary bg-primary/5"
                                : "border-border"
                            }`}
                            onClick={() => setMfaMethod("email")}
                          >
                            <input
                              type="radio"
                              checked={mfaMethod === "email"}
                              onChange={() => setMfaMethod("email")}
                              className="cursor-pointer"
                            />
                            <div>
                              <p className="font-medium">Email</p>
                              <p className="text-xs text-muted-foreground">
                                Receive codes via email
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsEnableMFAOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={onEnableMFA} disabled={enableMFAMutation.isPending}>
                        {enableMFAMutation.isPending ? "Enabling..." : "Enable MFA"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </CardContent>
          </Card>

          {/* Password Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Password
              </CardTitle>
              <CardDescription>Keep your password strong and secure</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {securityStatus && (
                <>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Last Changed</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(securityStatus.password_last_changed), "PPp")}
                      </p>
                    </div>
                  </div>

                  {securityStatus.password_expires_at && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Password Expires</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(securityStatus.password_expires_at), "PPp")}
                        </p>
                      </div>
                    </div>
                  )}

                  {securityStatus.failed_login_attempts > 0 && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Failed Login Attempts</AlertTitle>
                      <AlertDescription>
                        {securityStatus.failed_login_attempts} failed attempt(s) detected
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              )}

              <Separator />

              <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full" variant="outline">
                    Change Password
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handlePasswordSubmit(onChangePassword)}>
                    <DialogHeader>
                      <DialogTitle>Change Password</DialogTitle>
                      <DialogDescription>
                        Enter your current password and choose a new one
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="current_password">Current Password *</Label>
                        <Input
                          id="current_password"
                          type="password"
                          {...registerPassword("current_password", {
                            required: "Current password is required",
                          })}
                        />
                        {passwordErrors.current_password && (
                          <p className="text-sm text-destructive">
                            {passwordErrors.current_password.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new_password">New Password *</Label>
                        <Input
                          id="new_password"
                          type="password"
                          {...registerPassword("new_password", {
                            required: "New password is required",
                            minLength: {
                              value: 8,
                              message: "Password must be at least 8 characters",
                            },
                          })}
                        />
                        {passwordErrors.new_password && (
                          <p className="text-sm text-destructive">
                            {passwordErrors.new_password.message}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Password must be at least 8 characters and include uppercase, lowercase,
                          numbers, and special characters
                        </p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsChangePasswordOpen(false)
                          resetPassword()
                        }}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={changePasswordMutation.isPending}>
                        {changePasswordMutation.isPending ? "Changing..." : "Change Password"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>

        {/* Recent Login History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Login History
            </CardTitle>
            <CardDescription>
              Review your recent login activity for any suspicious behavior
            </CardDescription>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : loginHistory && loginHistory.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Device</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loginHistory.slice(0, 10).map((login) => (
                    <TableRow key={login.id}>
                      <TableCell>
                        {login.success ? (
                          <Badge variant="outline" className="gap-1">
                            <CheckCircle2 className="h-3 w-3 text-green-600" />
                            Success
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="gap-1">
                            <XCircle className="h-3 w-3" />
                            Failed
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{format(new Date(login.timestamp), "PPp")}</TableCell>
                      <TableCell>
                        {login.location ? (
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            {login.location.city}, {login.location.country}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Unknown</span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{login.ip_address}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          {login.user_agent.toLowerCase().includes("mobile") ? (
                            <Smartphone className="h-3 w-3 text-muted-foreground" />
                          ) : (
                            <Monitor className="h-3 w-3 text-muted-foreground" />
                          )}
                          <span className="text-muted-foreground truncate max-w-[200px]">
                            {login.user_agent}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-8">No login history available</p>
            )}
          </CardContent>
        </Card>
      </div>
    </LayoutWrapper>
  )
}
