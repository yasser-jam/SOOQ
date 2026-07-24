import type { Role } from "@/modules/auth/auth/types"
import type { StoreSettingsResponseDto } from "@/modules/store/settings/types"

export type MockUser = {
  userId: string
  phone: string
  fullName: string
  email?: string | null
  roles: Role[]
}

export type MockSession = {
  userId: string
  tenantId: string
  tenantSlug: string
  refreshToken: string
}

export type MockProductRecord = {
  productId: string
  titleAr: string
  titleEn: string
  descriptionAr?: string
  descriptionEn?: string
  slug: string
  basePrice: number
  compareAtPrice?: number
  currencyCode: string
  status: "DRAFT" | "ACTIVE" | "ARCHIVED"
  seoTitle?: string
  seoDescription?: string
  allowOversell: boolean
  defaultCategoryId?: string
  categories?: Array<{ id?: string; nameAr?: string; nameEn?: string }>
  tags?: Array<{ id?: string; name?: string }>
  media: Array<{
    mediaAssetId: string
    url: string
    thumbnailUrl?: string
  }>
  options?: Array<{
    productOptionId?: string
    optionNameAr: string
    optionNameEn: string
    values: Array<{
      optionValueId?: string
      valueAr: string
      valueEn: string
      colorHex?: string | null
    }>
  }>
  variants?: Array<{
    variantId?: string
    attributes?: Record<string, string>
    optionValues?: Array<{
      optionValueId?: string
      optionNameAr?: string
      optionNameEn?: string
      valueAr?: string
      valueEn?: string
    }>
    sku?: string
    price?: number | null
    compareAtPrice?: number | null
    costPrice?: number | null
    costCurrencyCode?: string | null
    stockQty?: number | null
    lowStockThreshold?: number | null
    weightGrams?: number | null
    barcode?: string | null
    isActive?: boolean
  }>
  createdAt: string
  updatedAt: string
}

export type MockCategoryRecord = {
  categoryId: string
  nameAr: string
  nameEn: string
  slug: string
  descriptionAr: string
  descriptionEn: string
  parentCategoryId: string | null
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type MockCollectionRecord = {
  collectionId: string
  collectionName: string
  collectionSlug: string
  collectionType: "MANUAL" | "AUTOMATED" | "AUTOMATIC"
  descriptionAr: string
  descriptionEn: string
  isActive: boolean
  /** Ordered product ids for MANUAL collections (and for public listing). */
  productIds: string[]
  createdAt: string
  updatedAt: string
}

export type MockTagRecord = {
  productTagId: string
  tagName: string
  slug: string
  createdAt: string
  updatedAt: string
}

export type MockOrderRecord = {
  orderId: string
  tenantId: string
  items: Array<{ variantId: string; quantity: number }>
  shippingAddress: {
    latitude: number
    longitude: number
    recipientName: string
    phone: string
    addressLabel: string
  }
  paymentMethod: "COD"
  guestEmail: string
  status: "PENDING" | "CONFIRMED"
  createdAt: string
}

export type MockDiscountCodeRecord = {
  discountCodeId: string
  code: string
  discountType: "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_SHIPPING"
  discountValue: number
  minOrderAmount: number | null
  maxDiscountCap: number | null
  usageLimit: number | null
  currentUses: number
  perCustomerMax: number | null
  applicableScope: "ALL" | "PRODUCT" | "CATEGORY"
  startsAt: string
  expiresAt: string
  isActive: boolean
  createdAt: string
}

export const MOCK_DB_VERSION = 6 as const

export type MockDatabase = {
  version: typeof MOCK_DB_VERSION
  user: MockUser
  session: MockSession | null
  /** Issued OTPs keyed by normalized phone */
  otps: Record<string, string>
  settings: StoreSettingsResponseDto
  /** Reserved slugs that should fail availability checks */
  reservedSlugs: string[]
  products: MockProductRecord[]
  categories: MockCategoryRecord[]
  collections: MockCollectionRecord[]
  tags: MockTagRecord[]
  discountCodes: MockDiscountCodeRecord[]
  /** Storefront checkout orders (POST /public/checkout) */
  orders: MockOrderRecord[]
}

export type MockRequest = {
  method: string
  url: string
  body?: unknown
  headers?: Record<string, string | undefined>
}

export type MockHandlerResult =
  | { handled: false }
  | { handled: true; data: unknown }
  | { handled: true; error: MockApiErrorShape }

export type MockApiErrorShape = {
  status: number
  message: string
  errorCode?: string
  fieldKey?: string
  action?: string
  data?: unknown
}
