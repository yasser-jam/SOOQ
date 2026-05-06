export type ShipmentStatus =
  | "PENDING"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "READY_FOR_PICKUP_AT_OFFICE"
  | "DELIVERED"
  | "FAILED"
  | "RETURNED"

export interface ShipmentStatusEvent {
  shipmentStatusEventId?: string
  fromStatus?: ShipmentStatus | null
  toStatus?: ShipmentStatus
  actorUserId?: string | null
  createdAt?: string
}

export interface Shipment {
  id?: string
  shipmentId?: string
  orderId?: string
  tenantId?: string
  shippingProviderId?: string
  providerName?: string
  providerCode?: string
  originLat?: number
  originLng?: number
  destinationLat?: number
  destinationLng?: number
  shipmentStatus?: ShipmentStatus
  expectedCodAmountSyp?: number | null
  collectedCodAmountSyp?: number | null
  deliveredAt?: string | null
  carrierTrackingUrl?: string | null
  officePickupInstructions?: string | null
  createdAt?: string
  statusEvents?: ShipmentStatusEvent[]
}

export type TransitionShipmentPayload = {
  targetStatus: ShipmentStatus
}

export type TransitionShipmentInput = {
  id: string
  data: TransitionShipmentPayload
}

export interface CreateShipmentPayload {
  orderId: string
  shippingProviderId: string
  originLat: number
  originLng: number
  destinationLat: number
  destinationLng: number
  expectedCodAmountSyp?: number | null
}

// Client-side filters for the shipments list — backend currently returns the
// full List<ShipmentResponseDto> without query params, so filtering happens in
// memory. Forward-compatible: when the backend gains @RequestParam support,
// the action signature stays the same, only its URL changes.
export interface ShipmentFilters {
  status?: ShipmentStatus
  shippingProviderId?: string
  createdAtFrom?: string
  createdAtTo?: string
}
