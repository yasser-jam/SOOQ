import type { QueryClient } from "@tanstack/react-query"
import { queryOptions } from "@tanstack/react-query"

import type { Product } from "./types"

export const productKeys = {
	all: ["products"] as const,
	detail: (id: string) => [...productKeys.all, id] as const,
}

export type CreateProductInput = Omit<Product, "id" | "createdAt" | "updatedAt">

export type UpdateProductInput = {
	id: string
	data: CreateProductInput
}

const SIMULATED_DELAY_MS = 1000

let productsStore: Product[] | null = null

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
const nowIso = () => new Date().toISOString()

const getProductsStore = async (): Promise<Product[]> => {
	if (!productsStore) {
		const { productsData } = await import("./data")
		productsStore = productsData.map((product) => ({ ...product }))
	}

	return productsStore
}

export const listProducts = async (): Promise<Product[]> => {
	await wait(SIMULATED_DELAY_MS)
	const products = await getProductsStore()
	return products.map((product) => ({ ...product }))
}

export const listProductsQueryOptions = () =>
	queryOptions({
		queryKey: productKeys.all,
		queryFn: listProducts,
	})

export const getProduct = async (id: string): Promise<Product> => {
	await wait(SIMULATED_DELAY_MS)
	const products = await getProductsStore()
	const product = products.find((currentProduct) => currentProduct.id === id)

	if (!product) {
		throw new Error("Product not found")
	}

	return { ...product }
}

export const getProductQueryOptions = (id: string) =>
	queryOptions({
		queryKey: productKeys.detail(id),
		queryFn: () => getProduct(id),
	})

export const updateProduct = async ({
	id,
	data,
}: UpdateProductInput): Promise<Product> => {
	await wait(SIMULATED_DELAY_MS)
	const products = await getProductsStore()
	const productIndex = products.findIndex((currentProduct) => currentProduct.id === id)

	if (productIndex === -1) {
		throw new Error("Product not found")
	}

	const updatedProduct: Product = {
		...products[productIndex],
		...data,
		updatedAt: nowIso(),
	}

	products[productIndex] = updatedProduct

	return { ...updatedProduct }
}

export const createProduct = async (data: CreateProductInput): Promise<Product> => {
	await wait(SIMULATED_DELAY_MS)
	const products = await getProductsStore()
	const nextId = String(Math.max(0, ...products.map((product) => Number(product.id ?? 0))) + 1)
	const timestamp = nowIso()

	const createdProduct: Product = {
		id: nextId,
		...data,
		createdAt: timestamp,
		updatedAt: timestamp,
	}

	products.unshift(createdProduct)

	return { ...createdProduct }
}

export const deleteProduct = async (id: string): Promise<{ id: string }> => {
	await wait(SIMULATED_DELAY_MS)
	const products = await getProductsStore()
	const productIndex = products.findIndex((currentProduct) => currentProduct.id === id)

	if (productIndex === -1) {
		throw new Error("Product not found")
	}

	products.splice(productIndex, 1)

	return { id }
}

export const getUpdateProductMutationOptions = ({
	productId,
	queryClient,
	onSuccess,
}: {
	productId: string
	queryClient: QueryClient
	onSuccess?: () => void
}) => ({
	mutationFn: updateProduct,
	onSuccess: (updatedProduct: Product) => {
		queryClient.setQueryData(productKeys.detail(updatedProduct.id ?? productId), updatedProduct)
		queryClient.invalidateQueries({ queryKey: productKeys.all })
		onSuccess?.()
	},
})

export const getCreateProductMutationOptions = ({
	queryClient,
	onSuccess,
}: {
	queryClient: QueryClient
	onSuccess?: () => void
}) => ({
	mutationFn: createProduct,
	onSuccess: (createdProduct: Product) => {
		queryClient.setQueryData(productKeys.detail(createdProduct.id ?? ""), createdProduct)
		queryClient.invalidateQueries({ queryKey: productKeys.all })
		onSuccess?.()
	},
})
