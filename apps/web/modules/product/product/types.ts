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
	mediaUrls?: string[]
	mediaAssetIds?: string[] | null
	files?: File[]
	options?: ProductOption[]
	variantOverrides?: any[]
}

export type UpdateProductPayload = Partial<CreateProductInput> &
	Pick<
		CreateProductInput,
		"titleAr" | "titleEn" | "slug" | "basePrice" | "currencyCode" | "status" | "allowOversell"
	>
	& {
		mediaAssetIds?: string[] | null
		files?: File[]
	}

export interface UpdateProductInput {
	id: string
	data: UpdateProductPayload
}

export type VariantOptionValues = z.infer<typeof variantOptionSchema>
