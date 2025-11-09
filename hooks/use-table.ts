import { useState, useCallback } from "react"
import { usePagination, UsePaginationReturn } from "./use-pagination"

export type SortDirection = "asc" | "desc" | null

export interface TableState {
  search: string
  sortBy: string | null
  sortDirection: SortDirection
  filters: Record<string, any>
}

export interface UseTableReturn extends TableState {
  pagination: UsePaginationReturn
  setSearch: (search: string) => void
  setSort: (sortBy: string, direction: SortDirection) => void
  toggleSort: (column: string) => void
  setFilter: (key: string, value: any) => void
  clearFilter: (key: string) => void
  clearAllFilters: () => void
  reset: () => void
}

export interface UseTableOptions {
  initialSearch?: string
  initialSortBy?: string | null
  initialSortDirection?: SortDirection
  initialFilters?: Record<string, any>
  pageSize?: number
}

/**
 * Comprehensive table state management hook
 * Manages search, sorting, filtering, and pagination
 */
export function useTable(options: UseTableOptions = {}): UseTableReturn {
  const {
    initialSearch = "",
    initialSortBy = null,
    initialSortDirection = null,
    initialFilters = {},
    pageSize = 10,
  } = options

  const [search, setSearch] = useState(initialSearch)
  const [sortBy, setSortBy] = useState<string | null>(initialSortBy)
  const [sortDirection, setSortDirection] = useState<SortDirection>(initialSortDirection)
  const [filters, setFilters] = useState<Record<string, any>>(initialFilters)

  const pagination = usePagination(pageSize)

  const setSort = useCallback((column: string, direction: SortDirection) => {
    setSortBy(column)
    setSortDirection(direction)
  }, [])

  const toggleSort = useCallback(
    (column: string) => {
      if (sortBy !== column) {
        // New column - set to ascending
        setSortBy(column)
        setSortDirection("asc")
      } else {
        // Same column - toggle direction
        if (sortDirection === "asc") {
          setSortDirection("desc")
        } else if (sortDirection === "desc") {
          setSortBy(null)
          setSortDirection(null)
        } else {
          setSortDirection("asc")
        }
      }
    },
    [sortBy, sortDirection]
  )

  const setFilter = useCallback(
    (key: string, value: any) => {
      setFilters((prev) => ({
        ...prev,
        [key]: value,
      }))
      // Reset to first page when filter changes
      pagination.goToPage(1)
    },
    [pagination]
  )

  const clearFilter = useCallback((key: string) => {
    setFilters((prev) => {
      const newFilters = { ...prev }
      delete newFilters[key]
      return newFilters
    })
  }, [])

  const clearAllFilters = useCallback(() => {
    setFilters({})
  }, [])

  const reset = useCallback(() => {
    setSearch(initialSearch)
    setSortBy(initialSortBy)
    setSortDirection(initialSortDirection)
    setFilters(initialFilters)
    pagination.reset()
  }, [initialSearch, initialSortBy, initialSortDirection, initialFilters, pagination])

  return {
    search,
    sortBy,
    sortDirection,
    filters,
    pagination,
    setSearch,
    setSort,
    toggleSort,
    setFilter,
    clearFilter,
    clearAllFilters,
    reset,
  }
}
