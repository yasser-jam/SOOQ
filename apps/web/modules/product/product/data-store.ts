import type { ExternalField } from "@/core/types/Fields"

import {
	MOCK_CATALOG_PRODUCTS,
	getMockCatalogProduct,
	type MockCatalogProduct,
} from "./mock-catalog"

export type ProductPickerRef = {
	id: string
	titleAr?: string
	titleEn?: string
}

export type ProductCardVariant = MockCatalogProduct["variants"][number]

export type ProductCardData = {
	id: string
	titleAr: string
	titleEn: string
	descriptionAr: string
	descriptionEn: string
	slug: string
	basePrice: number
	compareAtPrice: number
	currencyCode: string
	status: string
	allowOversell: boolean
	categories: Array<{ id: string; name?: string }>
	tags: Array<{ id: string; name?: string }>
	mediaUrls: string[]
	options: unknown[]
	variants: ProductCardVariant[]
}

export const productPickerKeys = {
	all: ["product", "picker"] as const,
	detail: (id: string) => [...productPickerKeys.all, id] as const,
	list: (query: string) => [...productPickerKeys.all, "list", query] as const,
}

export function toProductCardData(product: MockCatalogProduct): ProductCardData {
	return {
		id: product.id,
		titleAr: product.titleAr,
		titleEn: product.titleEn,
		descriptionAr: product.descriptionAr,
		descriptionEn: product.descriptionEn,
		slug: product.slug,
		basePrice: product.basePrice,
		compareAtPrice: product.compareAtPrice,
		currencyCode: product.currencyCode,
		status: product.status,
		allowOversell: product.allowOversell,
		categories: product.categories.map((category) => ({
			id: category.id,
			name: category.name,
		})),
		tags: product.tags,
		mediaUrls: product.mediaUrls,
		options: [],
		variants: product.variants,
	}
}

export async function getProductForCard(
	id: string,
): Promise<ProductCardData | null> {
	const product = getMockCatalogProduct(id)
	if (!product) return null
	return toProductCardData(product)
}

type ProductListRow = {
	id: string
	titleAr: string
	titleEn: string
	description: string
}

function filterCatalog(query: string): ProductListRow[] {
	const normalized = query.trim().toLowerCase()

	return MOCK_CATALOG_PRODUCTS.filter((product) => {
		if (!normalized) return true
		return (
			product.titleAr.toLowerCase().includes(normalized) ||
			product.titleEn.toLowerCase().includes(normalized) ||
			product.descriptionAr.toLowerCase().includes(normalized) ||
			product.descriptionEn.toLowerCase().includes(normalized)
		)
	}).map((product) => ({
		id: product.id,
		titleAr: product.titleAr,
		titleEn: product.titleEn,
		description: product.descriptionAr || product.descriptionEn,
	}))
}

export const productExternalField: ExternalField<ProductPickerRef | null> = {
	type: "external",
	placeholder: "ابحث عن منتج…",
	showSearch: true,
	fetchList: async ({ query }) => {
		await new Promise((resolve) => setTimeout(resolve, 200))
		return filterCatalog(query)
	},
	mapRow: (item: ProductListRow) => ({
		title: item.titleAr || item.titleEn,
		description: item.description.slice(0, 96),
	}),
	mapProp: (item: ProductListRow) => ({
		id: item.id,
		titleAr: item.titleAr,
		titleEn: item.titleEn,
	}),
	getItemSummary: (item) => item?.titleAr || item?.titleEn || item?.id || "منتج",
}
