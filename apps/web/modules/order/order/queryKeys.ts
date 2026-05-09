export const orderQueryKeys = {
	all: ["orders"] as const,
	summary: () => [...orderQueryKeys.all, "summary"] as const,
	list: (params?: Record<string, unknown>) =>
		[...orderQueryKeys.all, "list", params ?? {}] as const,
	detail: (id: string) => [...orderQueryKeys.all, "detail", id] as const,
	timeline: (id: string) => [...orderQueryKeys.all, "timeline", id] as const,
}
