"use client"

/**
 * Form Versions Page
 * View version history, compare versions, and restore previous versions
 */

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { LayoutWrapper } from "@/components/layout-wrapper"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  useFormVersions,
  useCurrentFormVersion,
  useFormVersionStats,
  usePublishVersion,
  useRestoreVersion,
  useDeleteVersion,
  useCreateFormVersion,
  useDuplicateVersion,
  type FormVersion,
} from "@/hooks/forms/use-form-versioning"
import {
  History,
  Check,
  GitBranch,
  Eye,
  RotateCcw,
  Trash2,
  Copy,
  Upload,
  FileText,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { format } from "date-fns"
import { useForm } from "react-hook-form"

export default function FormVersionsPage() {
  const params = useParams()
  const router = useRouter()
  const formId = params.id as string

  const [selectedVersion, setSelectedVersion] = useState<FormVersion | null>(null)
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isCreateVersionDialogOpen, setIsCreateVersionDialogOpen] = useState(false)
  const [createNewOnRestore, setCreateNewOnRestore] = useState(true)

  const { data: versions, isLoading: versionsLoading } = useFormVersions(formId)
  const { data: currentVersion } = useCurrentFormVersion(formId)
  const { data: stats } = useFormVersionStats(formId)

  const publishMutation = usePublishVersion(formId, selectedVersion?.version || 0)
  const restoreMutation = useRestoreVersion(formId, selectedVersion?.version || 0)
  const deleteMutation = useDeleteVersion(formId)
  const createVersionMutation = useCreateFormVersion(formId)
  const duplicateMutation = useDuplicateVersion(formId, selectedVersion?.version || 0)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<{
    title?: string
    description?: string
    changelog?: string
  }>()

  const onCreateVersion = async (data: any) => {
    try {
      await createVersionMutation.mutateAsync({
        form_id: formId,
        ...data,
      })
      setIsCreateVersionDialogOpen(false)
      reset()
    } catch (error) {
      // Error handled by mutation
    }
  }

  const onPublishVersion = async (version: FormVersion) => {
    try {
      await publishMutation.mutateAsync({})
    } catch (error) {
      // Error handled by mutation
    }
  }

  const onRestoreVersion = async () => {
    try {
      await restoreMutation.mutateAsync({
        create_new_version: createNewOnRestore,
        changelog: `Restored from version ${selectedVersion?.version}`,
      })
      setIsRestoreDialogOpen(false)
      setSelectedVersion(null)
    } catch (error) {
      // Error handled by mutation
    }
  }

  const onDeleteVersion = async () => {
    if (!selectedVersion) return
    try {
      await deleteMutation.mutateAsync(selectedVersion.version)
      setIsDeleteDialogOpen(false)
      setSelectedVersion(null)
    } catch (error) {
      // Error handled by mutation
    }
  }

  const onDuplicateVersion = async (version: FormVersion) => {
    try {
      await duplicateMutation.mutateAsync({
        title: `${version.title} (Copy)`,
      })
    } catch (error) {
      // Error handled by mutation
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      case "draft":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
      case "archived":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
      case "decommissioned":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
    }
  }

  return (
    <LayoutWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <History className="h-8 w-8" />
              Version History
            </h1>
            <p className="text-muted-foreground mt-1">View, compare, and restore form versions</p>
          </div>
          <Dialog open={isCreateVersionDialogOpen} onOpenChange={setIsCreateVersionDialogOpen}>
            <Button onClick={() => setIsCreateVersionDialogOpen(true)}>
              <GitBranch className="mr-2 h-4 w-4" />
              Create Version
            </Button>
            <DialogContent>
              <form onSubmit={handleSubmit(onCreateVersion)}>
                <DialogHeader>
                  <DialogTitle>Create New Version</DialogTitle>
                  <DialogDescription>Save the current state as a new version</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Version Title</Label>
                    <input
                      id="title"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="e.g., Major Update"
                      {...register("title")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe what changed..."
                      rows={3}
                      {...register("description")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="changelog">Changelog</Label>
                    <Textarea
                      id="changelog"
                      placeholder="List of changes..."
                      rows={4}
                      {...register("changelog")}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateVersionDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createVersionMutation.isPending}>
                    {createVersionMutation.isPending ? "Creating..." : "Create Version"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Versions</CardTitle>
                <History className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_versions}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Published</CardTitle>
                <Check className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.published_versions}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Drafts</CardTitle>
                <FileText className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.draft_versions}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Latest Version</CardTitle>
                <GitBranch className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">v{stats.latest_version}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Current Version */}
        {currentVersion && (
          <Card className="border-primary/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-600" />
                    Current Version: v{currentVersion.version}
                  </CardTitle>
                  <CardDescription>{currentVersion.title}</CardDescription>
                </div>
                <Badge className={getStatusColor(currentVersion.status)}>
                  {currentVersion.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {currentVersion.description && (
                  <p className="text-muted-foreground">{currentVersion.description}</p>
                )}
                <div className="flex items-center gap-4 text-muted-foreground">
                  <span>Created by {currentVersion.created_by_username}</span>
                  <Separator orientation="vertical" className="h-4" />
                  <span>{format(new Date(currentVersion.created_at), "PPp")}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Versions List */}
        <Card>
          <CardHeader>
            <CardTitle>All Versions</CardTitle>
            <CardDescription>Complete version history with actions</CardDescription>
          </CardHeader>
          <CardContent>
            {versionsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : versions && versions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Version</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {versions.map((version) => (
                    <TableRow key={version.id}>
                      <TableCell className="font-mono font-bold">
                        v{version.version}
                        {version.is_current && (
                          <Badge variant="outline" className="ml-2">
                            Current
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{version.title}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(version.status)}>{version.status}</Badge>
                      </TableCell>
                      <TableCell>{version.created_by_username}</TableCell>
                      <TableCell>{format(new Date(version.created_at), "PP")}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              router.push(`/forms/${formId}/versions/${version.version}/preview`)
                            }
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {!version.is_current && version.status === "draft" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onPublishVersion(version)}
                              disabled={publishMutation.isPending}
                            >
                              <Upload className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                          {!version.is_current && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedVersion(version)
                                setIsRestoreDialogOpen(true)
                              }}
                            >
                              <RotateCcw className="h-4 w-4 text-blue-600" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDuplicateVersion(version)}
                            disabled={duplicateMutation.isPending}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          {version.status === "draft" && !version.is_current && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedVersion(version)
                                setIsDeleteDialogOpen(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <History className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold">No versions found</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Create your first version to start tracking changes
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Restore Dialog */}
        <AlertDialog open={isRestoreDialogOpen} onOpenChange={setIsRestoreDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Restore Version</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to restore to version {selectedVersion?.version}?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={createNewOnRestore}
                  onChange={(e) => setCreateNewOnRestore(e.target.checked)}
                  className="h-4 w-4"
                />
                <span className="text-sm">
                  Create new version (recommended - preserves current version)
                </span>
              </label>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onRestoreVersion} disabled={restoreMutation.isPending}>
                {restoreMutation.isPending ? "Restoring..." : "Restore"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Version</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete version {selectedVersion?.version}? This action
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={onDeleteVersion}
                disabled={deleteMutation.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </LayoutWrapper>
  )
}
