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
  const mediaBase = process.env.NEXT_PUBLIC_MEDIA_URL || ""

  return {
    ...data,
    id: data.productId,
    titleAr: data.titleAr,
    titleEn: data.titleEn,
    descriptionAr: data.descriptionAr,
    descriptionEn: data.descriptionEn,
    mediaUrls: data.media?.map((m: any) => `${mediaBase}${m?.url}`) || [],
  }
}

const normalizeGetProduct = (data: any): Product => {
  // `data` is the API response `data` object containing product, pricing, images,
  // variantMatrix, variants, categories and tags.
  const product = data.product || {}

  const options: ProductOption[] = (data.variantMatrix?.options || []).map((opt: any) => ({
    optionNameAr: opt.optionNameAr,
    optionNameEn: opt.optionNameEn,
    sortOrder: opt.sortOrder ?? 0,
    values:
      (opt.values || []).map((v: any) => ({
        valueAr: v.valueAr,
        valueEn: v.valueEn,
        colorHex: v.colorHex ?? null,
        sortOrder: v.sortOrder ?? 0,
      })) || [],
  }))

  return {
    ...normalizeProduct(product),
    // keep backwards-compatible id/title/description mapping from normalizeProduct
    tagIds: data.tags?.map((t: any) => t.productTagId) || [],
    categoryIds: data.categories?.map((c: any) => c.categoryId) || [],
    defaultCategoryId: product.defaultCategoryId ?? undefined,
    basePrice: data.pricing?.basePrice,
    compareAtPrice: data.pricing?.compareAtPrice,
    currencyCode: data.pricing?.currencyCode,
    options,
    // images in the new API are under `images` with `publicUrl`
    mediaUrls: (data.images || []).map((m: any) => `${process.env.NEXT_PUBLIC_MEDIA_URL || ""}${m?.publicUrl}`),
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
