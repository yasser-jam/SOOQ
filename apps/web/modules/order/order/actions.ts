import { api } from "@/lib/api"
import { formatOrderMoney } from "@/modules/order/order/utils"
import type { ApiResponse } from "@/lib/types"

import type {
  AdminOrder,
  AdminOrderItem,
  AdminOrderListItem,
  AdminOrderPricing,
  AdminOrdersSummary,
  AdminOrderTimelineEvent,
  CancelOrderInput,
  EditOrderInput,
  ListAdminOrdersParams,
  OrderStatus,
  PaginatedApiResponse,
  TransitionOrderStatusInput,
  UpdateOrderNotesInput,
} from "./types"

// Backend DTOs (OrderResponseDto / OrderDetailResponseDto) expose `orderId`
// and `orderStatus`, but the frontend reads `id` and `status` everywhere
// (table row clicks, badge lookups, query keys). Normalize at the action
// boundary so consumers don't have to dual-read every field.
type OrderApiShape = {
  orderId?: string
  orderStatus?: OrderStatus
  id?: string
  status?: OrderStatus
}

const normalizeOrderListItem = <T extends OrderApiShape>(
  item: T
): T & { id?: string; orderId?: string; status?: OrderStatus } => ({
  ...item,
  id: item.id ?? item.orderId,
  orderId: item.orderId ?? item.id,
  status: (item.status ?? item.orderStatus) as OrderStatus | undefined,
})

// Detail-only normalization — builds the fields the FE summary/timeline cards
// expect from the flat OrderDetailResponseDto + OrderItemResponseDto +
// OrderTimelineResponseDto shapes:
//
// - `pricing` object built from flat subtotal/total/etc
// - `items[].id` from orderItemId, `priceLabel` formatted from totalPrice
// - `timeline[].eventType` from `action` (FE TIMELINE_EVENT_LABELS lookup)
type OrderDetailApiShape = OrderApiShape & {
  subtotal?: number
  discountAmount?: number
  taxAmount?: number
  shippingCost?: number
  total?: number
  currencyCode?: string
  pricing?: AdminOrderPricing | null
  items?: AdminOrderItem[]
  timeline?: AdminOrderTimelineEvent[]
}

const normalizeOrderItem = (
  item: AdminOrderItem,
  currencyCode?: string
): AdminOrderItem => {
  const lineTotal = item.totalPrice ?? item.unitPrice ?? null
  return {
    ...item,
    id: item.id ?? item.orderItemId,
    priceLabel:
      item.priceLabel ??
      (formatOrderMoney(lineTotal, currencyCode) || undefined),
  }
}

const normalizeTimelineEvent = (
  event: AdminOrderTimelineEvent & { action?: string; actor?: string }
): AdminOrderTimelineEvent => ({
  ...event,
  // Backend names the discriminator `action`; FE expects `eventType` for the
  // TIMELINE_EVENT_LABELS lookup. Keep the raw value as fallback.
  eventType: event.eventType ?? event.action,
  id: event.id ?? event.eventId,
})

const normalizeOrderDetail = (order: AdminOrder): AdminOrder => {
  const normalized = normalizeOrderListItem(order as OrderDetailApiShape)
  const flat = normalized as OrderDetailApiShape
  const currencyCode = flat.currencyCode ?? flat.pricing?.currencyCode

  // Build pricing from flat fields when the backend doesn't provide a nested
  // `pricing` object. If it ever starts to, prefer the explicit one.
  const pricing: AdminOrderPricing | null =
    flat.pricing ??
    (flat.subtotal !== undefined ||
    flat.total !== undefined ||
    flat.taxAmount !== undefined ||
    flat.shippingCost !== undefined
      ? {
          subtotal: flat.subtotal,
          shippingCost: flat.shippingCost,
          taxAmount: flat.taxAmount,
          total: flat.total,
          currencyCode,
        }
      : null)

  return {
    ...(normalized as AdminOrder),
    pricing,
    currencyCode,
    items: flat.items?.map((item) => normalizeOrderItem(item, currencyCode)),
    timeline: flat.timeline?.map(normalizeTimelineEvent),
  }
}

export const getAdminOrdersSummary = async (): Promise<AdminOrdersSummary> => {
  const response = await api<ApiResponse<AdminOrdersSummary>>(
    "/admin/orders/summary"
  )
  return response.data ?? {}
}

export const listAdminOrders = async (
  params: ListAdminOrdersParams
): Promise<PaginatedApiResponse<AdminOrderListItem>> => {
  const response = await api<
    ApiResponse<PaginatedApiResponse<AdminOrderListItem>>
  >("/admin/orders", {
    params,
  })

  const page = response.data ?? {}
  const items = page.items?.map(normalizeOrderListItem)
  const content = page.content?.map(normalizeOrderListItem)

  return {
    ...page,
    ...(items ? { items } : {}),
    ...(content ? { content } : {}),
  }
}

export const getAdminOrder = async (id: string): Promise<AdminOrder> => {
  const response = await api<ApiResponse<AdminOrder>>(`/admin/orders/${id}`)
  return normalizeOrderDetail(response.data as AdminOrder)
}

export const getAdminOrderTimeline = async (
  id: string
): Promise<AdminOrderTimelineEvent[]> => {
  const response = await api<ApiResponse<AdminOrderTimelineEvent[]>>(
    `/admin/orders/${id}/timeline`
  )

  return (response.data ?? []).map(normalizeTimelineEvent)
}

export const transitionAdminOrderStatus = ({
  id,
  data,
}: TransitionOrderStatusInput): Promise<void> =>
  api<void>(`/admin/orders/${id}/transition`, {
    method: "POST",
    body: data,
  })

export const cancelAdminOrder = ({
  id,
  data,
}: CancelOrderInput): Promise<void> =>
  api<void>(`/admin/orders/${id}/cancel`, {
    method: "POST",
    body: data,
  })

export const updateAdminOrderNotes = ({
  id,
  data,
}: UpdateOrderNotesInput): Promise<void> =>
  api<void>(`/admin/orders/${id}/notes`, {
    method: "PUT",
    body: data,
  })

export const editAdminOrder = ({ id, data }: EditOrderInput): Promise<void> =>
  api<void>(`/admin/orders/${id}/edit`, {
    method: "PUT",
    body: data,
  })
