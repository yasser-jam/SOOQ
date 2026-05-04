export const invoiceLayoutQueryKeys = {
	all: ["invoice-layout-profiles"] as const,
	detail: (id: string) =>
		[...invoiceLayoutQueryKeys.all, id] as const,
}
