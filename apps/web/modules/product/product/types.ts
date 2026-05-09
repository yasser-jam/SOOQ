import * as z from "zod"

import {
	productOptionSchema,
	productOptionValueSchema,
	productSchema,
	productStatusSchema,
	variantOptionSchema,
} from "./schema"

export type ProductStatus = z.infer<typeof productStatusSchema>
export type Product = z.infer<typeof productSchema>
export type ProductOption = z.infer<typeof productOptionSchema>
export type ProductOptionValue = z.infer<typeof productOptionValueSchema>

export interface CreateProductInput {
	titleAr: string
	titleEn: string
	slug: string
	basePrice: number
	currencyCode: string
	status: ProductStatus
	allowOversell: boolean
	descriptionAr?: string
	descriptionEn?: string
	compareAtPrice?: number
	seoTitle?: string
	seoDescription?: string
	defaultCategoryId?: string
	categoryIds?: string[]
	tagIds?: string[]
	/**
	 * Server-known media asset IDs.
	 * - `null` (or omitted): leave existing images unchanged on UPDATE; empty on CREATE
	 * - `[]`: unlink ALL existing images
	 * - `[id1, id2]`: exact list, in that order (index 0 = primary)
	 * On CREATE/UPDATE, uploaded `mediaFiles` UUIDs are PREPENDED to this list server-side.
	 */
	mediaAssetIds?: string[] | null
	/**
	 * Transient: new image files to upload as part of the multipart request.
	 * NOT serialized into the `product` JSON blob — appended as repeatable `files` parts.
	 */
	mediaFiles?: File[]
	options?: ProductOption[]
	variantOverrides?: any[]
}

export type UpdateProductPayload = Partial<CreateProductInput> &
	Pick<
		CreateProductInput,
		"titleAr" | "titleEn" | "slug" | "basePrice" | "currencyCode" | "status" | "allowOversell"
	>

export interface UpdateProductInput {
	id: string
	data: UpdateProductPayload
}

export type VariantOptionValues = z.infer<typeof variantOptionSchema>
