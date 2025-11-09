import { useState, useCallback, useMemo } from "react"

export interface PaginationState {
  page: number
  pageSize: number
  total: number
}

export interface UsePaginationReturn extends PaginationState {
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
  nextPage: () => void
  prevPage: () => void
  goToPage: (page: number) => void
  setPageSize: (size: number) => void
  setTotal: (total: number) => void
  offset: number
  reset: () => void
}

export function usePagination(
  initialPageSize: number = 10,
  initialPage: number = 1
): UsePaginationReturn {
  const [page, setPage] = useState(initialPage)
  const [pageSize, setPageSize] = useState(initialPageSize)
  const [total, setTotal] = useState(0)

  const totalPages = useMemo(() => Math.ceil(total / pageSize), [total, pageSize])
  const hasNext = page < totalPages
  const hasPrev = page > 1
  const offset = (page - 1) * pageSize

  const nextPage = useCallback(() => {
    if (hasNext) {
      setPage((p) => p + 1)
    }
  }, [hasNext])

  const prevPage = useCallback(() => {
    if (hasPrev) {
      setPage((p) => p - 1)
    }
  }, [hasPrev])

  const goToPage = useCallback(
    (newPage: number) => {
      const validPage = Math.max(1, Math.min(newPage, totalPages))
      setPage(validPage)
    },
    [totalPages]
  )

  const updatePageSize = useCallback((size: number) => {
    setPageSize(size)
    setPage(1) // Reset to first page when changing page size
  }, [])

  const reset = useCallback(() => {
    setPage(initialPage)
    setPageSize(initialPageSize)
    setTotal(0)
  }, [initialPage, initialPageSize])

  return {
    page,
    pageSize,
    total,
    totalPages,
    hasNext,
    hasPrev,
    offset,
    nextPage,
    prevPage,
    goToPage,
    setPageSize: updatePageSize,
    setTotal,
    reset,
  }
}
