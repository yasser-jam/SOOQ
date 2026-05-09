export const invoiceQueryKeys = {
	all: ["invoices"] as const,
	detail: (orderId: string) =>
		[...invoiceQueryKeys.all, orderId] as const,
}
