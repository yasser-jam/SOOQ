import { queryOptions } from "@tanstack/react-query"
import { api } from "@/lib/api"

import type { ProductCollection } from "./types"

export const productCollectionKeys = {
	all: ["product-collections"] as const,
	detail: (id: string) => [...productCollectionKeys.all, id] as const,
}

export type CreateProductCollectionInput = Pick<
	ProductCollection,
	|
		"collectionName"
	|
		"collectionSlug"
	|
		"collectionType"
	|
		"descriptionAr"
	|
		"descriptionEn"
	|
		"isActive"
>

export type UpdateProductCollectionInput = {
	id: string
	data: CreateProductCollectionInput
}

type ApiResponse<T> = {
	data?: T
}

type ProductCollectionApiModel = ProductCollection & {
	collectionId?: string
	productCollectionId?: string
}

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

export const listProductCollectionsQueryOptions = () =>
	queryOptions({
		queryKey: productCollectionKeys.all,
		queryFn: listProductCollections,
	})

export const getProductCollection = async (id: string): Promise<ProductCollection> => {
	const response = await api<ApiResponse<ProductCollectionApiModel>>(
		`/admin/collections/${id}`
	)

	return normalizeProductCollection(response.data as ProductCollectionApiModel)
}

export const getProductCollectionQueryOptions = (id: string) =>
	queryOptions({
		queryKey: productCollectionKeys.detail(id),
		queryFn: () => getProductCollection(id),
	})

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
