import {
	MOCK_CATALOG_PRODUCTS,
	type MockCatalogProduct,
} from "@/modules/product/product/mock-catalog"

export type Product = {
	id: string
	title: string
	image: string
	description: string
	price: number
	inStock: boolean
	categories: string[]
	collections: string[]
	discount?: number
}

function toLegacyProduct(product: MockCatalogProduct): Product {
	const hasDiscount = product.compareAtPrice > product.basePrice
	const discount = hasDiscount
		? Math.round((1 - product.basePrice / product.compareAtPrice) * 100)
		: undefined

	const inStock = product.variants.some(
		(variant) => variant.isActive !== false && (variant.stockQty ?? 0) > 0
	)

	return {
		id: product.id,
		title: product.titleEn,
		image: product.mediaUrls[0] ?? "",
		description: product.descriptionEn,
		price: hasDiscount ? product.compareAtPrice : product.basePrice,
		inStock,
		categories: product.categories.map((category) => category.name),
		collections: product.collections,
		discount,
	}
}

export const products: Product[] = MOCK_CATALOG_PRODUCTS.map(toLegacyProduct)

export const productOptions = products.map((p) => ({
	label: p.title,
	value: p.id,
}))

// ─── Shared helpers ─────────────────────────────────────────────────────────

export function formatPrice(price: number): string {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		minimumFractionDigits: 2,
	}).format(price)
}

export function discountedPrice(price: number, discount: number): number {
	return price * (1 - discount / 100)
}

export { productExternalField } from "@/modules/product/product/data-store"
export {
	collectionExternalField,
	type CollectionPickerRef,
	type ProductsGridResourceMetadata,
} from "@/modules/product/collection/data-store"
