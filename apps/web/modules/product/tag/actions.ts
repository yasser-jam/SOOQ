import { queryOptions } from "@tanstack/react-query"

import type { ProductTag } from "./types"

export const productTagKeys = {
	all: ["product-tags"] as const,
	detail: (id: string) => [...productTagKeys.all, id] as const,
}

export type UpdateProductTagInput = {
	id: string
	data: Pick<ProductTag, "tagName" | "slug">
}

export type CreateProductTagInput = Pick<ProductTag, "tagName" | "slug">

const SIMULATED_DELAY_MS = 1000

let productTagsStore: ProductTag[] | null = null

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const getProductTagsStore = async (): Promise<ProductTag[]> => {
	if (!productTagsStore) {
		const { productTags } = await import("./data")
		productTagsStore = productTags.map((tag) => ({ ...tag }))
	}

	return productTagsStore
}

export const listProductTags = async (): Promise<ProductTag[]> => {
	await wait(SIMULATED_DELAY_MS)
	const tags = await getProductTagsStore()
	return tags.map((tag) => ({ ...tag }))
}

export const listProductTagsQueryOptions = () =>
	queryOptions({
		queryKey: productTagKeys.all,
		queryFn: listProductTags,
	})

export const getProductTag = async (id: string): Promise<ProductTag> => {
	await wait(SIMULATED_DELAY_MS)
	const tags = await getProductTagsStore()
	const tag = tags.find((currentTag) => currentTag.id === id)

	if (!tag) {
		throw new Error("Tag not found")
	}

	return { ...tag }
}

export const getProductTagQueryOptions = (id: string) =>
	queryOptions({
		queryKey: productTagKeys.detail(id),
		queryFn: () => getProductTag(id),
	})

export const updateProductTag = async ({ id, data }: UpdateProductTagInput): Promise<ProductTag> => {
	await wait(SIMULATED_DELAY_MS)
	const tags = await getProductTagsStore()
	const tagIndex = tags.findIndex((currentTag) => currentTag.id === id)

	if (tagIndex === -1) {
		throw new Error("Tag not found")
	}

	const updatedTag: ProductTag = {
		...tags[tagIndex],
		...data,
	}

	tags[tagIndex] = updatedTag

	return { ...updatedTag }
}

export const createProductTag = async (
	data: CreateProductTagInput
): Promise<ProductTag> => {
	await wait(SIMULATED_DELAY_MS)
	const tags = await getProductTagsStore()
	const nextId = String(
		Math.max(0, ...tags.map((tag) => Number(tag.id ?? 0))) + 1
	)

	const createdTag: ProductTag = {
		id: nextId,
		...data,
	}

	tags.unshift(createdTag)

	return { ...createdTag }
}
export const deleteProductTag = async (id: string): Promise<{ id: string }> => {
	await wait(SIMULATED_DELAY_MS)
	const tags = await getProductTagsStore()
	const tagIndex = tags.findIndex((currentTag) => currentTag.id === id)

	if (tagIndex === -1) {
		throw new Error("Tag not found")
	}

	tags.splice(tagIndex, 1)

	return { id }
}


