import { api } from "@/lib/api"
import type { ApiResponse } from "@/lib/types"

import type {
	CreateShippingProviderPayload,
	ShippingProvider,
	UpdateShippingProviderInput,
} from "./types"

type ShippingProviderApiResponse = Omit<ShippingProvider, "id"> & {
	shippingProviderId: string
}

const normalizeProvider = (
	provider: ShippingProviderApiResponse
): ShippingProvider => ({
	...provider,
	id: provider.shippingProviderId,
})

export const listShippingProviders = async (): Promise<ShippingProvider[]> => {
	// Backend currently returns a plain array, but the 2026-04-11 redesign is
	// migrating list endpoints to Spring Page (`{ content: [...] }`). Read
	// both shapes so a future backend change doesn't blank the dropdown.
	const response = await api<
		ApiResponse<
			| ShippingProviderApiResponse[]
			| { content?: ShippingProviderApiResponse[] }
		>
	>("/admin/shipping/providers")

	const raw = response.data
	const items = Array.isArray(raw) ? raw : (raw?.content ?? [])

	return items.map(normalizeProvider)
}

export const getShippingProvider = async (
	id: string
): Promise<ShippingProvider> => {
	const response = await api<ApiResponse<ShippingProviderApiResponse>>(
		`/admin/shipping/providers/${id}`
	)

	return normalizeProvider(response.data!)
}

export const createShippingProvider = (
	data: CreateShippingProviderPayload
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
