import type { Product } from "./types"

const timestamp = "2026-04-19T00:00:00.000Z"

export const productsData: Product[] = [
	{
		id: "1",
		titleAr: "قميص قطني كلاسيكي",
		titleEn: "Classic Cotton Shirt",
		descriptionAr: "قميص رجالي قطني 100%",
		descriptionEn: "Men's 100% cotton shirt",
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
		mediaUrls: [],
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
		createdAt: timestamp,
		updatedAt: timestamp,
	},
]
