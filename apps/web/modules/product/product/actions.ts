import type { CreateProductInput, Product, ProductOption, UpdateProductInput } from "./types"
import api from "@/lib/api"
import { ApiResponse } from "@/lib/types"
import { ProductCategory } from "../category/types"
import { ProductTag } from "../tag/types"

const normalizeProduct = (data: any): Product => {
  const media = (data.media ?? []) as Array<any>
  return {
    ...data,
    id: data.productId,
    titleAr: data.titleAr,
    titleEn: data.titleEn,
    descriptionAr: data.descriptionAr,
    descriptionEn: data.descriptionEn,
    mediaUrls: media.map((m) => m.url ?? m.thumbnailUrl).filter(Boolean),
    // server-known IDs in their current order. null = unchanged on update; we hydrate with current list so the editor can manipulate it.
    mediaAssetIds: media.map((m) => m.mediaAssetId ?? m.assetId ?? m.id).filter(Boolean),
  }
}

const normalizeGetProduct = (data: any): Product => {
  // Backend AdminProductDetailResponseDto carries option axes inside
  // `variantMatrix.options[]` (see ProductOptionResponseDto). Older code in
  // this file was reading `data.variants` and looking for `o.titleAr` —
  // both wrong: data.variants is a flat list of SKUs, and option fields are
  // named `optionNameAr/optionNameEn` + values use `valueAr/valueEn`.
  const matrixOptions: any[] =
    (Array.isArray(data?.variantMatrix?.options) && data.variantMatrix.options) ||
    (Array.isArray(data?.options) && data.options) ||
    []

  return {
    ...normalizeProduct(data.product),
    tagIds: data.tags?.map((t: any) => t.productTagId) || [],
    categoryIds: data.categories?.map((c: any) => c.categoryId) || [],
    basePrice: data.pricing.basePrice,
    compareAtPrice: data.pricing.compareAtPrice,
    currencyCode: data.pricing.currencyCode,
    options: matrixOptions.map((o: any) => ({
      id: o.productOptionId ?? o.optionId,
      // Schema-aligned names (form uses these via productOptionSchema)
      optionNameAr: o.optionNameAr ?? o.titleAr ?? "",
      optionNameEn: o.optionNameEn ?? o.titleEn ?? "",
      sortOrder: o.sortOrder ?? 0,
      values:
        (o.values ?? o.optionValues ?? []).map((v: any) => ({
          id: v.optionValueId,
          valueAr: v.valueAr ?? v.titleAr ?? "",
          valueEn: v.valueEn ?? v.titleEn ?? "",
          colorHex: v.colorHex ?? null,
          sortOrder: v.sortOrder ?? 0,
        })),
    })),
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

/**
 * Builds the multipart FormData body for product create/update per spec:
 * - `product` part: JSON blob with all fields EXCEPT `mediaFiles` and the display-only `mediaUrls`
 * - `files` parts: repeatable file uploads from `mediaFiles` (server PREPENDS their UUIDs to mediaAssetIds)
 *
 * `mediaAssetIds` semantics are preserved as-is in the JSON:
 * - `null` (or omitted): leave existing images unchanged
 * - `[]`: remove all images
 * - `[ids]`: exact list, in that order (index 0 = primary)
 */
const buildProductFormData = (
  data: CreateProductInput | UpdateProductInput["data"]
): FormData => {
  const fd = new FormData()

  // Strip transient + display-only fields out of the JSON blob
  const { mediaFiles, mediaUrls, ...productJson } = data as CreateProductInput & {
    mediaUrls?: string[]
  }

  fd.append(
    "product",
    new Blob([JSON.stringify(productJson)], { type: "application/json" })
  )

  // Repeatable `files` parts (NOT `files[]` — backend expects same key repeated)
  if (mediaFiles && mediaFiles.length > 0) {
    for (const file of mediaFiles) {
      fd.append("files", file, file.name)
    }
  }

  return fd
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
