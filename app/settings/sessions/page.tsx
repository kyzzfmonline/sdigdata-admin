"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { LayoutWrapper } from "@/components/layout-wrapper"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { sessionAPI } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import type { UserSession } from "@/lib/types"
import {
  Monitor,
  Smartphone,
  Tablet,
  Loader2,
  Trash2,
  MapPin,
  Clock,
  AlertTriangle,
  Shield,
  LogOut,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

export default function SessionsPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [sessionToRevoke, setSessionToRevoke] = useState<UserSession | null>(null)
  const [showRevokeAllDialog, setShowRevokeAllDialog] = useState(false)

  // Fetch sessions
  const { data: sessionsData, isLoading } = useQuery({
    queryKey: ["sessions"],
    queryFn: async () => {
      const response = await sessionAPI.getSessions()
      return response.data.data as { sessions: UserSession[]; count: number }
    },
  })

  // Revoke single session
  const revokeMutation = useMutation({
    mutationFn: (sessionId: string) => sessionAPI.revokeSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] })
      toast({
        title: "Session Revoked",
        description: "The session has been successfully terminated.",
      })
      setSessionToRevoke(null)
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to revoke session",
        variant: "destructive",
      })
    },
  })

  // Revoke all sessions
  const revokeAllMutation = useMutation({
    mutationFn: () => sessionAPI.revokeAllSessions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] })
      toast({
        title: "All Sessions Revoked",
        description:
          "All other sessions have been terminated. You remain logged in on this device.",
      })
      setShowRevokeAllDialog(false)
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to revoke sessions",
        variant: "destructive",
      })
    },
  })

  const getDeviceIcon = (device: string) => {
    const lowerDevice = device.toLowerCase()
    if (
      lowerDevice.includes("mobile") ||
      lowerDevice.includes("android") ||
      lowerDevice.includes("ios")
    ) {
      return <Smartphone className="w-5 h-5" />
    }
    if (lowerDevice.includes("tablet") || lowerDevice.includes("ipad")) {
      return <Tablet className="w-5 h-5" />
    }
    return <Monitor className="w-5 h-5" />
  }

  const sessions = sessionsData?.sessions || []
  const activeSessions = sessions.filter((s) => !s.is_current)

  return (
    <LayoutWrapper>
      <div className="p-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Active Sessions</h1>
              <p className="text-muted-foreground mt-1">
                Manage your active login sessions across all devices
              </p>
            </div>
          </div>
        </div>

        {/* Security Alert */}
        {activeSessions.length > 3 && (
          <Alert className="mb-6 border-amber-500/50 bg-amber-500/10">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-900 dark:text-amber-200">
              You have {activeSessions.length} active sessions besides this one. If you don't
              recognize any of these, revoke them immediately.
            </AlertDescription>
          </Alert>
        )}

        {/* Sessions Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Your Sessions
                  {sessionsData && (
                    <Badge variant="secondary" className="ml-2">
                      {sessionsData.count} active
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  These are the devices currently logged into your account
                </CardDescription>
              </div>
              {activeSessions.length > 0 && (
                <Button
                  variant="destructive"
                  onClick={() => setShowRevokeAllDialog(true)}
                  disabled={revokeAllMutation.isPending}
                >
                  {revokeAllMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Revoking...
                    </>
                  ) : (
                    <>
                      <LogOut className="w-4 h-4 mr-2" />
                      Revoke All Others
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-12">
                <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No active sessions found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className={`
                      flex items-center justify-between p-4 rounded-lg border
                      ${
                        session.is_current
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/50"
                      }
                      transition-colors
                    `}
                  >
                    <div className="flex items-start gap-4 flex-1">
                      <div
                        className={`
                        w-12 h-12 rounded-lg flex items-center justify-center
                        ${session.is_current ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}
                      `}
                      >
                        {getDeviceIcon(session.device)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground">{session.device}</h3>
                          {session.is_current && (
                            <Badge variant="default" className="text-xs">
                              Current Session
                            </Badge>
                          )}
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-4 flex-wrap">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {session.ip_address}
                              {session.location && ` • ${session.location}`}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Last active {formatDistanceToNow(new Date(session.last_active))} ago
                          </div>
                          <div className="text-xs text-muted-foreground/70">
                            Signed in {formatDistanceToNow(new Date(session.created_at))} ago
                          </div>
                        </div>
                      </div>
                    </div>
                    {!session.is_current && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSessionToRevoke(session)}
                        disabled={revokeMutation.isPending}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security Tips */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Security Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>
                  If you see a session you don't recognize, revoke it immediately and change your
                  password.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Always log out from shared or public computers.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Regularly review your active sessions and revoke any you no longer use.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Enable two-factor authentication for an extra layer of security.</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Revoke Single Session Dialog */}
        <AlertDialog open={!!sessionToRevoke} onOpenChange={() => setSessionToRevoke(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Revoke Session</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to end this session? The device will be logged out
                immediately.
                <div className="mt-4 p-3 bg-muted rounded-lg text-sm">
                  <div className="font-medium text-foreground mb-1">{sessionToRevoke?.device}</div>
                  <div className="text-muted-foreground">
                    {sessionToRevoke?.ip_address}
                    {sessionToRevoke?.location && ` • ${sessionToRevoke.location}`}
                  </div>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => sessionToRevoke && revokeMutation.mutate(sessionToRevoke.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {revokeMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Revoking...
                  </>
                ) : (
                  "Revoke Session"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Revoke All Sessions Dialog */}
        <AlertDialog open={showRevokeAllDialog} onOpenChange={setShowRevokeAllDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Revoke All Other Sessions</AlertDialogTitle>
              <AlertDialogDescription>
                This will immediately log you out from all devices except this one. Are you sure you
                want to continue?
                <Alert className="mt-4 border-amber-500/50 bg-amber-500/10">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-900 dark:text-amber-200">
                    {activeSessions.length} session(s) will be terminated
                  </AlertDescription>
                </Alert>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => revokeAllMutation.mutate()}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {revokeAllMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Revoking...
                  </>
                ) : (
                  "Revoke All"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </LayoutWrapper>
  )
}
