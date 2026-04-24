import type {
	AdminProduct,
	AdminProductImage,
	AdminProductInclude,
	AdminProductListItem,
	AdminProductPricing,
	ListAdminProductsParams,
	PaginatedApiResponse,
	ProductStatus,
} from "../types"

const DEFAULT_PAGE_SIZE = 20
const DEFAULT_SORT = "createdAt,desc"
const DEFAULT_LOW_STOCK_THRESHOLD = 5

const MOCK_ADMIN_PRODUCTS: AdminProduct[] = [
	{
		id: "prd_1001",
		productId: "prd_1001",
		titleAr: "قميص قطني كلاسيكي",
		titleEn: "Classic Cotton Shirt",
		descriptionAr: "قميص رجالي قطني 100% مناسب للاستخدام اليومي.",
		descriptionEn: "Men's 100% cotton shirt for everyday wear.",
		slug: "classic-cotton-shirt-test",
		basePrice: 85000,
		compareAtPrice: 120000,
		currencyCode: "SYP",
		status: "DRAFT",
		seoTitle: "قميص قطني - متجر سوق",
		seoDescription: "اشتري قميص قطني بأفضل سعر",
		allowOversell: false,
		defaultCategoryId: "1",
		categoryIds: ["1"],
		tagIds: ["2"],
		mediaUrls: [
			"https://images.unsplash.com/photo-1521572163474-6864f9cf17ab",
			"https://images.unsplash.com/photo-1512436991641-6745cdb1723f",
		],
		options: [
			{
				optionNameAr: "المقاس",
				optionNameEn: "Size",
				sortOrder: 0,
				values: [
					{ valueAr: "S", valueEn: "S", sortOrder: 0 },
					{ valueAr: "M", valueEn: "M", sortOrder: 1 },
					{ valueAr: "L", valueEn: "L", sortOrder: 2 },
				],
			},
			{
				optionNameAr: "اللون",
				optionNameEn: "Color",
				sortOrder: 1,
				values: [
					{ valueAr: "أحمر", valueEn: "Red", colorHex: "#CC0000", sortOrder: 0 },
					{ valueAr: "أزرق", valueEn: "Blue", colorHex: "#0066CC", sortOrder: 1 },
				],
			},
		],
		variantOverrides: {
			"S-Red": { sku: "SHIRT-S-RED", price: 85000, stockQty: 25, isActive: true },
			"M-Blue": { sku: "SHIRT-M-BLU", price: 90000, stockQty: 10, isActive: true },
		},
		pricing: {
			basePrice: 85000,
			compareAtPrice: 120000,
			currencyCode: "SYP",
			priceRangeMin: 85000,
			priceRangeMax: 90000,
		},
		inventory: {
			totalStockQty: 35,
			availableStockQty: 32,
			reservedStockQty: 3,
			lowStockThreshold: 5,
			inStock: true,
		},
		images: [
			{
				id: "media_1001",
				mediaAssetId: "media_1001",
				url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab",
				altText: "Classic Cotton Shirt front view",
				isPrimary: true,
				sortOrder: 0,
				createdAt: "2026-04-19T00:00:00.000Z",
				updatedAt: "2026-04-19T00:00:00.000Z",
			},
			{
				id: "media_1002",
				mediaAssetId: "media_1002",
				url: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f",
				altText: "Classic Cotton Shirt alternate view",
				isPrimary: false,
				sortOrder: 1,
				createdAt: "2026-04-19T00:00:00.000Z",
				updatedAt: "2026-04-19T00:00:00.000Z",
			},
		],
		createdAt: "2026-04-19T00:00:00.000Z",
		updatedAt: "2026-04-20T09:30:00.000Z",
	},
	{
		id: "prd_1002",
		productId: "prd_1002",
		titleAr: "منتج بسيط",
		titleEn: "Simple Product",
		slug: "simple-product-test",
		basePrice: 50000,
		currencyCode: "SYP",
		status: "ACTIVE",
		allowOversell: false,
		pricing: {
			basePrice: 50000,
			currencyCode: "SYP",
			priceRangeMin: 50000,
			priceRangeMax: 50000,
		},
		inventory: {
			totalStockQty: 18,
			availableStockQty: 18,
			reservedStockQty: 0,
			lowStockThreshold: 5,
			inStock: true,
		},
		images: [
			{
				id: "media_1003",
				mediaAssetId: "media_1003",
				url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff",
				altText: "Simple Product",
				isPrimary: true,
				sortOrder: 0,
				createdAt: "2026-04-18T13:00:00.000Z",
				updatedAt: "2026-04-18T13:00:00.000Z",
			},
		],
		mediaUrls: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff"],
		createdAt: "2026-04-18T13:00:00.000Z",
		updatedAt: "2026-04-18T13:00:00.000Z",
	},
	{
		id: "prd_1003",
		productId: "prd_1003",
		titleAr: "سماعة بلوتوث",
		titleEn: "Bluetooth Headset",
		descriptionAr: "سماعة لاسلكية بعزل ضوضاء وبطارية تدوم طويلاً.",
		descriptionEn: "Wireless headset with noise isolation and long battery life.",
		slug: "bluetooth-headset",
		basePrice: 95000,
		compareAtPrice: 110000,
		currencyCode: "SYP",
		status: "ARCHIVED",
		seoTitle: "سماعة بلوتوث - متجر سوق",
		seoDescription: "سماعة لاسلكية بجودة عالية",
		allowOversell: true,
		defaultCategoryId: "4",
		categoryIds: ["4"],
		tagIds: ["1", "3"],
		options: [
			{
				optionNameAr: "اللون",
				optionNameEn: "Color",
				sortOrder: 0,
				values: [
					{ valueAr: "أسود", valueEn: "Black", sortOrder: 0 },
					{ valueAr: "أبيض", valueEn: "White", sortOrder: 1 },
				],
			},
		],
		variantOverrides: {
			Black: { sku: "HEADSET-BLK", price: 95000, stockQty: 2, isActive: true },
			White: { sku: "HEADSET-WHT", price: 97000, stockQty: 0, isActive: false },
		},
		pricing: {
			basePrice: 95000,
			compareAtPrice: 110000,
			currencyCode: "SYP",
			priceRangeMin: 95000,
			priceRangeMax: 97000,
		},
		inventory: {
			totalStockQty: 2,
			availableStockQty: 2,
			reservedStockQty: 0,
			lowStockThreshold: 5,
			inStock: true,
		},
		images: [
			{
				id: "media_1004",
				mediaAssetId: "media_1004",
				url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e",
				altText: "Bluetooth Headset",
				isPrimary: true,
				sortOrder: 0,
				createdAt: "2026-04-17T10:00:00.000Z",
				updatedAt: "2026-04-17T10:00:00.000Z",
			},
		],
		mediaUrls: ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e"],
		createdAt: "2026-04-17T10:00:00.000Z",
		updatedAt: "2026-04-22T07:45:00.000Z",
	},
]

