import type {
	CollectionProductRef,
	ProductsPageQuery,
	ProductsPageResult,
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

export function getProductsPageApiPath(query: ProductsPageQuery): string {
	const params = new URLSearchParams({
		page: String(query.page),
		size: String(query.size),
	})
	if (query.categorySlug) {
		params.set("categorySlug", query.categorySlug)
	}
	if (query.search?.trim()) {
		params.set("search", query.search.trim())
	}
	return `/public/products?${params.toString()}`
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
