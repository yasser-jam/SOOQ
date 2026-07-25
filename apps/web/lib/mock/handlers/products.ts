import { getMockDb, newMockId, updateMockDb } from "../db"
import type { MockHandlerResult, MockProductRecord, MockRequest } from "../types"

const envelope = <T>(data: T) => ({
  success: true,
  data,
  message: null,
  timestamp: Date.now(),
})

const primaryImageUrl = (product: MockProductRecord): string | undefined =>
  product.media[0]?.url ?? product.media[0]?.thumbnailUrl

const toListItem = (product: MockProductRecord) => ({
  productId: product.productId,
  titleAr: product.titleAr,
  titleEn: product.titleEn,
  descriptionAr: product.descriptionAr,
  descriptionEn: product.descriptionEn,
  slug: product.slug,
  basePrice: product.basePrice,
  compareAtPrice: product.compareAtPrice,
  currencyCode: product.currencyCode,
  status: product.status,
  seoTitle: product.seoTitle,
  seoDescription: product.seoDescription,
  allowOversell: product.allowOversell,
  media: product.media,
  primaryImageUrl: primaryImageUrl(product),
  createdAt: product.createdAt,
  updatedAt: product.updatedAt,
})

const toDetail = (product: MockProductRecord) => {
  const imageUrl = primaryImageUrl(product)
  return {
    product: {
      productId: product.productId,
      titleAr: product.titleAr,
      titleEn: product.titleEn,
      descriptionAr: product.descriptionAr,
      descriptionEn: product.descriptionEn,
      slug: product.slug,
      status: product.status,
      seoTitle: product.seoTitle,
      seoDescription: product.seoDescription,
      allowOversell: product.allowOversell,
      media: product.media,
      primaryImageUrl: imageUrl,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    },
    images: product.media.map((m) => ({
      url: m.url,
      thumbnailUrl: m.thumbnailUrl,
    })),
    pricing: {
      basePrice: product.basePrice,
      compareAtPrice: product.compareAtPrice ?? 0,
      currencyCode: product.currencyCode,
      discountPercentage:
        product.compareAtPrice && product.compareAtPrice > product.basePrice
          ? Math.round(
              ((product.compareAtPrice - product.basePrice) /
                product.compareAtPrice) *
                100
            )
          : 0,
      displayCompareAt: String(product.compareAtPrice ?? 0),
      displayPrice: String(product.basePrice),
      hasDiscount: Boolean(
        product.compareAtPrice && product.compareAtPrice > product.basePrice
      ),
    },
    categories: (product.categories ?? []).map((c, i) => ({
      categoryId: c.id ?? `mock-cat-${i}`,
      nameAr: c.nameAr ?? "",
      nameEn: c.nameEn ?? "",
    })),
    tags: (product.tags ?? []).map((t, i) => ({
      productTagId: t.id ?? `mock-tag-${i}`,
      name: t.name ?? "",
    })),
    variantMatrix: {
      options: product.options ?? [],
      variants: product.variants ?? [],
    },
  }
}

const parseProductBody = async (
  body: unknown
): Promise<Record<string, unknown>> => {
  if (!body) return {}

  if (body instanceof FormData) {
    const part = body.get("product")
    if (!part) return {}
    if (typeof part === "string") {
      return JSON.parse(part) as Record<string, unknown>
    }
    if (part instanceof Blob) {
      const text = await part.text()
      return JSON.parse(text) as Record<string, unknown>
    }
    return {}
  }

  if (typeof body === "object") {
    return body as Record<string, unknown>
  }

  return {}
}

const fromInput = (
  input: Record<string, unknown>,
  existing?: MockProductRecord
): MockProductRecord => {
  const now = new Date().toISOString()
  const productId = existing?.productId ?? newMockId("mock-product")

  const defaultCategory =
    input.defaultCategory && typeof input.defaultCategory === "object"
      ? (input.defaultCategory as { id?: string })
      : null

  return {
    productId,
    titleAr: String(input.titleAr ?? existing?.titleAr ?? ""),
    titleEn: String(input.titleEn ?? existing?.titleEn ?? ""),
    descriptionAr: String(
      input.descriptionAr ?? existing?.descriptionAr ?? ""
    ),
    descriptionEn: String(
      input.descriptionEn ?? existing?.descriptionEn ?? ""
    ),
    slug: String(input.slug ?? existing?.slug ?? productId),
    basePrice: Number(input.basePrice ?? existing?.basePrice ?? 0),
    compareAtPrice: Number(
      input.compareAtPrice ?? existing?.compareAtPrice ?? 0
    ),
    currencyCode: String(input.currencyCode ?? existing?.currencyCode ?? "SYP"),
    status: (String(input.status ?? existing?.status ?? "DRAFT") as
      | "DRAFT"
      | "ACTIVE"
      | "ARCHIVED"),
    seoTitle: String(input.seoTitle ?? existing?.seoTitle ?? ""),
    seoDescription: String(
      input.seoDescription ?? existing?.seoDescription ?? ""
    ),
    allowOversell: Boolean(
      input.allowOversell ?? existing?.allowOversell ?? false
    ),
    defaultCategoryId:
      defaultCategory?.id ?? existing?.defaultCategoryId ?? undefined,
    categories: Array.isArray(input.categories)
      ? (input.categories as MockProductRecord["categories"])
      : (existing?.categories ?? []),
    tags: Array.isArray(input.tags)
      ? (input.tags as Array<{ id?: string; name?: string }>).map((tag, index) => ({
          id: String(tag.id ?? `mock-tag-${index}`),
          name: tag.name != null ? String(tag.name) : undefined,
        }))
      : (existing?.tags ?? []),
    media: existing?.media ?? [],
    options: existing?.options ?? [],
    variants: Array.isArray(input.variants)
      ? (input.variants as MockProductRecord["variants"])
      : (existing?.variants ?? []),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  }
}

