import { api } from "@/lib/api"
import type { ShipmentStatus } from "@/lib/domain-enums"
import type { ApiResponse } from "@/lib/types"

export interface PublicShipmentStatusHistoryEntry {
  status: ShipmentStatus
  timestamp: string
}

export interface PublicShipmentTrackingResponse {
  shipmentId?: string
  orderId?: string
  shipmentStatus?: ShipmentStatus
  statusLabel?: string
  carrierTrackingUrl?: string | null
  officePickupInstructions?: string | null
  deliveredAt?: string | null
  createdAt?: string
  statusHistory?: PublicShipmentStatusHistoryEntry[]
}

export const publicShipmentTrackingQueryKey = (orderId: string) =>
  ["public", "shipping", "track", orderId] as const

// Returns null on 404 (no shipment yet for the order). Both the order-detail
// tracking card and the order-detail actions read this — React Query dedupes
// via the shared queryKey so this is a single network call per order detail.
//
// Defensive guard: callers should also use `enabled: Boolean(orderId)` on
// the useQuery to skip the fetch entirely while the param hydrates, but we
// short-circuit here too so a stray call never produces `/track/undefined`.
export const fetchPublicShipmentTracking = async (
  orderId: string | undefined | null
): Promise<PublicShipmentTrackingResponse | null> => {
  if (!orderId) return null

  try {
    const response = await api<ApiResponse<PublicShipmentTrackingResponse>>(
      `/public/shipping/track/${orderId}`
    )
    return response.data ?? null
  } catch (error) {
    const status = (error as { status?: number })?.status

    if (status === 404) return null

    throw error
  }
}
