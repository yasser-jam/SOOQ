import type {
  CategoryRef,
  CreateProductInput,
  Product,
  ProductOption,
  TagRef,
  UpdateProductInput,
  VariantRequest,
} from "./types"
import api from "@/lib/api"
import { ApiResponse } from "@/lib/types"
import { devAuthEnabled } from "@/modules/auth/auth/init"
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

const DEV_PRODUCTS_KEY = "sooq-dev-products"

const makeDevProductId = (): string =>
  `dev-product-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`

const readDevProducts = (): Product[] => {
  if (!devAuthEnabled || typeof window === "undefined") return []
  const raw = window.localStorage.getItem(DEV_PRODUCTS_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as Product[]
  } catch {
    return []
  }
}

const writeDevProducts = (products: Product[]): Product[] => {
  if (devAuthEnabled && typeof window !== "undefined") {
    window.localStorage.setItem(DEV_PRODUCTS_KEY, JSON.stringify(products))
  }
  return products
}

const makeDevProduct = (
  data: CreateProductInput,
  id: string = makeDevProductId()
): Product => {
  const now = new Date().toISOString()

  return {
    id,
    titleAr: data.titleAr,
    titleEn: data.titleEn,
    descriptionAr: data.descriptionAr ?? "",
    descriptionEn: data.descriptionEn ?? "",
    slug: data.slug,
    basePrice: Number(data.basePrice ?? 0),
    compareAtPrice: Number(data.compareAtPrice ?? 0),
    currencyCode: data.currencyCode,
    status: data.status,
    seoTitle: data.seoTitle ?? data.titleAr,
    seoDescription: data.seoDescription ?? data.descriptionAr ?? "",
    allowOversell: Boolean(data.allowOversell),
    defaultCategoryId: data.defaultCategoryId ?? "",
    categories: data.categories ?? [],
    tags: data.tags ?? [],
    mediaAssetIds: data.mediaAssetIds ?? null,
    mediaFiles: [],
    mediaUrls: [],
    options: data.options ?? [],
    variants: data.variants ?? [],
    attributes: [],
    createdAt: now,
    updatedAt: now,
  } as Product
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

  // Dedupe options by name (lowercased EN, fallback AR). Backend has been
  // observed to leak duplicate axes when a product is saved without echoing
  // productOptionId for existing options. Keep the first one.
  const dedupSeen = new Set<string>()
  const dedupedOptions = matrixOptions.filter((o: any) => {
    const k = String(o.optionNameEn ?? o.titleEn ?? o.optionNameAr ?? o.titleAr ?? "")
      .trim()
      .toLowerCase()
    if (!k || dedupSeen.has(k)) return false
    dedupSeen.add(k)
    return true
  })

  const normalizedOptions = dedupedOptions.map((o: any, i: number) => ({
    id: o.productOptionId ?? o.optionId,
    // Schema-aligned names (form uses these via productOptionSchema)
    optionNameAr: o.optionNameAr ?? o.titleAr ?? "",
    optionNameEn: o.optionNameEn ?? o.titleEn ?? "",
    sortOrder: i,
    values:
      (o.values ?? o.optionValues ?? []).map((v: any, vi: number) => ({
        id: v.optionValueId,
        valueAr: v.valueAr ?? v.titleAr ?? "",
        valueEn: v.valueEn ?? v.titleEn ?? "",
        colorHex: v.colorHex ?? null,
        sortOrder: vi,
      })),
  }))

  // Phase 2 (PRD): convert read-side variants into the new request shape so the
  // matrix UI can bind directly to form.variants. Each variant comes back from
  // the backend with an `optionValues[]` array — pair each value's id with its
  // parent option to recover the (axisKey → value) `attributes` map.
  // SOOQ-Front convention: axis key = optionNameAr (with EN fallback).
  const optionMetaByValueId = new Map<string, { axisKey: string; valueLabel: (raw: any) => string }>()
  for (const opt of normalizedOptions) {
    const axisKey = (opt.optionNameAr || opt.optionNameEn || "").trim()
    if (!axisKey) continue
    for (const v of opt.values) {
      if (!v.id) continue
      optionMetaByValueId.set(v.id, {
        axisKey,
        valueLabel: () => (v.valueAr || v.valueEn || "").trim(),
      })
    }
  }

  const rawVariants: any[] = Array.isArray(data?.variantMatrix?.variants)
    ? data.variantMatrix.variants
    : Array.isArray(data?.variants)
      ? data.variants
      : []

  const variants: VariantRequest[] = rawVariants.map((v: any) => {
    const attributes: Record<string, string> = {}
    for (const ov of v.optionValues ?? []) {
      const valueId = ov.optionValueId ?? ov.id
      const meta = valueId ? optionMetaByValueId.get(valueId) : undefined
      if (meta) {
        attributes[meta.axisKey] = meta.valueLabel(ov)
      } else {
        // Fallback: if the value isn't linked to a known option (shouldn't
        // happen, but defensive), use the value's own label keyed by the
        // option name shipped on the value itself.
        const axis = (ov.optionNameAr ?? ov.optionNameEn ?? "").trim()
        const label = (ov.valueAr ?? ov.valueEn ?? "").trim()
        if (axis && label) attributes[axis] = label
      }
    }
    return {
      attributes,
      sku: v.sku ?? undefined,
      price: v.price ?? null,
      compareAtPrice: v.compareAtPrice ?? null,
      costPrice: v.costPrice ?? null,
      costCurrencyCode: v.costCurrencyCode ?? null,
      stockQty: v.stockQty ?? null,
      lowStockThreshold: v.lowStockThreshold ?? null,
      weightGrams: v.weightGrams ?? null,
      barcode: v.barcode ?? null,
      isActive: v.isActive ?? true,
      variantId: v.variantId,
    }
  })

  return {
    ...normalizeProduct(data.product),
    // Phase 1: form state uses TagRef[]/CategoryRef[]. Server returns full
    // entities here, so every entry is an id-shaped ref. The merchant adds
    // `{name}`/`{nameAr,nameEn}` entries through the inline creator UI.
    tags: (data.tags ?? []).map((t: any) => ({ id: t.productTagId })) as TagRef[],
    categories: (data.categories ?? []).map((c: any) => ({ id: c.categoryId })) as CategoryRef[],
    basePrice: data.pricing.basePrice,
    compareAtPrice: data.pricing.compareAtPrice,
    currencyCode: data.pricing.currencyCode,
    options: normalizedOptions,
    variants,
  }
}

