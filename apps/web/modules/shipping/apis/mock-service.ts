import { SHIPMENT_STATUS_TRANSITIONS } from "../shipment/model"
import type { ShipmentStatus } from "../shipment/types"
import type { CodSettlementStatus } from "../cod/types"

type MockShippingProvider = {
  shippingProviderId: string
  providerCode: string
  providerName: string
  apiBaseUrl?: string
  priority?: number
  hasApiKey?: boolean
  hasWebhookSecret?: boolean
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
}

type MockShipmentStatusEvent = {
  shipmentStatusEventId: string
  fromStatus: ShipmentStatus | null
  toStatus: ShipmentStatus
  actorUserId: string | null
  createdAt: string
}

type MockShipment = {
  shipmentId: string
  orderId: string
  tenantId?: string
  shippingProviderId: string
  providerName?: string
  providerCode?: string
  shipmentStatus: ShipmentStatus
  expectedCodAmountSyp?: number | null
  collectedCodAmountSyp?: number | null
  deliveredAt?: string | null
  carrierTrackingUrl?: string | null
  officePickupInstructions?: string | null
  createdAt?: string
}

type MockCodBatch = {
  batchId: string
  shippingProviderId: string
  providerCode?: string
  providerName?: string
  orderCount: number
  expectedTotalSyp: number
  collectedTotalSyp: number
  providerFeePercentage: number
  providerFeeAmountSyp: number
  netSettlementSyp: number
  settlementStatus: CodSettlementStatus
  settlementDate: string
  reconciledByUserId?: string
  reconciledAt?: string
  notes?: string
}

const nowIso = () => new Date().toISOString()
const dateOnly = (value: Date) => value.toISOString().slice(0, 10)

let providerSeq = 2
let shipmentSeq = 3
let codSeq = 1
let eventSeq = 10