const getPrimaryImage = (images?: AdminProductImage[]) =>
	images?.find((image) => image.isPrimary) ?? images?.[0]

const compareByDirection = (
	left: string | number | undefined,
	right: string | number | undefined,
	direction: "asc" | "desc"
) => {
	const leftValue = left ?? ""
	const rightValue = right ?? ""

	if (leftValue === rightValue) {
		return 0
	}

	if (direction === "asc") {
		return leftValue > rightValue ? 1 : -1
	}

	return leftValue < rightValue ? 1 : -1
}

const sortProducts = (
	products: AdminProduct[],
	sort: string = DEFAULT_SORT
) => {
	const [fieldRaw, directionRaw] = sort.split(",")
	const field = fieldRaw === "titleAr" || fieldRaw === "basePrice" || fieldRaw === "updatedAt"
		? fieldRaw
		: "createdAt"
	const direction = directionRaw === "asc" ? "asc" : "desc"

	return [...products].sort((left, right) => {
		if (field === "basePrice") {
			return compareByDirection(left.basePrice, right.basePrice, direction)
		}

		if (field === "titleAr") {
			return compareByDirection(left.titleAr, right.titleAr, direction)
		}

		return compareByDirection(left[field], right[field], direction)
	})
}

const toListItem = (product: AdminProduct): AdminProductListItem => {
	const primaryImage = getPrimaryImage(product.images)

	return {
		id: product.id,
		productId: product.productId ?? product.id,
		titleAr: product.titleAr,
		titleEn: product.titleEn,
		slug: product.slug,
		status: product.status,
		basePrice: product.basePrice,
		compareAtPrice: product.compareAtPrice,
		currencyCode: product.currencyCode,
		allowOversell: product.allowOversell,
		thumbnailUrl: primaryImage?.url ?? null,
		imageUrl: primaryImage?.url ?? null,
		defaultCategoryId: product.defaultCategoryId ?? null,
		categoryIds: product.categoryIds ?? [],
		tagIds: product.tagIds ?? [],
		pricing: product.pricing ?? null,
		inventory: product.inventory ?? null,
		createdAt: product.createdAt,
		updatedAt: product.updatedAt,
	}
}

const withRequestedBlocks = (
	product: AdminProduct,
	includes: AdminProductInclude[] = []
): AdminProduct => {
	const requestedIncludes = new Set(includes)
	const includeAllBlocks = requestedIncludes.size === 0

	return {
		...product,
		images:
			includeAllBlocks || requestedIncludes.has("IMAGES")
				? product.images ?? []
				: undefined,
		pricing:
			includeAllBlocks || requestedIncludes.has("PRICING")
				? product.pricing ?? null
				: undefined,
		inventory:
			includeAllBlocks || requestedIncludes.has("INVENTORY")
				? {
						lowStockThreshold:
							product.inventory?.lowStockThreshold ??
							DEFAULT_LOW_STOCK_THRESHOLD,
						...product.inventory,
					}
				: undefined,
	}
}

export const listMockAdminProducts = (
	params: ListAdminProductsParams = {}
): PaginatedApiResponse<AdminProductListItem> => {
	const page = Math.max(0, params.page ?? 0)
	const size = Math.max(1, params.size ?? DEFAULT_PAGE_SIZE)
	const query = params.q?.trim().toLowerCase()

	const filteredProducts = sortProducts(
		MOCK_ADMIN_PRODUCTS.filter((product) => {
			const matchesStatus = params.status ? product.status === params.status : true

			if (!matchesStatus) {
				return false
			}

			if (!query) {
				return true
			}

			return [product.titleAr, product.titleEn, product.slug].some((value) =>
				value?.toLowerCase().includes(query)
			)
		}),
		params.sort
	)

	const totalItems = filteredProducts.length
	const totalPages = Math.max(1, Math.ceil(totalItems / size))
	const start = page * size
	const content = filteredProducts.slice(start, start + size).map(toListItem)

	return {
		content,
		items: content,
		totalElements: totalItems,
		totalItems,
		totalPages,
		page,
		number: page,
		size,
	}
}

export const getMockAdminProduct = (
	id: string,
	includes: AdminProductInclude[] = []
): AdminProduct | undefined => {
	const product = MOCK_ADMIN_PRODUCTS.find(
		(currentProduct) =>
			currentProduct.id === id ||
			currentProduct.productId === id ||
			currentProduct.slug === id
	)

	if (!product) {
		return undefined
	}

	return withRequestedBlocks(product, includes)
}
