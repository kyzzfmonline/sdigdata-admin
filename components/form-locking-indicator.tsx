"use client"

/**
 * Form Locking Indicator Component
 * Shows lock status and provides lock management controls
 */

import { useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useFormLockManager } from "@/hooks/forms/use-form-locking"
import { Lock, LockOpen, AlertCircle, User } from "lucide-react"
import { format } from "date-fns"

interface FormLockingIndicatorProps {
  formId: string
  autoAcquire?: boolean
  onLockAcquired?: () => void
  onLockReleased?: () => void
}

export function FormLockingIndicator({
  formId,
  autoAcquire = false,
  onLockAcquired,
  onLockReleased,
}: FormLockingIndicatorProps) {
  const { lockStatus, acquireLock, releaseLock, refreshLock, canEdit, isLocked } =
    useFormLockManager(formId, true)

  // Auto-acquire lock on mount if requested
  useEffect(() => {
    if (autoAcquire && !isLocked) {
      acquireLock.mutate(
        {},
        {
          onSuccess: () => {
            onLockAcquired?.()
          },
        }
      )
    }
  }, [autoAcquire, isLocked])

  // Release lock on unmount
  useEffect(() => {
    return () => {
      if (canEdit) {
        releaseLock.mutate(
          {},
          {
            onSuccess: () => {
              onLockReleased?.()
            },
          }
        )
      }
    }
  }, [canEdit])

  if (!lockStatus) {
    return null
  }

  // Not locked - can acquire
  if (!isLocked) {
    return (
      <Card className="border-green-500/50 bg-green-50/50 dark:bg-green-900/10">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LockOpen className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-900 dark:text-green-100">Form is Available</p>
                <p className="text-sm text-green-700 dark:text-green-300">You can edit this form</p>
              </div>
            </div>
            {!canEdit && (
              <Button
                size="sm"
                onClick={() => acquireLock.mutate({})}
                disabled={acquireLock.isPending}
              >
                <Lock className="h-4 w-4 mr-2" />
                {acquireLock.isPending ? "Acquiring..." : "Start Editing"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Locked by current user
  if (canEdit) {
    return (
      <Card className="border-blue-500/50 bg-blue-50/50 dark:bg-blue-900/10">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  You are editing this form
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Lock acquired{" "}
                  {lockStatus.locked_at && format(new Date(lockStatus.locked_at), "PPp")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refreshLock.mutate({})}
                disabled={refreshLock.isPending}
              >
                {refreshLock.isPending ? "Refreshing..." : "Refresh Lock"}
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <LockOpen className="h-4 w-4 mr-2" />
                    Release Lock
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Release Edit Lock</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to release the lock? Make sure you've saved your
                      changes.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => releaseLock.mutate({})}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Release Lock
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Locked by another user
  return (
    <Card className="border-red-500/50 bg-red-50/50 dark:bg-red-900/10">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div>
              <p className="font-medium text-red-900 dark:text-red-100">Form is Locked</p>
              <div className="flex items-center gap-2 text-sm text-red-700 dark:text-red-300">
                <User className="h-3 w-3" />
                <span>{lockStatus.locked_by_username} is editing this form</span>
              </div>
              {lockStatus.locked_at && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  Lock acquired {format(new Date(lockStatus.locked_at), "PPp")}
                </p>
              )}
              {lockStatus.lock_expires_at && (
                <p className="text-xs text-red-600 dark:text-red-400">
                  Expires {format(new Date(lockStatus.lock_expires_at), "PPp")}
                </p>
              )}
            </div>
          </div>
          {lockStatus.can_force_unlock && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  Force Unlock
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Force Unlock Form</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will forcefully remove the lock from {lockStatus.locked_by_username}. Only
                    do this if you're sure they're not actively editing.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Force Unlock
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Compact version for inline use
 */
export function FormLockingBadge({ formId }: { formId: string }) {
  const { lockStatus, canEdit, isLocked } = useFormLockManager(formId, false)

  if (!lockStatus || !isLocked) {
    return null
  }

  if (canEdit) {
    return (
      <Badge variant="default" className="gap-1">
        <Lock className="h-3 w-3" />
        Editing
      </Badge>
    )
  }

  return (
    <Badge variant="destructive" className="gap-1">
      <Lock className="h-3 w-3" />
      Locked by {lockStatus.locked_by_username}
    </Badge>
  )
}
