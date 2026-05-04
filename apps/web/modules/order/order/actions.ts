import { api } from "@/lib/api"
import type { ApiResponse } from "@/lib/types"

import type {
  AdminOrder,
  AdminOrderListItem,
  AdminOrdersSummary,
  AdminOrderTimelineEvent,
  CancelOrderInput,
  EditOrderInput,
  ListAdminOrdersParams,
  PaginatedApiResponse,
  TransitionOrderStatusInput,
  UpdateOrderNotesInput,
} from "./types"

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

  return response.data ?? {}
}

export const getAdminOrder = async (id: string): Promise<AdminOrder> => {
  const response = await api<ApiResponse<AdminOrder>>(`/admin/orders/${id}`)
  return response.data as AdminOrder
}

export const getAdminOrderTimeline = async (
  id: string
): Promise<AdminOrderTimelineEvent[]> => {
  const response = await api<ApiResponse<AdminOrderTimelineEvent[]>>(
    `/admin/orders/${id}/timeline`
  )

  return response.data ?? []
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
