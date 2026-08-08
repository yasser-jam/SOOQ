import { getMockDb, newMockId, updateMockDb } from "../db"
import type {
  MockCustomerOrderRecord,
  MockHandlerResult,
  MockInvoiceRecord,
  MockRequest,
} from "../types"

const envelope = <T>(data: T) => ({
  success: true,
  data,
  message: null,
  timestamp: Date.now(),
})

const MOCK_INVOICE_PDF_URL =
  "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"

const readBody = (body: unknown): Record<string, unknown> => {
  if (!body || typeof body !== "object" || body instanceof FormData) return {}
  return body as Record<string, unknown>
}

const parsePageParams = (url: string) => {
  const query = url.includes("?") ? url.split("?")[1] ?? "" : ""
  const params = new URLSearchParams(query)
  const page = Math.max(0, Number(params.get("page") ?? 0) || 0)
  const size = Math.max(1, Number(params.get("size") ?? 20) || 20)
  return { page, size }
}

const nextInvoiceNumber = (orderId: string): string => {
  const suffix = orderId.replace(/^mock-order-/, "") || Date.now().toString(36)
  return `INV-2026-${suffix}`
}

const findInvoiceByOrderId = (orderId: string) =>
  getMockDb().invoices.find((item) => item.orderId === orderId)

function ensureInvoice(orderId: string): MockInvoiceRecord {
  const existing = findInvoiceByOrderId(orderId)
  if (existing) return existing

  const created: MockInvoiceRecord = {
    invoiceId: newMockId("mock-invoice"),
    orderId,
    invoiceNumber: nextInvoiceNumber(orderId),
    pdfUrl: MOCK_INVOICE_PDF_URL,
    generatedAt: new Date().toISOString(),
  }

  updateMockDb((db) => {
    db.invoices = [created, ...db.invoices]
    return db
  })

  return created
}

type MockCustomerOrder = MockCustomerOrderRecord

function toListItem(order: MockCustomerOrder) {
  return {
    orderId: order.orderId,
    tenantId: order.tenantId,
    orderNumber: order.orderNumber,
    orderStatus: order.orderStatus,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    subtotal: order.subtotal,
    discountAmount: order.discountAmount,
    taxAmount: order.taxAmount,
    total: order.total,
    itemCount: order.itemCount,
    placedAt: order.placedAt,
  }
}

function toDetail(order: MockCustomerOrder) {
  return {
    orderId: order.orderId,
    orderNumber: order.orderNumber,
    orderStatus: order.orderStatus,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    currencyCode: "SYP",
    subtotal: order.subtotal,
    discountAmount: order.discountAmount,
    taxAmount: order.taxAmount,
    shippingCost: order.shippingCost,
    total: order.total,
    shippingAddress: order.shippingAddress,
    notesCustomer: order.notesCustomer ?? null,
    placedAt: order.placedAt,
    items: order.items,
    timeline: order.timeline,
  }
}

function mapCheckoutOrder(order: {
  orderId: string
  tenantId: string
  createdAt: string
  status: string
  paymentMethod: "COD"
  items: Array<{ variantId: string; quantity: number }>
  shippingAddress: MockCustomerOrder["shippingAddress"]
}): MockCustomerOrder {
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0)
  const unitPrice = 25_000
  const subtotal = itemCount * unitPrice
  const suffix = order.orderId.slice(-4)

  return {
    orderId: order.orderId,
    tenantId: order.tenantId,
    orderNumber: `ORD-${suffix}`,
    orderStatus: order.status === "CONFIRMED" ? "PROCESSING" : "PENDING",
    paymentStatus: "PAID",
    paymentMethod: order.paymentMethod,
    subtotal,
    discountAmount: 0,
    taxAmount: 0,
    shippingCost: 5_000,
    total: subtotal + 5_000,
    itemCount,
    placedAt: order.createdAt,
    shippingAddress: order.shippingAddress,
    notesCustomer: null,
    items: order.items.map((item, index) => ({
      orderItemId: `${order.orderId}-item-${index + 1}`,
      productTitle: `منتج ${item.variantId.slice(-4)}`,
      sku: `SKU-${item.variantId.slice(-4)}`,
      quantity: item.quantity,
      unitPrice,
      totalPrice: unitPrice * item.quantity,
    })),
    timeline: [
      {
        timelineId: `${order.orderId}-tl-1`,
        action: "ORDER_CREATED",
        actor: "CUSTOMER",
        details: null,
        createdAt: order.createdAt,
      },
    ],
  }
}

