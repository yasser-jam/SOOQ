export const discountCodeQueryKeys = {
	all: ["discount-codes"] as const,
	detail: (id: string) => [...discountCodeQueryKeys.all, id] as const,
}
