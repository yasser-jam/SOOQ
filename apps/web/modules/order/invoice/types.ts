export interface AdminInvoice {
	invoiceId?: string
	id?: string
	orderId?: string
	invoiceNumber?: string
	pdfUrl?: string | null
	generatedAt?: string
}

/** List/detail shape after the tiny id alias (`invoiceId` → `id`). */
export interface Invoice extends AdminInvoice {
	id: string
	orderId: string
	invoiceNumber: string
	pdfUrl: string | null
}
