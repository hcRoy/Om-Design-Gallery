import { useEffect, useMemo, useState } from 'react'
import { DEFAULT_PAGE_SIZE, totalPages } from '../lib/pagination.js'

/**
 * Slice an already-filtered in-memory list into pages.
 * Pass `resetKey` (e.g. search + filters) to jump back to page 1 when filters change.
 */
export function useClientPagination(items, { pageSize: initialPageSize = DEFAULT_PAGE_SIZE, resetKey } = {}) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSizeState] = useState(initialPageSize)
  const list = Array.isArray(items) ? items : []
  const total = list.length
  const pageCount = totalPages(total, pageSize)

  useEffect(() => {
    setPage(1)
  }, [resetKey])

  useEffect(() => {
    if (page > pageCount) setPage(pageCount)
  }, [page, pageCount])

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize
    return list.slice(start, start + pageSize)
  }, [list, page, pageSize])

  const setPageSize = (next) => {
    setPageSizeState(next)
    setPage(1)
  }

  return { page, setPage, pageSize, setPageSize, total, pageItems, pageCount }
}
