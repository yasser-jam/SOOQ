import * as z from "zod"

import { productCollectionSchema } from "./schema"

export type ProductCollection = z.infer<typeof productCollectionSchema>

export type ProductCollectionApiModel = ProductCollection & {
	collectionId?: string
	productCollectionId?: string
}

export type CollectionProduct = {
	productId: string
	sortOrder?: number
}

export type CollectionRule = {
	fieldKey: string
	operator: string
	value: string
	logicGroup: "AND" | "OR"
}

export type CollectionPreviewItem = {
	productId?: string
	id?: string
	titleAr?: string
	titleEn?: string
	slug?: string
	basePrice?: number
	currencyCode?: string
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

export type AddCollectionProductInput = {
	id: string
	data: CollectionProduct
}

export type AddCollectionRuleInput = {
	id: string
	data: CollectionRule
}
