import { queryOptions } from "@tanstack/react-query"

import api from "@/lib/api"
import type { ApiResponse } from "@/lib/types"

import type {
  CreateAttributeInput,
  ProductAttributeDefinition,
  UpdateAttributeInput,
} from "./types"

export const attributeQueryKeys = {
  all: ["product-attributes"] as const,
  list: (categoryId?: string | null) =>
    [...attributeQueryKeys.all, "list", categoryId ?? "tenant"] as const,
  detail: (id: string) => [...attributeQueryKeys.all, "detail", id] as const,
}

const normalize = (
  raw: ProductAttributeDefinition & { attributeDefId?: string }
): ProductAttributeDefinition => ({
  ...raw,
  options: (raw.options ?? []).map((o) => ({
    ...o,
    sortOrder: o.sortOrder ?? 0,
  })),
})

/**
 * GET /api/v1/admin/product-attributes
 * Optional ?categoryId= filter (omit for tenant-wide).
 */
export const listAttributeDefinitions = async (
  categoryId?: string | null
): Promise<ProductAttributeDefinition[]> => {
  const search = categoryId ? `?categoryId=${encodeURIComponent(categoryId)}` : ""
  const response = await api<ApiResponse<ProductAttributeDefinition[]>>(
    `/admin/product-attributes${search}`
  )
  return (response.data ?? []).map(normalize)
}

export const listAttributeDefinitionsQueryOptions = (
  categoryId?: string | null
) =>
  queryOptions({
    queryKey: attributeQueryKeys.list(categoryId),
    queryFn: () => listAttributeDefinitions(categoryId),
  })

/**
 * GET /api/v1/admin/product-attributes/{id}
 */
export const getAttributeDefinition = async (
  id: string
): Promise<ProductAttributeDefinition> => {
  const response = await api<ApiResponse<ProductAttributeDefinition>>(
    `/admin/product-attributes/${id}`
  )
  if (!response.data) {
    throw new Error(`Attribute definition ${id} not found`)
  }
  return normalize(response.data)
}

export const getAttributeDefinitionQueryOptions = (id: string) =>
  queryOptions({
    queryKey: attributeQueryKeys.detail(id),
    queryFn: () => getAttributeDefinition(id),
  })

/**
 * POST /api/v1/admin/product-attributes
 * For SELECT/MULTI_SELECT include the `options` array inline.
 */
export const createAttributeDefinition = (
  data: CreateAttributeInput
): Promise<void> =>
  api<void>("/admin/product-attributes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: data,
  })

/**
 * PUT /api/v1/admin/product-attributes/{id}
 * Send the FULL options list — anything missing is removed server-side.
 */
export const updateAttributeDefinition = ({
  id,
  data,
}: UpdateAttributeInput): Promise<void> =>
  api<void>(`/admin/product-attributes/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: data,
  })

/**
 * DELETE /api/v1/admin/product-attributes/{id}
 * Soft-delete.
 */
export const deleteAttributeDefinition = (id: string): Promise<void> =>
  api<void>(`/admin/product-attributes/${id}`, {
    method: "DELETE",
  })
