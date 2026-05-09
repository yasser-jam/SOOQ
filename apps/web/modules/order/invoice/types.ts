export interface InvoiceApiModel {
	invoiceId?: string
	id?: string
	orderId?: string
	invoiceNumber?: string
	pdfUrl?: string | null
	generatedAt?: string
}

export interface Invoice {
	id: string
	orderId: string
	invoiceNumber: string
	pdfUrl: string | null
	generatedAt?: string
}
