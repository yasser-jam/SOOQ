import { getMockDb, newMockId, updateMockDb } from "../db"
import type {
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

/** Public sample PDF so download links work without a file store. */
const MOCK_INVOICE_PDF_URL =
  "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"

const toApi = (invoice: MockInvoiceRecord) => ({
  invoiceId: invoice.invoiceId,
  id: invoice.invoiceId,
  orderId: invoice.orderId,
  invoiceNumber: invoice.invoiceNumber,
  pdfUrl: invoice.pdfUrl,
  generatedAt: invoice.generatedAt,
})

const nextInvoiceNumber = (orderId: string): string => {
  const suffix = orderId.replace(/^mock-order-/, "") || Date.now().toString(36)
  return `INV-2026-${suffix}`
}

const findByOrderId = (orderId: string) =>
  getMockDb().invoices.find((item) => item.orderId === orderId)

/**
 * Admin invoices — list / generate / regenerate when mock mode is on.
 */
export const handleInvoicesMock = (request: MockRequest): MockHandlerResult => {
  const method = request.method.toUpperCase()
  const path = request.url.split("?")[0] ?? request.url

  if (method === "GET" && path === "/admin/invoices") {
    const sorted = [...getMockDb().invoices].sort((a, b) =>
      b.generatedAt.localeCompare(a.generatedAt)
    )
    return {
      handled: true,
      data: envelope(sorted.map(toApi)),
    }
  }

  const generateMatch = path.match(
    /^\/admin\/invoices\/generate\/([^/]+)$/
  )
  if (generateMatch && method === "POST") {
    const orderId = decodeURIComponent(generateMatch[1] ?? "")
    if (!orderId) {
      return {
        handled: true,
        error: {
          status: 400,
          message: "معرّف الطلب مطلوب",
          errorCode: "ERR_VALIDATION",
        },
      }
    }

    const existing = findByOrderId(orderId)
    if (existing) {
      return {
        handled: true,
        error: {
          status: 409,
          message: "الفاتورة موجودة مسبقاً — استخدم إعادة التوليد",
          errorCode: "ERR_CONFLICT",
        },
      }
    }

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

    return { handled: true, data: envelope(toApi(created)) }
  }

  const regenerateMatch = path.match(
    /^\/admin\/invoices\/regenerate\/([^/]+)$/
  )
  if (regenerateMatch && method === "POST") {
    const orderId = decodeURIComponent(regenerateMatch[1] ?? "")
    const existing = findByOrderId(orderId)

    if (!existing) {
      return {
        handled: true,
        error: {
          status: 404,
          message: "لا توجد فاتورة لهذا الطلب",
          errorCode: "ERR_NOT_FOUND",
        },
      }
    }

    const updated: MockInvoiceRecord = {
      ...existing,
      pdfUrl: MOCK_INVOICE_PDF_URL,
      generatedAt: new Date().toISOString(),
    }

    updateMockDb((db) => {
      db.invoices = db.invoices.map((item) =>
        item.orderId === orderId ? updated : item
      )
      return db
    })

    return { handled: true, data: envelope(toApi(updated)) }
  }

  return { handled: false }
}
