export const collectionQueryKeys = {
	all: ["list-collections"] as const,
	detail: (id: string) => [...collectionQueryKeys.all, id] as const,
	products: (id: string) => [...collectionQueryKeys.detail(id), "products"] as const,
	rules: (id: string) => [...collectionQueryKeys.detail(id), "rules"] as const,
	preview: (id: string) => [...collectionQueryKeys.detail(id), "preview"] as const,
}
