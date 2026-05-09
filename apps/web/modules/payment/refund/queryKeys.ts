export const refundQueryKeys = {
	all: ["refunds"] as const,
	byOrder: (orderId: string) =>
		[...refundQueryKeys.all, "order", orderId] as const,
}
