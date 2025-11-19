"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import {
  Filter,
  X,
  Calendar as CalendarIcon,
  Save,
  RotateCcw,
  ChevronDown,
} from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import type { DateRange } from "react-day-picker"

export interface ResponseFilters {
  search: string
  dateRange?: DateRange
  qualityRange: [number, number]
  submittedBy?: string
  hasAttachments?: boolean
  fieldFilters: Record<string, any>
}

interface ResponseFiltersProps {
  filters: ResponseFilters
  onChange: (filters: ResponseFilters) => void
  fieldOptions?: Array<{
    id: string
    label: string
    type: string
    options?: Array<{ label: string; value: string }>
  }>
}

export function ResponseFiltersPanel({ filters, onChange, fieldOptions = [] }: ResponseFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [savedFilters, setSavedFilters] = useState<Record<string, ResponseFilters>>({})
  const [filterName, setFilterName] = useState("")

  const hasActiveFilters =
    filters.search ||
    filters.dateRange ||
    filters.qualityRange[0] > 0 ||
    filters.qualityRange[1] < 100 ||
    filters.submittedBy ||
    Object.keys(filters.fieldFilters).length > 0

  const handleReset = () => {
    onChange({
      search: "",
      qualityRange: [0, 100],
      fieldFilters: {},
    })
  }

  const handleSaveFilter = () => {
    if (!filterName.trim()) return
    setSavedFilters({
      ...savedFilters,
      [filterName]: filters,
    })
    setFilterName("")
  }

  const handleLoadFilter = (name: string) => {
    onChange(savedFilters[name])
  }

  const handleRemoveSavedFilter = (name: string) => {
    const updated = { ...savedFilters }
    delete updated[name]
    setSavedFilters(updated)
  }

  const updateFilter = (key: keyof ResponseFilters, value: any) => {
    onChange({ ...filters, [key]: value })
  }

  const updateFieldFilter = (fieldId: string, value: any) => {
    const updated = { ...filters.fieldFilters }
    if (value === undefined || value === null || value === "") {
      delete updated[fieldId]
    } else {
      updated[fieldId] = value
    }
    onChange({ ...filters, fieldFilters: updated })
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5" />
          <h3 className="font-semibold">Filters</h3>
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-2">
              Active
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <ChevronDown className={cn("w-4 h-4 transition-transform", isExpanded && "rotate-180")} />
          </Button>
        </div>
      </div>

      {/* Quick Search */}
      <div className="mb-4">
        <Input
          placeholder="Search responses..."
          value={filters.search}
          onChange={(e) => updateFilter("search", e.target.value)}
          className="w-full"
        />
      </div>

      {isExpanded && (
        <div className="space-y-6 pt-4 border-t">
          {/* Date Range */}
          <div className="space-y-2">
            <Label>Date Range</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !filters.dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.dateRange?.from ? (
                    filters.dateRange.to ? (
                      <>
                        {format(filters.dateRange.from, "LLL dd, y")} -{" "}
                        {format(filters.dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(filters.dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={filters.dateRange?.from}
                  selected={filters.dateRange}
                  onSelect={(range) => updateFilter("dateRange", range)}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Quality Score Range */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Quality Score</Label>
              <span className="text-sm text-muted-foreground">
                {filters.qualityRange[0]}% - {filters.qualityRange[1]}%
              </span>
            </div>
            <Slider
              value={filters.qualityRange}
              onValueChange={(value) => updateFilter("qualityRange", value as [number, number])}
              min={0}
              max={100}
              step={5}
              className="w-full"
            />
          </div>

          {/* Field-Specific Filters */}
          {fieldOptions.length > 0 && (
            <div className="space-y-4">
              <Label>Field Filters</Label>
              {fieldOptions.map((field) => (
                <div key={field.id} className="space-y-2">
                  <Label className="text-sm text-muted-foreground">{field.label}</Label>
                  {field.type === "select" || field.type === "radio" ? (
                    <Select
                      value={filters.fieldFilters[field.id] || ""}
                      onValueChange={(value) => updateFieldFilter(field.id, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Any value" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Any value</SelectItem>
                        {field.options?.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : field.type === "checkbox" || field.type === "yes_no" ? (
                    <Select
                      value={filters.fieldFilters[field.id] || ""}
                      onValueChange={(value) => updateFieldFilter(field.id, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Any value" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Any value</SelectItem>
                        <SelectItem value="true">Yes</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      placeholder="Enter value..."
                      value={filters.fieldFilters[field.id] || ""}
                      onChange={(e) => updateFieldFilter(field.id, e.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Saved Filters */}
          {Object.keys(savedFilters).length > 0 && (
            <div className="space-y-2">
              <Label>Saved Filters</Label>
              <div className="flex flex-wrap gap-2">
                {Object.keys(savedFilters).map((name) => (
                  <Badge
                    key={name}
                    variant="outline"
                    className="cursor-pointer hover:bg-accent"
                  >
                    <span onClick={() => handleLoadFilter(name)}>{name}</span>
                    <X
                      className="w-3 h-3 ml-2"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveSavedFilter(name)
                      }}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Save Current Filter */}
          <div className="space-y-2">
            <Label>Save Current Filter</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Filter name..."
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
              />
              <Button onClick={handleSaveFilter} disabled={!filterName.trim()}>
                <Save className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
