import { api } from "@/lib/api"
import type { ApiResponse } from "@/lib/types"

import type { Invoice, InvoiceApiModel } from "./types"

const normalizeInvoice = (model: InvoiceApiModel): Invoice => ({
	id: model.invoiceId ?? model.id ?? "",
	orderId: model.orderId ?? "",
	invoiceNumber: model.invoiceNumber ?? "",
	pdfUrl: model.pdfUrl ?? null,
	generatedAt: model.generatedAt,
})

export const listInvoices = async (): Promise<Invoice[]> => {
	const response = await api<ApiResponse<InvoiceApiModel[]>>(
		"/admin/invoices"
	)

	return response.data?.map(normalizeInvoice) ?? []
}

export const generateInvoice = async (orderId: string): Promise<Invoice> => {
	const response = await api<ApiResponse<InvoiceApiModel>>(
		`/admin/invoices/generate/${orderId}`,
		{ method: "POST" }
	)

	return normalizeInvoice(response.data ?? {})
}

export const regenerateInvoice = async (
	orderId: string
): Promise<Invoice> => {
	const response = await api<ApiResponse<InvoiceApiModel>>(
		`/admin/invoices/regenerate/${orderId}`,
		{ method: "POST" }
	)

	return normalizeInvoice(response.data ?? {})
}
