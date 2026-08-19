import type { ExternalField } from "@/core/types/Fields"
import api, { toFullApiUrl } from "@/lib/api"
import publicApi from "@/lib/public-api"
import { resolveMediaUrl } from "@/lib/media"
import { getEditorTenantId } from "@/lib/tenant-context"
import type { ApiResponse, PagedApiResponse } from "@/lib/types"

export type ProductPickerRef = {
	id: string
	titleAr?: string
	titleEn?: string
	slug?: string
}

export type ProductResourceMetadata = {
	type: "product"
	method: "get"
	apiUrl: string
	id: string
}

/**
 * Rendered blocks read products from the public API only:
 * `/public/products` for listings and `/public/products/{slug}` for detail.
 * The admin card endpoint (`/admin/products/{id}?include=…`) used to back
 * product blocks — it needs merchant credentials the storefront doesn't have,
 * and it made a listing cost one request per card.
 */
export function getPublicProductApiPath(slug: string): string {
	return `/public/products/${encodeURIComponent(slug)}`
}

export function getPublicProductApiUrl(slug: string): string {
	return toFullApiUrl(getPublicProductApiPath(slug))
}

export function buildPublicProductResourceMetadata(
	slug: string,
	id?: string,
): ProductResourceMetadata {
	return {
		type: "product",
		method: "get",
		apiUrl: getPublicProductApiUrl(slug),
		id: id ?? slug,
	}
}

function isPublicApiUrl(apiUrl: string): boolean {
	return (
		apiUrl.includes("/public/products/") ||
		apiUrl.includes("/api/v1/public/products/")
	)
}

function pickLocalizedString(
	record: Record<string, unknown>,
	arKeys: string[],
	enKeys: string[],
	locale: "ar" | "en",
): string {
	const readKeys = (keys: string[]) => {
		for (const key of keys) {
			const v = record[key]
			if (typeof v === "string" && v.trim()) return v.trim()
		}
		return ""
	}
	const primary = readKeys(locale === "ar" ? arKeys : enKeys)
	if (primary) return primary
	return readKeys(locale === "ar" ? enKeys : arKeys)
}

/**
 * Build a locale-specific one-line summary of product attributes for the
 * ContentParagraph binding on the product-details preset — e.g. Arabic:
 * "العلامة التجارية: SOOQ · سعة التخزين: ٦٤ جيجابايت · الضمان: 1".
 */
function formatAttributesDisplay(
	attributes: Array<Record<string, unknown>>,
	locale: "ar" | "en",
): string {
	const separator = " · "
	const pairSeparator = locale === "ar" ? ": " : ": "

	const lines = attributes
		.map((attr) => {
			const label = pickLocalizedString(
				attr,
				["attributeNameAr", "nameAr", "labelAr"],
				["attributeNameEn", "nameEn", "labelEn"],
				locale,
			)
			if (!label) return null

			const options = Array.isArray(attr.selectedOptions)
				? (attr.selectedOptions as Array<Record<string, unknown>>)
				: []
			let value = ""
			if (options.length > 0) {
				value = options
					.map((opt) =>
						pickLocalizedString(
							opt,
							["optionValueAr", "valueAr", "nameAr"],
							["optionValueEn", "valueEn", "nameEn"],
							locale,
						),
					)
					.filter(Boolean)
					.join("، ")
			}
			if (!value && typeof attr.valueText === "string") {
				value = attr.valueText.trim()
			}
			if (!value && typeof attr.valueNumber === "number") {
				value = String(attr.valueNumber)
			}
			if (!value) return null

			return `${label}${pairSeparator}${value}`
		})
		.filter((line): line is string => Boolean(line))

	return lines.join(separator)
}

