"use client"

/**
 * Form Templates Gallery Page
 * Browse, search, and create forms from templates
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import { LayoutWrapper } from "@/components/layout-wrapper"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
import { Textarea } from "@/components/ui/textarea"
import {
  useFormTemplates,
  useTemplateCategories,
  useFormTemplate,
  useCreateFormFromTemplate,
  type FormTemplate,
} from "@/hooks/forms/use-form-templates"
import {
  Search as SearchIcon,
  FileText,
  Star,
  Copy,
  TrendingUp,
  Filter,
  Sparkles,
  Eye,
  Plus,
  Loader2,
  Grid3x3,
  LayoutGrid,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useForm } from "react-hook-form"
import { formatDistanceToNow } from "date-fns"

export default function TemplatesPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>()
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false)

  const { data: templates, isLoading: templatesLoading } = useFormTemplates({
    search: searchQuery || undefined,
    category: selectedCategory,
  })
  const { data: categories } = useTemplateCategories()
  const { data: previewTemplate } = useFormTemplate(selectedTemplate?.id)

  const createFromTemplate = useCreateFormFromTemplate()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<{
    title: string
    description?: string
  }>()

  const onCreateFromTemplate = async (data: any) => {
    if (!selectedTemplate) return
    try {
      const result = await createFromTemplate.mutateAsync({
        template_id: selectedTemplate.id,
        title: data.title,
        description: data.description,
      })
      setIsCreateDialogOpen(false)
      reset()
      router.push(`/forms/${result.form_id}/edit`)
    } catch (error) {
      // Error handled by mutation
    }
  }

  const openCreateDialog = (template: FormTemplate) => {
    setSelectedTemplate(template)
    setIsCreateDialogOpen(true)
  }

  const openPreviewDialog = (template: FormTemplate) => {
    setSelectedTemplate(template)
    setIsPreviewDialogOpen(true)
  }

  const featuredTemplates = templates?.filter((t) => t.is_featured) || []
  const popularTemplates =
    templates?.sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0)).slice(0, 6) || []

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      survey: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      registration: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      feedback: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
      inspection: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      health: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      custom: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
    }
    return colors[category] || colors.custom
  }

  return (
    <LayoutWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-primary" />
              Form Templates
            </h1>
            <p className="text-muted-foreground mt-1">
              Start with a template to create forms faster
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories?.map((category: any) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name} ({category.template_count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Templates</TabsTrigger>
            <TabsTrigger value="featured">
              <Star className="h-4 w-4 mr-1" />
              Featured
            </TabsTrigger>
            <TabsTrigger value="popular">
              <TrendingUp className="h-4 w-4 mr-1" />
              Popular
            </TabsTrigger>
          </TabsList>

          {/* All Templates */}
          <TabsContent value="all" className="space-y-4">
            {templatesLoading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-full mt-2" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-32 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : templates && templates.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {templates.map((template) => (
                  <Card key={template.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <FileText className="h-5 w-5 text-primary" />
                            {template.name}
                          </CardTitle>
                          <CardDescription className="mt-1">{template.description}</CardDescription>
                        </div>
                        {template.is_featured && (
                          <Badge variant="default" className="ml-2">
                            <Star className="h-3 w-3 mr-1" />
                            Featured
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary">{(template as any).category_name || template.category}</Badge>
                          {template.tags?.map((tag) => (
                            <Badge key={tag} variant="outline">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Copy className="h-4 w-4" />
                            <span>{template.usage_count || 0} uses</span>
                          </div>
                          {(template as any).average_rating !== undefined && (
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span>{(template as any).average_rating.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => openPreviewDialog(template)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Preview
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => openCreateDialog(template)}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Use Template
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold">No templates found</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Try adjusting your search or filters
                </p>
              </div>
            )}
          </TabsContent>

          {/* Featured Templates */}
          <TabsContent value="featured" className="space-y-4">
            {featuredTemplates.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {featuredTemplates.map((template) => (
                  <Card
                    key={template.id}
                    className="hover:shadow-lg transition-shadow border-primary/50"
                  >
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                        {template.name}
                      </CardTitle>
                      <CardDescription>{template.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary">{(template as any).category_name || template.category}</Badge>
                          {template.tags?.map((tag) => (
                            <Badge key={tag} variant="outline">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Copy className="h-4 w-4" />
                            <span>{template.usage_count || 0} uses</span>
                          </div>
                          {(template as any).average_rating !== undefined && (
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span>{(template as any).average_rating.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => openPreviewDialog(template)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Preview
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => openCreateDialog(template)}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Use Template
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Star className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold">No featured templates</h3>
              </div>
            )}
          </TabsContent>

          {/* Popular Templates */}
          <TabsContent value="popular" className="space-y-4">
            {popularTemplates.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {popularTemplates.map((template) => (
                  <Card key={template.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                        {template.name}
                      </CardTitle>
                      <CardDescription>{template.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary">{(template as any).category_name || template.category}</Badge>
                          {template.tags?.map((tag) => (
                            <Badge key={tag} variant="outline">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Copy className="h-4 w-4" />
                            <span>{template.usage_count || 0} uses</span>
                          </div>
                          {(template as any).average_rating !== undefined && (
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span>{(template as any).average_rating.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => openPreviewDialog(template)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Preview
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => openCreateDialog(template)}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Use Template
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold">No popular templates yet</h3>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Create from Template Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent>
            <form onSubmit={handleSubmit(onCreateFromTemplate)}>
              <DialogHeader>
                <DialogTitle>Create Form from Template</DialogTitle>
                <DialogDescription>
                  Create a new form based on: {selectedTemplate?.name}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Form Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Customer Feedback Survey"
                    {...register("title", { required: "Title is required" })}
                  />
                  {errors.title && (
                    <p className="text-sm text-destructive">{errors.title.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what this form is for..."
                    rows={3}
                    {...register("description")}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false)
                    reset()
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createFromTemplate.isPending}>
                  {createFromTemplate.isPending ? "Creating..." : "Create Form"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Preview Dialog */}
        <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedTemplate?.name}</DialogTitle>
              <DialogDescription>{selectedTemplate?.description}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {previewTemplate && (
                <>
                  <div>
                    <h4 className="font-medium mb-2">Template Details</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Category:</span>
                        <Badge variant="secondary" className="ml-2">
                          {(previewTemplate as any).category_name}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Fields:</span>
                        <span className="ml-2 font-medium">{(previewTemplate as any).field_count}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Times Used:</span>
                        <span className="ml-2 font-medium">{previewTemplate.usage_count || 0}</span>
                      </div>
                      {(previewTemplate as any).average_rating !== undefined && (
                        <div>
                          <span className="text-muted-foreground">Rating:</span>
                          <span className="ml-2 font-medium flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            {(previewTemplate as any).average_rating.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  {previewTemplate.tags && previewTemplate.tags.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {previewTemplate.tags.map((tag) => (
                          <Badge key={tag} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {(previewTemplate as any).preview_fields && (previewTemplate as any).preview_fields.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Form Fields Preview</h4>
                      <div className="space-y-2 bg-muted/50 p-4 rounded-lg">
                        {(previewTemplate as any).preview_fields.map((field: any, index: number) => (
                          <div key={index} className="flex items-center gap-2">
                            <span className="text-muted-foreground text-sm">{index + 1}.</span>
                            <span className="font-medium">{field.label}</span>
                            <Badge variant="outline" className="text-xs">
                              {field.type}
                            </Badge>
                            {field.required && (
                              <Badge variant="destructive" className="text-xs">
                                Required
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPreviewDialogOpen(false)}>
                Close
              </Button>
              <Button
                onClick={() => {
                  setIsPreviewDialogOpen(false)
                  if (selectedTemplate) {
                    openCreateDialog(selectedTemplate)
                  }
                }}
              >
                <Copy className="h-4 w-4 mr-2" />
                Use This Template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </LayoutWrapper>
  )
}
