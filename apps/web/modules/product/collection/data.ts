import type { ProductCollection } from "./types"

const timestamp = "2026-04-19T00:00:00.000Z"

export const productCollections: ProductCollection[] = [
	{
		id: "1",
		collectionName: "Summer Sale",
		collectionSlug: "summer-sale",
		collectionType: "MANUAL",
		descriptionAr: "تخفيضات الصيف",
		descriptionEn: "Summer discounts",
		isActive: true,
		createdAt: timestamp,
		updatedAt: timestamp,
	},
]
