import { api } from "@/lib/api"

import type { CreateProductCategoryInput, ProductCategory, UpdateProductCategoryInput } from "./types"
import { ApiResponse } from "@/lib/types"

export const productCategoryKeys = {
	all: ["product-categories"] as const,
	detail: (id: string) => [...productCategoryKeys.all, id] as const,
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

export const getProductCategory = async (id: string): Promise<ProductCategory> => {
	const response = await api<ApiResponse<ProductCategoryApiModel>>(
		`/admin/categories/${id}`
	)

	return normalizeProductCategory(response.data as ProductCategoryApiModel)
}

export const updateProductCategory = ({
	id,
	data,
}: UpdateProductCategoryInput): Promise<void> =>
	api<void>(`/admin/categories/${id}`, {
		method: "PUT",
		body: data,
	})

export const createProductCategory = (data: CreateProductCategoryInput): Promise<void> =>
	api<void>("/admin/categories", {
		method: "POST",
		body: data,
	})

export const deleteProductCategory = (id: string): Promise<void> =>
	api<void>(`/admin/categories/${id}`, {
		method: "DELETE",
	})

/**
 * GET /api/v1/admin/categories/{categoryId}/children
 * Returns immediate children only (1 level). Useful for drill-down navigation
 * without loading the entire tree.
 */
export const getCategoryChildren = async (
	categoryId: string
): Promise<ProductCategory[]> => {
	const response = await api<ApiResponse<ProductCategoryApiModel[]>>(
		`/admin/categories/${categoryId}/children`
	)
	return response.data?.map(normalizeProductCategory) ?? []
}

export const categoryChildrenQueryKey = (parentId: string) =>
	[...productCategoryKeys.all, "children", parentId] as const
