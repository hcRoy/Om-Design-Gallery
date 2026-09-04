export const DEFAULT_PAGE_SIZE = 10
export const PAGE_SIZE_OPTIONS = [10, 25, 50]

export function pageRange(page, pageSize) {
  const size = Math.max(1, Number(pageSize) || DEFAULT_PAGE_SIZE)
  const current = Math.max(1, Number(page) || 1)
  const from = (current - 1) * size
  const to = from + size - 1
  return { from, to, page: current, pageSize: size }
}

/** Strip characters that break PostgREST `.or()` filter syntax. */
export function sanitizeSearchTerm(term) {
  return String(term ?? '')
    .trim()
    .replace(/[,.()]/g, '')
}

export function totalPages(total, pageSize) {
  const size = Math.max(1, Number(pageSize) || DEFAULT_PAGE_SIZE)
  return Math.max(1, Math.ceil(Math.max(0, Number(total) || 0) / size))
}
