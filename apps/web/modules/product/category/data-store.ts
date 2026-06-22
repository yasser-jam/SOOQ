import { MOCK_CATALOG_PRODUCTS } from "@/modules/product/product/mock-catalog"

export type CategoryBrowseItem = {
	id: string
	name: string
	count?: number
}

export const categoryBrowseKeys = {
	all: () => ["product", "category", "browse"] as const,
}

export async function listCategoryBrowseItems(): Promise<CategoryBrowseItem[]> {
	await new Promise((resolve) => setTimeout(resolve, 150))

	const counts = new Map<string, { id: string; name: string; count: number }>()

	for (const product of MOCK_CATALOG_PRODUCTS) {
		for (const category of product.categories) {
			const existing = counts.get(category.id)
			if (existing) {
				existing.count += 1
				continue
			}
			counts.set(category.id, {
				id: category.id,
				name: category.name,
				count: 1,
			})
		}
	}

	return Array.from(counts.values()).sort((a, b) =>
		a.name.localeCompare(b.name, "en"),
	)
}
