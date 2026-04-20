import { queryOptions } from "@tanstack/react-query"
import { api } from "@/lib/api"

import type { ProductTag } from "./types"

export const productTagKeys = {
  all: ["product-tags"] as const,
  detail: (id: string) => [...productTagKeys.all, id] as const,
}

export type UpdateProductTagInput = {
  id: string
  data: Pick<ProductTag, "tagName" | "slug">
}

export type CreateProductTagInput = Pick<ProductTag, "tagName" | "slug">

type ApiResponse<T> = {
  data?: T
}
export const listProductTags = async (): Promise<ProductTag[]> => {
  const response = await api<ApiResponse<any[]>>("/admin/tags")
  return response.data?.map(el => ({ ...el, id: el.productTagId })) ?? []
}

export const listProductTagsQueryOptions = () =>
  queryOptions({
    queryKey: productTagKeys.all,
    queryFn: listProductTags,
  })

export const getProductTag = async (id: string): Promise<ProductTag> => {
  const response = await api<ApiResponse<ProductTag>>(
    `/admin/tags/${id}`
  )
  return response.data as ProductTag
}

export const getProductTagQueryOptions = (id: string) =>
  queryOptions({
    queryKey: productTagKeys.detail(id),
    queryFn: () => getProductTag(id),
  })

export const updateProductTag = async ({
  id,
  data,
}: UpdateProductTagInput): Promise<void> => {
  const response = await api<ApiResponse<unknown>>(
    `/admin/tags/${id}`,
    {
      method: "PUT",
      body: data,
    }
  )
}

export const createProductTag = async (
  data: CreateProductTagInput
): Promise<void> => {
  const response = await api<ApiResponse<unknown>>("/admin/tags", {
    method: "POST",
    body: data,
  })
}
export const deleteProductTag = async (id: string): Promise<void> => {
  await api(`/admin/tags/${id}`, {
    method: "DELETE",
  })
}
