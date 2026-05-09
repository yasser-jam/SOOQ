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
