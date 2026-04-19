import type { CreateProductInput, UpdateProductInput } from "./actions"
import type { Product } from "./types"

export const productFormDefaultValues: CreateProductInput = {
	titleAr: "",
	titleEn: "",
	descriptionAr: "",
	descriptionEn: "",
	slug: "",
	basePrice: 0,
	compareAtPrice: 0,
	currencyCode: "SYP",
	status: "DRAFT",
	seoTitle: "",
	seoDescription: "",
	allowOversell: false,
	defaultCategoryId: "",
	categoryIds: [],
	tagIds: [],
	mediaUrls: [],
	options: [],
}

export const initProductFormValues = (
	product?: Product | null
): CreateProductInput => {
	if (!product) {
		return { ...productFormDefaultValues }
	}

	return {
		titleAr: product.titleAr,
		titleEn: product.titleEn,
		descriptionAr: product.descriptionAr,
		descriptionEn: product.descriptionEn,
		slug: product.slug,
		basePrice: product.basePrice,
		compareAtPrice: product.compareAtPrice,
		currencyCode: product.currencyCode,
		status: product.status,
		seoTitle: product.seoTitle,
		seoDescription: product.seoDescription,
		allowOversell: product.allowOversell,
		defaultCategoryId: product.defaultCategoryId,
		categoryIds: [...product.categoryIds],
		tagIds: [...product.tagIds],
		mediaUrls: [...(product.mediaUrls ?? [])],
		options: product.options.map((option) => ({
			...option,
			values: option.values.map((value) => ({ ...value })),
		})),
	}
}

export const initProduct = (
	id: string,
	data: CreateProductInput
): UpdateProductInput => ({
	id,
	data,
})

export const initProductPayload = (
	data: CreateProductInput
): CreateProductInput => ({
	...data,
	defaultCategoryId: data.defaultCategoryId || undefined,
	categoryIds: [...new Set(data.categoryIds)],
	tagIds: [...new Set(data.tagIds)],
	mediaUrls: data.mediaUrls.map((url) => url.trim()).filter(Boolean),
	options: data.options.map((option, optionIndex) => ({
		...option,
		sortOrder: optionIndex,
		values: option.values.map((value, valueIndex) => ({
			...value,
			sortOrder: valueIndex,
		})),
	})),
})