export const listProducts = async (): Promise<ApiResponse<Product[]>> => {
  if (devAuthEnabled) {
    return { success: true, data: readDevProducts() }
  }

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
  if (devAuthEnabled) {
    const product = readDevProducts().find((item) => item.id === id)
    if (!product) {
      throw new Error(`Product ${id} not found`)
    }
    return product
  }

  const response = await api<ProductGetResponse>(`/admin/products/${id}`)

  return normalizeGetProduct(response.data)
}

/**
 * Builds the multipart FormData body for product create/update per spec:
 * - `product` part: JSON blob with all fields EXCEPT `mediaFiles` and the display-only `mediaUrls`
 * - `files` parts: repeatable file uploads from `mediaFiles` (server PREPENDS their UUIDs to mediaAssetIds)
 *
 * Phase 1 wire format: `tags[]` and `categories[]` carry mixed `{id}` +
 * `{name}`/`{nameAr,nameEn}` refs. We always send the new shape — never the
 * legacy `tagIds`/`categoryIds` — because mixing both in one request is a
 * 400 from the backend.
 *
 * Phase 2 wire format: `variants[]` carries `{attributes: {axis: value}, sku?, price?, ...}`.
 * Backend derives option axes from the union of `attributes` keys. The form's
 * `options` field is UI-only (drives the matrix Cartesian render) and is
 * NOT sent on the wire — sending both shapes in one request is a 400.
 *
 * Phase 4 wire format: media + EAV attributes use explicit wrappers. The
 * legacy tri-state shape (null = unchanged, [] = clear, [ids] = set) is no
 * longer sent — `mediaAssetIds` and `attributes` are translated 1:1 to
 * `mediaAssets` and `attributesUpdate` here in the serializer. Sending both
 * the wrapper and the legacy field in one request is a 400, so we strip the
 * legacy fields off `rest` first.
 */
const buildProductFormData = (
  data: CreateProductInput | UpdateProductInput["data"]
): FormData => {
  const fd = new FormData()

  const {
    mediaFiles,
    mediaUrls,
    mediaAssetIds,
    defaultCategoryId,
    options,
    variants,
    attributes,
    ...rest
  } = data as CreateProductInput & {
    mediaUrls?: string[]
    options?: unknown
    attributes?: unknown[]
  }

  const productJson: Record<string, unknown> = { ...rest }

  // Default category is restricted to existing categories only. Send it as a
  // structured `defaultCategory: {id}` ref to keep the payload consistent
  // with the new tags/categories shape. Omit entirely when unset — backend
  // falls back to the first item in `categories`.
  if (defaultCategoryId) {
    productJson.defaultCategory = { id: defaultCategoryId }
  }

  // Phase 2: strip the transient `variantId` (used to wire the inventory
  // adjust modal to a saved row) before sending. Backend ignores unknown
  // fields, but keeping the wire payload clean prevents future surprises.
  if (Array.isArray(variants)) {
    productJson.variants = variants.map((v) => {
      const { variantId: _variantId, ...rest } = v as VariantRequest
      return rest
    })
  }

  // Phase 4 (PRD): tri-state mediaAssetIds → explicit mediaAssets wrapper.
  // Mapping mirrors the previous semantics 1:1 — null/undefined means
  // "leave unchanged" so we omit the wrapper entirely.
  if (mediaAssetIds === null || mediaAssetIds === undefined) {
    // omit → backend leaves images unchanged
  } else if (mediaAssetIds.length === 0) {
    productJson.mediaAssets = { clear: true }
  } else {
    productJson.mediaAssets = { set: mediaAssetIds }
  }

  // Phase 4 (PRD): EAV attributes array → explicit attributesUpdate wrapper.
  // The form's Zod schema always defaults `attributes` to [], so the legacy
  // shape always behaved as "clear-and-replace" — preserve that by always
  // sending `{ set: [...] }` when the field is present at runtime.
  if (attributes !== undefined) {
    productJson.attributesUpdate = { set: attributes }
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
  if (devAuthEnabled) {
    const products = readDevProducts()
    const index = products.findIndex((item) => item.id === id)
    const next = makeDevProduct(data as CreateProductInput, id)
    writeDevProducts(
      index >= 0
        ? products.map((item) => (item.id === id ? { ...item, ...next } : item))
        : [next, ...products]
    )
    return
  }

  await api(`/admin/products/${id}`, {
    method: "PUT",
    body: buildProductFormData(data),
  })
}

export const createProduct = async (
  data: CreateProductInput
): Promise<void> => {
  if (devAuthEnabled) {
    const products = readDevProducts()
    const product = makeDevProduct(data)
    writeDevProducts([product, ...products])
    return
  }

  await api("/admin/products", {
    method: "POST",
    body: buildProductFormData(data),
  })
}

export const deleteProduct = async (id: string): Promise<void> => {
  if (devAuthEnabled) {
    writeDevProducts(readDevProducts().filter((product) => product.id !== id))
    return
  }

  await api(`/admin/products/${id}`, {
    method: "DELETE",
  })
}
