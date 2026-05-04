import * as z from "zod"

import { shippingProviderSchema } from "./schema"

export type ShippingProvider = z.infer<typeof shippingProviderSchema>

export interface CreateShippingProviderPayload {
	providerCode: string
	providerName: string
	apiBaseUrl?: string
	apiKey?: string
	webhookSecret?: string
	priority?: number
}

export interface UpdateShippingProviderPayload {
	providerName?: string
	apiBaseUrl?: string
	apiKey?: string
	webhookSecret?: string
	priority?: number
	isActive?: boolean
}

export interface UpdateShippingProviderInput {
	id: string
	data: UpdateShippingProviderPayload
}
