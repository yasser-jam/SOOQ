import { getMockDb, newMockId, updateMockDb } from "../db"
import type {
  MockDiscountCodeRecord,
  MockHandlerResult,
  MockRequest,
} from "../types"

const envelope = <T>(data: T) => ({
  success: true,
  data,
  message: null,
  timestamp: Date.now(),
})

const toApi = (code: MockDiscountCodeRecord) => ({
  id: code.discountCodeId,
  discountCodeId: code.discountCodeId,
  code: code.code,
  discountType: code.discountType,
  discountValue: code.discountValue,
  minOrderAmount: code.minOrderAmount,
  maxDiscountCap: code.maxDiscountCap,
  usageLimit: code.usageLimit,
  currentUses: code.currentUses,
  perCustomerMax: code.perCustomerMax,
  applicableScope: code.applicableScope,
  startsAt: code.startsAt,
  expiresAt: code.expiresAt,
  isActive: code.isActive,
  createdAt: code.createdAt,
})

const readBody = (body: unknown): Record<string, unknown> => {
  if (!body || typeof body !== "object" || body instanceof FormData) return {}
  return body as Record<string, unknown>
}

const asNullableNumber = (value: unknown): number | null => {
  if (value === "" || value === null || value === undefined) return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

const asDiscountType = (
  value: unknown,
  fallback: MockDiscountCodeRecord["discountType"]
): MockDiscountCodeRecord["discountType"] => {
  if (value === "PERCENTAGE" || value === "FIXED_AMOUNT" || value === "FREE_SHIPPING") {
    return value
  }
  return fallback
}

const asScope = (
  value: unknown,
  fallback: MockDiscountCodeRecord["applicableScope"]
): MockDiscountCodeRecord["applicableScope"] => {
  if (value === "ALL" || value === "PRODUCT" || value === "CATEGORY") {
    return value
  }
  return fallback
}

const fromInput = (
  input: Record<string, unknown>,
  existing?: MockDiscountCodeRecord
): MockDiscountCodeRecord => {
  const now = new Date().toISOString()
  const code = String(input.code ?? existing?.code ?? "")
    .trim()
    .toUpperCase()

  return {
    discountCodeId: existing?.discountCodeId ?? newMockId("mock-discount"),
    code,
    discountType: asDiscountType(
      input.discountType,
      existing?.discountType ?? "PERCENTAGE"
    ),
    discountValue: Number(
      input.discountValue ?? existing?.discountValue ?? 0
    ),
    minOrderAmount:
      input.minOrderAmount !== undefined
        ? asNullableNumber(input.minOrderAmount)
        : (existing?.minOrderAmount ?? null),
    maxDiscountCap:
      input.maxDiscountCap !== undefined
        ? asNullableNumber(input.maxDiscountCap)
        : (existing?.maxDiscountCap ?? null),
    usageLimit:
      input.usageLimit !== undefined
        ? asNullableNumber(input.usageLimit)
        : (existing?.usageLimit ?? null),
    currentUses: existing?.currentUses ?? 0,
    perCustomerMax:
      input.perCustomerMax !== undefined
        ? asNullableNumber(input.perCustomerMax)
        : (existing?.perCustomerMax ?? null),
    applicableScope: asScope(
      input.applicableScope,
      existing?.applicableScope ?? "ALL"
    ),
    startsAt: String(input.startsAt ?? existing?.startsAt ?? now),
    expiresAt: String(input.expiresAt ?? existing?.expiresAt ?? now),
    isActive:
      typeof input.isActive === "boolean"
        ? input.isActive
        : (existing?.isActive ?? true),
    createdAt: existing?.createdAt ?? now,
  }
}

/**
 * Admin discount codes — list/create/update/delete when mock mode is on.
 */
export const handleDiscountCodesMock = (
  request: MockRequest
): MockHandlerResult => {
  const method = request.method.toUpperCase()
  const path = request.url.split("?")[0] ?? request.url

  if (method === "GET" && path === "/admin/discount-codes") {
    return {
      handled: true,
      data: envelope(getMockDb().discountCodes.map(toApi)),
    }
  }

  if (method === "POST" && path === "/admin/discount-codes") {
    const body = readBody(request.body)
    const code = String(body.code ?? "")
      .trim()
      .toUpperCase()
    if (!code) {
      return {
        handled: true,
        error: {
          status: 400,
          message: "الرمز مطلوب",
          errorCode: "ERR_VALIDATION",
          fieldKey: "code",
        },
      }
    }

    const created = fromInput({ ...body, code })
    if (!created.discountValue || created.discountValue <= 0) {
      return {
        handled: true,
        error: {
          status: 400,
          message: "القيمة يجب أن تكون أكبر من صفر",
          errorCode: "ERR_VALIDATION",
          fieldKey: "discountValue",
        },
      }
    }

    const conflict = getMockDb().discountCodes.some(
      (item) => item.code === created.code
    )
    if (conflict) {
      return {
        handled: true,
        error: {
          status: 409,
          message: "كود الخصم موجود مسبقاً",
          errorCode: "ERR_CONFLICT",
        },
      }
    }

    updateMockDb((db) => {
      db.discountCodes = [created, ...db.discountCodes]
      return db
    })
    return { handled: true, data: envelope(toApi(created)) }
  }

  const detailMatch = path.match(/^\/admin\/discount-codes\/([^/]+)$/)
  if (detailMatch) {
    const id = decodeURIComponent(detailMatch[1] ?? "")
    const existing = getMockDb().discountCodes.find(
      (item) => item.discountCodeId === id
    )

    if (method === "GET") {
      if (!existing) {
        return {
          handled: true,
          error: {
            status: 404,
            message: "كود الخصم غير موجود",
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
            message: "كود الخصم غير موجود",
            errorCode: "ERR_NOT_FOUND",
          },
        }
      }
      // code + discountType are immutable on update (matches form/API).
      const body = readBody(request.body)
      const updated = fromInput(
        {
          ...body,
          code: existing.code,
          discountType: existing.discountType,
        },
        existing
      )
      updateMockDb((db) => {
        db.discountCodes = db.discountCodes.map((item) =>
          item.discountCodeId === id ? updated : item
        )
        return db
      })
      return { handled: true, data: envelope(toApi(updated)) }
    }

    if (method === "DELETE") {
      if (!existing) {
        return {
          handled: true,
          error: {
            status: 404,
            message: "كود الخصم غير موجود",
            errorCode: "ERR_NOT_FOUND",
          },
        }
      }
      updateMockDb((db) => {
        db.discountCodes = db.discountCodes.filter(
          (item) => item.discountCodeId !== id
        )
        return db
      })
      return { handled: true, data: envelope(null) }
    }
  }

  return { handled: false }
}
