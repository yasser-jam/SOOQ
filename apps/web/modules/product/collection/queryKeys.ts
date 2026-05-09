export const collectionQueryKeys = {
	all: ["list-collections"] as const,
	detail: (id: string) => [...collectionQueryKeys.all, id] as const,
	products: (id: string, page?: number) =>
		[...collectionQueryKeys.all, id, "products", page ?? 0] as const,
	rules: (id: string) => [...collectionQueryKeys.all, id, "rules"] as const,
	preview: (id: string) =>
		[...collectionQueryKeys.all, id, "preview"] as const,
}
