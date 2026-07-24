import type {
  MockCodCollectionEntryRecord,
  MockCodReconciliationBatchRecord,
  MockShipmentRecord,
  MockShippingProviderRecord,
} from "./types"

/** Matches `MOCK_USER_ID` in seed.ts — keep in sync (avoid circular import). */
const MOCK_OWNER_USER_ID = "mock-owner-user"

/** Fixed provider ids so batches / shipments stay linked across reloads. */
export const MOCK_PROVIDER_DHL_ID = "mock-provider-dhl"
export const MOCK_PROVIDER_LOCAL_ID = "mock-provider-local"

export const MOCK_SHIPMENT_1_ID = "mock-shipment-cod-1"
export const MOCK_SHIPMENT_2_ID = "mock-shipment-cod-2"
export const MOCK_SHIPMENT_3_ID = "mock-shipment-cod-3"
export const MOCK_SHIPMENT_4_ID = "mock-shipment-cod-4"

const daysAgoYmd = (days: number): string => {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

const daysAgoIso = (days: number, hour = 14): string => {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(hour, 30, 0, 0)
  return d.toISOString()
}

export const seedMockShippingProviders = (): MockShippingProviderRecord[] => {
  const now = new Date().toISOString()
  return [
    {
      shippingProviderId: MOCK_PROVIDER_DHL_ID,
      providerCode: "DHL_SY",
      providerName: "DHL سوريا",
      apiBaseUrl: "https://api.example-dhl.test",
      priority: 10,
      hasApiKey: true,
      hasWebhookSecret: true,
      isActive: true,
      createdAt: daysAgoIso(60),
      updatedAt: now,
    },
    {
      shippingProviderId: MOCK_PROVIDER_LOCAL_ID,
      providerCode: "LOCAL_EXPRESS",
      providerName: "توصيل محلي سريع",
      apiBaseUrl: "",
      priority: 5,
      hasApiKey: false,
      hasWebhookSecret: false,
      isActive: true,
      createdAt: daysAgoIso(45),
      updatedAt: now,
    },
  ]
}

/**
 * Delivered shipments aligned with seed COD batches (same provider + calendar day).
 * Extra PENDING/IN_TRANSIT rows keep the shipments list realistic.
 */
export const seedMockShipments = (): MockShipmentRecord[] => {
  const settleDay = daysAgoYmd(3)
  const settleDayOlder = daysAgoYmd(10)

  return [
    {
      shipmentId: MOCK_SHIPMENT_1_ID,
      orderId: "mock-order-1001",
      shippingProviderId: MOCK_PROVIDER_DHL_ID,
      providerCode: "DHL_SY",
      providerName: "DHL سوريا",
      originLat: 33.5138,
      originLng: 36.2765,
      destinationLat: 33.51,
      destinationLng: 36.29,
      shipmentStatus: "DELIVERED",
      expectedCodAmountSyp: 150_000,
      collectedCodAmountSyp: 150_000,
      deliveredAt: `${settleDay}T14:20:00.000Z`,
      createdAt: daysAgoIso(5),
    },
    {
      shipmentId: MOCK_SHIPMENT_2_ID,
      orderId: "mock-order-1002",
      shippingProviderId: MOCK_PROVIDER_DHL_ID,
      providerCode: "DHL_SY",
      providerName: "DHL سوريا",
      originLat: 33.5138,
      originLng: 36.2765,
      destinationLat: 33.48,
      destinationLng: 36.31,
      shipmentStatus: "DELIVERED",
      expectedCodAmountSyp: 85_000,
      collectedCodAmountSyp: 80_000,
      deliveredAt: `${settleDay}T16:05:00.000Z`,
      createdAt: daysAgoIso(5),
    },
    {
      shipmentId: MOCK_SHIPMENT_3_ID,
      orderId: "mock-order-1003",
      shippingProviderId: MOCK_PROVIDER_LOCAL_ID,
      providerCode: "LOCAL_EXPRESS",
      providerName: "توصيل محلي سريع",
      originLat: 33.5138,
      originLng: 36.2765,
      destinationLat: 33.52,
      destinationLng: 36.28,
      shipmentStatus: "DELIVERED",
      expectedCodAmountSyp: 220_000,
      collectedCodAmountSyp: 220_000,
      deliveredAt: `${settleDayOlder}T11:00:00.000Z`,
      createdAt: daysAgoIso(12),
    },
    {
      shipmentId: MOCK_SHIPMENT_4_ID,
      orderId: "mock-order-1004",
      shippingProviderId: MOCK_PROVIDER_DHL_ID,
      providerCode: "DHL_SY",
      providerName: "DHL سوريا",
      originLat: 33.5138,
      originLng: 36.2765,
      destinationLat: 33.49,
      destinationLng: 36.3,
      shipmentStatus: "IN_TRANSIT",
      expectedCodAmountSyp: 95_000,
      collectedCodAmountSyp: null,
      deliveredAt: null,
      createdAt: daysAgoIso(1),
    },
  ]
}

export const seedMockCodReconciliationBatches =
  (): MockCodReconciliationBatchRecord[] => {
    const settleDay = daysAgoYmd(3)
    const settleDayOlder = daysAgoYmd(10)
    const feePctDhl = 5
    const expectedDhl = 235_000
    const collectedDhl = 230_000
    const feeDhl = Math.round((expectedDhl * feePctDhl) / 100)

    const feePctLocal = 3
    const expectedLocal = 220_000
    const collectedLocal = 220_000
    const feeLocal = Math.round((expectedLocal * feePctLocal) / 100)

    return [
      {
        batchId: "mock-cod-batch-pending",
        shippingProviderId: MOCK_PROVIDER_DHL_ID,
        providerCode: "DHL_SY",
        providerName: "DHL سوريا",
        orderCount: 2,
        expectedTotalSyp: expectedDhl,
        collectedTotalSyp: collectedDhl,
        providerFeePercentage: feePctDhl,
        providerFeeAmountSyp: feeDhl,
        netSettlementSyp: collectedDhl - feeDhl,
        settlementStatus: "PENDING",
        settlementDate: settleDay,
        reconciledByUserId: MOCK_OWNER_USER_ID,
        reconciledAt: daysAgoIso(2),
        notes: "دفعة تجريبية قيد التسوية — فرق بسيط في التحصيل",
      },
      {
        batchId: "mock-cod-batch-settled",
        shippingProviderId: MOCK_PROVIDER_LOCAL_ID,
        providerCode: "LOCAL_EXPRESS",
        providerName: "توصيل محلي سريع",
        orderCount: 1,
        expectedTotalSyp: expectedLocal,
        collectedTotalSyp: collectedLocal,
        providerFeePercentage: feePctLocal,
        providerFeeAmountSyp: feeLocal,
        netSettlementSyp: collectedLocal - feeLocal,
        settlementStatus: "SETTLED",
        settlementDate: settleDayOlder,
        reconciledByUserId: MOCK_OWNER_USER_ID,
        reconciledAt: daysAgoIso(8),
        notes: "تمت التسوية بالكامل",
      },
      {
        batchId: "mock-cod-batch-disputed",
        shippingProviderId: MOCK_PROVIDER_DHL_ID,
        providerCode: "DHL_SY",
        providerName: "DHL سوريا",
        orderCount: 1,
        expectedTotalSyp: 50_000,
        collectedTotalSyp: 40_000,
        providerFeePercentage: 5,
        providerFeeAmountSyp: 2_500,
        netSettlementSyp: 37_500,
        settlementStatus: "DISPUTED",
        settlementDate: daysAgoYmd(20),
        reconciledByUserId: MOCK_OWNER_USER_ID,
        reconciledAt: daysAgoIso(18),
        notes: "خلاف على مبلغ التحصيل — قيد المراجعة",
      },
    ]
  }

export const seedMockCodEntries = (): MockCodCollectionEntryRecord[] => [
  {
    codCollectionEntryId: "mock-cod-entry-1",
    shipmentId: MOCK_SHIPMENT_1_ID,
    paymentTxnId: "TXN-MOCK-9001",
    expectedAmountSyp: 150_000,
    collectedAmountSyp: 150_000,
    collectedAt: daysAgoIso(3, 14),
  },
  {
    codCollectionEntryId: "mock-cod-entry-2",
    shipmentId: MOCK_SHIPMENT_2_ID,
    paymentTxnId: "TXN-MOCK-9002",
    expectedAmountSyp: 85_000,
    collectedAmountSyp: 80_000,
    collectedAt: daysAgoIso(3, 16),
  },
  {
    codCollectionEntryId: "mock-cod-entry-3",
    shipmentId: MOCK_SHIPMENT_3_ID,
    paymentTxnId: "TXN-MOCK-9003",
    expectedAmountSyp: 220_000,
    collectedAmountSyp: 220_000,
    collectedAt: daysAgoIso(10, 11),
  },
]
