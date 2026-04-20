import { queryOptions } from "@tanstack/react-query"
import { api } from "@/lib/api"

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

type ApiResponse<T> = {
	data?: T
}

type ProductCategoryApiModel = ProductCategory & {
	categoryId?: string
}

const normalizeProductCategory = (
	category: ProductCategoryApiModel
): ProductCategory => ({
	...category,
	id: category.categoryId ?? category.id,
})

export const listProductCategories = async (): Promise<ProductCategory[]> => {
	const response = await api<ApiResponse<ProductCategoryApiModel[]>>(
		"/admin/categories"
	)

	return response.data?.map(normalizeProductCategory) ?? []
}

export const listProductCategoriesQueryOptions = () =>
	queryOptions({
		queryKey: productCategoryKeys.all,
		queryFn: listProductCategories,
	})

export const getProductCategory = async (id: string): Promise<ProductCategory> => {
	const response = await api<ApiResponse<ProductCategoryApiModel>>(
		`/admin/categories/${id}`
	)

	return normalizeProductCategory(response.data as ProductCategoryApiModel)
}

export const getProductCategoryQueryOptions = (id: string) =>
	queryOptions({
		queryKey: productCategoryKeys.detail(id),
		queryFn: () => getProductCategory(id),
	})

export const updateProductCategory = async ({
	id,
	data,
}: UpdateProductCategoryInput): Promise<void> => {
	await api<ApiResponse<unknown>>(`/admin/categories/${id}`, {
		method: "PUT",
		body: data,
	})
}

export const createProductCategory = async (
	data: CreateProductCategoryInput
): Promise<void> => {
	await api<ApiResponse<unknown>>("/admin/categories", {
		method: "POST",
		body: data,
	})
}

export const deleteProductCategory = async (id: string): Promise<void> => {
	await api(`/admin/categories/${id}`, {
		method: "DELETE",
	})
}