const pagedEnvelope = <T>(
  items: T[],
  page: number,
  size: number
) => {
  const total = items.length
  const totalPages = total === 0 ? 0 : Math.max(1, Math.ceil(total / (size || 1)))
  // Public products API uses 0-based page indexes (aligned with collections).
  const start = page * size
  const slice = size > 0 ? items.slice(start, start + size) : items
  return {
    success: true,
    data: slice,
    meta: {
      page,
      size: size || total,
      total,
      totalPages,
      hasNext: page + 1 < totalPages,
      hasPrev: page > 0,
    },
    message: null,
    timestamp: Date.now(),
  }
}

const parseProductsPageParams = (url: string) => {
  const params = new URLSearchParams(url.split("?")[1] ?? "")
  return {
    page: Number(params.get("page") ?? 0),
    size: Number(params.get("size") ?? 12),
    categorySlug: params.get("categorySlug") ?? undefined,
    search: params.get("search") ?? undefined,
  }
}

const filterPublicProducts = (
  categorySlug?: string,
  search?: string
): MockProductRecord[] => {
  const db = getMockDb()
  const categoryById = new Map(
    db.categories.map((category) => [category.categoryId, category])
  )

  return db.products.filter((product) => {
    if (product.status !== "ACTIVE") return false

    if (categorySlug) {
      const categoryIds = [
        product.defaultCategoryId,
        ...(product.categories?.map((c) => c.id) ?? []),
      ].filter(Boolean) as string[]
      const matchesCategory = categoryIds.some((id) => {
        const category = categoryById.get(id)
        return category?.slug === categorySlug
      })
      if (!matchesCategory) return false
    }

    const q = search?.trim().toLowerCase()
    if (q) {
      const haystack = `${product.titleAr ?? ""} ${product.titleEn ?? ""}`.toLowerCase()
      if (!haystack.includes(q)) return false
    }

    return true
  })
}

export const handleProductsMock = async (
  request: MockRequest
): Promise<MockHandlerResult> => {
  const method = request.method.toUpperCase()
  const path = request.url.split("?")[0] ?? request.url

  if (method === "GET" && path === "/public/products") {
    const { page, size, categorySlug, search } = parseProductsPageParams(request.url)
    const filtered = filterPublicProducts(categorySlug, search)
    const items = filtered.map(toListItem)
    return { handled: true, data: pagedEnvelope(items, page, size) }
  }

  const publicBySlug = path.match(/^\/public\/products\/([^/]+)$/)
  if (publicBySlug && method === "GET") {
    const slug = decodeURIComponent(publicBySlug[1] ?? "")
    const product = getMockDb().products.find(
      (p) => p.slug === slug && p.status === "ACTIVE"
    )
    if (!product) {
      return {
        handled: true,
        error: {
          status: 404,
          message: "المنتج غير موجود",
          errorCode: "ERR_NOT_FOUND",
        },
      }
    }
    return { handled: true, data: envelope(toDetail(product)) }
  }

  if (method === "GET" && path === "/admin/products") {
    const products = getMockDb().products.map(toListItem)
    // Support both flat ApiResponse (admin table) and paged picker shapes.
    const params = new URLSearchParams(request.url.split("?")[1] ?? "")
    const page = Number(params.get("page") ?? 0)
    const size = Number(params.get("size") ?? 0)
    if (size > 0) {
      const start = page * size
      const slice = products.slice(start, start + size)
      const total = products.length
      const totalPages = Math.max(1, Math.ceil(total / size) || 1)
      return {
        handled: true,
        data: {
          success: true,
          data: slice,
          meta: {
            page,
            size,
            total,
            totalPages,
            hasNext: page + 1 < totalPages,
            hasPrev: page > 0,
          },
          message: null,
          timestamp: Date.now(),
        },
      }
    }
    return { handled: true, data: envelope(products) }
  }

  const detailMatch = path.match(/^\/admin\/products\/([^/]+)$/)
  if (detailMatch) {
    const id = decodeURIComponent(detailMatch[1] ?? "")

    if (method === "GET") {
      const product = getMockDb().products.find((p) => p.productId === id)
      if (!product) {
        return {
          handled: true,
          error: {
            status: 404,
            message: "المنتج غير موجود",
            errorCode: "ERR_NOT_FOUND",
          },
        }
      }
      return { handled: true, data: envelope(toDetail(product)) }
    }

    if (method === "PUT") {
      const input = await parseProductBody(request.body)
      const db = getMockDb()
      const existing = db.products.find((p) => p.productId === id)
      if (!existing) {
        return {
          handled: true,
          error: {
            status: 404,
            message: "المنتج غير موجود",
            errorCode: "ERR_NOT_FOUND",
          },
        }
      }
      const updated = fromInput(input, existing)
      updateMockDb((next) => {
        next.products = next.products.map((p) =>
          p.productId === id ? updated : p
        )
        return next
      })
      return { handled: true, data: envelope(toDetail(updated)) }
    }

    if (method === "DELETE") {
      updateMockDb((next) => {
        next.products = next.products.filter((p) => p.productId !== id)
        return next
      })
      return { handled: true, data: envelope(null) }
    }
  }

  if (method === "POST" && path === "/admin/products") {
    const input = await parseProductBody(request.body)
    const created = fromInput(input)
    updateMockDb((next) => {
      next.products = [created, ...next.products]
      return next
    })
    return { handled: true, data: envelope(toDetail(created)) }
  }

  return { handled: false }
}
