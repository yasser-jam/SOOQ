import { REGISTRATION_HUB_SLUG } from "@/modules/auth/auth/types"
import type { StoreSettingsResponseDto } from "@/modules/store/settings/types"

import {
  seedMockCategories,
  seedMockCollections,
  seedMockProducts,
  seedMockTags,
} from "./seed-catalog"
import { MOCK_DB_VERSION, type MockDatabase, type MockUser } from "./types"

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
  orders: [],
})
