import * as z from "zod"

import { productCollectionSchema } from "./schema"

export type ProductCollection = z.infer<typeof productCollectionSchema>

export type ProductCollectionApiModel = ProductCollection & {
	collectionId?: string
	productCollectionId?: string
}

export type CreateProductCollectionInput = Pick<
	ProductCollection,
	|
		"collectionName"
	|
		"collectionSlug"
	|
		"collectionType"
	|
		"descriptionAr"
	|
		"descriptionEn"
	|
		"isActive"
>

export type UpdateProductCollectionInput = {
	id: string
	data: CreateProductCollectionInput
}

/* === Sub-resources (Phase 4A) =========================================== */

export type CollectionProductLink = {
	productId: string
	sortOrder: number
	titleAr?: string
	titleEn?: string
	primaryImageUrl?: string
	displayPrice?: string
	stockStatus?: string
}

export type CollectionRule = {
	collectionRuleId?: string
	fieldKey: string
	operator: string
	value: string
	logicGroup: "AND" | "OR"
}

export type CollectionRuleInput = Omit<CollectionRule, "collectionRuleId">

/** Lightweight product preview returned by /preview endpoint. */
export type CollectionPreviewProduct = {
	productId: string
	titleAr?: string
	titleEn?: string
	primaryImageUrl?: string
	displayPrice?: string
}
