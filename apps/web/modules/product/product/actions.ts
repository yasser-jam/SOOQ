import type { QueryClient } from "@tanstack/react-query"
import { queryOptions } from "@tanstack/react-query"

import type { CreateProductInput, Product, ProductOption, UpdateProductInput } from "./types"
import api from "@/lib/api"
import { ApiResponse } from "@/lib/types"
import { ProductCategory } from "../category/types"
import { ProductTag } from "../tag/types"

const normalizeProduct = (data: any): Product => {
  return {
    ...data,
    id: data.productId,
    titleAr: data.titleAr,
    titleEn: data.titleEn,
    descriptionAr: data.descriptionAr,
    descriptionEn: data.descriptionEn,
    mediaUrls: data.media?.map((m: any) => m.url) || [],
    
  }
}

const normalizeGetProduct = (data: any): Product => {
  return {
    ...normalizeProduct(data.product),
    tagIds: data.tags?.map((t: any) => t.productTagId) || [] ,
    categoryIds: data.categories?.map((c: any) => c.categoryId) || [],
    basePrice: data.pricing.basePrice,
    compareAtPrice: data.pricing.compareAtPrice,
    currencyCode: data.pricing.currencyCode,
    options:
      data.variants?.map((o: any) => ({
        id: o.optionId,
        titleAr: o.titleAr,
        titleEn: o.titleEn,
        values:
          o.optionValues?.map((v: any) => ({
            id: v.optionValueId ,
            titleAr: v.valueAr,
            titleEn: v.valueEn,
          })) || [],
      })) || [],
  }
}

export const listProducts = async (): Promise<ApiResponse<Product[]>> => {
  let products = await api<ApiResponse<Product[]>>("/admin/products")

  products.data = products.data?.map((el) => normalizeProduct(el)) || []

  return products
}

type ProductGetResponse = ApiResponse<{
  product: Product
  categories: ProductCategory[]
  pricing: {
    basePrice: number
    compareAtPrice: number
    currencyCode: "SYP" | "USD"
    discountPercentage: number
    displayCompareAt: string
    displayPrice: string
    hasDiscount: boolean
  }
  tags: ProductTag[]
  variants: ProductOption[]
}>

export const getProduct = async (id: string): Promise<Product> => {
  const response = await api<ProductGetResponse>(`/admin/products/${id}`)

  console.log(response.data);

  console.log('normalized', normalizeGetProduct(response.data));
  
  

  return normalizeGetProduct(response.data)
}

export const updateProduct = async ({
  id,
  data,
}: UpdateProductInput): Promise<void> => {
  await api(`/admin/products/${id}`, {
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
