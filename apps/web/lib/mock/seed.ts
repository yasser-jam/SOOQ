import { REGISTRATION_HUB_SLUG } from "@/modules/auth/auth/types"
import type { StoreSettingsResponseDto } from "@/modules/store/settings/types"

import {
  seedMockCategories,
  seedMockCollections,
  seedMockProducts,
  seedMockTags,
} from "./seed-catalog"
import {
  seedMockCodEntries,
  seedMockCodReconciliationBatches,
  seedMockShipments,
  seedMockShippingProviders,
} from "./seed-finance"
import {
  MOCK_DB_VERSION,
  type MockDatabase,
  type MockDiscountCodeRecord,
  type MockUser,
} from "./types"

export const MOCK_STORAGE_KEY = "sooq-mock-api-db"

export const MOCK_DEFAULT_PHONE = "+963999000111"
export const MOCK_DEFAULT_OTP = "123456"

/** UUID-shaped so `publicApi` tenant validation accepts mock sessions. */
export const MOCK_HUB_TENANT_ID = "00000000-0000-4000-8000-000000000001"
export const MOCK_STORE_TENANT_ID = "00000000-0000-4000-8000-000000000002"
export const MOCK_USER_ID = "mock-owner-user"
/** Storefront customer identity used by `/customer/auth/*` mocks. */
export const MOCK_CUSTOMER_USER_ID = "mock-customer-user"
/** Default store slug for storefront OTP when `NEXT_PUBLIC_TENANT_SLUG` is unset. */
export const MOCK_STORE_SLUG = "demo-store"

export {
  seedMockCategories,
  seedMockCollections,
  seedMockProducts,
  seedMockTags,
}

const daysFromNow = (days: number): string => {
  const d = new Date()
  d.setDate(d.getDate() + days)
  d.setHours(12, 0, 0, 0)
  return d.toISOString()
}

/** Sample codes covering ACTIVE / SCHEDULED / EXPIRED / INACTIVE statuses. */
export const seedMockDiscountCodes = (): MockDiscountCodeRecord[] => {
  const now = new Date().toISOString()
  return [
    {
      discountCodeId: "mock-discount-welcome10",
      code: "WELCOME10",
      discountType: "PERCENTAGE",
      discountValue: 10,
      minOrderAmount: 50_000,
      maxDiscountCap: 25_000,
      usageLimit: 100,
      currentUses: 23,
      perCustomerMax: 1,
      applicableScope: "ALL",
      startsAt: daysFromNow(-30),
      expiresAt: daysFromNow(60),
      isActive: true,
      createdAt: daysFromNow(-30),
    },
    {
      discountCodeId: "mock-discount-save5k",
      code: "SAVE5K",
      discountType: "FIXED_AMOUNT",
      discountValue: 5_000,
      minOrderAmount: 100_000,
      maxDiscountCap: null,
      usageLimit: 50,
      currentUses: 12,
      perCustomerMax: 2,
      applicableScope: "PRODUCT",
      startsAt: daysFromNow(-14),
      expiresAt: daysFromNow(30),
      isActive: true,
      createdAt: daysFromNow(-14),
    },
    {
      discountCodeId: "mock-discount-freeship",
      code: "FREESHIP",
      discountType: "FREE_SHIPPING",
      discountValue: 1,
      minOrderAmount: 75_000,
      maxDiscountCap: null,
      usageLimit: null,
      currentUses: 0,
      perCustomerMax: 1,
      applicableScope: "ALL",
      startsAt: daysFromNow(7),
      expiresAt: daysFromNow(90),
      isActive: true,
      createdAt: now,
    },
    {
      discountCodeId: "mock-discount-summer25",
      code: "SUMMER25",
      discountType: "PERCENTAGE",
      discountValue: 25,
      minOrderAmount: null,
      maxDiscountCap: 50_000,
      usageLimit: 200,
      currentUses: 200,
      perCustomerMax: 1,
      applicableScope: "CATEGORY",
      startsAt: daysFromNow(-90),
      expiresAt: daysFromNow(-7),
      isActive: true,
      createdAt: daysFromNow(-90),
    },
    {
      discountCodeId: "mock-discount-paused",
      code: "PAUSED15",
      discountType: "PERCENTAGE",
      discountValue: 15,
      minOrderAmount: 25_000,
      maxDiscountCap: null,
      usageLimit: 30,
      currentUses: 5,
      perCustomerMax: null,
      applicableScope: "ALL",
      startsAt: daysFromNow(-10),
      expiresAt: daysFromNow(40),
      isActive: false,
      createdAt: daysFromNow(-10),
    },
  ]
}

export const seedMockUser = (): MockUser => ({
  userId: MOCK_USER_ID,
  phone: MOCK_DEFAULT_PHONE,
  fullName: "تاجر SOOQ التجريبي",
  email: null,
  roles: ["OWNER"],
})

export const seedMockSettings = (): StoreSettingsResponseDto => ({
  storeConfigId: "mock-store-config",
  tenantId: MOCK_HUB_TENANT_ID,
  storeName: null,
  slug: null,
  primaryCurrencyCode: null,
  isConfigured: false,
  profileNameAr: "",
  profileNameEn: "",
  profileDescription: "",
  contactEmail: "",
  contactPhone: "",
  governorate: "",
  city: "",
  street: "",
  latitude: null,
  longitude: null,
  logoUrl: "",
  faviconUrl: "",
  currencySymbolPosition: "AFTER",
  currencyDecimalPlaces: 0,
  numeralSystem: "LATIN",
  timezone: "Asia/Damascus",
  socialLinks: [],
  businessHours: [],
  deletionRequested: false,
})

export const createSeedDatabase = (): MockDatabase => ({
  version: MOCK_DB_VERSION,
  user: seedMockUser(),
  session: null,
  otps: {},
  settings: seedMockSettings(),
  reservedSlugs: ["admin", "sooq", "store", REGISTRATION_HUB_SLUG],
  products: seedMockProducts(),
  categories: seedMockCategories(),
  collections: seedMockCollections(),
  tags: seedMockTags(),
  discountCodes: seedMockDiscountCodes(),
  orders: [],
  shippingProviders: seedMockShippingProviders(),
  shipments: seedMockShipments(),
  codReconciliationBatches: seedMockCodReconciliationBatches(),
  codEntries: seedMockCodEntries(),
})
