import * as z from "zod"

import {
	productOptionSchema,
	productOptionValueSchema,
	productSchema,
	productStatusSchema,
	variantOptionSchema,
} from "./schema"
import type { VariantRequest } from "../variant/types"

export type { VariantRequest }

export type ProductStatus = z.infer<typeof productStatusSchema>
export type Product = z.infer<typeof productSchema>
export type ProductOption = z.infer<typeof productOptionSchema>
export type ProductOptionValue = z.infer<typeof productOptionValueSchema>

/**
 * Inline tag reference. `{id}` links an existing tag; `{name}` makes the
 * backend create it on-the-fly inside the product upsert transaction.
 * Sent on the wire as part of `tags[]`. Never combine with the legacy
 * `tagIds` field — backend rejects requests that mix both shapes.
 */
export type TagRef = { id?: string; name?: string }

/**
 * Inline category reference. Same `{id}` vs new-entity semantics as TagRef.
 * Backend requires `nameAr` for new entries; `nameEn` is optional.
 */
export type CategoryRef = { id?: string; nameAr?: string; nameEn?: string }

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
	/**
	 * Default category id. Must match an entry in `categories` whose `{id}` is
	 * set (i.e. an already-saved category). The form restricts the picker to
	 * existing categories only, so this is always an id-shaped reference.
	 */
	defaultCategoryId?: string
	/** Inline category list (Phase 1). Replaces the legacy `categoryIds`. */
	categories?: CategoryRef[]
	/** Inline tag list (Phase 1). Replaces the legacy `tagIds`. */
	tags?: TagRef[]
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
	/** UI-only: option axes the merchant defined. Not sent on the wire. */
	options?: ProductOption[]
	/** Phase 2 (PRD): inline variants list. Sent to POST/PUT /admin/products. */
	variants?: VariantRequest[]
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
