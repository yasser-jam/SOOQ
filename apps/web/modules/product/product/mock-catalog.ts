export type MockCatalogCategory = {
	id: string
	name: string
}

export type MockCatalogVariant = {
	attributes: Record<string, string>
	price: number
	compareAtPrice: number
	stockQty: number | null
	lowStockThreshold?: number | null
	isActive?: boolean
}

export type MockCatalogProduct = {
	id: string
	titleAr: string
	titleEn: string
	descriptionAr: string
	descriptionEn: string
	slug: string
	basePrice: number
	compareAtPrice: number
	currencyCode: string
	status: "ACTIVE" | "DRAFT" | "ARCHIVED"
	allowOversell: boolean
	categories: MockCatalogCategory[]
	collections: string[]
	tags: Array<{ id: string; name?: string }>
	mediaUrls: string[]
	variants: MockCatalogVariant[]
}

const img = (seed: string) =>
	`https://images.unsplash.com/${seed}?w=800&auto=format&fit=crop&q=80`

const variant = (
	attrs: Record<string, string>,
	price: number,
	compareAtPrice: number,
	stockQty: number,
): MockCatalogVariant => ({
	attributes: attrs,
	price,
	compareAtPrice,
	stockQty,
	isActive: true,
})

/** Demo catalog for the Puck editor — mirrors legacy `products.ts` shape. */
export const MOCK_CATALOG_PRODUCTS: MockCatalogProduct[] = [
	{
		id: "prod-001",
		titleAr: "حذاء أبيض كلاسيكي",
		titleEn: "Classic White Sneakers",
		descriptionAr: "حذاء يومي مريح بلماشٍ شبكي.",
		descriptionEn: "Everyday comfort sneaker with a breathable mesh upper.",
		slug: "classic-white-sneakers",
		basePrice: 89,
		compareAtPrice: 119,
		currencyCode: "USD",
		status: "ACTIVE",
		allowOversell: false,
		categories: [{ id: "cat-footwear", name: "Footwear" }],
		collections: ["new-arrivals"],
		tags: [{ id: "tag-bestseller", name: "Best seller" }],
		mediaUrls: [img("photo-1542291026-7eec264c27ff")],
		variants: [
			variant({ Size: "40" }, 89, 119, 12),
			variant({ Size: "41" }, 89, 119, 8),
			variant({ Size: "42" }, 89, 119, 0),
		],
	},
	{
		id: "prod-002",
		titleAr: "حقيبة جلدية",
		titleEn: "Leather Tote Bag",
		descriptionAr: "حقيبة جلدية عملية للاستخدام اليومي.",
		descriptionEn: "Practical leather tote for daily carry.",
		slug: "leather-tote-bag",
		basePrice: 145,
		compareAtPrice: 145,
		currencyCode: "USD",
		status: "ACTIVE",
		allowOversell: false,
		categories: [{ id: "cat-accessories", name: "Accessories" }],
		collections: ["essentials"],
		tags: [],
		mediaUrls: [img("photo-1590874106678-dc2835778906a")],
		variants: [variant({}, 145, 145, 6)],
	},
	{
		id: "prod-003",
		titleAr: "قميص كتّان",
		titleEn: "Linen Shirt",
		descriptionAr: "قميص كتان خفيف مناسب للصيف.",
		descriptionEn: "Lightweight linen shirt for warm days.",
		slug: "linen-shirt",
		basePrice: 64,
		compareAtPrice: 79,
		currencyCode: "USD",
		status: "ACTIVE",
		allowOversell: false,
		categories: [{ id: "cat-apparel", name: "Apparel" }],
		collections: ["summer"],
		tags: [{ id: "tag-linen", name: "Linen" }],
		mediaUrls: [img("photo-1620799140188-f897a468a7a1")],
		variants: [
			variant({ Size: "S" }, 64, 79, 10),
			variant({ Size: "M" }, 64, 79, 14),
			variant({ Size: "L" }, 64, 79, 5),
		],
	},
	{
		id: "prod-004",
		titleAr: "ساعة بسيطة",
		titleEn: "Minimal Watch",
		descriptionAr: "ساعة أنيقة بإطار رقيق.",
		descriptionEn: "Elegant watch with a slim case.",
		slug: "minimal-watch",
		basePrice: 210,
		compareAtPrice: 249,
		currencyCode: "USD",
		status: "ACTIVE",
		allowOversell: false,
		categories: [{ id: "cat-accessories", name: "Accessories" }],
		collections: ["gifts"],
		tags: [],
		mediaUrls: [img("photo-1523275335684-37898b6baf30")],
		variants: [variant({ Finish: "Silver" }, 210, 249, 4)],
	},
	{
		id: "prod-005",
		titleAr: "مزهرية سيرamic",
		titleEn: "Ceramic Vase",
		descriptionAr: "قطعة ديكور يدوية الصنع.",
		descriptionEn: "Handmade decor piece for the shelf.",
		slug: "ceramic-vase",
		basePrice: 48,
		compareAtPrice: 48,
		currencyCode: "USD",
		status: "ACTIVE",
		allowOversell: true,
		categories: [{ id: "cat-home", name: "Home" }],
		collections: ["artisan"],
		tags: [{ id: "tag-handmade", name: "Handmade" }],
		mediaUrls: [img("photo-1618221195710-dd6b41faaea6")],
		variants: [variant({}, 48, 48, 20)],
	},
	{
		id: "prod-006",
		titleAr: "بطانية صوف",
		titleEn: "Wool Throw",
		descriptionAr: "بطانية صوف ناعمة بللون محايد.",
		descriptionEn: "Soft wool throw in a neutral tone.",
		slug: "wool-throw",
		basePrice: 98,
		compareAtPrice: 120,
		currencyCode: "USD",
		status: "ACTIVE",
		allowOversell: false,
		categories: [{ id: "cat-home", name: "Home" }],
		collections: ["cozy"],
		tags: [],
		mediaUrls: [img("photo-1616486338812-68fd4c45c822")],
		variants: [variant({}, 98, 120, 7)],
	},
	{
		id: "prod-007",
		titleAr: "نظارات شمسية",
		titleEn: "Sunglasses",
		descriptionAr: "إطار أسيتات مع حماية UV.",
		descriptionEn: "Acetate frame with UV protection.",
		slug: "sunglasses",
		basePrice: 55,
		compareAtPrice: 70,
		currencyCode: "USD",
		status: "ACTIVE",
		allowOversell: false,
		categories: [{ id: "cat-accessories", name: "Accessories" }],
		collections: ["summer"],
		tags: [],
		mediaUrls: [img("photo-1572635196237-14b492f07966")],
		variants: [variant({}, 55, 70, 15)],
	},
	{
		id: "prod-008",
		titleAr: "جاكيت دنيم",
		titleEn: "Denim Jacket",
		descriptionAr: "جاكيت دنيم كلاسيكي.",
		descriptionEn: "Classic denim jacket.",
		slug: "denim-jacket",
		basePrice: 110,
		compareAtPrice: 110,
		currencyCode: "USD",
		status: "ACTIVE",
		allowOversell: false,
		categories: [{ id: "cat-apparel", name: "Apparel" }],
		collections: ["essentials"],
		tags: [],
		mediaUrls: [img("photo-1551028719-00167b16eac5")],
		variants: [
			variant({ Size: "M" }, 110, 110, 3),
			variant({ Size: "L" }, 110, 110, 2),
		],
	},
	{
		id: "prod-009",
		titleAr: "شموع معطرة",
		titleEn: "Scented Candles",
		descriptionAr: "مجموعة شموع برائح خفيفة.",
		descriptionEn: "Set of lightly scented candles.",
		slug: "scented-candles",
		basePrice: 36,
		compareAtPrice: 36,
		currencyCode: "USD",
		status: "ACTIVE",
		allowOversell: true,
		categories: [{ id: "cat-home", name: "Home" }],
		collections: ["gifts"],
		tags: [],
		mediaUrls: [img("photo-1602874802956-7c5536832487")],
		variants: [variant({}, 36, 36, 30)],
	},
	{
		id: "prod-010",
		titleAr: "حزام جلدي",
		titleEn: "Leather Belt",
		descriptionAr: "حزام جلد طبيعي مع إبزيم معدني.",
		descriptionEn: "Full-grain leather belt with metal buckle.",
		slug: "leather-belt",
		basePrice: 42,
		compareAtPrice: 52,
		currencyCode: "USD",
		status: "ACTIVE",
		allowOversell: false,
		categories: [{ id: "cat-accessories", name: "Accessories" }],
		collections: ["essentials"],
		tags: [],
		mediaUrls: [img("photo-1624222247344-550cc18d25")],
		variants: [variant({ Size: "32" }, 42, 52, 9)],
	},
	{
		id: "prod-011",
		titleAr: "بنطلون تشino",
		titleEn: "Chino Trousers",
		descriptionAr: "قصة مستقيمة مناسبة للعمل والعطلة.",
		descriptionEn: "Straight fit for work and weekends.",
		slug: "chino-trousers",
		basePrice: 72,
		compareAtPrice: 90,
		currencyCode: "USD",
		status: "ACTIVE",
		allowOversell: false,
		categories: [{ id: "cat-apparel", name: "Apparel" }],
		collections: ["essentials"],
		tags: [],
		mediaUrls: [img("photo-1473966960720-791de36711934")],
		variants: [
			variant({ Size: "30" }, 72, 90, 6),
			variant({ Size: "32" }, 72, 90, 4),
		],
	},
	{
		id: "prod-012",
		titleAr: "حذاء جري",
		titleEn: "Running Shoes",
		descriptionAr: "حذاء خفيف للجري والمشي.",
		descriptionEn: "Lightweight trainer for runs and walks.",
		slug: "running-shoes",
		basePrice: 95,
		compareAtPrice: 120,
		currencyCode: "USD",
		status: "ACTIVE",
		allowOversell: false,
		categories: [{ id: "cat-footwear", name: "Footwear" }],
		collections: ["new-arrivals"],
		tags: [{ id: "tag-sport", name: "Sport" }],
		mediaUrls: [img("photo-1460353583731-92c6da0888fe")],
		variants: [
			variant({ Size: "41" }, 95, 120, 11),
			variant({ Size: "42" }, 95, 120, 9),
		],
	},
]

export const getMockCatalogProduct = (
	id: string,
): MockCatalogProduct | undefined =>
	MOCK_CATALOG_PRODUCTS.find((product) => product.id === id)
