export const invoiceQueryKeys = {
	all: ["invoices"] as const,
	list: () => [...invoiceQueryKeys.all, "list"] as const,
	/** Keyed by order id — generate/regenerate are order-scoped. */
	detail: (orderId: string) =>
		[...invoiceQueryKeys.all, "detail", orderId] as const,
}
