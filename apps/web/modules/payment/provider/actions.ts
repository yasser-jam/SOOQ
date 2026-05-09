import { api } from "@/lib/api"
import type { ApiResponse } from "@/lib/types"

import type {
	CreatePaymentProviderPayload,
	PaymentProviderConfig,
	PaymentProviderConfigApiModel,
	UpdatePaymentProviderInput,
} from "./types"

const normalizeProvider = (
	model: PaymentProviderConfigApiModel
): PaymentProviderConfig => ({
	id: model.configId ?? model.id ?? "",
	providerCode: model.providerCode,
	displayName: model.displayName ?? "",
	settingsJson: model.settingsJson ?? null,
	isActive: model.isActive ?? true,
	sortOrder: model.sortOrder ?? 0,
	supportsWebhook: model.supportsWebhook ?? false,
	requiresRedirect: model.requiresRedirect ?? false,
	supportsRefund: model.supportsRefund ?? false,
	supportsSavedCards: model.supportsSavedCards ?? false,
	createdAt: model.createdAt,
})

export const listPaymentProviders = async (): Promise<
	PaymentProviderConfig[]
> => {
	const response = await api<ApiResponse<PaymentProviderConfigApiModel[]>>(
		"/admin/payment-providers"
	)

	return response.data?.map(normalizeProvider) ?? []
}

export const getPaymentProvider = async (
	id: string
): Promise<PaymentProviderConfig> => {
	const response = await api<ApiResponse<PaymentProviderConfigApiModel>>(
		`/admin/payment-providers/${id}`
	)

	return normalizeProvider(response.data as PaymentProviderConfigApiModel)
}

export const createPaymentProvider = async (
	data: CreatePaymentProviderPayload
): Promise<void> => {
	await api<ApiResponse<unknown>>("/admin/payment-providers", {
		method: "POST",
		body: data,
	})
}

export const updatePaymentProvider = async ({
	id,
	data,
}: UpdatePaymentProviderInput): Promise<void> => {
	await api<ApiResponse<unknown>>(`/admin/payment-providers/${id}`, {
		method: "PUT",
		body: data,
	})
}

export const deletePaymentProvider = async (id: string): Promise<void> => {
	await api<ApiResponse<unknown>>(`/admin/payment-providers/${id}`, {
		method: "DELETE",
	})
}
