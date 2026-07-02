import type { ExternalField } from "@/core/types/Fields"
import api, { toFullApiUrl } from "@/lib/api"
import type { ApiResponse, PagedApiResponse } from "@/lib/types"

export type ProductPickerRef = {
	id: string
	titleAr?: string
	titleEn?: string
}

export type ProductResourceMetadata = {
	type: "product"
	method: "get"
	apiUrl: string
	id: string
}

export const PRODUCT_CARD_API_INCLUDES = [
	"PRICING",
	"IMAGES",
	"INVENTORY",
] as const

export function getProductCardApiPath(id: string): string {
	const includes = PRODUCT_CARD_API_INCLUDES.map(
		(include) => `include=${include}`,
	).join("&")
	return `/admin/products/${id}?${includes}`
}

export function getProductCardApiUrl(id: string): string {
	return toFullApiUrl(getProductCardApiPath(id))
}

export function buildProductResourceMetadata(id: string): ProductResourceMetadata {
	return {
		type: "product",
		method: "get",
		apiUrl: getProductCardApiUrl(id),
		id,
	}
}

export type ProductCardVariant = {
	variantId?: string
	attributes: Record<string, string>
	price: number
	compareAtPrice: number
	stockQty: number | null
	lowStockThreshold?: number | null
	isActive?: boolean
}

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
	detail: (id: string, apiUrl = "") =>
		[...productPickerKeys.all, id, apiUrl] as const,
	list: (query: string) => [...productPickerKeys.all, "list", query] as const,
}

type AdminProductListItem = {
	productId: string
	titleAr: string
	titleEn: string
	slug?: string
	displayPrice?: string
	basePrice?: number
	currencyCode?: string
	status?: string
}

type ProductListRow = {
	id: string
	titleAr: string
	titleEn: string
	description: string
}

const PRODUCT_LIST_PAGE_SIZE = 100

let cachedProductList: ProductListRow[] | null = null

async function fetchProductListRows(): Promise<ProductListRow[]> {
	if (cachedProductList) return cachedProductList

	const response = await api<PagedApiResponse<AdminProductListItem>>(
		"/admin/products",
		{
			params: { page: 0, size: PRODUCT_LIST_PAGE_SIZE },
		},
	)

	cachedProductList = (response.data ?? []).map((item) => ({
		id: item.productId,
		titleAr: item.titleAr ?? "",
		titleEn: item.titleEn ?? "",
		description:
			item.displayPrice ??
			(item.basePrice != null && item.currencyCode
				? `${item.basePrice} ${item.currencyCode}`
				: item.slug ?? ""),
	}))

	return cachedProductList
}

function filterProductList(rows: ProductListRow[], query: string): ProductListRow[] {
	const normalized = query.trim().toLowerCase()
	if (!normalized) return rows

	return rows.filter(
		(product) =>
			product.titleAr.toLowerCase().includes(normalized) ||
			product.titleEn.toLowerCase().includes(normalized) ||
			product.description.toLowerCase().includes(normalized) ||
			product.id.toLowerCase().includes(normalized),
	)
}

function mapVariantsFromDetail(data: Record<string, unknown>): ProductCardVariant[] {
	const matrixOptions: Array<Record<string, unknown>> =
		(Array.isArray((data.variantMatrix as { options?: unknown[] })?.options) &&
			(data.variantMatrix as { options: Array<Record<string, unknown>> }).options) ||
		(Array.isArray(data.options) && (data.options as Array<Record<string, unknown>>)) ||
		[]

	const dedupSeen = new Set<string>()
	const normalizedOptions = matrixOptions.filter((option) => {
		const key = String(
			option.optionNameEn ?? option.titleEn ?? option.optionNameAr ?? option.titleAr ?? "",
		)
			.trim()
			.toLowerCase()
		if (!key || dedupSeen.has(key)) return false
		dedupSeen.add(key)
		return true
	})

	const optionMetaByValueId = new Map<
		string,
		{ axisKey: string; valueLabel: (raw: Record<string, unknown>) => string }
	>()

	for (const option of normalizedOptions) {
		const axisKey = String(option.optionNameAr ?? option.optionNameEn ?? "").trim()
		if (!axisKey) continue

		const values = (option.values ?? option.optionValues ?? []) as Array<
			Record<string, unknown>
		>

		for (const value of values) {
			const valueId = String(value.optionValueId ?? value.id ?? "")
			if (!valueId) continue

			const valueAr = String(value.valueAr ?? value.titleAr ?? "")
			const valueEn = String(value.valueEn ?? value.titleEn ?? "")
			optionMetaByValueId.set(valueId, {
				axisKey,
				valueLabel: () => (valueAr || valueEn).trim(),
			})
		}
	}

	const rawVariants: Array<Record<string, unknown>> = Array.isArray(
		(data.variantMatrix as { variants?: unknown[] })?.variants,
	)
		? ((data.variantMatrix as { variants: Array<Record<string, unknown>> }).variants ??
			[])
		: Array.isArray(data.variants)
			? (data.variants as Array<Record<string, unknown>>)
			: []

	return rawVariants.map((variant) => {
		const attributes: Record<string, string> = {}

		for (const optionValue of (variant.optionValues ?? []) as Array<
			Record<string, unknown>
		>) {
			const valueId = String(optionValue.optionValueId ?? optionValue.id ?? "")
			const meta = valueId ? optionMetaByValueId.get(valueId) : undefined

			if (meta) {
				attributes[meta.axisKey] = meta.valueLabel(optionValue)
				continue
			}

			const axis = String(optionValue.optionNameAr ?? optionValue.optionNameEn ?? "").trim()
			const label = String(optionValue.valueAr ?? optionValue.valueEn ?? "").trim()
			if (axis && label) attributes[axis] = label
		}

		return {
			attributes,
			price: Number(variant.price ?? 0),
			compareAtPrice: Number(variant.compareAtPrice ?? 0),
			stockQty:
				variant.stockQty == null ? null : Number(variant.stockQty),
			lowStockThreshold:
				variant.lowStockThreshold == null
					? null
					: Number(variant.lowStockThreshold),
			isActive: variant.isActive !== false,
		}
	})
}

