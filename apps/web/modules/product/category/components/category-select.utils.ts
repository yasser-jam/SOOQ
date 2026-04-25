import type { ProductCategory } from "../types"

// Normalizes unknown form values into a stable string for comparisons/lookups.
export const toStringValue = (value: unknown): string =>
	typeof value === "string" ? value : ""

export const getCategoryChildren = (
	category: ProductCategory,
	subrowKeys?: string
): ProductCategory[] => {
	if (!subrowKeys) return []

	const nestedValue = (category as Record<string, unknown>)[subrowKeys]
	return Array.isArray(nestedValue) ? (nestedValue as ProductCategory[]) : []
}

// Returns a deep-cloned tree while removing excluded nodes at any depth.
export const filterCategoryTree = (
	nodes: ProductCategory[],
	excludedIds: Set<string>,
	subrowKeys?: string
): ProductCategory[] => {
	return nodes.reduce<ProductCategory[]>((result, node) => {
		const nodeId = node.id ?? ""
		if (excludedIds.has(nodeId)) {
			return result
		}

		const children = getCategoryChildren(node, subrowKeys)
		const filteredChildren = children.length
			? filterCategoryTree(children, excludedIds, subrowKeys)
			: []

		if (subrowKeys) {
			result.push({
				...node,
				[subrowKeys]: filteredChildren,
			})
			return result
		}

		result.push(node)
		return result
	}, [])
}

// Builds an id -> Arabic name index from either a flat list or a nested tree.
export const buildCategoryNameMap = (
	nodes: ProductCategory[],
	subrowKeys?: string
): Map<string, string> => {
	const names = new Map<string, string>()

	const visit = (items: ProductCategory[]) => {
		items.forEach((item) => {
			const itemId = item.id ?? ""
			if (itemId) {
				names.set(itemId, item.nameAr)
			}

			const children = getCategoryChildren(item, subrowKeys)
			if (children.length) {
				visit(children)
			}
		})
	}

	visit(nodes)
	return names
}
