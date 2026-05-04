import { api } from "@/lib/api"
import type { ApiResponse } from "@/lib/types"

import type {
  CreateShipmentPayload,
  Shipment,
  ShipmentStatusEvent,
  TransitionShipmentInput,
} from "./types"

type ShipmentApiResponse = Shipment & {
  shipmentId: string
}

const normalizeShipment = (shipment: ShipmentApiResponse): Shipment => ({
  ...shipment,
  id: shipment.shipmentId,
})

export const listShipments = async (): Promise<Shipment[]> => {
  const response = await api<ApiResponse<ShipmentApiResponse[]>>("/admin/shipping/shipments")
  return response.data?.map(normalizeShipment) ?? []
}

export const getShipment = async (id: string): Promise<Shipment> => {
  const response = await api<ApiResponse<ShipmentApiResponse>>(`/admin/shipping/shipments/${id}`)
  return normalizeShipment(response.data!)
}

export const getShipmentEvents = async (id: string): Promise<ShipmentStatusEvent[]> => {
  const response = await api<ApiResponse<ShipmentStatusEvent[]>>(
    `/admin/shipping/shipments/${id}/events`
  )
  return response.data ?? []
}

export const transitionShipment = ({ id, data }: TransitionShipmentInput): Promise<void> =>
  api<void>(`/admin/shipping/shipments/${id}/transition`, {
    method: "POST",
    body: data,
  })

export const createShipment = async (
  payload: CreateShipmentPayload
): Promise<Shipment> => {
  const response = await api<ApiResponse<ShipmentApiResponse>>(
    "/admin/shipping/shipments",
    {
      method: "POST",
      body: payload,
    }
  )

  return normalizeShipment(response.data!)
}
