import type { ExternalField } from "@/core/types/Fields"
import { toFullApiUrl } from "@/lib/api"
import publicApi from "@/lib/public-api"
import { getEditorTenantId } from "@/lib/tenant-context"
import type { PagedApiResponse } from "@/lib/types"

export type CollectionPickerRef = {
	id: string
	name: string
	slug: string
	productCount?: number
}

export type ProductsGridResourceMetadata = {
	type: "collection"
	method: "get"
	collectionId: string
	collectionSlug: string
	productCount: number
	apiUrl: string
}

type PublicCollectionListItem = {
	collectionId: string
	collectionName: string
	collectionSlug: string
	productCount?: number
}

export type CollectionProductRef = {
	id: string
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
  tags?: Array<{ id: string; name?: string }>
}

type CollectionProductListItem = {
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
  sortOrder?: number
  tags?: Array<{
    id?: string
    name?: string
    productTagId?: string
    tagName?: string
  }>
}

const COLLECTION_LIST_PAGE_SIZE = 20
const COLLECTION_PRODUCTS_PAGE_SIZE = 100

let cachedCollectionList: CollectionListRow[] | null = null

type CollectionListRow = {
	id: string
	name: string
	slug: string
	productCount: number
}

export const collectionPickerKeys = {
	all: ["collection", "picker"] as const,
	list: (query: string) => [...collectionPickerKeys.all, "list", query] as const,
	products: (apiUrl: string) =>
		[...collectionPickerKeys.all, "products", apiUrl] as const,
}

function requireEditorTenantId(): string {
	const tenantId = getEditorTenantId()
	if (!tenantId) {
		throw new Error("Tenant ID is not available for public collection API calls.")
	}
	return tenantId
}

export function getCollectionsListApiUrl(): string {
	return toFullApiUrl(
		`/public/collections?page=0&size=${COLLECTION_LIST_PAGE_SIZE}`,
	)
}

export function getCollectionProductsApiPath(collectionSlug: string): string {
	return `/public/collections/${encodeURIComponent(collectionSlug)}/products?page=0&size=${COLLECTION_PRODUCTS_PAGE_SIZE}`
}

export function getCollectionProductsApiUrl(collectionSlug: string): string {
	return toFullApiUrl(getCollectionProductsApiPath(collectionSlug))
}

export function buildProductsGridResourceMetadata(
	collection: CollectionPickerRef,
): ProductsGridResourceMetadata {
	return {
		type: "collection",
		method: "get",
		collectionId: collection.id,
		collectionSlug: collection.slug,
		productCount: collection.productCount ?? 0,
		apiUrl: getCollectionProductsApiUrl(collection.slug),
	}
}

async function fetchCollectionListRows(): Promise<CollectionListRow[]> {
	if (cachedCollectionList) return cachedCollectionList

	const tenantId = requireEditorTenantId()
	const response = await publicApi<PagedApiResponse<PublicCollectionListItem>>(
		"/public/collections",
		{
			tenantId,
			params: { page: 0, size: COLLECTION_LIST_PAGE_SIZE },
		},
	)

	cachedCollectionList = (response.data ?? []).map((item) => ({
		id: item.collectionId,
		name: item.collectionName,
		slug: item.collectionSlug,
		productCount: item.productCount ?? 0,
	}))

	return cachedCollectionList
}

function filterCollectionList(
	rows: CollectionListRow[],
	query: string,
): CollectionListRow[] {
	const normalized = query.trim().toLowerCase()
	if (!normalized) return rows

	return rows.filter(
		(collection) =>
			collection.name.toLowerCase().includes(normalized) ||
			collection.slug.toLowerCase().includes(normalized) ||
			collection.id.toLowerCase().includes(normalized),
	)
}

function mapCollectionProductTags(
  tags: CollectionProductListItem["tags"]
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

function mapCollectionProductItems(
  items: CollectionProductListItem[],
): CollectionProductRef[] {
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
    tags: mapCollectionProductTags(item.tags),
  }))
}

export async function fetchCollectionProductsFromUrl(
	apiUrl: string,
): Promise<CollectionProductRef[]> {
	const tenantId = requireEditorTenantId()
	const response = await publicApi<PagedApiResponse<CollectionProductListItem>>(
		apiUrl,
		{ tenantId },
	)

	const items = Array.isArray(response.data) ? response.data : []
	return mapCollectionProductItems(items)
}

export async function fetchCollectionProductsBySlug(
	collectionSlug: string,
): Promise<CollectionProductRef[]> {
	return fetchCollectionProductsFromUrl(getCollectionProductsApiUrl(collectionSlug))
}

/** @deprecated Prefer fetchCollectionProductsBySlug — public API uses collection slug. */
export async function fetchCollectionProductRefs(
	collectionId: string,
): Promise<CollectionProductRef[]> {
	const rows = await fetchCollectionListRows()
	const match = rows.find((row) => row.id === collectionId)
	if (!match?.slug) return []
	return fetchCollectionProductsBySlug(match.slug)
}

export const collectionExternalField: ExternalField<CollectionPickerRef | null> = {
	type: "external",
	placeholder: "ابحث عن مجموعة…",
	showSearch: true,
	fetchList: async ({ query }) => {
		const rows = await fetchCollectionListRows()
		return filterCollectionList(rows, query)
	},
	mapRow: (item: CollectionListRow) => ({
		title: item.name,
		description: `${item.productCount} منتج`,
	}),
	mapProp: (item: CollectionListRow) => ({
		id: item.id,
		name: item.name,
		slug: item.slug,
		productCount: item.productCount,
	}),
	getItemSummary: (item) =>
		item?.name
			? `${item.name} (${item.productCount ?? 0} منتج)`
			: "مجموعة",
}
