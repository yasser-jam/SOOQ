import type * as z from "zod"

import type {
	paymentCredentialsSchema,
	paymentProviderFormSchema,
	paymentSettingsSchema,
} from "./schema"

export type PaymentCredentials = z.infer<typeof paymentCredentialsSchema>
export type PaymentSettings = z.infer<typeof paymentSettingsSchema>

export type PaymentProviderFormValues = z.input<
	typeof paymentProviderFormSchema
>
export type PaymentProviderFormOutput = z.output<
	typeof paymentProviderFormSchema
>

export interface PaymentProviderConfigApiModel {
	configId?: string
	id?: string
	providerCode: string
	displayName?: string | null
	settingsJson?: string | null
	isActive?: boolean | null
	sortOrder?: number | null
	supportsWebhook?: boolean
	requiresRedirect?: boolean
	supportsRefund?: boolean
	supportsSavedCards?: boolean
	createdAt?: string
}

export interface PaymentProviderConfig {
	id: string
	providerCode: string
	displayName: string
	settingsJson: string | null
	isActive: boolean
	sortOrder: number
	supportsWebhook: boolean
	requiresRedirect: boolean
	supportsRefund: boolean
	supportsSavedCards: boolean
	createdAt?: string
}

export interface CreatePaymentProviderPayload {
	providerCode: string
	displayName?: string
	credentialsJson?: string
	settingsJson?: string
	isActive?: boolean
	sortOrder?: number
}

export interface UpdatePaymentProviderPayload {
	displayName?: string
	credentialsJson?: string
	settingsJson?: string
	isActive?: boolean
	sortOrder?: number
}

export interface UpdatePaymentProviderInput {
	id: string
	data: UpdatePaymentProviderPayload
}
