import * as z from "zod"

import {
	productOptionSchema,
	productOptionValueSchema,
	productSchema,
	productStatusSchema,
} from "./schema"

export type ProductStatus = z.infer<typeof productStatusSchema>
export type Product = z.infer<typeof productSchema>
export type ProductOption = z.infer<typeof productOptionSchema>
export type ProductOptionValue = z.infer<typeof productOptionValueSchema>

export interface AdminProductVariantOverride {
	sku?: string
	price?: number
	stockQty?: number
	isActive?: boolean
}

export type AdminProductVariantOverrides = Record<
	string,
	AdminProductVariantOverride
>

export type AdminProductInclude = "PRICING" | "IMAGES" | "INVENTORY"

export interface AdminProductImage {
	id?: string
	mediaAssetId?: string
	url?: string
	alt?: string | null
	altText?: string | null
	isPrimary?: boolean
	sortOrder?: number
	createdAt?: string
	updatedAt?: string
}

export interface AdminProductPricing {
	basePrice?: number
	compareAtPrice?: number | null
	currencyCode?: string
	priceRangeMin?: number
	priceRangeMax?: number
}

export interface AdminProductInventory {
	totalStockQty?: number
	availableStockQty?: number
	reservedStockQty?: number
	lowStockThreshold?: number
	inStock?: boolean
}

export interface AdminProductListItem {
	id?: string
	productId?: string
	titleAr?: string
	titleEn?: string
	slug?: string
	status?: ProductStatus
	basePrice?: number
	compareAtPrice?: number | null
	currencyCode?: string
	allowOversell?: boolean
	thumbnailUrl?: string | null
	imageUrl?: string | null
	defaultCategoryId?: string | null
	categoryIds?: string[]
	tagIds?: string[]
	createdAt?: string
	updatedAt?: string
	pricing?: AdminProductPricing | null
	inventory?: AdminProductInventory | null
}

export interface AdminProduct extends AdminProductListItem {
	descriptionAr?: string
	descriptionEn?: string
	seoTitle?: string
	seoDescription?: string
	mediaUrls?: string[]
	options?: ProductOption[]
	variantOverrides?: AdminProductVariantOverrides
	images?: AdminProductImage[]
}

export interface PaginatedApiResponse<T> {
	content?: T[]
	items?: T[]
	totalElements?: number
	totalItems?: number
	totalPages?: number
	page?: number
	number?: number
	size?: number
}

export interface ListAdminProductsParams {
	page?: number
	size?: number
	sort?: string
	status?: ProductStatus
	q?: string
}

export interface GetAdminProductParams {
	include?: AdminProductInclude[]
}

export interface CreateAdminProductInput {
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
	options?: ProductOption[]
	variantOverrides?: AdminProductVariantOverrides
}

export type UpdateAdminProductPayload = Partial<CreateAdminProductInput> &
	Pick<
		CreateAdminProductInput,
		"titleAr" | "titleEn" | "slug" | "basePrice" | "currencyCode" | "status" | "allowOversell"
	>

export interface UpdateAdminProductInput {
	id: string
	data: UpdateAdminProductPayload
}
