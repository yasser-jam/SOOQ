import type * as z from "zod"

import type {
  createDiscountCodeSchema,
  discountTypeSchema,
  updateDiscountCodeSchema,
} from "./schema"

export type DiscountType = z.infer<typeof discountTypeSchema>

/** API may still return legacy scopes; creates/updates always send ALL. */
export type DiscountScope = "ALL" | "PRODUCT" | "CATEGORY"

export type CreateDiscountCodeFormValues = z.input<
  typeof createDiscountCodeSchema
>
export type CreateDiscountCodePayload = z.output<
  typeof createDiscountCodeSchema
>

export type UpdateDiscountCodeFormValues = z.input<
  typeof updateDiscountCodeSchema
>
export type UpdateDiscountCodePayload = z.output<
  typeof updateDiscountCodeSchema
>

export interface DiscountCodeApiModel {
  discountCodeId?: string
  id?: string
  code: string
  discountType: DiscountType
  discountValue: number
  minOrderAmount?: number | null
  maxDiscountCap?: number | null
  usageLimit?: number | null
  currentUses?: number | null
  perCustomerMax?: number | null
  applicableScope?: DiscountScope | null
  startsAt: string
  expiresAt: string
  isActive: boolean
  createdAt?: string
}

export interface DiscountCode extends DiscountCodeApiModel {
  id: string
}

export interface UpdateDiscountCodeInput {
  id: string
  data: UpdateDiscountCodePayload
}
