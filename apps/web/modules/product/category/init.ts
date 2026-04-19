import type {
	CreateProductCategoryInput,
	UpdateProductCategoryInput,
} from "./actions"
import type { ProductCategory } from "./types"

export const categoryFormDefaultValues: CreateProductCategoryInput = {
	nameAr: "",
	nameEn: "",
	slug: "",
	descriptionAr: "",
	descriptionEn: "",
	parentCategoryId: "",
	sortOrder: 0,
	isActive: true,
}

export const initCategoryFormValues = (
	category?: ProductCategory | null
): CreateProductCategoryInput => {
	if (!category) {
		return { ...categoryFormDefaultValues }
	}

	return {
		nameAr: category.nameAr,
		nameEn: category.nameEn,
		slug: category.slug,
		descriptionAr: category.descriptionAr,
		descriptionEn: category.descriptionEn,
		parentCategoryId: category.parentCategoryId ?? "",
		sortOrder: category.sortOrder,
		isActive: category.isActive,
	}
}

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
