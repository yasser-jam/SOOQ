import { getMockDb, newMockId, updateMockDb } from "../db"
import type {
  MockCodReconciliationBatchRecord,
  MockCodSettlementStatus,
  MockHandlerResult,
  MockRequest,
} from "../types"

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

const parsePageParams = (
  url: string
): { page: number; size: number } => {
  const query = url.includes("?") ? url.split("?")[1] ?? "" : ""
  const params = new URLSearchParams(query)
  const page = Math.max(0, Number(params.get("page") ?? 0) || 0)
  const size = Math.max(1, Number(params.get("size") ?? 20) || 20)
  return { page, size }
}

const toApi = (batch: MockCodReconciliationBatchRecord) => ({
  batchId: batch.batchId,
  shippingProviderId: batch.shippingProviderId,
  providerCode: batch.providerCode,
  providerName: batch.providerName,
  orderCount: batch.orderCount,
  expectedTotalSyp: batch.expectedTotalSyp,
  collectedTotalSyp: batch.collectedTotalSyp,
  providerFeePercentage: batch.providerFeePercentage,
  providerFeeAmountSyp: batch.providerFeeAmountSyp,
  netSettlementSyp: batch.netSettlementSyp,
  settlementStatus: batch.settlementStatus,
  settlementDate: batch.settlementDate,
  reconciledByUserId: batch.reconciledByUserId,
  reconciledAt: batch.reconciledAt,
  notes: batch.notes,
})

const asStatus = (value: unknown): MockCodSettlementStatus | null => {
  if (value === "PENDING" || value === "SETTLED" || value === "DISPUTED") {
    return value
  }
  return null
}

const ALLOWED_TRANSITIONS: Record<
  MockCodSettlementStatus,
  MockCodSettlementStatus[]
> = {
  PENDING: ["SETTLED", "DISPUTED"],
  DISPUTED: ["SETTLED"],
  SETTLED: [],
}

/**
 * Finance COD reconciliation + collection entries when mock mode is on.
 */
