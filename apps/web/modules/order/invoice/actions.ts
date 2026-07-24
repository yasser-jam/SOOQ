import { api } from "@/lib/api"
import type { ApiResponse } from "@/lib/types"

import type { AdminInvoice, Invoice } from "./types"

/** Tiny id alias only — keep the rest of the API shape intact. */
const normalizeInvoice = (model: AdminInvoice): Invoice => ({
	...model,
	id: model.invoiceId ?? model.id ?? "",
	orderId: model.orderId ?? "",
	invoiceNumber: model.invoiceNumber ?? "",
	pdfUrl: model.pdfUrl ?? null,
})

export const listInvoices = async (): Promise<Invoice[]> => {
	const response = await api<ApiResponse<AdminInvoice[]>>("/admin/invoices")
	return response.data?.map(normalizeInvoice) ?? []
}

export const generateInvoice = async (orderId: string): Promise<Invoice> => {
	const response = await api<ApiResponse<AdminInvoice>>(
		`/admin/invoices/generate/${orderId}`,
		{ method: "POST" }
	)

	return normalizeInvoice(response.data ?? {})
}

export const regenerateInvoice = async (
	orderId: string
): Promise<Invoice> => {
	const response = await api<ApiResponse<AdminInvoice>>(
		`/admin/invoices/regenerate/${orderId}`,
		{ method: "POST" }
	)

	return normalizeInvoice(response.data ?? {})
}
