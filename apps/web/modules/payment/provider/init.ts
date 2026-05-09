import {
	paymentCredentialsSchema,
	paymentProviderFormSchema,
	paymentSettingsSchema,
} from "./schema"
import type {
	CreatePaymentProviderPayload,
	PaymentCredentials,
	PaymentProviderConfig,
	PaymentProviderFormValues,
	PaymentSettings,
	UpdatePaymentProviderInput,
	UpdatePaymentProviderPayload,
} from "./types"

const CREDENTIALS_DEFAULTS: PaymentCredentials =
	paymentCredentialsSchema.parse({})
const SETTINGS_DEFAULTS: PaymentSettings = paymentSettingsSchema.parse({})

export const paymentProviderFormDefaults: PaymentProviderFormValues = {
	providerCode: "COD",
	displayName: "",
	isActive: true,
	sortOrder: 0,
	credentials: { ...CREDENTIALS_DEFAULTS },
	settings: { ...SETTINGS_DEFAULTS },
}

const parseSettingsJson = (raw?: string | null): PaymentSettings => {
	if (!raw) return { ...SETTINGS_DEFAULTS }
	try {
		const parsed = JSON.parse(raw)
		return paymentSettingsSchema.parse({
			...SETTINGS_DEFAULTS,
			...parsed,
		})
	} catch {
		return { ...SETTINGS_DEFAULTS }
	}
}

export const initPaymentProviderFormValues = (
	model?: PaymentProviderConfig | null
): PaymentProviderFormValues => {
	if (!model) return { ...paymentProviderFormDefaults }

	return {
		providerCode: model.providerCode,
		displayName: model.displayName,
		isActive: model.isActive,
		sortOrder: model.sortOrder,
		// Credentials are write-only on the backend, so we always start blank
		// in edit mode. The form treats blank as "leave unchanged".
		credentials: { ...CREDENTIALS_DEFAULTS },
		settings: parseSettingsJson(model.settingsJson),
	}
}

const trimCredentials = (
	credentials: PaymentCredentials
): PaymentCredentials => ({
	terminalId: credentials.terminalId.trim(),
	username: credentials.username.trim(),
	password: credentials.password,
})

const hasAnyCredential = (credentials: PaymentCredentials): boolean =>
	Boolean(
		credentials.terminalId || credentials.username || credentials.password
	)

export const buildCreatePaymentProviderPayload = (
	rawValues: PaymentProviderFormValues
): CreatePaymentProviderPayload => {
	const values = paymentProviderFormSchema.parse(rawValues)
	const trimmedCredentials = trimCredentials(values.credentials)

	return {
		providerCode: values.providerCode,
		displayName: values.displayName.trim() || undefined,
		isActive: values.isActive,
		sortOrder: values.sortOrder,
		settingsJson: JSON.stringify(values.settings),
		credentialsJson: hasAnyCredential(trimmedCredentials)
			? JSON.stringify(trimmedCredentials)
			: undefined,
	}
}

export const buildUpdatePaymentProviderPayload = (
	rawValues: PaymentProviderFormValues
): UpdatePaymentProviderPayload => {
	const values = paymentProviderFormSchema.parse(rawValues)
	const trimmedCredentials = trimCredentials(values.credentials)

	return {
		displayName: values.displayName.trim() || undefined,
		isActive: values.isActive,
		sortOrder: values.sortOrder,
		settingsJson: JSON.stringify(values.settings),
		// Only send credentials if user actually entered something — otherwise
		// the backend keeps the existing credentials untouched.
		credentialsJson: hasAnyCredential(trimmedCredentials)
			? JSON.stringify(trimmedCredentials)
			: undefined,
	}
}

export const initPaymentProviderUpdate = (
	id: string,
	data: UpdatePaymentProviderPayload
): UpdatePaymentProviderInput => ({
	id,
	data,
})
