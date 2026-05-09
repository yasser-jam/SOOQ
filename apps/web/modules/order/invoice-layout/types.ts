import type * as z from "zod"

import type {
	invoiceLayoutFormSchema,
	invoiceVisibleFieldsSchema,
} from "./schema"

export type InvoiceVisibleFields = z.infer<typeof invoiceVisibleFieldsSchema>

export type InvoiceLayoutFormValues = z.input<typeof invoiceLayoutFormSchema>
export type InvoiceLayoutFormOutput = z.output<typeof invoiceLayoutFormSchema>

export interface InvoiceLayoutProfileApiModel {
	profileId?: string
	id?: string
	profileName: string
	visibleFieldsJson?: string | null
	isDefault?: boolean | null
	createdAt?: string
}

export interface InvoiceLayoutProfile {
	id: string
	profileName: string
	visibleFieldsJson?: string | null
	isDefault: boolean
	createdAt?: string
}

export interface CreateInvoiceLayoutPayload {
	profileName: string
	visibleFieldsJson: string
	isDefault: boolean
}

export interface UpdateInvoiceLayoutPayload {
	profileName?: string
	visibleFieldsJson?: string
	isDefault?: boolean
}

export interface UpdateInvoiceLayoutInput {
	id: string
	data: UpdateInvoiceLayoutPayload
}

// Multipart mutation inputs — pair the JSON profile payload with an optional
// File for the logo part. The backend (POST/PUT /admin/invoice-layout-profiles)
// merges the resulting publicUrl into visibleFieldsJson.logoUrl when present.
export interface CreateInvoiceLayoutMutationInput {
	payload: CreateInvoiceLayoutPayload
	logoFile?: File | null
}

export interface UpdateInvoiceLayoutMutationInput {
	id: string
	payload: UpdateInvoiceLayoutPayload
	logoFile?: File | null
}
