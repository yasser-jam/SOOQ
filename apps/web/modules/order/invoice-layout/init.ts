import { invoiceVisibleFieldsSchema } from "./schema"
import type {
	CreateInvoiceLayoutPayload,
	InvoiceLayoutFormValues,
	InvoiceLayoutProfile,
	InvoiceVisibleFields,
	UpdateInvoiceLayoutMutationInput,
	UpdateInvoiceLayoutPayload,
} from "./types"

const VISIBLE_FIELDS_DEFAULTS: InvoiceVisibleFields =
	invoiceVisibleFieldsSchema.parse({})

export const invoiceLayoutFormDefaults: InvoiceLayoutFormValues = {
	profileName: "",
	isDefault: false,
	visibleFields: { ...VISIBLE_FIELDS_DEFAULTS },
}

export const parseVisibleFieldsJson = (
	raw?: string | null
): InvoiceVisibleFields => {
	if (!raw) return { ...VISIBLE_FIELDS_DEFAULTS }

	try {
		const parsed = JSON.parse(raw)
		// Merge with defaults so missing fields fall back gracefully.
		return invoiceVisibleFieldsSchema.parse({
			...VISIBLE_FIELDS_DEFAULTS,
			...parsed,
		})
	} catch {
		return { ...VISIBLE_FIELDS_DEFAULTS }
	}
}

export const initInvoiceLayoutFormValues = (
	profile?: InvoiceLayoutProfile | null
): InvoiceLayoutFormValues => {
	if (!profile) return { ...invoiceLayoutFormDefaults }

	return {
		profileName: profile.profileName,
		isDefault: profile.isDefault,
		visibleFields: parseVisibleFieldsJson(profile.visibleFieldsJson),
	}
}

export const buildCreatePayload = (
	values: InvoiceLayoutFormValues
): CreateInvoiceLayoutPayload => ({
	profileName: values.profileName.trim(),
	isDefault: values.isDefault ?? false,
	visibleFieldsJson: JSON.stringify(values.visibleFields),
})

export const buildUpdatePayload = (
	values: InvoiceLayoutFormValues
): UpdateInvoiceLayoutPayload => ({
	profileName: values.profileName.trim(),
	isDefault: values.isDefault ?? false,
	visibleFieldsJson: JSON.stringify(values.visibleFields),
})

export const initInvoiceLayoutUpdate = (
	id: string,
	payload: UpdateInvoiceLayoutPayload,
	logoFile?: File | null
): UpdateInvoiceLayoutMutationInput => ({
	id,
	payload,
	logoFile,
})
