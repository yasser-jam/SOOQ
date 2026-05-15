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
	// Phase 5 (PRD): strip the "بدون قالب" sentinel so the backend sees the
	// field only when the merchant actually picked a template.
	templateKey:
		data.templateKey && data.templateKey !== "__none__"
			? data.templateKey
			: undefined,
})
