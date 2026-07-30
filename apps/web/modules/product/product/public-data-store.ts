import {
	hasProductsPageFilters,
	type CollectionProductRef,
	type ProductsPageQuery,
	type ProductsPageResult,
} from "@/core/config/data-adapter/types"
import { toFullApiUrl } from "@/lib/api"
import publicApi from "@/lib/public-api"
import { getEditorTenantId } from "@/lib/tenant-context"
import type { PagedApiResponse } from "@/lib/types"

type PublicProductListItem = {
	productId: string
	titleAr?: string
	titleEn?: string
	slug?: string
	displayPrice?: string
	basePrice?: number
	compareAtPrice?: number
	currencyCode?: string
	status?: string
	primaryImageUrl?: string
	descriptionAr?: string
	descriptionEn?: string
	inStock?: boolean
	stockQty?: number
	tags?: Array<{
		id?: string
		name?: string
		productTagId?: string
		tagName?: string
	}>
}

function requireEditorTenantId(): string {
	const tenantId = getEditorTenantId()
	if (!tenantId) {
		throw new Error("Tenant ID is not available for public products API calls.")
	}
	return tenantId
}

/**
 * Two public listing endpoints back the products page:
 *
 * - `GET /public/products` — plain browse (category + pagination only).
 * - `GET /public/products/search` — full-text + facet filtering
 *   (`q`, `minPrice`, `maxPrice`, `inStockOnly`).
 *
 * We only switch to `/search` once a filter is actually set, so the default
 * (unfiltered) listing keeps the cheaper browse path.
 */
export function getProductsPageApiPath(query: ProductsPageQuery): string {
	const params = new URLSearchParams({
		page: String(query.page),
		size: String(query.size),
	})
	if (query.categorySlug) {
		params.set("categorySlug", query.categorySlug)
	}

	if (!hasProductsPageFilters(query)) {
		return `/public/products?${params.toString()}`
	}

	// `q` is always sent — the search endpoint accepts it empty when the
	// request is filter-only (price / stock).
	params.set("q", query.search?.trim() ?? "")
	if (query.minPrice != null) {
		params.set("minPrice", String(query.minPrice))
	}
	if (query.maxPrice != null) {
		params.set("maxPrice", String(query.maxPrice))
	}
	if (query.inStockOnly) {
		params.set("inStockOnly", "true")
	}
	return `/public/products/search?${params.toString()}`
}

export function getProductsPageApiUrl(query: ProductsPageQuery): string {
	return toFullApiUrl(getProductsPageApiPath(query))
}

function mapProductTags(
	tags: PublicProductListItem["tags"],
): Array<{ id: string; name?: string }> {
	if (!Array.isArray(tags)) return []

	return tags
		.map((tag, index) => {
			const id = String(tag.productTagId ?? tag.id ?? "").trim()
			const name = String(tag.tagName ?? tag.name ?? "").trim()
			if (!id && !name) return null
			return {
				id: id || `tag-${index}`,
				name: name || undefined,
			}
		})
		.filter((tag): tag is { id: string; name?: string } => tag != null)
}

/** Undefined when the payload says nothing about stock — callers stay optimistic. */
function mapInStock(item: PublicProductListItem): boolean | undefined {
	if (typeof item.inStock === "boolean") return item.inStock
	if (typeof item.stockQty === "number") return item.stockQty > 0
	return undefined
}

function mapProductItems(items: PublicProductListItem[]): CollectionProductRef[] {
	return items.map((item) => ({
		id: item.productId,
		titleAr: item.titleAr,
		titleEn: item.titleEn,
		slug: item.slug,
		displayPrice: item.displayPrice,
		basePrice: item.basePrice,
		compareAtPrice: item.compareAtPrice,
		currencyCode: item.currencyCode,
		status: item.status,
		primaryImageUrl: item.primaryImageUrl,
		descriptionAr: item.descriptionAr,
		descriptionEn: item.descriptionEn,
		inStock: mapInStock(item),
		tags: mapProductTags(item.tags),
	}))
}

export async function fetchProductsPageFromUrl(
	apiUrl: string,
): Promise<ProductsPageResult> {
	const tenantId = requireEditorTenantId()
	const response = await publicApi<PagedApiResponse<PublicProductListItem>>(
		apiUrl,
		{ tenantId },
	)

	const items = Array.isArray(response.data) ? response.data : []
	const meta = response.meta

	return {
		items: mapProductItems(items),
		totalItems: meta?.total ?? items.length,
		totalPages: meta?.totalPages ?? (items.length > 0 ? 1 : 0),
	}
}
