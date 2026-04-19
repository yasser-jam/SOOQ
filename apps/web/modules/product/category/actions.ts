import { queryOptions } from "@tanstack/react-query"

import type { ProductCategory } from "./types"

export const productCategoryKeys = {
	all: ["product-categories"] as const,
	detail: (id: string) => [...productCategoryKeys.all, id] as const,
}

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

const SIMULATED_DELAY_MS = 1000

let productCategoriesStore: ProductCategory[] | null = null

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const nowIso = () => new Date().toISOString()

const getProductCategoriesStore = async (): Promise<ProductCategory[]> => {
	if (!productCategoriesStore) {
		const { productCategories } = await import("./data")
		productCategoriesStore = productCategories.map((category) => ({ ...category }))
	}

	return productCategoriesStore
}

export const listProductCategories = async (): Promise<ProductCategory[]> => {
	await wait(SIMULATED_DELAY_MS)
	const categories = await getProductCategoriesStore()
	return categories.map((category) => ({ ...category }))
}

export const listProductCategoriesQueryOptions = () =>
	queryOptions({
		queryKey: productCategoryKeys.all,
		queryFn: listProductCategories,
	})

export const getProductCategory = async (id: string): Promise<ProductCategory> => {
	await wait(SIMULATED_DELAY_MS)
	const categories = await getProductCategoriesStore()
	const category = categories.find((currentCategory) => currentCategory.id === id)

	if (!category) {
		throw new Error("Category not found")
	}

	return { ...category }
}

export const getProductCategoryQueryOptions = (id: string) =>
	queryOptions({
		queryKey: productCategoryKeys.detail(id),
		queryFn: () => getProductCategory(id),
	})

export const updateProductCategory = async ({
	id,
	data,
}: UpdateProductCategoryInput): Promise<ProductCategory> => {
	await wait(SIMULATED_DELAY_MS)
	const categories = await getProductCategoriesStore()
	const categoryIndex = categories.findIndex((currentCategory) => currentCategory.id === id)

	if (categoryIndex === -1) {
		throw new Error("Category not found")
	}

	const updatedCategory: ProductCategory = {
		...categories[categoryIndex],
		...data,
		updatedAt: nowIso(),
	}

	categories[categoryIndex] = updatedCategory

	return { ...updatedCategory }
}

export const createProductCategory = async (
	data: CreateProductCategoryInput
): Promise<ProductCategory> => {
	await wait(SIMULATED_DELAY_MS)
	const categories = await getProductCategoriesStore()
	const nextId = String(
		Math.max(0, ...categories.map((category) => Number(category.id ?? 0))) + 1
	)
	const timestamp = nowIso()

	const createdCategory: ProductCategory = {
		id: nextId,
		...data,
		createdAt: timestamp,
		updatedAt: timestamp,
	}

	categories.unshift(createdCategory)

	return { ...createdCategory }
}

export const deleteProductCategory = async (id: string): Promise<{ id: string }> => {
	await wait(SIMULATED_DELAY_MS)
	const categories = await getProductCategoriesStore()
	const categoryIndex = categories.findIndex((currentCategory) => currentCategory.id === id)

	if (categoryIndex === -1) {
		throw new Error("Category not found")
	}

	categories.splice(categoryIndex, 1)

	return { id }
}
