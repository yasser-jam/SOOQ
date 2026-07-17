import { REGISTRATION_HUB_SLUG } from "@/modules/auth/auth/types"

import { getMockDb, updateMockDb } from "../db"
import { createMockAuthTokens } from "../jwt"
import { MOCK_DEFAULT_OTP, MOCK_HUB_TENANT_ID } from "../seed"
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

export const handleAuthMock = (request: MockRequest): MockHandlerResult => {
  const method = request.method.toUpperCase()
  const path = request.url.split("?")[0] ?? request.url

  if (method === "POST" && path === "/auth/otp/request") {
    const body = readBody(request.body)
    const phone = normalizePhone(body.phone)
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

    updateMockDb((db) => {
      db.otps[phone] = MOCK_DEFAULT_OTP
      if (typeof body.fullName === "string" && body.fullName.trim()) {
        db.user.fullName = body.fullName.trim()
      }
      db.user.phone = phone
      return db
    })

    return {
      handled: true,
      data: envelope("تم إرسال رمز التحقق (وضع التجربة: 123456)"),
    }
  }

  if (method === "POST" && path === "/auth/otp/verify") {
    const body = readBody(request.body)
    const phone = normalizePhone(body.phone)
    const otpCode = String(body.otpCode ?? "").trim()
    const db = getMockDb()
    const expected = db.otps[phone] ?? MOCK_DEFAULT_OTP

    if (!phone || otpCode !== expected) {
      return {
        handled: true,
        error: {
          status: 400,
          message: "رمز التحقق غير صحيح",
          errorCode: "ERR_OTP_INVALID",
        },
      }
    }

    const tokens = createMockAuthTokens({
      phone,
      userId: db.user.userId,
      tenantId: MOCK_HUB_TENANT_ID,
      tenantSlug: REGISTRATION_HUB_SLUG,
      roles: db.user.roles,
    })

    updateMockDb((next) => {
      next.session = {
        userId: tokens.userId,
        tenantId: tokens.tenantId,
        tenantSlug: tokens.tenantSlug ?? REGISTRATION_HUB_SLUG,
        refreshToken: tokens.refreshToken,
      }
      delete next.otps[phone]
      return next
    })

    return { handled: true, data: envelope(tokens) }
  }

  if (method === "POST" && path === "/auth/oauth/google") {
    const body = readBody(request.body)
    const email =
      typeof body.email === "string" && body.email
        ? body.email
        : "merchant@mock.sooq"
    const fullName =
      typeof body.fullName === "string" && body.fullName
        ? body.fullName
        : "تاجر Google التجريبي"
    const tenantSlug =
      typeof body.tenantSlug === "string" && body.tenantSlug.trim()
        ? body.tenantSlug.trim()
        : REGISTRATION_HUB_SLUG

    const db = getMockDb()
    const tokens = createMockAuthTokens({
      phone: email,
      email,
      userId: db.user.userId,
      tenantId:
        tenantSlug === REGISTRATION_HUB_SLUG
          ? MOCK_HUB_TENANT_ID
          : db.settings.tenantId,
      tenantSlug,
      roles: db.user.roles,
    })

    updateMockDb((next) => {
      next.user.email = email
      next.user.fullName = fullName
      next.session = {
        userId: tokens.userId,
        tenantId: tokens.tenantId,
        tenantSlug: tokens.tenantSlug ?? REGISTRATION_HUB_SLUG,
        refreshToken: tokens.refreshToken,
      }
      return next
    })

    return { handled: true, data: envelope(tokens) }
  }

  if (method === "POST" && path === "/auth/refresh") {
    const body = readBody(request.body)
    const refreshToken = String(body.refreshToken ?? "")
    const db = getMockDb()

    if (
      !refreshToken ||
      (db.session && db.session.refreshToken !== refreshToken)
    ) {
      // Still allow any mock-refresh token for resilience across reloads.
      if (!refreshToken.startsWith("mock-refresh:")) {
        return {
          handled: true,
          error: {
            status: 401,
            message: "جلسة غير صالحة",
            errorCode: "ERR_REFRESH_INVALID",
          },
        }
      }
    }

    const settings = db.settings
    const tenantSlug = settings.isConfigured
      ? (settings.slug ?? REGISTRATION_HUB_SLUG)
      : REGISTRATION_HUB_SLUG
    const tenantId = settings.isConfigured
      ? settings.tenantId
      : MOCK_HUB_TENANT_ID
    const phone = db.user.phone

    const tokens = createMockAuthTokens({
      phone,
      email: db.user.email,
      userId: db.user.userId,
      tenantId,
      tenantSlug,
      roles: db.user.roles,
    })

    updateMockDb((next) => {
      next.session = {
        userId: tokens.userId,
        tenantId: tokens.tenantId,
        tenantSlug: tokens.tenantSlug ?? REGISTRATION_HUB_SLUG,
        refreshToken: tokens.refreshToken,
      }
      return next
    })

    return { handled: true, data: envelope(tokens) }
  }

  return { handled: false }
}
