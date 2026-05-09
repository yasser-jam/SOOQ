export const paymentProviderQueryKeys = {
	all: ["payment-providers"] as const,
	detail: (id: string) =>
		[...paymentProviderQueryKeys.all, id] as const,
}
