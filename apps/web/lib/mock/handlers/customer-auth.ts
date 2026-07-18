import { getMockDb, updateMockDb } from "../db"
import { createMockAuthTokens } from "../jwt"
import {
  MOCK_CUSTOMER_USER_ID,
  MOCK_DEFAULT_OTP,
  MOCK_STORE_SLUG,
  MOCK_STORE_TENANT_ID,
} from "../seed"
import type { MockHandlerResult, MockRequest } from "../types"

const envelope = <T>(data: T) => ({
  success: true,
  data,
  message: null,
  timestamp: Date.now(),
})

const normalizePhone = (phone: unknown): string =>
  String(phone ?? "").replace(/\s+/g, "")

const readBody = (body: unknown): Record<string, unknown> => {
  if (!body || typeof body !== "object" || body instanceof FormData) return {}
  return body as Record<string, unknown>
}

const resolveStoreTenant = (tenantSlug: string) => {
  const db = getMockDb()
  if (db.settings.isConfigured && db.settings.slug === tenantSlug) {
    return {
      tenantId: db.settings.tenantId || MOCK_STORE_TENANT_ID,
      tenantSlug,
    }
  }
  return {
    tenantId: MOCK_STORE_TENANT_ID,
    tenantSlug: tenantSlug || MOCK_STORE_SLUG,
  }
}

/**
 * Customer (storefront) OTP — distinct from merchant `/auth/otp/*`.
 * Does not mutate the merchant `session` so admin + storefront can coexist
 * in the same browser during local mock testing.
 */
export const handleCustomerAuthMock = (
  request: MockRequest
): MockHandlerResult => {
  const method = request.method.toUpperCase()
  const path = request.url.split("?")[0] ?? request.url

  if (method === "POST" && path === "/customer/auth/otp/request") {
    const body = readBody(request.body)
    const phone = normalizePhone(body.phone)
    const tenantSlug = String(body.tenantSlug ?? "").trim()

    if (!phone) {
      return {
        handled: true,
        error: {
          status: 400,
          message: "رقم الهاتف مطلوب",
          errorCode: "ERR_VALIDATION",
        },
      }
    }

    if (!tenantSlug) {
      return {
        handled: true,
        error: {
          status: 400,
          message: "معرّف المتجر مطلوب",
          errorCode: "ERR_VALIDATION",
        },
      }
    }

    updateMockDb((db) => {
      db.otps[phone] = MOCK_DEFAULT_OTP
      return db
    })

    return {
      handled: true,
      data: envelope("تم إرسال رمز التحقق (وضع التجربة: 123456)"),
    }
  }

  if (method === "POST" && path === "/customer/auth/otp/verify") {
    const body = readBody(request.body)
    const phone = normalizePhone(body.phone)
    const otpCode = String(body.otpCode ?? "").trim()
    const tenantSlug = String(body.tenantSlug ?? "").trim()
    const db = getMockDb()
    const expected = db.otps[phone] ?? MOCK_DEFAULT_OTP

    if (!phone || !tenantSlug) {
      return {
        handled: true,
        error: {
          status: 400,
          message: "رقم الهاتف ومعرّف المتجر مطلوبان",
          errorCode: "ERR_VALIDATION",
        },
      }
    }

    if (otpCode !== expected) {
      return {
        handled: true,
        error: {
          status: 400,
          message: "رمز التحقق غير صحيح",
          errorCode: "ERR_OTP_INVALID",
        },
      }
    }

    const { tenantId, tenantSlug: resolvedSlug } = resolveStoreTenant(tenantSlug)
    const tokens = createMockAuthTokens({
      phone,
      userId: MOCK_CUSTOMER_USER_ID,
      tenantId,
      tenantSlug: resolvedSlug,
      roles: ["CUSTOMER"],
    })

    updateMockDb((next) => {
      delete next.otps[phone]
      return next
    })

    return { handled: true, data: envelope(tokens) }
  }

  return { handled: false }
}
