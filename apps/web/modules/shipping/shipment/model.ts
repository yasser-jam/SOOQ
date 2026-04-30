import type { ShipmentStatus } from "./types"

export const SHIPMENT_STATUS_META: Record<
  ShipmentStatus,
  {
    label: string
    badgeVariant:
      | "secondary"
      | "secondary-tonal"
      | "outline"
      | "destructive"
  }
> = {
  PENDING: {
    label: "قيد الانتظار",
    badgeVariant: "secondary",
  },
  PICKED_UP: {
    label: "تم الاستلام",
    badgeVariant: "secondary-tonal",
  },
  IN_TRANSIT: {
    label: "قيد التوصيل",
    badgeVariant: "secondary-tonal",
  },
  READY_FOR_PICKUP_AT_OFFICE: {
    label: "جاهز للاستلام من المكتب",
    badgeVariant: "secondary-tonal",
  },
  DELIVERED: {
    label: "تم التسليم",
    badgeVariant: "outline",
  },
  FAILED: {
    label: "فشل التسليم",
    badgeVariant: "destructive",
  },
  RETURNED: {
    label: "تم الإرجاع",
    badgeVariant: "destructive",
  },
}

export const SHIPMENT_STATUS_TRANSITIONS: Record<ShipmentStatus, ShipmentStatus[]> = {
  PENDING: ["PICKED_UP"],
  PICKED_UP: ["IN_TRANSIT"],
  IN_TRANSIT: ["DELIVERED", "READY_FOR_PICKUP_AT_OFFICE", "FAILED"],
  READY_FOR_PICKUP_AT_OFFICE: ["DELIVERED"],
  FAILED: ["RETURNED"],
  DELIVERED: [],
  RETURNED: [],
}
