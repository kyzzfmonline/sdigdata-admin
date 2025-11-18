/**
 * Templates Management Page
 * Lists and manages form templates
 */

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import LayoutWrapper from "@/components/LayoutWrapper"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import {
  BookTemplate,
  Search,
  MoreVertical,
  Plus,
  Eye,
  Edit,
  Trash2,
  Loader,
  TrendingUp,
  Calendar,
} from "lucide-react"
import { useTemplates, useDeleteTemplate, useCreateFromTemplate } from "@/hooks/use-templates"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { useStore } from "@/lib/store"
import { toast } from "@/hooks/use-toast"

// Template categories
const TEMPLATE_CATEGORIES = [
  { value: "all", label: "All Categories" },
  { value: "survey", label: "Survey" },
  { value: "registration", label: "Registration" },
  { value: "feedback", label: "Feedback" },
  { value: "inspection", label: "Inspection" },
  { value: "assessment", label: "Assessment" },
  { value: "data_collection", label: "Data Collection" },
  { value: "application", label: "Application" },
  { value: "report", label: "Report" },
  { value: "other", label: "Other" },
]

export default function TemplatesPage() {
  const router = useRouter()
  const currentUser = useStore((state) => state.user)

  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("all")
  const [page, setPage] = useState(1)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null)

  const { data, isLoading, error } = useTemplates({
    category: category === "all" ? undefined : category,
    search: search || undefined,
    page,
    limit: 12,
  })

  const deleteTemplate = useDeleteTemplate()
  const createFromTemplate = useCreateFromTemplate()

  const handleDelete = async () => {
    if (!templateToDelete) return

    await deleteTemplate.mutateAsync(templateToDelete)
    setDeleteDialogOpen(false)
    setTemplateToDelete(null)
  }

  const handleCreateFromTemplate = async (templateId: string, templateName: string) => {
    try {
      const result = await createFromTemplate.mutateAsync({
        templateId,
        title: \`\${templateName} - \${new Date().toLocaleDateString()}\`,
        organizationId: currentUser?.organization_id,
      })

      // Navigate to the new form
      if (result?.form_id) {
        router.push(\`/forms/\${result.form_id}\`)
      }
    } catch (error) {
      // Error handled by mutation hook
    }
  }

  if (error) {
    return (
      <LayoutWrapper>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <Card className="max-w-md w-full">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
                    <BookTemplate className="w-8 h-8 text-destructive" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Failed to Load Templates</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {error?.response?.data?.detail || "An error occurred"}
                    </p>
                  </div>
                  <Button onClick={() => window.location.reload()} variant="outline">
                    Try Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </LayoutWrapper>
    )
  }

  const templates = data?.templates || []
  const pagination = data?.pagination || { page: 1, total: 0, total_pages: 1 }

  return (
    <LayoutWrapper>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <BookTemplate className="w-8 h-8" />
              Form Templates
            </h1>
            <p className="text-muted-foreground mt-1">
              Browse and manage reusable form templates
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search templates..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEMPLATE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Templates Grid */}
        {isLoading ? (
          <TableSkeleton />
        ) : templates.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                  <BookTemplate className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">No Templates Found</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {search || category !== "all"
                      ? "Try adjusting your filters"
                      : "Save forms as templates to see them here"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template: any) => (
                <Card key={template.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">{template.name}</CardTitle>
                        <CardDescription className="line-clamp-2 mt-1">
                          {template.description || "No description"}
                        </CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="ml-2">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              handleCreateFromTemplate(template.id, template.name)
                            }
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Create Form
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => router.push(\`/templates/\${template.id}\`)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setTemplateToDelete(template.id)
                              setDeleteDialogOpen(true)
                            }}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-3">
                      {/* Category Badge */}
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {template.category
                            .split("_")
                            .map(
                              (word: string) =>
                                word.charAt(0).toUpperCase() + word.slice(1)
                            )
                            .join(" ")}
                        </Badge>
                        {template.is_public && (
                          <Badge variant="outline">Public</Badge>
                        )}
                      </div>

                      {/* Tags */}
                      {template.tags && template.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {template.tags.slice(0, 3).map((tag: string) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {template.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{template.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          <span>{template.usage_count || 0} uses</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {new Date(template.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Create Button */}
                      <Button
                        className="w-full mt-2"
                        size="sm"
                        onClick={() =>
                          handleCreateFromTemplate(template.id, template.name)
                        }
                        disabled={createFromTemplate.isPending}
                      >
                        {createFromTemplate.isPending ? (
                          <>
                            <Loader className="w-4 h-4 mr-2 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4 mr-2" />
                            Create Form from Template
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {pagination.total_pages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {pagination.page} of {pagination.total_pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= pagination.total_pages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this template. Forms created from this template
              will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteTemplate.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteTemplate.isPending ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Template"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </LayoutWrapper>
  )
}
