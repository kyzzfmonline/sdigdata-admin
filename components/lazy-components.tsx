"use client"

import dynamic from "next/dynamic"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

// Loading skeletons for lazy-loaded components
export const FormBuilderSkeleton = () => (
  <Card className="w-full">
    <CardHeader>
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96 mt-2" />
    </CardHeader>
    <CardContent className="space-y-4">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-64 w-full" />
    </CardContent>
  </Card>
)

export const ChartSkeleton = () => (
  <Card className="w-full">
    <CardHeader>
      <Skeleton className="h-6 w-48" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-64 w-full" />
    </CardContent>
  </Card>
)

export const FormRendererSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-12 w-full" />
    <Skeleton className="h-12 w-full" />
    <Skeleton className="h-12 w-full" />
    <Skeleton className="h-24 w-full" />
    <Skeleton className="h-10 w-32" />
  </div>
)

// Lazy-loaded components with loading states

// Form Builder - Large component, only load when needed
export const LazyFormBuilder = dynamic(
  () => import("@/components/form-builder").then((mod) => ({ default: mod.FormBuilder })),
  {
    loading: () => <FormBuilderSkeleton />,
    ssr: false, // Form builder has client-side only features
  }
)

// Form Renderer - Used in form submission pages
export const LazyFormRenderer = dynamic(
  () => import("@/components/form-renderer").then((mod) => ({ default: mod.FormRenderer })),
  {
    loading: () => <FormRendererSkeleton />,
    ssr: false,
  }
)

// Chart components from recharts - Heavy library
export const LazyLineChart = dynamic(
  () => import("recharts").then((mod) => ({ default: mod.LineChart })),
  {
    loading: () => <Skeleton className="h-64 w-full" />,
    ssr: false,
  }
)

export const LazyBarChart = dynamic(
  () => import("recharts").then((mod) => ({ default: mod.BarChart })),
  {
    loading: () => <Skeleton className="h-64 w-full" />,
    ssr: false,
  }
)

export const LazyAreaChart = dynamic(
  () => import("recharts").then((mod) => ({ default: mod.AreaChart })),
  {
    loading: () => <Skeleton className="h-64 w-full" />,
    ssr: false,
  }
)

export const LazyPieChart = dynamic(
  () => import("recharts").then((mod) => ({ default: mod.PieChart })),
  {
    loading: () => <Skeleton className="h-64 w-full" />,
    ssr: false,
  }
)

// Export other recharts components
export const LazyLine = dynamic((() =>
  import("recharts").then((mod) => ({ default: mod.Line }))) as any)
export const LazyBar = dynamic((() =>
  import("recharts").then((mod) => ({ default: mod.Bar }))) as any)
export const LazyArea = dynamic((() =>
  import("recharts").then((mod) => ({ default: mod.Area }))) as any)
export const LazyPie = dynamic((() =>
  import("recharts").then((mod) => ({ default: mod.Pie }))) as any)
export const LazyCell = dynamic((() =>
  import("recharts").then((mod) => ({ default: mod.Cell }))) as any)
export const LazyXAxis = dynamic((() =>
  import("recharts").then((mod) => ({ default: mod.XAxis }))) as any)
export const LazyYAxis = dynamic((() =>
  import("recharts").then((mod) => ({ default: mod.YAxis }))) as any)
export const LazyCartesianGrid = dynamic((() =>
  import("recharts").then((mod) => ({ default: mod.CartesianGrid }))) as any)
export const LazyTooltip = dynamic((() =>
  import("recharts").then((mod) => ({ default: mod.Tooltip }))) as any)
export const LazyLegend = dynamic((() =>
  import("recharts").then((mod) => ({ default: mod.Legend }))) as any)
export const LazyResponsiveContainer = dynamic((() =>
  import("recharts").then((mod) => ({ default: mod.ResponsiveContainer }))) as any)

// Media Uploader - Contains file upload logic
export const LazyMediaUploader = dynamic(
  () => import("@/components/media-uploader").then((mod) => ({ default: mod.MediaUploader })),
  {
    loading: () => <Skeleton className="h-32 w-full" />,
    ssr: false,
  }
)

// Command Palette - Only load when triggered
export const LazyCommandPalette = dynamic(
  () => import("@/components/command-palette").then((mod) => ({ default: mod.CommandPalette })),
  {
    ssr: false,
  }
)

// GPS Capture - Location features
export const LazyGPSCapture = dynamic(
  () => import("@/components/gps-capture").then((mod) => ({ default: mod.GPSCapture })),
  {
    loading: () => <Skeleton className="h-24 w-full" />,
    ssr: false,
  }
)
