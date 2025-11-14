"use client"

/**
 * ML/AI Data Exports Page
 * Export training data, view quality metrics, and manage ML datasets
 */

import { useState } from "react"
import { LayoutWrapper } from "@/components/layout-wrapper"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
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
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  useMLQualityStats,
  useExportTrainingData,
  useTrainingDataExports,
  useMLDatasets,
  useCreateMLDataset,
  useDeleteMLDataset,
  useDownloadExport,
  type TrainingDataExportRequest,
  type CreateMLDatasetRequest,
} from "@/hooks/ml/use-ml-exports"
import {
  Database,
  Download,
  FileText,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Trash2,
  Plus,
  Sparkles,
  BarChart3,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { format } from "date-fns"
import { useForm } from "react-hook-form"

export default function MLExportsPage() {
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [isDatasetDialogOpen, setIsDatasetDialogOpen] = useState(false)

  const { data: qualityStats } = useMLQualityStats()
  const { data: exports, isLoading: exportsLoading } = useTrainingDataExports()
  const { data: datasets, isLoading: datasetsLoading } = useMLDatasets()

  const exportTrainingData = useExportTrainingData()
  const createDataset = useCreateMLDataset()
  const deleteDataset = useDeleteMLDataset()
  const downloadExport = useDownloadExport()

  const {
    register: registerExport,
    handleSubmit: handleSubmitExport,
    reset: resetExport,
  } = useForm<{
    format: string
    min_quality_score?: number
    exclude_duplicates: boolean
    exclude_outliers: boolean
  }>()

  const {
    register: registerDataset,
    handleSubmit: handleSubmitDataset,
    reset: resetDataset,
  } = useForm<{
    name: string
    description?: string
    target_variable?: string
  }>()

  const onExportData = async (data: any) => {
    const exportRequest: TrainingDataExportRequest = {
      format: data.format,
      filters: {
        min_quality_score: data.min_quality_score ? Number(data.min_quality_score) : undefined,
        exclude_duplicates: data.exclude_duplicates,
        exclude_outliers: data.exclude_outliers,
      },
      options: {
        include_metadata: true,
        normalize: true,
      },
    }

    try {
      await exportTrainingData.mutateAsync(exportRequest)
      setIsExportDialogOpen(false)
      resetExport()
    } catch (error) {
      // Error handled by mutation
    }
  }

  const onCreateDataset = async (data: any) => {
    const datasetRequest: CreateMLDatasetRequest = {
      name: data.name,
      description: data.description,
      target_variable: data.target_variable,
      preprocessing: {
        handle_missing: "mean",
        encoding: "onehot",
        scaling: "standard",
      },
    }

    try {
      await createDataset.mutateAsync(datasetRequest)
      setIsDatasetDialogOpen(false)
      resetDataset()
    } catch (error) {
      // Error handled by mutation
    }
  }

  const handleDownload = async (exportId: string) => {
    await downloadExport.mutateAsync({ export_id: exportId, export_type: "training" })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      case "processing":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
      case "failed":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
    }
  }

  const getQualityScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <LayoutWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Database className="h-8 w-8 text-primary" />
              ML/AI Data Exports
            </h1>
            <p className="text-muted-foreground mt-1">
              Export training data and manage ML datasets
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setIsDatasetDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Dataset
            </Button>
            <Button onClick={() => setIsExportDialogOpen(true)}>
              <Download className="mr-2 h-4 w-4" />
              Export Data
            </Button>
          </div>
        </div>

        {/* Quality Stats */}
        {qualityStats && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Samples</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{qualityStats.total_samples}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {qualityStats.complete_samples} complete
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Quality Score</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold ${getQualityScoreColor(qualityStats.quality_score)}`}
                >
                  {qualityStats.quality_score}
                </div>
                <Progress value={qualityStats.quality_score} className="mt-2 h-2" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completeness</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(qualityStats.completeness_ratio * 100).toFixed(1)}%
                </div>
                <Progress value={qualityStats.completeness_ratio * 100} className="mt-2 h-2" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Data Issues</CardTitle>
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {qualityStats.duplicate_samples + qualityStats.outlier_samples}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {qualityStats.duplicate_samples} duplicates, {qualityStats.outlier_samples}{" "}
                  outliers
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quality Recommendations */}
        {qualityStats && qualityStats.recommendations.length > 0 && (
          <Card className="border-yellow-500/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-600" />
                Data Quality Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {qualityStats.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-yellow-600 mt-1">•</span>
                    <span className="text-sm">{rec}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="exports" className="space-y-4">
          <TabsList>
            <TabsTrigger value="exports">
              <Download className="h-4 w-4 mr-1" />
              Exports
            </TabsTrigger>
            <TabsTrigger value="datasets">
              <Database className="h-4 w-4 mr-1" />
              Datasets
            </TabsTrigger>
            <TabsTrigger value="quality">
              <BarChart3 className="h-4 w-4 mr-1" />
              Quality Analysis
            </TabsTrigger>
          </TabsList>

          {/* Exports Tab */}
          <TabsContent value="exports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Training Data Exports</CardTitle>
                <CardDescription>View and download your exported training datasets</CardDescription>
              </CardHeader>
              <CardContent>
                {exportsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-24 w-full" />
                    ))}
                  </div>
                ) : exports && exports.length > 0 ? (
                  <div className="space-y-3">
                    {exports.map((exp) => (
                      <Card key={exp.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <FileText className="h-5 w-5 text-primary" />
                                <div>
                                  <p className="font-medium">{exp.format.toUpperCase()} Export</p>
                                  <p className="text-sm text-muted-foreground">
                                    {exp.total_samples} samples •{" "}
                                    {(exp.file_size_bytes / 1024 / 1024).toFixed(2)} MB
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span>Created {format(new Date(exp.created_at), "PPp")}</span>
                                {exp.expires_at && (
                                  <span>Expires {format(new Date(exp.expires_at), "PPp")}</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge className={getStatusColor(exp.status)}>
                                {exp.status === "processing" && <Clock className="h-3 w-3 mr-1" />}
                                {exp.status === "completed" && (
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                )}
                                {exp.status === "failed" && (
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                )}
                                {exp.status}
                              </Badge>
                              {exp.status === "completed" && exp.download_url && (
                                <Button
                                  size="sm"
                                  onClick={() => handleDownload(exp.id)}
                                  disabled={downloadExport.isPending}
                                >
                                  <Download className="h-4 w-4 mr-1" />
                                  Download
                                </Button>
                              )}
                            </div>
                          </div>
                          {exp.error_message && (
                            <p className="text-sm text-destructive mt-2">
                              Error: {exp.error_message}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Download className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <h3 className="mt-4 text-lg font-semibold">No exports yet</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      Create your first data export to get started
                    </p>
                    <Button className="mt-4" onClick={() => setIsExportDialogOpen(true)}>
                      <Download className="mr-2 h-4 w-4" />
                      Export Data
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Datasets Tab */}
          <TabsContent value="datasets" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>ML Datasets</CardTitle>
                <CardDescription>Manage your machine learning datasets</CardDescription>
              </CardHeader>
              <CardContent>
                {datasetsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-24 w-full" />
                    ))}
                  </div>
                ) : datasets && datasets.length > 0 ? (
                  <div className="space-y-3">
                    {datasets.map((dataset) => (
                      <Card key={dataset.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <Database className="h-5 w-5 text-primary" />
                                <div>
                                  <p className="font-medium">{dataset.name}</p>
                                  {dataset.description && (
                                    <p className="text-sm text-muted-foreground">
                                      {dataset.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span>{dataset.sample_count} samples</span>
                                <span>{dataset.feature_count} features</span>
                                {dataset.target_variable && (
                                  <span>Target: {dataset.target_variable}</span>
                                )}
                              </div>
                              <div className="mt-2">
                                <span className="text-sm text-muted-foreground">
                                  Quality Score:{" "}
                                </span>
                                <span
                                  className={`text-sm font-medium ${getQualityScoreColor(dataset.quality_score)}`}
                                >
                                  {dataset.quality_score}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {dataset.download_url && (
                                <Button size="sm" variant="outline">
                                  <Download className="h-4 w-4 mr-1" />
                                  Download
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteDataset.mutate(dataset.id)}
                                disabled={deleteDataset.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Database className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <h3 className="mt-4 text-lg font-semibold">No datasets yet</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      Create your first ML dataset
                    </p>
                    <Button className="mt-4" onClick={() => setIsDatasetDialogOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Dataset
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quality Analysis Tab */}
          <TabsContent value="quality" className="space-y-4">
            {qualityStats && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Field Quality Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {qualityStats.field_quality_breakdown.map((field) => (
                        <div key={field.field_id}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{field.field_name}</span>
                            <span className="text-sm text-muted-foreground">
                              Missing: {(field.missing_rate * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Uniqueness:</span>
                              <Progress value={field.uniqueness * 100} className="mt-1 h-2" />
                            </div>
                            <div>
                              <span className="text-muted-foreground">Consistency:</span>
                              <Progress
                                value={field.data_type_consistency * 100}
                                className="mt-1 h-2"
                              />
                            </div>
                            <div>
                              <span className="text-muted-foreground">Missing:</span>
                              <Progress value={field.missing_rate * 100} className="mt-1 h-2" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Overall Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-muted-foreground">Consistency Score</span>
                        <div className="flex items-center gap-2 mt-1">
                          <Progress value={qualityStats.consistency_score * 100} className="h-2" />
                          <span className="text-sm font-medium">
                            {(qualityStats.consistency_score * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Completeness Ratio</span>
                        <div className="flex items-center gap-2 mt-1">
                          <Progress value={qualityStats.completeness_ratio * 100} className="h-2" />
                          <span className="text-sm font-medium">
                            {(qualityStats.completeness_ratio * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>

        {/* Export Data Dialog */}
        <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
          <DialogContent>
            <form onSubmit={handleSubmitExport(onExportData)}>
              <DialogHeader>
                <DialogTitle>Export Training Data</DialogTitle>
                <DialogDescription>Configure your training data export</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="format">Export Format *</Label>
                  <Select defaultValue="csv" {...registerExport("format")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                      <SelectItem value="parquet">Parquet</SelectItem>
                      <SelectItem value="tfrecord">TFRecord</SelectItem>
                      <SelectItem value="jsonl">JSONL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="min_quality_score">Minimum Quality Score</Label>
                  <Input
                    id="min_quality_score"
                    type="number"
                    min="0"
                    max="100"
                    placeholder="e.g., 70"
                    {...registerExport("min_quality_score")}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="exclude_duplicates">Exclude Duplicates</Label>
                  <input
                    id="exclude_duplicates"
                    type="checkbox"
                    className="h-4 w-4"
                    {...registerExport("exclude_duplicates")}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="exclude_outliers">Exclude Outliers</Label>
                  <input
                    id="exclude_outliers"
                    type="checkbox"
                    className="h-4 w-4"
                    {...registerExport("exclude_outliers")}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsExportDialogOpen(false)
                    resetExport()
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={exportTrainingData.isPending}>
                  {exportTrainingData.isPending ? "Exporting..." : "Export"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Create Dataset Dialog */}
        <Dialog open={isDatasetDialogOpen} onOpenChange={setIsDatasetDialogOpen}>
          <DialogContent>
            <form onSubmit={handleSubmitDataset(onCreateDataset)}>
              <DialogHeader>
                <DialogTitle>Create ML Dataset</DialogTitle>
                <DialogDescription>Create a new machine learning dataset</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Dataset Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Customer Churn Prediction"
                    {...registerDataset("name", { required: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the dataset..."
                    rows={3}
                    {...registerDataset("description")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="target_variable">Target Variable</Label>
                  <Input
                    id="target_variable"
                    placeholder="e.g., churn_status"
                    {...registerDataset("target_variable")}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDatasetDialogOpen(false)
                    resetDataset()
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createDataset.isPending}>
                  {createDataset.isPending ? "Creating..." : "Create Dataset"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </LayoutWrapper>
  )
}
