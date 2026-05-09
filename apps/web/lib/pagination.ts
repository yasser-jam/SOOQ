import type { Page } from "./types"

export type NormalizedPage<T> = {
  items: T[]
  totalItems: number
  totalPages: number
  pageIndex: number
  pageSize: number
}

export const normalizePage = <T>(
  page: Page<T> | undefined | null,
  fallbackPageSize = 10
): NormalizedPage<T> => {
  const items = page?.content ?? []
  const totalItems = page?.totalElements ?? items.length
  const pageSize = page?.size ?? fallbackPageSize
  const totalPages = page?.totalPages ?? Math.max(1, Math.ceil(totalItems / pageSize))
  const pageIndex = page?.number ?? 0

  return {
    items,
    totalItems,
    totalPages,
    pageIndex,
    pageSize,
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