function listMockCustomerOrders(): MockCustomerOrder[] {
  const db = getMockDb()
  const checkoutOrders = (db.orders ?? []).map(mapCheckoutOrder)
  const seeded = db.customerOrders ?? []
  return [...seeded, ...checkoutOrders].sort((a, b) =>
    b.placedAt.localeCompare(a.placedAt)
  )
}

/**
 * Storefront customer orders — list, detail, invoice, cancel, and returns.
 */
export const handleCustomerOrdersMock = (
  request: MockRequest
): MockHandlerResult => {
  const method = request.method.toUpperCase()
  const path = request.url.split("?")[0] ?? request.url

  if (method === "GET" && path === "/customer/orders") {
    const { page, size } = parsePageParams(request.url)
    const all = listMockCustomerOrders()
    const start = page * size
    const items = all.slice(start, start + size).map(toListItem)
    const totalPages = Math.max(1, Math.ceil(all.length / size))

    return {
      handled: true,
      data: envelope({
        content: items,
        totalElements: all.length,
        totalPages,
        number: page,
        size,
        first: page === 0,
        last: page >= totalPages - 1,
      }),
    }
  }

  const detailMatch = path.match(/^\/customer\/orders\/([^/]+)$/)
  if (detailMatch && method === "GET") {
    const orderId = decodeURIComponent(detailMatch[1] ?? "")
    const order = listMockCustomerOrders().find((item) => item.orderId === orderId)
    if (!order) {
      return {
        handled: true,
        error: {
          status: 404,
          message: "تعذّر العثور على الطلب.",
          errorCode: "ERR_NOT_FOUND",
        },
      }
    }
    return { handled: true, data: envelope(toDetail(order)) }
  }

  const invoiceMatch = path.match(/^\/customer\/orders\/([^/]+)\/invoice$/)
  if (invoiceMatch && method === "GET") {
    const orderId = decodeURIComponent(invoiceMatch[1] ?? "")
    const order = listMockCustomerOrders().find((item) => item.orderId === orderId)
    if (!order) {
      return {
        handled: true,
        error: {
          status: 404,
          message: "تعذّر العثور على الطلب.",
          errorCode: "ERR_NOT_FOUND",
        },
      }
    }

    const invoice = ensureInvoice(orderId)
    return {
      handled: true,
      data: envelope({
        invoiceId: invoice.invoiceId,
        orderId: invoice.orderId,
        invoiceNumber: invoice.invoiceNumber,
        pdfUrl: invoice.pdfUrl,
        generatedAt: invoice.generatedAt,
      }),
    }
  }

  const cancelMatch = path.match(/^\/customer\/orders\/([^/]+)\/cancel$/)
  if (cancelMatch && method === "POST") {
    const orderId = decodeURIComponent(cancelMatch[1] ?? "")
    const order = listMockCustomerOrders().find((item) => item.orderId === orderId)
    if (!order) {
      return {
        handled: true,
        error: {
          status: 404,
          message: "تعذّر العثور على الطلب.",
          errorCode: "ERR_NOT_FOUND",
        },
      }
    }

    updateMockDb((db) => {
      if (Array.isArray(db.customerOrders)) {
        db.customerOrders = db.customerOrders.map((entry) =>
          entry.orderId === orderId
            ? { ...entry, orderStatus: "CANCELLED" }
            : entry
        )
      }
      db.orders = db.orders.map((entry) =>
        entry.orderId === orderId ? { ...entry, status: "PENDING" } : entry
      )
      return db
    })

    readBody(request.body)
    return { handled: true, data: envelope({ orderId, orderStatus: "CANCELLED" }) }
  }

  if (method === "POST" && path === "/customer/returns") {
    const body = readBody(request.body)
    const orderId = String(body.orderId ?? "").trim()
    const items = Array.isArray(body.items) ? body.items : []
    if (!orderId || items.length === 0) {
      return {
        handled: true,
        error: {
          status: 400,
          message: "بيانات طلب الإرجاع غير مكتملة",
          errorCode: "ERR_VALIDATION",
        },
      }
    }

    return {
      handled: true,
      data: envelope({
        returnRequestId: newMockId("mock-return"),
        orderId,
        status: "PENDING",
      }),
    }
  }

  return { handled: false }
}
