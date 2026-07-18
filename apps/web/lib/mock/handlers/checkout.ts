import { getMockDb, newMockId, updateMockDb } from "../db"
import { MOCK_STORE_TENANT_ID } from "../seed"
import type { MockHandlerResult, MockOrderRecord, MockRequest } from "../types"

const envelope = <T>(data: T) => ({
  success: true,
  data,
  message: null,
  timestamp: Date.now(),
})

const readBody = (body: unknown): Record<string, unknown> => {
  if (!body || typeof body !== "object" || body instanceof FormData) return {}
  return body as Record<string, unknown>
}

const readTenantHeader = (
  headers?: Record<string, string | undefined>
): string => {
  if (!headers) return MOCK_STORE_TENANT_ID
  return (
    headers["X-Tenant-Id"] ??
    headers["x-tenant-id"] ??
    headers["X-Tenant-ID"] ??
    MOCK_STORE_TENANT_ID
  )
}

const knownVariantIds = (): Set<string> => {
  const ids = new Set<string>()
  for (const product of getMockDb().products) {
    if (product.status !== "ACTIVE") continue
    for (const variant of product.variants ?? []) {
      if (variant.variantId) ids.add(variant.variantId)
    }
    // Some cart lines fall back to product id when there is a single variant.
    if ((product.variants?.length ?? 0) <= 1) {
      ids.add(product.productId)
    }
  }
  return ids
}

/**
 * Storefront checkout — `POST /public/checkout`.
 * Persists the order in the mock DB and returns a COD confirmation envelope.
 */
export const handleCheckoutMock = (request: MockRequest): MockHandlerResult => {
  const method = request.method.toUpperCase()
  const path = request.url.split("?")[0] ?? request.url

  if (!(method === "POST" && path === "/public/checkout")) {
    return { handled: false }
  }

  const body = readBody(request.body)
  const itemsRaw = Array.isArray(body.items) ? body.items : []
  const shipping =
    body.shippingAddress && typeof body.shippingAddress === "object"
      ? (body.shippingAddress as Record<string, unknown>)
      : {}

  const items = itemsRaw
    .map((item) => {
      if (!item || typeof item !== "object") return null
      const row = item as Record<string, unknown>
      const variantId = String(row.variantId ?? "").trim()
      const quantity = Number(row.quantity ?? 0)
      if (!variantId || !Number.isFinite(quantity) || quantity < 1) return null
      return { variantId, quantity: Math.floor(quantity) }
    })
    .filter((item): item is { variantId: string; quantity: number } =>
      Boolean(item)
    )

  if (items.length === 0) {
    return {
      handled: true,
      error: {
        status: 400,
        message: "السلة فارغة أو لا تحتوي منتجات قابلة للطلب",
        errorCode: "ERR_VALIDATION",
      },
    }
  }

  const recipientName = String(shipping.recipientName ?? "").trim()
  const phone = String(shipping.phone ?? "").trim()
  const addressLabel = String(shipping.addressLabel ?? "").trim()
  const latitude = Number(shipping.latitude)
  const longitude = Number(shipping.longitude)

  if (!recipientName || !phone || !addressLabel) {
    return {
      handled: true,
      error: {
        status: 400,
        message: "بيانات الشحن غير مكتملة",
        errorCode: "ERR_VALIDATION",
      },
    }
  }

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return {
      handled: true,
      error: {
        status: 400,
        message: "إحداثيات العنوان غير صالحة",
        errorCode: "ERR_VALIDATION",
      },
    }
  }

  const variants = knownVariantIds()
  const unknown = items.find((item) => !variants.has(item.variantId))
  if (unknown) {
    return {
      handled: true,
      error: {
        status: 400,
        message: `المتغير غير موجود: ${unknown.variantId}`,
        errorCode: "ERR_VALIDATION",
      },
    }
  }

  const order: MockOrderRecord = {
    orderId: newMockId("mock-order"),
    tenantId: readTenantHeader(request.headers),
    items,
    shippingAddress: {
      latitude,
      longitude,
      recipientName,
      phone,
      addressLabel,
    },
    paymentMethod: "COD",
    guestEmail: String(body.guestEmail ?? "guest@example.com"),
    status: "CONFIRMED",
    createdAt: new Date().toISOString(),
  }

  updateMockDb((db) => {
    db.orders = [order, ...(db.orders ?? [])]
    return db
  })

  return {
    handled: true,
    data: envelope({
      orderId: order.orderId,
      status: order.status,
      paymentMethod: order.paymentMethod,
      itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
      createdAt: order.createdAt,
      message: "تم تأكيد الطلب (وضع التجربة)",
    }),
  }
}
