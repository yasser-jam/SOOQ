import { api } from "@/lib/api"
import { ApiResponse } from "@/lib/types"

import type {
	AddCollectionProductInput,
	AddCollectionRuleInput,
	CreateProductCollectionInput,
	CollectionPreviewItem,
	CollectionRule,
	ProductCollection,
	ProductCollectionApiModel,
	UpdateProductCollectionInput,
} from "./types"

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

export const listCollectionProducts = async (
	id: string
): Promise<CollectionPreviewItem[]> => {
	const response = await api<ApiResponse<CollectionPreviewItem[]>>(
		`/admin/collections/${id}/products`
	)

	return response.data ?? []
}

export const addProductToCollection = async ({
	id,
	data,
}: AddCollectionProductInput): Promise<void> => {
	await api(`/admin/collections/${id}/products`, {
		method: "POST",
		body: data,
	})
}

export const listCollectionRules = async (
	id: string
): Promise<CollectionRule[]> => {
	const response = await api<ApiResponse<CollectionRule[]>>(
		`/admin/collections/${id}/rules`
	)

	return response.data ?? []
}

export const addCollectionRule = async ({
	id,
	data,
}: AddCollectionRuleInput): Promise<void> => {
	await api(`/admin/collections/${id}/rules`, {
		method: "POST",
		body: data,
	})
}

export const evaluateCollectionRules = async (
	id: string
): Promise<ApiResponse<unknown>> => {
	return api<ApiResponse<unknown>>(`/admin/collections/${id}/evaluate`, {
		method: "POST",
	})
}

export const previewCollectionRules = async (
	id: string
): Promise<CollectionPreviewItem[]> => {
	const response = await api<ApiResponse<CollectionPreviewItem[]>>(
		`/admin/collections/${id}/preview`
	)

	return response.data ?? []
}
