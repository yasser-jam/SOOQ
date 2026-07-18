import { getMockDb, newMockId, updateMockDb } from "../db"
import type {
  MockCollectionRecord,
  MockHandlerResult,
  MockProductRecord,
  MockRequest,
} from "../types"

const envelope = <T>(data: T) => ({
  success: true,
  data,
  message: null,
  timestamp: Date.now(),
})

const pagedEnvelope = <T>(
  items: T[],
  page: number,
  size: number
) => {
  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / (size || 1)) || 1)
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

const toAdmin = (collection: MockCollectionRecord) => ({
  id: collection.collectionId,
  collectionId: collection.collectionId,
  collectionName: collection.collectionName,
  collectionSlug: collection.collectionSlug,
  collectionType: collection.collectionType,
  descriptionAr: collection.descriptionAr,
  descriptionEn: collection.descriptionEn,
  isActive: collection.isActive,
  createdAt: collection.createdAt,
  updatedAt: collection.updatedAt,
  rules: [],
})

const toPublicListItem = (collection: MockCollectionRecord) => ({
  collectionId: collection.collectionId,
  collectionName: collection.collectionName,
  collectionSlug: collection.collectionSlug,
  productCount: collection.productIds.length,
})

const primaryImageUrl = (product: MockProductRecord): string | undefined =>
  product.media[0]?.url ?? product.media[0]?.thumbnailUrl

const toPublicProductItem = (
  product: MockProductRecord,
  sortOrder: number
) => ({
  productId: product.productId,
  titleAr: product.titleAr,
  titleEn: product.titleEn,
  slug: product.slug,
  descriptionAr: product.descriptionAr,
  descriptionEn: product.descriptionEn,
  basePrice: product.basePrice,
  compareAtPrice: product.compareAtPrice,
  currencyCode: product.currencyCode,
  displayPrice: String(product.basePrice),
  status: product.status,
  primaryImageUrl: primaryImageUrl(product),
  sortOrder,
})

const toCollectionProductLink = (
  product: MockProductRecord,
  sortOrder: number
) => ({
  productId: product.productId,
  sortOrder,
  titleAr: product.titleAr,
  titleEn: product.titleEn,
  primaryImageUrl: primaryImageUrl(product),
  displayPrice: String(product.basePrice),
  stockStatus: "IN_STOCK",
})

const readBody = (body: unknown): Record<string, unknown> => {
  if (!body || typeof body !== "object" || body instanceof FormData) return {}
  return body as Record<string, unknown>
}

const parsePageParams = (url: string) => {
  const params = new URLSearchParams(url.split("?")[1] ?? "")
  return {
    page: Number(params.get("page") ?? 0),
    size: Number(params.get("size") ?? 20),
  }
}

const resolveCollectionProducts = (
  collection: MockCollectionRecord
): MockProductRecord[] => {
  const byId = new Map(
    getMockDb().products.map((product) => [product.productId, product])
  )
  return collection.productIds
    .map((id) => byId.get(id))
    .filter((product): product is MockProductRecord => Boolean(product))
}

const fromInput = (
  input: Record<string, unknown>,
  existing?: MockCollectionRecord
): MockCollectionRecord => {
  const now = new Date().toISOString()
  const typeRaw = String(
    input.collectionType ?? existing?.collectionType ?? "MANUAL"
  ).toUpperCase()
  const collectionType =
    typeRaw === "AUTOMATED" || typeRaw === "AUTOMATIC"
      ? (typeRaw as "AUTOMATED" | "AUTOMATIC")
      : "MANUAL"

  return {
    collectionId: existing?.collectionId ?? newMockId("mock-col"),
    collectionName: String(
      input.collectionName ?? existing?.collectionName ?? ""
    ),
    collectionSlug: String(
      input.collectionSlug ?? existing?.collectionSlug ?? ""
    ),
    collectionType,
    descriptionAr: String(
      input.descriptionAr ?? existing?.descriptionAr ?? ""
    ),
    descriptionEn: String(
      input.descriptionEn ?? existing?.descriptionEn ?? ""
    ),
    isActive:
      input.isActive === undefined
        ? (existing?.isActive ?? true)
        : Boolean(input.isActive),
    productIds: existing?.productIds ?? [],
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  }
}

