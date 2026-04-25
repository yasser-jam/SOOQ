import type { CreateProductCategoryInput, UpdateProductCategoryInput } from "./types"

export const initCategory = (
	id: string,
	data: CreateProductCategoryInput
): UpdateProductCategoryInput => ({
	id,
	data,
})

export const initCategoryPayload = (
	data: CreateProductCategoryInput
): CreateProductCategoryInput => ({
	...data,
	parentCategoryId: data.parentCategoryId === "" ? null : data.parentCategoryId,
})
