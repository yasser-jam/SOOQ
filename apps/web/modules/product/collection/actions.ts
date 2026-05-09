import { api } from "@/lib/api"
import { ApiResponse } from "@/lib/types"

import type {
	CreateProductCollectionInput,
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
