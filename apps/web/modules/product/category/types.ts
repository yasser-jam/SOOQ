import * as z from "zod"

import { productCategorySchema } from "./schema"

export type ProductCategory = z.infer<typeof productCategorySchema>

export type { CategoryTemplate } from "./actions"

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
> & {
	/** Phase 5 (PRD): optional starter template key. Honored on POST only. */
	templateKey?: string
}

export type UpdateProductCategoryInput = {
	id: string
	data: CreateProductCategoryInput
}
