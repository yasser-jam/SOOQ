import type { ExternalField } from "@/core/types/Fields"
import api, { toFullApiUrl } from "@/lib/api"
import type { ApiResponse, PagedApiResponse } from "@/lib/types"

export type CollectionPickerRef = {
	id: string
	name: string
	productCount?: number
}

export type ProductsGridResourceMetadata = {
	type: "collection"
	method: "get"
	collectionId: string
	productCount: number
	apiUrl: string
}

type AdminCollectionListItem = {
	collectionId: string
	collectionName: string
	productCount?: number
}

/** Same shape as the admin product list / collection products endpoints. */
type CollectionProductListItem = {
	productId: string
	titleAr?: string
	titleEn?: string
	slug?: string
	displayPrice?: string
	basePrice?: number
	currencyCode?: string
	status?: string
	primaryImageUrl?: string
	sortOrder?: number
}

const COLLECTION_LIST_PAGE_SIZE = 20
const COLLECTION_PRODUCTS_PAGE_SIZE = 100

let cachedCollectionList: CollectionListRow[] | null = null

type CollectionListRow = {
	id: string
	name: string
	productCount: number
}

export const collectionPickerKeys = {
	all: ["collection", "picker"] as const,
	list: (query: string) => [...collectionPickerKeys.all, "list", query] as const,
	products: (apiUrl: string) =>
		[...collectionPickerKeys.all, "products", apiUrl] as const,
}

export function getCollectionsListApiUrl(): string {
	return toFullApiUrl(
		`/admin/collections?page=0&size=${COLLECTION_LIST_PAGE_SIZE}`,
	)
}

export function getCollectionProductsApiPath(collectionId: string): string {
	return `/admin/collections/${collectionId}/products?page=0&size=${COLLECTION_PRODUCTS_PAGE_SIZE}`
}

export function getCollectionProductsApiUrl(collectionId: string): string {
	return toFullApiUrl(getCollectionProductsApiPath(collectionId))
}

export function buildProductsGridResourceMetadata(
	collection: CollectionPickerRef,
): ProductsGridResourceMetadata {
	return {
		type: "collection",
		method: "get",
		collectionId: collection.id,
		productCount: collection.productCount ?? 0,
		apiUrl: getCollectionProductsApiUrl(collection.id),
	}
}

async function fetchCollectionListRows(): Promise<CollectionListRow[]> {
	if (cachedCollectionList) return cachedCollectionList

	const response = await api<PagedApiResponse<AdminCollectionListItem>>(
		"/admin/collections",
		{
			params: { page: 0, size: COLLECTION_LIST_PAGE_SIZE },
		},
	)

	cachedCollectionList = (response.data ?? []).map((item) => ({
		id: item.collectionId,
		name: item.collectionName,
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
			collection.id.toLowerCase().includes(normalized),
	)
}

function mapCollectionProductItems(
	items: CollectionProductListItem[],
): Array<{ id: string; titleAr?: string; titleEn?: string }> {
	return items.map((item) => ({
		id: item.productId,
		titleAr: item.titleAr,
		titleEn: item.titleEn,
	}))
}

export async function fetchCollectionProductsFromUrl(
	apiUrl: string,
): Promise<Array<{ id: string; titleAr?: string; titleEn?: string }>> {
	const response = await api<
		PagedApiResponse<CollectionProductListItem> | ApiResponse<CollectionProductListItem[]>
	>(apiUrl)

	const items = Array.isArray(response.data) ? response.data : []
	return mapCollectionProductItems(items)
}

export async function fetchCollectionProductRefs(
	collectionId: string,
): Promise<Array<{ id: string; titleAr?: string; titleEn?: string }>> {
	return fetchCollectionProductsFromUrl(getCollectionProductsApiUrl(collectionId))
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
		productCount: item.productCount,
	}),
	getItemSummary: (item) =>
		item?.name
			? `${item.name} (${item.productCount ?? 0} منتج)`
			: "مجموعة",
}
