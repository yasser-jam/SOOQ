import { queryOptions } from "@tanstack/react-query"
import { api } from "@/lib/api"

import type {
  CreateProductTagInput,
  ProductTag,
  UpdateProductTagInput,
} from "./types"
import { ApiResponse } from "@/lib/types"

type ProductTagResponse = ProductTag & {
  productTagId: string
}

export const productTagKeys = {
  all: ["product-tags"] as const,
  detail: (id: string) => [...productTagKeys.all, id] as const,
}

export const listProductTags = async (): Promise<ProductTag[]> => {
  const response = await api<ApiResponse<ProductTagResponse[]>>("/admin/tags")
  return response.data?.map((el) => ({ ...el, id: el.productTagId })) ?? []
}

export const listProductTagsQueryOptions = () =>
  queryOptions({
    queryKey: productTagKeys.all,
    queryFn: listProductTags,
  })

export const getProductTag = async (id: string): Promise<ProductTag> => {
  let response = await api<ApiResponse<ProductTagResponse>>(`/admin/tags/${id}`)
  return { ...response.data!, id: response.data?.productTagId }
}

export const getProductTagQueryOptions = (id: string) =>
  queryOptions({
    queryKey: productTagKeys.detail(id),
    queryFn: () => getProductTag(id),
  })

export const updateProductTag = ({
  id,
  data,
}: UpdateProductTagInput): Promise<void> =>
  api<void>(`/admin/tags/${id}`, {
    method: "PUT",
    body: data,
  })

export const createProductTag = (data: CreateProductTagInput): Promise<void> =>
  api<void>("/admin/tags", {
    method: "POST",
    body: data,
  })

export const deleteProductTag = (id: string): Promise<void> =>
  api<void>(`/admin/tags/${id}`, {
    method: "DELETE",
  })
