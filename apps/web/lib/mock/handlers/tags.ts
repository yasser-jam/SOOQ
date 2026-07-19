import { getMockDb, newMockId, updateMockDb } from "../db"
import type { MockHandlerResult, MockRequest, MockTagRecord } from "../types"

const envelope = <T>(data: T) => ({
  success: true,
  data,
  message: null,
  timestamp: Date.now(),
})

const toApi = (tag: MockTagRecord) => ({
  id: tag.productTagId,
  productTagId: tag.productTagId,
  tagName: tag.tagName,
  slug: tag.slug,
  createdAt: tag.createdAt,
  updatedAt: tag.updatedAt,
})

const readBody = (body: unknown): Record<string, unknown> => {
  if (!body || typeof body !== "object" || body instanceof FormData) return {}
  return body as Record<string, unknown>
}

const slugify = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\u0600-\u06FF-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")

const fromInput = (
  input: Record<string, unknown>,
  existing?: MockTagRecord
): MockTagRecord => {
  const now = new Date().toISOString()
  const tagName = String(input.tagName ?? existing?.tagName ?? "").trim()
  const slugRaw = String(input.slug ?? existing?.slug ?? "").trim()
  return {
    productTagId: existing?.productTagId ?? newMockId("mock-tag"),
    tagName,
    slug: slugRaw || slugify(tagName) || `tag-${Date.now().toString(36)}`,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  }
}

/**
 * Admin product tags — powers Design Studio / product forms when mock mode is on.
 */
export const handleTagsMock = (request: MockRequest): MockHandlerResult => {
  const method = request.method.toUpperCase()
  const path = request.url.split("?")[0] ?? request.url

  if (method === "GET" && path === "/admin/tags") {
    return {
      handled: true,
      data: envelope(getMockDb().tags.map(toApi)),
    }
  }

  if (method === "POST" && path === "/admin/tags") {
    const body = readBody(request.body)
    const tagName = String(body.tagName ?? "").trim()
    if (!tagName) {
      return {
        handled: true,
        error: {
          status: 400,
          message: "اسم العلامة مطلوب",
          errorCode: "ERR_VALIDATION",
        },
      }
    }

    const created = fromInput(body)
    const conflict = getMockDb().tags.some(
      (tag) => tag.slug === created.slug || tag.tagName === created.tagName
    )
    if (conflict) {
      return {
        handled: true,
        error: {
          status: 409,
          message: "العلامة موجودة مسبقاً",
          errorCode: "ERR_CONFLICT",
        },
      }
    }

    updateMockDb((db) => {
      db.tags = [created, ...db.tags]
      return db
    })
    return { handled: true, data: envelope(toApi(created)) }
  }

  const detailMatch = path.match(/^\/admin\/tags\/([^/]+)$/)
  if (detailMatch) {
    const id = decodeURIComponent(detailMatch[1] ?? "")
    const existing = getMockDb().tags.find((tag) => tag.productTagId === id)

    if (method === "GET") {
      if (!existing) {
        return {
          handled: true,
          error: {
            status: 404,
            message: "العلامة غير موجودة",
            errorCode: "ERR_NOT_FOUND",
          },
        }
      }
      return { handled: true, data: envelope(toApi(existing)) }
    }

    if (method === "PUT") {
      if (!existing) {
        return {
          handled: true,
          error: {
            status: 404,
            message: "العلامة غير موجودة",
            errorCode: "ERR_NOT_FOUND",
          },
        }
      }
      const updated = fromInput(readBody(request.body), existing)
      updateMockDb((db) => {
        db.tags = db.tags.map((tag) =>
          tag.productTagId === id ? updated : tag
        )
        // Keep denormalized product tags in sync for editor cards.
        db.products = db.products.map((product) => ({
          ...product,
          tags: (product.tags ?? []).map((tag) =>
            tag.id === id ? { ...tag, name: updated.tagName } : tag
          ),
        }))
        return db
      })
      return { handled: true, data: envelope(toApi(updated)) }
    }

    if (method === "DELETE") {
      updateMockDb((db) => {
        db.tags = db.tags.filter((tag) => tag.productTagId !== id)
        db.products = db.products.map((product) => ({
          ...product,
          tags: (product.tags ?? []).filter((tag) => tag.id !== id),
        }))
        return db
      })
      return { handled: true, data: envelope(null) }
    }
  }

  return { handled: false }
}
