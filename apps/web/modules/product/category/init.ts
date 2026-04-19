import type {
	CreateProductCategoryInput,
	UpdateProductCategoryInput,
} from "./actions"

export const initCategory = (
	id: string,
	data: CreateProductCategoryInput
): UpdateProductCategoryInput => ({
	id,
	data,
})
