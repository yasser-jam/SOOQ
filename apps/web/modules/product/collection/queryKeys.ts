export const collectionQueryKeys = {
	all: ["list-collections"] as const,
	detail: (id: string) => [...collectionQueryKeys.all, id] as const,
}
