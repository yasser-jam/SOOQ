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
