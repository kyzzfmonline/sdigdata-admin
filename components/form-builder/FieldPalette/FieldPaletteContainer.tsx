/**
 * Field Palette Container
 * Main container for the field library with search and categorization
 */

"use client"

import { useState, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"
import { useFormBuilderContext } from "../FormBuilderProvider"
import {
  getFieldCategories,
  getFieldConfigsByCategory,
  searchFieldConfigs,
  type FieldTypeConfig,
} from "@/lib/form-builder/field-configs"
import { FieldTypeCard } from "./FieldTypeCard"
import type { FormField } from "@/lib/types"

export function FieldPaletteContainer() {
  const { addField } = useFormBuilderContext()
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")

  const categories = getFieldCategories()
  const fieldsByCategory = getFieldConfigsByCategory()

  // Filter fields based on search and category
  const filteredFields = useMemo(() => {
    let fields: FieldTypeConfig[] = []

    if (searchQuery.trim()) {
      // Search across all fields
      fields = searchFieldConfigs(searchQuery)
    } else if (selectedCategory === "All") {
      // Show all fields
      fields = Object.values(fieldsByCategory).flat()
    } else {
      // Show fields in selected category
      fields = fieldsByCategory[selectedCategory] || []
    }

    return fields
  }, [searchQuery, selectedCategory, fieldsByCategory])

  const handleAddField = (type: FormField["type"]) => {
    addField(type)
  }

  return (
    <Card className="p-6 shadow-sm border bg-card h-full flex flex-col">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground mb-1">Field Library</h3>
        <p className="text-sm text-muted-foreground">Add fields to your form by clicking on them</p>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search field types..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            aria-label="Search field types"
          />
        </div>
      </div>

      {/* Category Filter */}
      {!searchQuery && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                onClick={() => setSelectedCategory(category)}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                className="text-xs"
                aria-pressed={selectedCategory === category}
                aria-label={`Filter by ${category} category`}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="mb-3 text-sm text-muted-foreground">
        {searchQuery
          ? `${filteredFields.length} result${filteredFields.length !== 1 ? "s" : ""} for "${searchQuery}"`
          : selectedCategory === "All"
            ? `${filteredFields.length} field types available`
            : `${filteredFields.length} ${selectedCategory} field${filteredFields.length !== 1 ? "s" : ""}`}
      </div>

      {/* Field List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-2">
        {filteredFields.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm">No fields found</p>
            {searchQuery && <p className="text-xs mt-2">Try adjusting your search query</p>}
          </div>
        ) : (
          filteredFields.map((config, index) => (
            <FieldTypeCard
              key={config.type}
              config={config}
              onClick={() => handleAddField(config.type)}
              index={index}
            />
          ))
        )}
      </div>

      {/* Keyboard Hint */}
      <div className="mt-4 pt-4 border-t border-border text-xs text-muted-foreground">
        <p>
          <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Enter</kbd> to add selected field
        </p>
      </div>
    </Card>
  )
}