function normalizePublicProductPayload(
	raw: ProductDetailPayload,
): ProductDetailPayload {
	if (raw.product != null) return raw

	const flat = raw as Record<string, unknown>
	const productId = String(flat.productId ?? flat.id ?? "")
	const pricingRaw =
		flat.pricing != null && typeof flat.pricing === "object"
			? (flat.pricing as Record<string, unknown>)
			: {}
	const currencyCode = String(
		pricingRaw.currencyCode ?? flat.currencyCode ?? "SYP",
	)

	const rawImages = Array.isArray(flat.images)
		? (flat.images as Array<Record<string, unknown> | string>)
		: []
	const images = rawImages
		.map((item, index) => {
			if (typeof item === "string") return { url: item, isPrimary: false, sortOrder: index }
			const url = String(item.url ?? item.imageUrl ?? item.publicUrl ?? "").trim()
			if (!url) return null
			const thumbnailUrls =
				item.thumbnailUrls != null && typeof item.thumbnailUrls === "object"
					? (item.thumbnailUrls as Record<string, unknown>)
					: null
			const thumbnailUrl =
				item.thumbnailUrl != null
					? String(item.thumbnailUrl)
					: (thumbnailUrls?.["600"] ?? thumbnailUrls?.["300"] ?? thumbnailUrls?.["150"])
			return {
				url,
				thumbnailUrl: thumbnailUrl != null ? String(thumbnailUrl) : undefined,
				isPrimary: Boolean(item.isPrimary),
				sortOrder: Number(item.sortOrder ?? index),
			}
		})
		.filter(
			(item): item is { url: string; thumbnailUrl?: string; isPrimary: boolean; sortOrder: number } =>
				item != null,
		)
		// Primary image first (main product image), then by declared sortOrder.
		.sort((a, b) => {
			if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1
			return a.sortOrder - b.sortOrder
		})

	const primaryImageUrl =
		flat.primaryImageUrl != null
			? String(flat.primaryImageUrl)
			: (images[0]?.url ?? null)
	const primaryThumbnailUrl =
		flat.primaryThumbnailUrl != null
			? String(flat.primaryThumbnailUrl)
			: (images[0]?.thumbnailUrl ?? null)

	const rawVariants = Array.isArray(flat.variants)
		? (flat.variants as Array<Record<string, unknown>>)
		: []
	const variants = rawVariants.map((variant) => ({
		variantId:
			variant.variantId != null ? String(variant.variantId) : undefined,
		sku: variant.sku != null ? String(variant.sku) : undefined,
		price: variant.price != null ? Number(variant.price) : undefined,
		compareAtPrice:
			variant.compareAtPrice != null ? Number(variant.compareAtPrice) : undefined,
		stockQty: variant.stockQty == null ? null : Number(variant.stockQty),
		optionValues: Array.isArray(variant.optionValues)
			? (variant.optionValues as Array<Record<string, unknown>>)
			: [],
		isActive: variant.available !== false && variant.isActive !== false,
	}))

	// Synthesize a variantMatrix from the flat variants list. The public API
	// doesn't expose per-attribute grouping, so we group option values by
	// their position within each variant's optionValues array (position i =
	// option group i). This is the same convention the admin editor uses.
	const optionGroupCount = variants.reduce(
		(max, v) => Math.max(max, v.optionValues.length),
		0,
	)
	const matrixOptions: Array<{
		optionNameAr: string
		optionNameEn: string
		optionValues: Array<Record<string, unknown>>
	}> = []
	for (let i = 0; i < optionGroupCount; i += 1) {
		const seen = new Map<string, Record<string, unknown>>()
		for (const variant of variants) {
			const value = variant.optionValues[i]
			if (!value) continue
			const id = String(value.optionValueId ?? value.id ?? "").trim()
			if (!id || seen.has(id)) continue
			seen.set(id, value)
		}
		if (seen.size === 0) continue
		matrixOptions.push({
			optionNameAr: `الخيار ${i + 1}`,
			optionNameEn: `Option ${i + 1}`,
			optionValues: [...seen.values()].sort(
				(a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0),
			),
		})
	}

	const rawAttributes = Array.isArray(flat.attributes)
		? (flat.attributes as Array<Record<string, unknown>>)
		: []
	const attributesDisplayAr = formatAttributesDisplay(rawAttributes, "ar")
	const attributesDisplayEn = formatAttributesDisplay(rawAttributes, "en")

	return {
		product: {
			productId,
			id: productId,
			titleAr: flat.titleAr,
			titleEn: flat.titleEn,
			descriptionAr: flat.descriptionAr,
			descriptionEn: flat.descriptionEn,
			slug: flat.slug,
			basePrice: pricingRaw.basePrice ?? flat.basePrice,
			compareAtPrice: pricingRaw.compareAtPrice ?? flat.compareAtPrice,
			currencyCode,
			status: flat.status,
			primaryImageUrl,
			primaryThumbnailUrl,
			media: images,
			tags: flat.tags ?? [],
			categories: flat.categories ?? [],
			attributes: rawAttributes,
			attributesDisplayAr,
			attributesDisplayEn,
		},
		pricing: {
			basePrice: pricingRaw.basePrice ?? flat.basePrice,
			compareAtPrice: pricingRaw.compareAtPrice ?? flat.compareAtPrice,
			currencyCode,
			displayPrice: pricingRaw.displayPrice ?? flat.displayPrice ?? "",
			displayCompareAt:
				pricingRaw.displayCompareAt ?? flat.displayCompareAt ?? "",
			discountPercentage:
				pricingRaw.discountPercentage ?? flat.discountPercentage ?? 0,
			hasDiscount: Boolean(pricingRaw.hasDiscount ?? flat.hasDiscount),
		},
		images,
		variants,
		variantMatrix: {
			options: matrixOptions,
			variants,
		},
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
	/** Kept on the picked ref so the storefront can use `/public/products/{slug}`. */
	slug: string
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
		slug: item.slug ?? "",
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
			variantId:
				variant.variantId != null ? String(variant.variantId) : undefined,
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
		.map((item) => {
			const raw = String(item.url ?? item.thumbnailUrl ?? "").trim()
			return raw ? resolveMediaUrl(raw) ?? raw : ""
		})
		.filter(Boolean)

	if (mediaUrls.length === 0) {
		const primaryImage = product.primaryImageUrl ?? product.primaryThumbnailUrl
		if (primaryImage) {
			const raw = String(primaryImage)
			mediaUrls.push(resolveMediaUrl(raw) ?? raw)
		}
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
		options: Array.isArray(payload.options) ? payload.options : [],
		variants,
	}
}

/** Raw API payload used by editor valueContext path resolution. */
export type ProductDetailPayload = Record<string, unknown>

export async function fetchProductDetailPayloadFromUrl(
	apiUrl: string,
): Promise<ProductDetailPayload | null> {
	if (isPublicApiUrl(apiUrl)) {
		const tenantId = getEditorTenantId()
		if (!tenantId) return null

		const response = await publicApi<ApiResponse<ProductDetailPayload>>(apiUrl, {
			tenantId,
		})
		const raw = response.data
		if (!raw) return null
		return normalizePublicProductPayload(raw)
	}

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
		slug: item.slug || undefined,
	}),
	getItemSummary: (item) => item?.titleAr || item?.titleEn || item?.id || "منتج",
}