export const handleCollectionsMock = (
  request: MockRequest
): MockHandlerResult => {
  const method = request.method.toUpperCase()
  const path = request.url.split("?")[0] ?? request.url

  // ── Public (editor picker + preview / storefront) ─────────────────────
  if (method === "GET" && path === "/public/collections") {
    const { page, size } = parsePageParams(request.url)
    const active = getMockDb()
      .collections.filter((c) => c.isActive)
      .map(toPublicListItem)
    return { handled: true, data: pagedEnvelope(active, page, size) }
  }

  const publicProductsMatch = path.match(
    /^\/public\/collections\/([^/]+)\/products$/
  )
  if (publicProductsMatch && method === "GET") {
    const slug = decodeURIComponent(publicProductsMatch[1] ?? "")
    const collection = getMockDb().collections.find(
      (c) => c.collectionSlug === slug && c.isActive
    )
    if (!collection) {
      return {
        handled: true,
        error: {
          status: 404,
          message: "المجموعة غير موجودة",
          errorCode: "ERR_NOT_FOUND",
        },
      }
    }
    const { page, size } = parsePageParams(request.url)
    const products = resolveCollectionProducts(collection)
      .filter((p) => p.status === "ACTIVE")
      .map((product, index) => toPublicProductItem(product, index))
    return { handled: true, data: pagedEnvelope(products, page, size) }
  }

  // ── Admin ─────────────────────────────────────────────────────────────
  if (method === "GET" && path === "/admin/collections") {
    return {
      handled: true,
      data: envelope(getMockDb().collections.map(toAdmin)),
    }
  }

  if (method === "POST" && path === "/admin/collections") {
    const created = fromInput(readBody(request.body))
    updateMockDb((db) => {
      db.collections = [created, ...db.collections]
      return db
    })
    return { handled: true, data: envelope(toAdmin(created)) }
  }

  const adminProductsMatch = path.match(
    /^\/admin\/collections\/([^/]+)\/products$/
  )
  if (adminProductsMatch) {
    const id = decodeURIComponent(adminProductsMatch[1] ?? "")
    const collection = getMockDb().collections.find(
      (c) => c.collectionId === id
    )

    if (method === "GET") {
      if (!collection) {
        return {
          handled: true,
          error: {
            status: 404,
            message: "المجموعة غير موجودة",
            errorCode: "ERR_NOT_FOUND",
          },
        }
      }
      const { page, size } = parsePageParams(request.url)
      const products = resolveCollectionProducts(collection).map(
        (product, index) => toCollectionProductLink(product, index)
      )
      return { handled: true, data: envelope(products.slice(page * size, page * size + size)) }
    }

    if (method === "POST") {
      if (!collection) {
        return {
          handled: true,
          error: {
            status: 404,
            message: "المجموعة غير موجودة",
            errorCode: "ERR_NOT_FOUND",
          },
        }
      }
      const body = readBody(request.body)
      const productId = String(body.productId ?? "")
      if (!productId) {
        return {
          handled: true,
          error: {
            status: 400,
            message: "معرّف المنتج مطلوب",
            errorCode: "ERR_VALIDATION",
          },
        }
      }
      updateMockDb((db) => {
        db.collections = db.collections.map((c) => {
          if (c.collectionId !== id) return c
          if (c.productIds.includes(productId)) return c
          return {
            ...c,
            productIds: [...c.productIds, productId],
            updatedAt: new Date().toISOString(),
          }
        })
        return db
      })
      return { handled: true, data: envelope(null) }
    }
  }

  const removeProductMatch = path.match(
    /^\/admin\/collections\/([^/]+)\/products\/([^/]+)$/
  )
  if (removeProductMatch && method === "DELETE") {
    const id = decodeURIComponent(removeProductMatch[1] ?? "")
    const productId = decodeURIComponent(removeProductMatch[2] ?? "")
    updateMockDb((db) => {
      db.collections = db.collections.map((c) =>
        c.collectionId === id
          ? {
              ...c,
              productIds: c.productIds.filter((pid) => pid !== productId),
              updatedAt: new Date().toISOString(),
            }
          : c
      )
      return db
    })
    return { handled: true, data: envelope(null) }
  }

  const reorderMatch = path.match(
    /^\/admin\/collections\/([^/]+)\/products\/reorder$/
  )
  if (reorderMatch && method === "PUT") {
    const id = decodeURIComponent(reorderMatch[1] ?? "")
    const body = readBody(request.body)
    const productIds = Array.isArray(body.productIds)
      ? body.productIds.map(String)
      : []
    updateMockDb((db) => {
      db.collections = db.collections.map((c) =>
        c.collectionId === id
          ? { ...c, productIds, updatedAt: new Date().toISOString() }
          : c
      )
      return db
    })
    return { handled: true, data: envelope(null) }
  }

  const previewMatch = path.match(/^\/admin\/collections\/([^/]+)\/preview$/)
  if (previewMatch && method === "GET") {
    const id = decodeURIComponent(previewMatch[1] ?? "")
    const collection = getMockDb().collections.find(
      (c) => c.collectionId === id
    )
    if (!collection) {
      return {
        handled: true,
        error: {
          status: 404,
          message: "المجموعة غير موجودة",
          errorCode: "ERR_NOT_FOUND",
        },
      }
    }
    const products = resolveCollectionProducts(collection).map((product) => ({
      productId: product.productId,
      titleAr: product.titleAr,
      titleEn: product.titleEn,
      primaryImageUrl: primaryImageUrl(product),
      displayPrice: String(product.basePrice),
    }))
    return { handled: true, data: envelope(products) }
  }

  const detailMatch = path.match(/^\/admin\/collections\/([^/]+)$/)
  if (detailMatch) {
    const id = decodeURIComponent(detailMatch[1] ?? "")

    if (method === "GET") {
      const collection = getMockDb().collections.find(
        (c) => c.collectionId === id
      )
      if (!collection) {
        return {
          handled: true,
          error: {
            status: 404,
            message: "المجموعة غير موجودة",
            errorCode: "ERR_NOT_FOUND",
          },
        }
      }
      return { handled: true, data: envelope(toAdmin(collection)) }
    }

    if (method === "PUT") {
      const existing = getMockDb().collections.find(
        (c) => c.collectionId === id
      )
      if (!existing) {
        return {
          handled: true,
          error: {
            status: 404,
            message: "المجموعة غير موجودة",
            errorCode: "ERR_NOT_FOUND",
          },
        }
      }
      const updated = fromInput(readBody(request.body), existing)
      updateMockDb((db) => {
        db.collections = db.collections.map((c) =>
          c.collectionId === id ? updated : c
        )
        return db
      })
      return { handled: true, data: envelope(toAdmin(updated)) }
    }

    if (method === "DELETE") {
      updateMockDb((db) => {
        db.collections = db.collections.filter((c) => c.collectionId !== id)
        return db
      })
      return { handled: true, data: envelope(null) }
    }
  }

  return { handled: false }
}
