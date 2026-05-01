import type { QueryClient } from "@tanstack/react-query"
import { queryOptions } from "@tanstack/react-query"

import type { CreateProductInput, Product, UpdateProductInput } from "./types"
import api from "@/lib/api"
import { ApiResponse } from "@/lib/types"

export const productKeys = {
  all: ["products"] as const,
  detail: (id: string) => [...productKeys.all, id] as const,
}

export const listProducts = async (): Promise<ApiResponse<Product[]>> => api("/admin/products", {})

export const getProduct = async (id: string): Promise<Product> => {
  const response = await api<Product>(`/admin/products/${id}`)

  return response
}

export const updateProduct = async ({ id, data } : UpdateProductInput): Promise<void> => {
  await api(`/products/${id}`, {
    method: "PUT",
    body: data,
  })
}

export const createProduct = async (
  data: CreateProductInput
): Promise<void> => {
  await api("/admin/products", {
    method: "POST",
    body: data,
  })
}

export const deleteProduct = async (id: string): Promise<void> => {
  await api(`/products/${id}`, {
    method: "DELETE",
  })
}