function mapAdminDetailToProductCardData(
	payload: Record<string, unknown>,
): ProductCardData | null {
	const product = (payload.product ?? {}) as Record<string, unknown>
	const pricing = (payload.pricing ?? {}) as Record<string, unknown>
	const id = String(product.productId ?? product.id ?? "")

	if (!id) return null

	const media = (product.media ?? []) as Array<Record<string, unknown>>
	const mediaUrls = media
		.map((item) => String(item.url ?? item.thumbnailUrl ?? ""))
		.filter(Boolean)

	if (mediaUrls.length === 0) {
		const primaryImage = product.primaryImageUrl ?? product.primaryThumbnailUrl
		if (primaryImage) mediaUrls.push(String(primaryImage))
	}

	const categories = ((payload.categories ?? []) as Array<Record<string, unknown>>).map(
		(category) => ({
			id: String(category.categoryId ?? category.id ?? ""),
			name: String(
				category.nameAr ?? category.nameEn ?? category.name ?? category.categoryId ?? "",
			),
		}),
	)

	const tags = ((payload.tags ?? []) as Array<Record<string, unknown>>).map((tag) => ({
		id: String(tag.productTagId ?? tag.id ?? ""),
		name: String(tag.tagName ?? tag.name ?? tag.productTagId ?? ""),
	}))

	const variants = mapVariantsFromDetail(payload)
	const basePrice = Number(pricing.basePrice ?? product.basePrice ?? 0)
	const compareAtPrice = Number(
		pricing.compareAtPrice ?? product.compareAtPrice ?? 0,
	)

	return {
		id,
		titleAr: String(product.titleAr ?? ""),
		titleEn: String(product.titleEn ?? ""),
		descriptionAr: String(product.descriptionAr ?? ""),
		descriptionEn: String(product.descriptionEn ?? ""),
		slug: String(product.slug ?? id),
		basePrice,
		compareAtPrice,
		currencyCode: String(pricing.currencyCode ?? product.currencyCode ?? "SYP"),
		status: String(product.status ?? "DRAFT"),
		allowOversell: Boolean(product.allowOversell),
		categories,
		tags,
		mediaUrls,
		options: payload.options ?? [],
		variants,
	}
}

/** Raw API payload used by editor valueContext path resolution. */
export type ProductDetailPayload = Record<string, unknown>

export async function fetchProductDetailPayloadFromUrl(
	apiUrl: string,
): Promise<ProductDetailPayload | null> {
	const response = await api<ApiResponse<ProductDetailPayload>>(apiUrl)
	return response.data ?? null
}

export async function fetchProductForCardFromUrl(
	apiUrl: string,
): Promise<ProductCardData | null> {
	const payload = await fetchProductDetailPayloadFromUrl(apiUrl)
	if (!payload) return null
	return mapAdminDetailToProductCardData(payload)
}

export async function getProductForCard(id: string): Promise<ProductCardData | null> {
	return fetchProductForCardFromUrl(getProductCardApiUrl(id))
}

export const productExternalField: ExternalField<ProductPickerRef | null> = {
	type: "external",
	placeholder: "ابحث عن منتج…",
	showSearch: true,
	fetchList: async ({ query }) => {
		const rows = await fetchProductListRows()
		return filterProductList(rows, query)
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
