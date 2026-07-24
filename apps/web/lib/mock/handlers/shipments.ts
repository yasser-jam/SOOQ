import { getMockDb } from "../db"
import type {
  MockHandlerResult,
  MockRequest,
  MockShipmentRecord,
} from "../types"

const envelope = <T>(data: T) => ({
  success: true,
  data,
  message: null,
  timestamp: Date.now(),
})

const toApi = (shipment: MockShipmentRecord) => ({
  shipmentId: shipment.shipmentId,
  orderId: shipment.orderId,
  shippingProviderId: shipment.shippingProviderId,
  providerCode: shipment.providerCode,
  providerName: shipment.providerName,
  originLat: shipment.originLat,
  originLng: shipment.originLng,
  destinationLat: shipment.destinationLat,
  destinationLng: shipment.destinationLng,
  shipmentStatus: shipment.shipmentStatus,
  expectedCodAmountSyp: shipment.expectedCodAmountSyp,
  collectedCodAmountSyp: shipment.collectedCodAmountSyp,
  deliveredAt: shipment.deliveredAt,
  createdAt: shipment.createdAt,
})

/**
 * Shipments list/detail — used by COD batch detail + COD entries pages.
 */
export const handleShipmentsMock = (
  request: MockRequest
): MockHandlerResult => {
  const method = request.method.toUpperCase()
  const path = request.url.split("?")[0] ?? request.url

  if (method === "GET" && path === "/admin/shipping/shipments") {
    return {
      handled: true,
      data: envelope(getMockDb().shipments.map(toApi)),
    }
  }

  const detailMatch = path.match(/^\/admin\/shipping\/shipments\/([^/]+)$/)
  if (method === "GET" && detailMatch) {
    const id = decodeURIComponent(detailMatch[1] ?? "")
    const shipment = getMockDb().shipments.find(
      (item) => item.shipmentId === id
    )
    if (!shipment) {
      return {
        handled: true,
        error: {
          status: 404,
          message: "الشحنة غير موجودة",
          errorCode: "ERR_NOT_FOUND",
        },
      }
    }
    return { handled: true, data: envelope(toApi(shipment)) }
  }

  return { handled: false }
}
