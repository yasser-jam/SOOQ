import type { CreateProductInput, Product, ProductOption, UpdateProductInput } from "./types"
import api from "@/lib/api"
import { ApiResponse } from "@/lib/types"
import { ProductCategory } from "../category/types"
import { ProductTag } from "../tag/types"

type ProductFormPayload = Omit<CreateProductInput, "files"> & {
  files?: File[]
}

type ProductFormData = ProductFormPayload & {
  id?: string
  createdAt?: string
  updatedAt?: string
  mediaUrls?: string[]
}

const buildProductFormData = ({ files, ...product }: ProductFormData) => {
  const formData = new FormData()
  const productPayload = { ...product } as Record<string, unknown>
  const mediaAssetIds =
    (product as { mediaAssetIds?: string[] | null }).mediaAssetIds ?? null

  delete productPayload.id
  delete productPayload.createdAt
  delete productPayload.updatedAt
  delete productPayload.mediaUrls

  formData.append(
    "product",
    new Blob(
      [
        JSON.stringify({
          ...productPayload,
          mediaAssetIds,
        }),
      ],
      { type: "application/json" }
    )
  )

  files?.forEach((file) => {
    formData.append("files", file)
  })

  return formData
}

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
  const products = await api<ApiResponse<Product[]>>("/admin/products")

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

  return normalizeGetProduct(response.data)
}

export const updateProduct = async ({
  id,
  data,
}: UpdateProductInput): Promise<void> => {
  await api(`/admin/products/${id}`, {
    method: "PUT",
    body: buildProductFormData(data),
  })
}

export const createProduct = async (
  data: CreateProductInput
): Promise<void> => {
  await api("/admin/products", {
    method: "POST",
    body: buildProductFormData(data),
  })
}

export const deleteProduct = async (id: string): Promise<void> => {
  await api(`/admin/products/${id}`, {
    method: "DELETE",
  })
}
