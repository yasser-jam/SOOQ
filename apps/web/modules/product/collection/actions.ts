import type { QueryClient } from "@tanstack/react-query"
import { queryOptions } from "@tanstack/react-query"

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

const SIMULATED_DELAY_MS = 1000

let productCollectionsStore: ProductCollection[] | null = null

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const nowIso = () => new Date().toISOString()

const getProductCollectionsStore = async (): Promise<ProductCollection[]> => {
	if (!productCollectionsStore) {
		const { productCollections } = await import("./data")
		productCollectionsStore = productCollections.map((collection) => ({ ...collection }))
	}

	return productCollectionsStore
}

export const listProductCollections = async (): Promise<ProductCollection[]> => {
	await wait(SIMULATED_DELAY_MS)
	const collections = await getProductCollectionsStore()
	return collections.map((collection) => ({ ...collection }))
}

export const listProductCollectionsQueryOptions = () =>
	queryOptions({
		queryKey: productCollectionKeys.all,
		queryFn: listProductCollections,
	})

export const getProductCollection = async (id: string): Promise<ProductCollection> => {
	await wait(SIMULATED_DELAY_MS)
	const collections = await getProductCollectionsStore()
	const collection = collections.find(
		(currentCollection) => currentCollection.id === id
	)

	if (!collection) {
		throw new Error("Collection not found")
	}

	return { ...collection }
}

export const getProductCollectionQueryOptions = (id: string) =>
	queryOptions({
		queryKey: productCollectionKeys.detail(id),
		queryFn: () => getProductCollection(id),
	})

export const updateProductCollection = async ({
	id,
	data,
}: UpdateProductCollectionInput): Promise<ProductCollection> => {
	await wait(SIMULATED_DELAY_MS)
	const collections = await getProductCollectionsStore()
	const collectionIndex = collections.findIndex(
		(currentCollection) => currentCollection.id === id
	)

	if (collectionIndex === -1) {
		throw new Error("Collection not found")
	}

	const updatedCollection: ProductCollection = {
		...collections[collectionIndex],
		...data,
		updatedAt: nowIso(),
	}

	collections[collectionIndex] = updatedCollection

	return { ...updatedCollection }
}

export const createProductCollection = async (
	data: CreateProductCollectionInput
): Promise<ProductCollection> => {
	await wait(SIMULATED_DELAY_MS)
	const collections = await getProductCollectionsStore()
	const nextId = String(
		Math.max(0, ...collections.map((collection) => Number(collection.id ?? 0))) + 1
	)
	const timestamp = nowIso()

	const createdCollection: ProductCollection = {
		id: nextId,
		...data,
		createdAt: timestamp,
		updatedAt: timestamp,
	}

	collections.unshift(createdCollection)

	return { ...createdCollection }
}

export const deleteProductCollection = async (
	id: string
): Promise<{ id: string }> => {
	await wait(SIMULATED_DELAY_MS)
	const collections = await getProductCollectionsStore()
	const collectionIndex = collections.findIndex(
		(currentCollection) => currentCollection.id === id
	)

	if (collectionIndex === -1) {
		throw new Error("Collection not found")
	}

	collections.splice(collectionIndex, 1)

	return { id }
}

export const getUpdateCollectionMutationOptions = ({
	collectionId,
	queryClient,
	onSuccess,
}: {
	collectionId: string
	queryClient: QueryClient
	onSuccess?: () => void
}) => ({
	mutationFn: updateProductCollection,
	onSuccess: (updatedCollection: ProductCollection) => {
		queryClient.setQueryData(
			productCollectionKeys.detail(updatedCollection.id ?? collectionId),
			updatedCollection
		)
		queryClient.invalidateQueries({ queryKey: productCollectionKeys.all })
		onSuccess?.()
	},
})

export const getCreateCollectionMutationOptions = ({
	queryClient,
	onSuccess,
}: {
	queryClient: QueryClient
	onSuccess?: () => void
}) => ({
	mutationFn: createProductCollection,
	onSuccess: (createdCollection: ProductCollection) => {
		queryClient.setQueryData(
			productCollectionKeys.detail(createdCollection.id ?? ""),
			createdCollection
		)
		queryClient.invalidateQueries({ queryKey: productCollectionKeys.all })
		onSuccess?.()
	},
})
