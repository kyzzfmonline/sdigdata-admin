"use client"

import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts"
import type { FormResponse, Form } from "@/lib/types"
import { useMemo } from "react"

interface ResponseVisualizationsProps {
  responses: FormResponse[]
  formData?: Form
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"]

export function ResponseVisualizations({ responses, formData }: ResponseVisualizationsProps) {
  const fieldAnalytics = useMemo(() => {
    if (!formData?.schema?.fields) return []

    return formData.schema.fields.map((field: any) => {
      const fieldValues = responses
        .map((r) => r.data[field.id])
        .filter((v) => v !== undefined && v !== null && v !== "")

      let analysis: any = {
        fieldId: field.id,
        fieldLabel: field.label,
        fieldType: field.type,
        totalResponses: fieldValues.length,
        completionRate: (fieldValues.length / responses.length) * 100,
      }

      // Analyze based on field type
      if (field.type === "select" || field.type === "radio") {
        // Frequency distribution
        const distribution: Record<string, number> = {}
        fieldValues.forEach((v) => {
          const val = String(v)
          distribution[val] = (distribution[val] || 0) + 1
        })

        analysis.distribution = Object.entries(distribution)
          .map(([value, count]) => ({
            value,
            count,
            percentage: ((count as number) / fieldValues.length) * 100,
          }))
          .sort((a, b) => b.count - a.count)

        analysis.mostCommon = analysis.distribution[0]?.value
        analysis.uniqueValues = Object.keys(distribution).length
      } else if (field.type === "multi_select" || field.type === "checkbox") {
        // For arrays, count each option
        const distribution: Record<string, number> = {}
        fieldValues.forEach((v) => {
          if (Array.isArray(v)) {
            v.forEach((item) => {
              const val = String(item)
              distribution[val] = (distribution[val] || 0) + 1
            })
          }
        })

        analysis.distribution = Object.entries(distribution)
          .map(([value, count]) => ({
            value,
            count,
            percentage: ((count as number) / responses.length) * 100,
          }))
          .sort((a, b) => b.count - a.count)

        analysis.mostCommon = analysis.distribution[0]?.value
      } else if (field.type === "number" || field.type === "rating" || field.type === "slider") {
        // Numeric analysis
        const numbers = fieldValues.map((v) => Number(v)).filter((n) => !isNaN(n))
        if (numbers.length > 0) {
          analysis.min = Math.min(...numbers)
          analysis.max = Math.max(...numbers)
          analysis.avg = numbers.reduce((a, b) => a + b, 0) / numbers.length
          analysis.median = numbers.sort((a, b) => a - b)[Math.floor(numbers.length / 2)]

          // Create ranges for distribution
          const range = analysis.max - analysis.min
          const bucketSize = range / 5
          const buckets: Record<string, number> = {}

          numbers.forEach((n) => {
            const bucket = Math.min(Math.floor((n - analysis.min) / bucketSize), 4)
            const label = `${(analysis.min + bucket * bucketSize).toFixed(0)}-${(
              analysis.min +
              (bucket + 1) * bucketSize
            ).toFixed(0)}`
            buckets[label] = (buckets[label] || 0) + 1
          })

          analysis.distribution = Object.entries(buckets).map(([range, count]) => ({
            range,
            count,
          }))
        }
      } else if (field.type === "yes_no" || field.type === "checkbox") {
        // Boolean analysis
        const trueCount = fieldValues.filter((v) => v === true || v === "true" || v === "Yes").length
        const falseCount = fieldValues.length - trueCount

        analysis.distribution = [
          { value: "Yes", count: trueCount, percentage: (trueCount / fieldValues.length) * 100 },
          { value: "No", count: falseCount, percentage: (falseCount / fieldValues.length) * 100 },
        ]
      } else if (field.type === "text" || field.type === "long_text" || field.type === "textarea") {
        // Text analysis
        const lengths = fieldValues.map((v) => String(v).length)
        if (lengths.length > 0) {
          analysis.avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length
          analysis.minLength = Math.min(...lengths)
          analysis.maxLength = Math.max(...lengths)
        }

        // Word frequency (top 10)
        const words: Record<string, number> = {}
        fieldValues.forEach((v) => {
          String(v)
            .toLowerCase()
            .split(/\s+/)
            .forEach((word) => {
              if (word.length > 3) {
                // Skip short words
                words[word] = (words[word] || 0) + 1
              }
            })
        })

        analysis.topWords = Object.entries(words)
          .map(([word, count]) => ({ word, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10)
      }

      return analysis
    })
  }, [responses, formData])

  const renderFieldVisualization = (field: any) => {
    if (!field.distribution || field.distribution.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No visualization available for this field type
        </div>
      )
    }

    // Pie chart for select/radio/boolean
    if (
      field.fieldType === "select" ||
      field.fieldType === "radio" ||
      field.fieldType === "yes_no"
    ) {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={field.distribution}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ value, percentage }: any) => `${value} (${percentage.toFixed(1)}%)`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="count"
            >
              {field.distribution.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )
    }

    // Bar chart for multi-select/checkbox/numeric ranges
    if (
      field.fieldType === "multi_select" ||
      field.fieldType === "checkbox" ||
      field.fieldType === "number" ||
      field.fieldType === "rating" ||
      field.fieldType === "slider"
    ) {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={field.distribution}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey={field.fieldType === "number" || field.fieldType === "rating" || field.fieldType === "slider" ? "range" : "value"} className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Bar dataKey="count" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )
    }

