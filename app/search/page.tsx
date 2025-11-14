"use client"

/**
 * Advanced Search Page
 * Global search across all resources with filters and saved searches
 */

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { LayoutWrapper } from "@/components/layout-wrapper"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Separator } from "@/components/ui/separator"
import {
  useGlobalSearch,
  useSearchSuggestions,
  useSavedSearches,
  useSaveSearch,
  useDeleteSavedSearch,
  useRecentSearches,
  usePopularSearches,
} from "@/hooks/search/use-advanced-search"
import {
  Search,
  Filter,
  Save,
  Clock,
  TrendingUp,
  Star,
  Trash2,
  FileText,
  Users,
  Database,
  Settings,
  X,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useForm } from "react-hook-form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useDebounce } from "@/hooks/use-debounce"

const RESOURCE_TYPES = [
  { value: "all", label: "All Resources", icon: Database },
  { value: "forms", label: "Forms", icon: FileText },
  { value: "responses", label: "Responses", icon: Database },
  { value: "users", label: "Users", icon: Users },
  { value: "templates", label: "Templates", icon: FileText },
]

export default function AdvancedSearchPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedResource, setSelectedResource] = useState<string>("all")
  const [filters, setFilters] = useState<Record<string, any>>({})
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const debouncedQuery = useDebounce(searchQuery, 300)

  const { data: searchResults, isLoading: searchLoading } = useGlobalSearch({
    query: debouncedQuery,
    filters: {
      ...filters,
      resource_types: selectedResource !== "all" ? [selectedResource as any] : undefined,
    },
    limit: 50,
  })

  const { data: suggestions } = useSearchSuggestions(searchQuery)
  const { data: savedSearches } = useSavedSearches()
  const { data: recentSearches } = useRecentSearches()
  const { data: popularSearches } = usePopularSearches()
  const saveSearch = useSaveSearch()
  const deleteSavedSearch = useDeleteSavedSearch()

  const { register, handleSubmit, reset } = useForm<{
    name: string
    description?: string
  }>()

  const onSaveSearch = async (data: any) => {
    try {
      await saveSearch.mutateAsync({
        name: data.name,
        description: data.description,
        query: {
          query: searchQuery,
          filters: {
            ...filters,
            resource_types: selectedResource !== "all" ? [selectedResource as any] : undefined,
          },
        },
      })
      setIsSaveDialogOpen(false)
      reset()
    } catch (error) {
      // Error handled by mutation
    }
  }

  const handleLoadSavedSearch = (search: any) => {
    setSearchQuery(search.query)
    setSelectedResource(search.resource_types?.[0] || "all")
    setFilters(search.filters || {})
  }

  const handleDeleteSavedSearch = async (searchId: string) => {
    try {
      await deleteSavedSearch.mutateAsync(searchId)
    } catch (error) {
      // Error handled by mutation
    }
  }

  const getResourceIcon = (type: string) => {
    const resource = RESOURCE_TYPES.find((r) => r.value === type)
    return resource?.icon || Database
  }

  const groupedResults = searchResults?.results.reduce(
    (acc, result) => {
      if (!acc[result.resource_type]) {
        acc[result.resource_type] = []
      }
      acc[result.resource_type].push(result)
      return acc
    },
    {} as Record<string, any[]>
  )

  return (
    <LayoutWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Search className="h-8 w-8 text-primary" />
            Advanced Search
          </h1>
          <p className="text-muted-foreground mt-1">
            Search across all resources with powerful filters
          </p>
        </div>

        {/* Search Bar */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search forms, responses, users, and more..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                      onClick={() => setSearchQuery("")}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <Select value={selectedResource} onValueChange={setSelectedResource}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RESOURCE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
                {searchQuery && (
                  <Button onClick={() => setIsSaveDialogOpen(true)}>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                )}
              </div>

              {/* Suggestions */}
              {suggestions && suggestions.length > 0 && searchQuery && (
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm text-muted-foreground">Suggestions:</span>
                  {suggestions.map((suggestion, idx) => (
                    <Badge
                      key={idx}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                      onClick={() => setSearchQuery(suggestion.text)}
                    >
                      {suggestion.text}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Filters Panel */}
              {showFilters && (
                <Card className="border-dashed">
                  <CardHeader>
                    <CardTitle className="text-sm">Advanced Filters</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Date Range</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Any time" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="today">Today</SelectItem>
                            <SelectItem value="week">This Week</SelectItem>
                            <SelectItem value="month">This Month</SelectItem>
                            <SelectItem value="year">This Year</SelectItem>
                            <SelectItem value="custom">Custom Range</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Status</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Any status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="published">Published</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Sort By</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Relevance" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="relevance">Relevance</SelectItem>
                            <SelectItem value="date_desc">Newest First</SelectItem>
                            <SelectItem value="date_asc">Oldest First</SelectItem>
                            <SelectItem value="name">Name</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => setFilters({})}>
                        Clear Filters
                      </Button>
                      <Button size="sm" onClick={() => setShowFilters(false)}>
                        Apply Filters
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {debouncedQuery ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Search Results</CardTitle>
                  {searchResults && (
                    <CardDescription>
                      Found {searchResults.total} results in {searchResults.took_ms}ms
                    </CardDescription>
                  )}
                </div>
                {searchResults?.facets && (
                  <div className="flex gap-2">
                    {Object.entries(searchResults.facets).map(([key, value]) => (
                      <Badge key={key} variant="outline">
                        {key}: {value as number}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {searchLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : groupedResults && Object.keys(groupedResults).length > 0 ? (
                <div className="space-y-6">
                  {Object.entries(groupedResults).map(([resourceType, results]) => {
                    const Icon = getResourceIcon(resourceType)
                    return (
                      <div key={resourceType}>
                        <div className="flex items-center gap-2 mb-3">
                          <Icon className="h-5 w-5 text-primary" />
                          <h3 className="font-semibold capitalize">{resourceType}</h3>
                          <Badge variant="outline">{results.length}</Badge>
                        </div>
                        <div className="space-y-2">
                          {results.map((result: any) => (
                            <Card
                              key={result.id}
                              className="hover:shadow-md transition-shadow cursor-pointer"
                              onClick={() => {
                                if (result.url) {
                                  router.push(result.url)
                                }
                              }}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h4 className="font-medium mb-1">{result.title}</h4>
                                    {result.description && (
                                      <p className="text-sm text-muted-foreground line-clamp-2">
                                        {result.description}
                                      </p>
                                    )}
                                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                      {result.metadata?.created_at && (
                                        <span>
                                          Created:{" "}
                                          {new Date(
                                            result.metadata.created_at
                                          ).toLocaleDateString()}
                                        </span>
                                      )}
                                      {result.metadata?.author && (
                                        <span>By: {result.metadata.author}</span>
                                      )}
                                      {result.score && (
                                        <Badge variant="secondary" className="text-xs">
                                          Score: {result.score.toFixed(2)}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Search className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-semibold">No results found</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Try adjusting your search query or filters
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="saved" className="space-y-4">
            <TabsList>
              <TabsTrigger value="saved">
                <Star className="h-4 w-4 mr-1" />
                Saved Searches
              </TabsTrigger>
              <TabsTrigger value="recent">
                <Clock className="h-4 w-4 mr-1" />
                Recent
              </TabsTrigger>
              <TabsTrigger value="popular">
                <TrendingUp className="h-4 w-4 mr-1" />
                Popular
              </TabsTrigger>
            </TabsList>

            {/* Saved Searches */}
            <TabsContent value="saved">
              <Card>
                <CardHeader>
                  <CardTitle>Saved Searches</CardTitle>
                  <CardDescription>Your saved search queries for quick access</CardDescription>
                </CardHeader>
                <CardContent>
                  {savedSearches && savedSearches.length > 0 ? (
                    <div className="space-y-2">
                      {savedSearches.map((search) => (
                        <Card key={search.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div
                                className="flex-1 cursor-pointer"
                                onClick={() => handleLoadSavedSearch(search)}
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-medium">{search.name}</h4>
                                  {search.alert_enabled && (
                                    <Badge variant="outline" className="text-xs">
                                      Alerts On
                                    </Badge>
                                  )}
                                </div>
                                {search.description && (
                                  <p className="text-sm text-muted-foreground mb-2">
                                    {search.description}
                                  </p>
                                )}
                                <div className="text-sm font-mono bg-muted px-2 py-1 rounded">
                                  {search.query.query}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteSavedSearch(search.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Star className="mx-auto h-12 w-12 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground mt-2">No saved searches yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Recent Searches */}
            <TabsContent value="recent">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Searches</CardTitle>
                  <CardDescription>Your recent search history</CardDescription>
                </CardHeader>
                <CardContent>
                  {recentSearches && recentSearches.length > 0 ? (
                    <div className="space-y-2">
                      {recentSearches.map((search, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 p-3 hover:bg-muted rounded-lg cursor-pointer"
                          onClick={() => setSearchQuery(search.query)}
                        >
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono text-sm">{search.query}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Clock className="mx-auto h-12 w-12 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground mt-2">No recent searches</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Popular Searches */}
            <TabsContent value="popular">
              <Card>
                <CardHeader>
                  <CardTitle>Popular Searches</CardTitle>
                  <CardDescription>Most searched queries across the platform</CardDescription>
                </CardHeader>
                <CardContent>
                  {popularSearches && popularSearches.length > 0 ? (
                    <div className="space-y-2">
                      {popularSearches.map((search, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 p-3 hover:bg-muted rounded-lg cursor-pointer"
                          onClick={() => setSearchQuery(search.query)}
                        >
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          <span className="font-mono text-sm flex-1">{search.query}</span>
                          <Badge variant="outline">{search.count} searches</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground mt-2">No popular searches yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {/* Save Search Dialog */}
        <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
          <DialogContent>
            <form onSubmit={handleSubmit(onSaveSearch)}>
              <DialogHeader>
                <DialogTitle>Save Search</DialogTitle>
                <DialogDescription>Save this search for quick access later</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Search Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Recent Form Submissions"
                    {...register("name", { required: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    placeholder="Optional description"
                    {...register("description")}
                  />
                </div>
                <div className="bg-muted p-3 rounded-lg">
                  <Label className="text-xs text-muted-foreground">Search Query</Label>
                  <p className="font-mono text-sm mt-1">{searchQuery}</p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsSaveDialogOpen(false)
                    reset()
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saveSearch.isPending}>
                  {saveSearch.isPending ? "Saving..." : "Save Search"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </LayoutWrapper>
  )
}
