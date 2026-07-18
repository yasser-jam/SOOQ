import { getMockDb, newMockId, updateMockDb } from "../db"
import type {
  MockCategoryRecord,
  MockHandlerResult,
  MockRequest,
} from "../types"

const envelope = <T>(data: T) => ({
  success: true,
  data,
  message: null,
  timestamp: Date.now(),
})

const toApi = (category: MockCategoryRecord) => ({
  id: category.categoryId,
  categoryId: category.categoryId,
  nameAr: category.nameAr,
  nameEn: category.nameEn,
  slug: category.slug,
  descriptionAr: category.descriptionAr,
  descriptionEn: category.descriptionEn,
  parentCategoryId: category.parentCategoryId,
  sortOrder: category.sortOrder,
  isActive: category.isActive,
  createdAt: category.createdAt,
  updatedAt: category.updatedAt,
})

const readBody = (body: unknown): Record<string, unknown> => {
  if (!body || typeof body !== "object" || body instanceof FormData) return {}
  return body as Record<string, unknown>
}

const fromInput = (
  input: Record<string, unknown>,
  existing?: MockCategoryRecord
): MockCategoryRecord => {
  const now = new Date().toISOString()
  return {
    categoryId: existing?.categoryId ?? newMockId("mock-cat"),
    nameAr: String(input.nameAr ?? existing?.nameAr ?? ""),
    nameEn: String(input.nameEn ?? existing?.nameEn ?? ""),
    slug: String(input.slug ?? existing?.slug ?? ""),
    descriptionAr: String(
      input.descriptionAr ?? existing?.descriptionAr ?? ""
    ),
    descriptionEn: String(
      input.descriptionEn ?? existing?.descriptionEn ?? ""
    ),
    parentCategoryId:
      input.parentCategoryId === undefined
        ? (existing?.parentCategoryId ?? null)
        : input.parentCategoryId == null || input.parentCategoryId === ""
          ? null
          : String(input.parentCategoryId),
    sortOrder: Number(input.sortOrder ?? existing?.sortOrder ?? 0),
    isActive:
      input.isActive === undefined
        ? (existing?.isActive ?? true)
        : Boolean(input.isActive),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  }
}

export const handleCategoriesMock = (
  request: MockRequest
): MockHandlerResult => {
  const method = request.method.toUpperCase()
  const path = request.url.split("?")[0] ?? request.url

  if (method === "GET" && path === "/admin/categories/templates") {
    return {
      handled: true,
      data: envelope([
        {
          key: "apparel",
          labelEn: "Apparel",
          labelAr: "ملابس",
          attributeKeys: ["size", "color"],
        },
        {
          key: "general",
          labelEn: "General",
          labelAr: "عام",
          attributeKeys: [],
        },
      ]),
    }
  }

  if (method === "GET" && path === "/admin/categories") {
    const categories = getMockDb().categories.map(toApi)
    return { handled: true, data: envelope(categories) }
  }

  if (method === "POST" && path === "/admin/categories") {
    const created = fromInput(readBody(request.body))
    updateMockDb((db) => {
      db.categories = [...db.categories, created]
      return db
    })
    return { handled: true, data: envelope(toApi(created)) }
  }

  const childrenMatch = path.match(/^\/admin\/categories\/([^/]+)\/children$/)
  if (childrenMatch && method === "GET") {
    const parentId = decodeURIComponent(childrenMatch[1] ?? "")
    const children = getMockDb()
      .categories.filter((c) => c.parentCategoryId === parentId)
      .map(toApi)
    return { handled: true, data: envelope(children) }
  }

  const detailMatch = path.match(/^\/admin\/categories\/([^/]+)$/)
  if (detailMatch) {
    const id = decodeURIComponent(detailMatch[1] ?? "")

    if (method === "GET") {
      const category = getMockDb().categories.find((c) => c.categoryId === id)
      if (!category) {
        return {
          handled: true,
          error: {
            status: 404,
            message: "التصنيف غير موجود",
            errorCode: "ERR_NOT_FOUND",
          },
        }
      }
      return { handled: true, data: envelope(toApi(category)) }
    }

    if (method === "PUT") {
      const db = getMockDb()
      const existing = db.categories.find((c) => c.categoryId === id)
      if (!existing) {
        return {
          handled: true,
          error: {
            status: 404,
            message: "التصنيف غير موجود",
            errorCode: "ERR_NOT_FOUND",
          },
        }
      }
      const updated = fromInput(readBody(request.body), existing)
      updateMockDb((next) => {
        next.categories = next.categories.map((c) =>
          c.categoryId === id ? updated : c
        )
        return next
      })
      return { handled: true, data: envelope(toApi(updated)) }
    }

    if (method === "DELETE") {
      updateMockDb((next) => {
        next.categories = next.categories.filter((c) => c.categoryId !== id)
        return next
      })
      return { handled: true, data: envelope(null) }
    }
  }

  return { handled: false }
}
