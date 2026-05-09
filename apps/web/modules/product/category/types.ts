import * as z from "zod"

import { productCategorySchema } from "./schema"

export type ProductCategory = z.infer<typeof productCategorySchema>

export type CreateProductCategoryInput = Pick<
	ProductCategory,
	|
		"nameAr"
	|
		"nameEn"
	|
		"slug"
	|
		"descriptionAr"
	|
		"descriptionEn"
	|
		"parentCategoryId"
	|
		"sortOrder"
	|
		"isActive"
>

export type UpdateProductCategoryInput = {
	id: string
	data: CreateProductCategoryInput
}
