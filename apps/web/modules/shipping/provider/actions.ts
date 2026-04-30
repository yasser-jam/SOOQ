import { api } from "@/lib/api"
import type { ApiResponse } from "@/lib/types"

import type {
  ShippingProvider,
  ShippingProviderUpsertPayload,
  UpdateShippingProviderInput,
} from "./types"

type ShippingProviderApiResponse = Omit<ShippingProvider, "id"> & {
  shippingProviderId: string
}

const normalizeProvider = (provider: ShippingProviderApiResponse): ShippingProvider => ({
  ...provider,
  id: provider.shippingProviderId,
})

export const listShippingProviders = async (): Promise<ShippingProvider[]> => {
  const response = await api<ApiResponse<ShippingProviderApiResponse[]>>(
    "/admin/shipping/providers"
  )

  return response.data?.map(normalizeProvider) ?? []
}

export const getShippingProvider = async (id: string): Promise<ShippingProvider> => {
  const response = await api<ApiResponse<ShippingProviderApiResponse>>(
    `/admin/shipping/providers/${id}`
  )

  return normalizeProvider(response.data!)
}

export const createShippingProvider = (
  data: ShippingProviderUpsertPayload
): Promise<void> =>
  api<void>("/admin/shipping/providers", {
    method: "POST",
    body: data,
  })

export const updateShippingProvider = ({
  id,
  data,
}: UpdateShippingProviderInput): Promise<void> =>
  api<void>(`/admin/shipping/providers/${id}`, {
    method: "PUT",
    body: data,
  })

export const deleteShippingProvider = (id: string): Promise<void> =>
  api<void>(`/admin/shipping/providers/${id}`, {
    method: "DELETE",
  })