    return null
  }

  const renderFieldStats = (field: any) => {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-muted/30 p-3 rounded-lg">
          <p className="text-sm text-muted-foreground">Completion Rate</p>
          <p className="text-2xl font-bold">{field.completionRate.toFixed(1)}%</p>
        </div>
        <div className="bg-muted/30 p-3 rounded-lg">
          <p className="text-sm text-muted-foreground">Total Responses</p>
          <p className="text-2xl font-bold">{field.totalResponses}</p>
        </div>
        {field.mostCommon && (
          <div className="bg-muted/30 p-3 rounded-lg col-span-2">
            <p className="text-sm text-muted-foreground">Most Common Value</p>
            <p className="text-lg font-bold truncate" title={field.mostCommon}>
              {field.mostCommon}
            </p>
          </div>
        )}
        {field.avg !== undefined && (
          <>
            <div className="bg-muted/30 p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">Average</p>
              <p className="text-2xl font-bold">{field.avg.toFixed(2)}</p>
            </div>
            <div className="bg-muted/30 p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">Min / Max</p>
              <p className="text-lg font-bold">
                {field.min.toFixed(1)} / {field.max.toFixed(1)}
              </p>
            </div>
          </>
        )}
        {field.avgLength !== undefined && (
          <div className="bg-muted/30 p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">Avg Length</p>
            <p className="text-2xl font-bold">{Math.round(field.avgLength)} chars</p>
          </div>
        )}
      </div>
    )
  }

  if (fieldAnalytics.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">No data available for visualization</p>
      </Card>
    )
  }

  return (
    <Tabs defaultValue={fieldAnalytics[0]?.fieldId} className="w-full">
      <TabsList className="w-full justify-start overflow-x-auto flex-nowrap">
        {fieldAnalytics.map((field) => (
          <TabsTrigger key={field.fieldId} value={field.fieldId} className="whitespace-nowrap">
            {field.fieldLabel}
          </TabsTrigger>
        ))}
      </TabsList>

      {fieldAnalytics.map((field) => (
        <TabsContent key={field.fieldId} value={field.fieldId} className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">{field.fieldLabel}</h3>
            {renderFieldStats(field)}
            {renderFieldVisualization(field)}
            {field.topWords && field.topWords.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-semibold mb-3">Top Words</h4>
                <div className="flex flex-wrap gap-2">
                  {field.topWords.map((item: any) => (
                    <div
                      key={item.word}
                      className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium"
                    >
                      {item.word} ({item.count})
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </TabsContent>
      ))}
    </Tabs>
  )
}
