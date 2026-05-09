import type {
	CreateShippingProviderPayload,
	ShippingProvider,
	UpdateShippingProviderInput,
	UpdateShippingProviderPayload,
} from "./types"

export const shippingProviderFormDefaults: ShippingProvider = {
	providerCode: "",
	providerName: "",
	apiBaseUrl: "",
	apiKey: "",
	webhookSecret: "",
	priority: 0,
	isActive: true,
}

export const initShippingProviderFormValues = (
	data?: ShippingProvider | null
): ShippingProvider => {
	if (!data) return { ...shippingProviderFormDefaults }

	return {
		id: data.id,
		providerCode: data.providerCode || "",
		providerName: data.providerName || "",
		apiBaseUrl: data.apiBaseUrl || "",
		// apiKey/webhookSecret are write-only on the backend — start blank and
		// treat blank as "no change" on submit.
		apiKey: "",
		webhookSecret: "",
		priority: data.priority ?? 0,
		hasApiKey: data.hasApiKey,
		hasWebhookSecret: data.hasWebhookSecret,
		isActive: data.isActive ?? true,
	}
}

export const buildCreateShippingProviderPayload = (
	values: ShippingProvider
): CreateShippingProviderPayload => ({
	providerCode: values.providerCode,
	providerName: values.providerName,
	apiBaseUrl: values.apiBaseUrl || undefined,
	apiKey: values.apiKey || undefined,
	webhookSecret: values.webhookSecret || undefined,
	priority: values.priority ?? 0,
})

export const buildUpdateShippingProviderPayload = (
	values: ShippingProvider
): UpdateShippingProviderPayload => ({
	providerName: values.providerName,
	apiBaseUrl: values.apiBaseUrl || undefined,
	// Only send apiKey/webhookSecret if user actually entered something.
	apiKey: values.apiKey ? values.apiKey : undefined,
	webhookSecret: values.webhookSecret ? values.webhookSecret : undefined,
	priority: values.priority ?? 0,
	isActive: values.isActive,
})

export const initShippingProviderUpdate = (
	id: string,
	data: UpdateShippingProviderPayload
): UpdateShippingProviderInput => ({
	id,
	data,
})
