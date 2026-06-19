import type { QueryClient } from "@tanstack/react-query"
import { queryOptions } from "@tanstack/react-query"

import { api } from "@/lib/api"
import { attributeQueryKeys } from "@/modules/product/attribute/actions"

import type {
	CreateProductCategoryInput,
	ProductCategory,
	UpdateProductCategoryInput,
} from "./types"
import { ApiResponse } from "@/lib/types"

export const productCategoryKeys = {
	all: ["product-categories"] as const,
	detail: (id: string) => [...productCategoryKeys.all, id] as const,
	// Phase 5 (PRD): code-defined attribute templates exposed by the backend.
	templates: () => [...productCategoryKeys.all, "templates"] as const,
}

/**
 * Phase 5 (PRD): a single starter template for category attribute seeding.
 * Returned by GET /admin/categories/templates. The list is essentially
 * static per backend release — cache with a long staleTime.
 */
export type CategoryTemplate = {
	key: string
	labelEn: string
	labelAr: string
	attributeKeys: string[]
}

export const getCategoryTemplates = async (): Promise<CategoryTemplate[]> => {
	const response = await api<ApiResponse<CategoryTemplate[]>>(
		"/admin/categories/templates"
	)
	return response.data ?? []
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

export const getProductCategoryQueryOptions = (id: string) =>
	queryOptions({
		queryKey: productCategoryKeys.detail(id),
		queryFn: () => getProductCategory(id),
		enabled: Boolean(id),
	})

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

export const getCreateProductCategoryMutationOptions = ({
	queryClient,
	onSuccess,
}: {
	queryClient: QueryClient
	onSuccess?: () => void
}) => ({
	mutationFn: createProductCategory,
	onSuccess: () => {
		queryClient.invalidateQueries({ queryKey: productCategoryKeys.all })
		// Phase 5 (PRD): templated create seeds attribute defs server-side.
		queryClient.invalidateQueries({ queryKey: attributeQueryKeys.all })
		onSuccess?.()
	},
})

export const getUpdateProductCategoryMutationOptions = ({
	queryClient,
	onSuccess,
}: {
	queryClient: QueryClient
	onSuccess?: () => void
}) => ({
	mutationFn: updateProductCategory,
	onSuccess: (_: void, variables: UpdateProductCategoryInput) => {
		queryClient.invalidateQueries({ queryKey: productCategoryKeys.all })
		queryClient.invalidateQueries({
			queryKey: productCategoryKeys.detail(variables.id),
		})
		onSuccess?.()
	},
})

export const getDeleteProductCategoryMutationOptions = ({
	queryClient,
	onSuccess,
}: {
	queryClient: QueryClient
	onSuccess?: (id: string) => void
}) => ({
	mutationFn: deleteProductCategory,
	onSuccess: (_: void, id: string) => {
		queryClient.invalidateQueries({ queryKey: productCategoryKeys.all })
		queryClient.removeQueries({ queryKey: productCategoryKeys.detail(id) })
		onSuccess?.(id)
	},
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
