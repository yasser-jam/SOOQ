import { api } from "@/lib/api"
import { ApiResponse } from "@/lib/types"

import type {
	CollectionPreviewProduct,
	CollectionProductLink,
	CollectionRule,
	CollectionRuleInput,
	CreateProductCollectionInput,
	ProductCollection,
	ProductCollectionApiModel,
	UpdateProductCollectionInput,
} from './types'

const normalizeProductCollection = (
	collection: ProductCollectionApiModel
): ProductCollection => ({
	...collection,
	id: collection.collectionId ?? collection.productCollectionId ?? collection.id,
})

export const listProductCollections = async (): Promise<ProductCollection[]> => {
	const response = await api<ApiResponse<ProductCollectionApiModel[]>>(
		"/admin/collections"
	)

	return response.data?.map(normalizeProductCollection) ?? []
}

export const getProductCollection = async (id: string): Promise<ProductCollection> => {
	const response = await api<ApiResponse<ProductCollectionApiModel>>(
		`/admin/collections/${id}`
	)

	return normalizeProductCollection(response.data as ProductCollectionApiModel)
}

export const updateProductCollection = async ({
	id,
	data,
}: UpdateProductCollectionInput): Promise<void> => {
	await api<ApiResponse<unknown>>(`/admin/collections/${id}`, {
		method: "PUT",
		body: data,
	})
}

export const createProductCollection = async (
	data: CreateProductCollectionInput
): Promise<void> => {
	await api<ApiResponse<unknown>>("/admin/collections", {
		method: "POST",
		body: data,
	})
}

export const deleteProductCollection = async (
	id: string
): Promise<void> => {
	await api(`/admin/collections/${id}`, {
		method: "DELETE",
	})
}

/* === Phase 4A: collection sub-resources ================================= */

/**
 * GET /admin/collections/{id}/products?page=&size=
 * List enriched products in a collection.
 */
export const listCollectionProducts = async (
	collectionId: string,
	params: { page?: number; size?: number } = {}
): Promise<CollectionProductLink[]> => {
	const page = params.page ?? 0
	const size = params.size ?? 20
	const response = await api<ApiResponse<CollectionProductLink[]>>(
		`/admin/collections/${collectionId}/products?page=${page}&size=${size}`
	)
	return response.data ?? []
}

/**
 * POST /admin/collections/{id}/products
 * Add a product to a MANUAL collection.
 */
export const addCollectionProduct = async (
	collectionId: string,
	body: { productId: string; sortOrder?: number }
): Promise<void> => {
	await api<void>(`/admin/collections/${collectionId}/products`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body,
	})
}

/**
 * DELETE /admin/collections/{id}/products/{productId}
 */
export const removeCollectionProduct = async (
	collectionId: string,
	productId: string
): Promise<void> => {
	await api<void>(
		`/admin/collections/${collectionId}/products/${productId}`,
		{
			method: "DELETE",
		}
	)
}

/**
 * PUT /admin/collections/{id}/products/reorder
 * Reorder products in a MANUAL collection.
 */
export const reorderCollectionProducts = async (
	collectionId: string,
	productIds: string[]
): Promise<void> => {
	await api<void>(`/admin/collections/${collectionId}/products/reorder`, {
		method: "PUT",
		headers: { "Content-Type": "application/json" },
		body: { productIds },
	})
}

/**
 * GET /admin/collections/{id}  (returns rules inline)
 * Convenience wrapper extracting the rules array off the detail response.
 */
export const listCollectionRules = async (
	collectionId: string
): Promise<CollectionRule[]> => {
	const response = await api<ApiResponse<{ rules?: CollectionRule[] }>>(
		`/admin/collections/${collectionId}`
	)
	return response.data?.rules ?? []
}

/**
 * POST /admin/collections/{id}/rules
 */
export const createCollectionRule = async (
	collectionId: string,
	rule: CollectionRuleInput
): Promise<void> => {
	await api<void>(`/admin/collections/${collectionId}/rules`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: rule,
	})
}

/**
 * PUT /admin/collections/{id}/rules/{ruleId}
 */
export const updateCollectionRule = async (
	collectionId: string,
	ruleId: string,
	rule: CollectionRuleInput
): Promise<void> => {
	await api<void>(
		`/admin/collections/${collectionId}/rules/${ruleId}`,
		{
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: rule,
		}
	)
}

/**
 * DELETE /admin/collections/{id}/rules/{ruleId}
 */
export const deleteCollectionRule = async (
	collectionId: string,
	ruleId: string
): Promise<void> => {
	await api<void>(
		`/admin/collections/${collectionId}/rules/${ruleId}`,
		{
			method: "DELETE",
		}
	)
}

/**
 * POST /admin/collections/{id}/evaluate
 * Trigger rule evaluation (writes the matched products into the collection).
 */
export const evaluateCollectionRules = async (
	collectionId: string
): Promise<void> => {
	await api<void>(`/admin/collections/${collectionId}/evaluate`, {
		method: "POST",
	})
}

/**
 * GET /admin/collections/{id}/preview
 * Preview matched products (read-only) without committing the evaluation.
 */
export const previewCollectionRules = async (
	collectionId: string
): Promise<CollectionPreviewProduct[]> => {
	const response = await api<ApiResponse<CollectionPreviewProduct[]>>(
		`/admin/collections/${collectionId}/preview`
	)
	return response.data ?? []
}