const providers: MockShippingProvider[] = [
  {
    shippingProviderId: "prov-1",
    providerCode: "DAMASCUS_EXPRESS",
    providerName: "دمشق إكسبريس",
    apiBaseUrl: "https://api.mock-3pl.sy/v1",
    priority: 10,
    hasApiKey: true,
    hasWebhookSecret: true,
    isActive: true,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
  {
    shippingProviderId: "prov-2",
    providerCode: "ALEPPO_FAST",
    providerName: "حلب السريع",
    apiBaseUrl: "https://api.aleppo-fast.sy/v1",
    priority: 20,
    hasApiKey: false,
    hasWebhookSecret: false,
    isActive: true,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  },
]

const shipments: MockShipment[] = [
  {
    shipmentId: "ship-1",
    orderId: "order-1001",
    shippingProviderId: "prov-1",
    providerCode: "DAMASCUS_EXPRESS",
    providerName: "دمشق إكسبريس",
    shipmentStatus: "PENDING",
    expectedCodAmountSyp: 50000,
    collectedCodAmountSyp: 0,
    createdAt: nowIso(),
    carrierTrackingUrl: "https://track.mock-3pl.sy/ABC123",
  },
  {
    shipmentId: "ship-2",
    orderId: "order-1002",
    shippingProviderId: "prov-1",
    providerCode: "DAMASCUS_EXPRESS",
    providerName: "دمشق إكسبريس",
    shipmentStatus: "IN_TRANSIT",
    expectedCodAmountSyp: 120000,
    collectedCodAmountSyp: 0,
    createdAt: nowIso(),
    carrierTrackingUrl: "https://track.mock-3pl.sy/DEF456",
  },
  {
    shipmentId: "ship-3",
    orderId: "order-1003",
    shippingProviderId: "prov-2",
    providerCode: "ALEPPO_FAST",
    providerName: "حلب السريع",
    shipmentStatus: "DELIVERED",
    expectedCodAmountSyp: null,
    collectedCodAmountSyp: null,
    createdAt: nowIso(),
    deliveredAt: nowIso(),
    carrierTrackingUrl: "https://track.mock-3pl.sy/GHI789",
  },
]

const shipmentEventsById: Record<string, MockShipmentStatusEvent[]> = {
  "ship-1": [
    {
      shipmentStatusEventId: "evt-1",
      fromStatus: null,
      toStatus: "PENDING",
      actorUserId: null,
      createdAt: nowIso(),
    },
  ],
  "ship-2": [
    {
      shipmentStatusEventId: "evt-2",
      fromStatus: null,
      toStatus: "PENDING",
      actorUserId: null,
      createdAt: nowIso(),
    },
    {
      shipmentStatusEventId: "evt-3",
      fromStatus: "PENDING",
      toStatus: "PICKED_UP",
      actorUserId: "user-mock",
      createdAt: nowIso(),
    },
    {
      shipmentStatusEventId: "evt-4",
      fromStatus: "PICKED_UP",
      toStatus: "IN_TRANSIT",
      actorUserId: "user-mock",
      createdAt: nowIso(),
    },
  ],
  "ship-3": [
    {
      shipmentStatusEventId: "evt-5",
      fromStatus: null,
      toStatus: "PENDING",
      actorUserId: null,
      createdAt: nowIso(),
    },
    {
      shipmentStatusEventId: "evt-6",
      fromStatus: "PENDING",
      toStatus: "PICKED_UP",
      actorUserId: "user-mock",
      createdAt: nowIso(),
    },
    {
      shipmentStatusEventId: "evt-7",
      fromStatus: "PICKED_UP",
      toStatus: "IN_TRANSIT",
      actorUserId: "user-mock",
      createdAt: nowIso(),
    },
    {
      shipmentStatusEventId: "evt-8",
      fromStatus: "IN_TRANSIT",
      toStatus: "DELIVERED",
      actorUserId: "user-mock",
      createdAt: nowIso(),
    },
  ],
}

const codBatches: MockCodBatch[] = [
  {
    batchId: "batch-1",
    shippingProviderId: "prov-1",
    providerCode: "DAMASCUS_EXPRESS",
    providerName: "دمشق إكسبريس",
    orderCount: 2,
    expectedTotalSyp: 170000,
    collectedTotalSyp: 0,
    providerFeePercentage: 5,
    providerFeeAmountSyp: 0,
    netSettlementSyp: 0,
    settlementStatus: "PENDING",
    settlementDate: dateOnly(new Date()),
    reconciledByUserId: "user-mock",
    reconciledAt: nowIso(),
    notes: "Mock batch",
  },
]

export const listMockShippingProviders = (): MockShippingProvider[] => providers

export const getMockShippingProvider = (id: string): MockShippingProvider | undefined =>
  providers.find((p) => p.shippingProviderId === id)

export const createMockShippingProvider = (
  input: Pick<MockShippingProvider, "providerCode" | "providerName"> &
    Partial<Pick<MockShippingProvider, "apiBaseUrl" | "priority">>
): MockShippingProvider => {
  providerSeq += 1
  const shippingProviderId = `prov-${providerSeq}`
  const created: MockShippingProvider = {
    shippingProviderId,
    providerCode: input.providerCode,
    providerName: input.providerName,
    apiBaseUrl: input.apiBaseUrl,
    priority: input.priority ?? 10,
    hasApiKey: false,
    hasWebhookSecret: false,
    isActive: true,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }
  providers.unshift(created)
  return created
}

export const updateMockShippingProvider = (
  id: string,
  data: Partial<MockShippingProvider>
): MockShippingProvider | undefined => {
  const index = providers.findIndex((p) => p.shippingProviderId === id)
  if (index < 0) return undefined

  const current = providers[index]
  if (!current) return undefined

  const updated: MockShippingProvider = {
    ...current,
    ...data,
    shippingProviderId: current.shippingProviderId,
    updatedAt: nowIso(),
  }

  providers[index] = updated
  return updated
}

export const deleteMockShippingProvider = (id: string): boolean => {
  const index = providers.findIndex((p) => p.shippingProviderId === id)
  if (index < 0) return false
  providers.splice(index, 1)
  return true
}

export const listMockShipments = (): MockShipment[] => shipments

export const getMockShipment = (id: string): (MockShipment & { statusEvents?: MockShipmentStatusEvent[] }) | undefined => {
  const shipment = shipments.find((s) => s.shipmentId === id)
  if (!shipment) return undefined
  return {
    ...shipment,
    statusEvents: shipmentEventsById[id] ?? [],
  }
}

export const listMockShipmentEvents = (shipmentId: string): MockShipmentStatusEvent[] =>
  shipmentEventsById[shipmentId] ?? []

export const transitionMockShipment = (
  shipmentId: string,
  targetStatus: ShipmentStatus
): { ok: true } | { ok: false; status: number; errorCode: string; message: string } => {
  const shipment = shipments.find((s) => s.shipmentId === shipmentId)
  if (!shipment) {
    return { ok: false, status: 404, errorCode: "ERR_8002", message: "Shipment not found" }
  }

  const fromStatus = shipment.shipmentStatus
  const allowed = SHIPMENT_STATUS_TRANSITIONS[fromStatus] ?? []
  if (!allowed.includes(targetStatus)) {
    return {
      ok: false,
      status: 400,
      errorCode: "ERR_8000",
      message: "Invalid shipment transition",
    }
  }

  shipment.shipmentStatus = targetStatus
  if (targetStatus === "DELIVERED") {
    shipment.deliveredAt = nowIso()
  }

  eventSeq += 1
  const evt: MockShipmentStatusEvent = {
    shipmentStatusEventId: `evt-${eventSeq}`,
    fromStatus,
    toStatus: targetStatus,
    actorUserId: "user-mock",
    createdAt: nowIso(),
  }

  shipmentEventsById[shipmentId] = [...(shipmentEventsById[shipmentId] ?? []), evt]

  return { ok: true }
}

export const listMockCodReconciliationBatches = (params: { page?: number; size?: number }) => {
  const page = Number.isFinite(params.page) ? (params.page as number) : 0
  const size = Number.isFinite(params.size) ? (params.size as number) : 20

  const totalItems = codBatches.length
  const totalPages = Math.max(1, Math.ceil(totalItems / size))
  const safePage = Math.max(0, Math.min(page, totalPages - 1))

  const start = safePage * size
  const items = codBatches.slice(start, start + size)

  return {
    items,
    totalItems,
    totalElements: totalItems,
    totalPages,
    page: safePage,
    number: safePage,
    size,
  }
}

export const createMockCodReconciliationBatch = (payload: {
  shippingProviderId: string
  providerFeePercentage: number
  settlementDate: string
  notes?: string
}): MockCodBatch => {
  codSeq += 1
  const batchId = `batch-${codSeq}`

  const provider = getMockShippingProvider(payload.shippingProviderId)
  const relatedShipments = shipments.filter(
    (s) =>
      s.shippingProviderId === payload.shippingProviderId &&
      typeof s.expectedCodAmountSyp === "number" &&
      (s.expectedCodAmountSyp ?? 0) > 0
  )

  const expectedTotalSyp = relatedShipments.reduce(
    (sum, s) => sum + (s.expectedCodAmountSyp ?? 0),
    0
  )
  const collectedTotalSyp = relatedShipments.reduce(
    (sum, s) => sum + (s.collectedCodAmountSyp ?? 0),
    0
  )

  const providerFeePercentage = payload.providerFeePercentage
  const providerFeeAmountSyp = Math.round((expectedTotalSyp * providerFeePercentage) / 100)
  const netSettlementSyp = expectedTotalSyp - providerFeeAmountSyp

  const created: MockCodBatch = {
    batchId,
    shippingProviderId: payload.shippingProviderId,
    providerCode: provider?.providerCode,
    providerName: provider?.providerName,
    orderCount: relatedShipments.length,
    expectedTotalSyp,
    collectedTotalSyp,
    providerFeePercentage,
    providerFeeAmountSyp,
    netSettlementSyp,
    settlementStatus: "PENDING",
    settlementDate: payload.settlementDate,
    reconciledByUserId: "user-mock",
    reconciledAt: nowIso(),
    notes: payload.notes,
  }

  codBatches.unshift(created)
  return created
}

export const updateMockCodReconciliationStatus = (
  batchId: string,
  status: CodSettlementStatus
): boolean => {
  const batch = codBatches.find((b) => b.batchId === batchId)
  if (!batch) return false
  batch.settlementStatus = status
  batch.reconciledAt = nowIso()
  return true
}