export const handleCodMock = (request: MockRequest): MockHandlerResult => {
  const method = request.method.toUpperCase()
  const path = request.url.split("?")[0] ?? request.url

  if (method === "GET" && path === "/admin/shipping/cod/reconciliation") {
    const { page, size } = parsePageParams(request.url)
    const all = getMockDb().codReconciliationBatches.map(toApi)
    const start = page * size
    const content = all.slice(start, start + size)
    return {
      handled: true,
      data: envelope({
        content,
        items: content,
        totalElements: all.length,
        totalItems: all.length,
        totalPages: Math.max(1, Math.ceil(all.length / size)),
        page,
        number: page,
        size,
      }),
    }
  }

  if (method === "POST" && path === "/admin/shipping/cod/reconciliation") {
    const body = readBody(request.body)
    const shippingProviderId = String(body.shippingProviderId ?? "").trim()
    const settlementDate = String(body.settlementDate ?? "").trim()
    const providerFeePercentage = Number(body.providerFeePercentage ?? 0)
    const notes =
      typeof body.notes === "string" && body.notes.trim()
        ? body.notes.trim()
        : undefined

    if (!shippingProviderId) {
      return {
        handled: true,
        error: {
          status: 400,
          message: "الرجاء اختيار مزود الشحن",
          errorCode: "ERR_VALIDATION",
          fieldKey: "shippingProviderId",
        },
      }
    }
    if (!settlementDate) {
      return {
        handled: true,
        error: {
          status: 400,
          message: "الرجاء اختيار التاريخ",
          errorCode: "ERR_VALIDATION",
          fieldKey: "settlementDate",
        },
      }
    }
    if (
      !Number.isFinite(providerFeePercentage) ||
      providerFeePercentage < 0 ||
      providerFeePercentage > 100
    ) {
      return {
        handled: true,
        error: {
          status: 400,
          message: "نسبة العمولة غير صالحة",
          errorCode: "ERR_VALIDATION",
          fieldKey: "providerFeePercentage",
        },
      }
    }

    const db = getMockDb()
    const provider = db.shippingProviders.find(
      (item) => item.shippingProviderId === shippingProviderId
    )
    if (!provider) {
      return {
        handled: true,
        error: {
          status: 404,
          message: "مزود الشحن غير موجود",
          errorCode: "ERR_NOT_FOUND",
        },
      }
    }

    const matching = db.shipments.filter(
      (shipment) =>
        shipment.shippingProviderId === shippingProviderId &&
        shipment.shipmentStatus === "DELIVERED" &&
        shipment.deliveredAt?.startsWith(settlementDate)
    )

    const expectedTotalSyp = matching.reduce(
      (sum, shipment) => sum + (shipment.expectedCodAmountSyp ?? 0),
      0
    )
    const collectedTotalSyp = matching.reduce(
      (sum, shipment) => sum + (shipment.collectedCodAmountSyp ?? 0),
      0
    )
    const providerFeeAmountSyp = Math.round(
      (expectedTotalSyp * providerFeePercentage) / 100
    )

    const created: MockCodReconciliationBatchRecord = {
      batchId: newMockId("mock-cod-batch"),
      shippingProviderId: provider.shippingProviderId,
      providerCode: provider.providerCode,
      providerName: provider.providerName,
      orderCount: matching.length,
      expectedTotalSyp,
      collectedTotalSyp,
      providerFeePercentage,
      providerFeeAmountSyp,
      netSettlementSyp: collectedTotalSyp - providerFeeAmountSyp,
      settlementStatus: "PENDING",
      settlementDate,
      reconciledByUserId: db.user.userId,
      reconciledAt: new Date().toISOString(),
      notes,
    }

    updateMockDb((next) => {
      next.codReconciliationBatches = [
        created,
        ...next.codReconciliationBatches,
      ]
      return next
    })

    return { handled: true, data: envelope(toApi(created)) }
  }

  const statusMatch = path.match(
    /^\/admin\/shipping\/cod\/reconciliation\/([^/]+)\/status$/
  )
  if (method === "PUT" && statusMatch) {
    const id = decodeURIComponent(statusMatch[1] ?? "")
    const body = readBody(request.body)
    const nextStatus = asStatus(body.status)
    if (!nextStatus) {
      return {
        handled: true,
        error: {
          status: 400,
          message: "حالة التسوية غير صالحة",
          errorCode: "ERR_VALIDATION",
          fieldKey: "status",
        },
      }
    }

    const existing = getMockDb().codReconciliationBatches.find(
      (item) => item.batchId === id
    )
    if (!existing) {
      return {
        handled: true,
        error: {
          status: 404,
          message: "دفعة التسوية غير موجودة",
          errorCode: "ERR_NOT_FOUND",
        },
      }
    }

    const allowed = ALLOWED_TRANSITIONS[existing.settlementStatus]
    if (!allowed.includes(nextStatus)) {
      return {
        handled: true,
        error: {
          status: 409,
          message: "لا يمكن التحويل إلى هذه الحالة",
          errorCode: "ERR_CONFLICT",
        },
      }
    }

    const updated: MockCodReconciliationBatchRecord = {
      ...existing,
      settlementStatus: nextStatus,
    }

    updateMockDb((next) => {
      next.codReconciliationBatches = next.codReconciliationBatches.map(
        (item) => (item.batchId === id ? updated : item)
      )
      return next
    })

    return { handled: true, data: envelope(toApi(updated)) }
  }

  const entriesMatch = path.match(/^\/admin\/shipping\/cod\/entries\/([^/]+)$/)
  if (method === "GET" && entriesMatch) {
    const shipmentId = decodeURIComponent(entriesMatch[1] ?? "")
    const entries = getMockDb().codEntries.filter(
      (entry) => entry.shipmentId === shipmentId
    )
    return {
      handled: true,
      data: envelope(
        entries.map((entry) => ({
          codCollectionEntryId: entry.codCollectionEntryId,
          shipmentId: entry.shipmentId,
          paymentTxnId: entry.paymentTxnId,
          expectedAmountSyp: entry.expectedAmountSyp,
          collectedAmountSyp: entry.collectedAmountSyp,
          collectedAt: entry.collectedAt,
        }))
      ),
    }
  }

  return { handled: false }
}
