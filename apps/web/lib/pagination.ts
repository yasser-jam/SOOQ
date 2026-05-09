import type { Page, PagedApiResponse } from "./types"

export type NormalizedPage<T> = {
  items: T[]
  totalItems: number
  totalPages: number
  pageIndex: number
  pageSize: number
  hasNext: boolean
  hasPrev: boolean
}

const isPagedApiResponse = <T>(
  input: unknown
): input is PagedApiResponse<T> => {
  if (!input || typeof input !== "object") return false
  const obj = input as Record<string, unknown>
  return Array.isArray(obj.data) && typeof obj.meta === "object" && obj.meta !== null
}

const isSpringPage = <T>(input: unknown): input is Page<T> => {
  if (!input || typeof input !== "object") return false
  const obj = input as Record<string, unknown>
  return (
    Array.isArray(obj.content) ||
    typeof obj.totalElements === "number" ||
    typeof obj.totalPages === "number"
  )
}

export const normalizePage = <T>(
  input: PagedApiResponse<T> | Page<T> | undefined | null,
  fallbackPageSize = 20
): NormalizedPage<T> => {
  if (isPagedApiResponse<T>(input)) {
    const meta = input.meta!
    const items = input.data ?? []
    return {
      items,
      totalItems: meta.total ?? items.length,
      totalPages: meta.totalPages ?? Math.max(1, Math.ceil((meta.total ?? items.length) / (meta.size || fallbackPageSize))),
      pageIndex: meta.page ?? 0,
      pageSize: meta.size ?? fallbackPageSize,
      hasNext: meta.hasNext ?? false,
      hasPrev: meta.hasPrev ?? false,
    }
  }

  if (isSpringPage<T>(input)) {
    const items = input.content ?? []
    const totalItems = input.totalElements ?? items.length
    const pageSize = input.size ?? fallbackPageSize
    const totalPages = input.totalPages ?? Math.max(1, Math.ceil(totalItems / pageSize))
    const pageIndex = input.number ?? 0
    return {
      items,
      totalItems,
      totalPages,
      pageIndex,
      pageSize,
      hasNext: !(input.last ?? pageIndex >= totalPages - 1),
      hasPrev: !(input.first ?? pageIndex <= 0),
    }
  }

  return {
    items: [],
    totalItems: 0,
    totalPages: 1,
    pageIndex: 0,
    pageSize: fallbackPageSize,
    hasNext: false,
    hasPrev: false,
  }
}

export type PageQueryParams = {
  page?: number
  size?: number
  sort?: string
}

export const buildPageParams = (
  params: PageQueryParams = {}
): Record<string, string | number> => {
  const result: Record<string, string | number> = {
    page: params.page ?? 0,
    size: params.size ?? 20,
  }

  if (params.sort) {
    result.sort = params.sort
  }

  return result
}
