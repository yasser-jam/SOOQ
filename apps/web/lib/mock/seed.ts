import { REGISTRATION_HUB_SLUG } from "@/modules/auth/auth/types"
import type { StoreSettingsResponseDto } from "@/modules/store/settings/types"

import type { MockDatabase, MockProductRecord, MockUser } from "./types"

export const MOCK_STORAGE_KEY = "sooq-mock-api-db"

export const MOCK_DEFAULT_PHONE = "+963999000111"
export const MOCK_DEFAULT_OTP = "123456"
export const MOCK_HUB_TENANT_ID = "mock-registration-tenant"
export const MOCK_STORE_TENANT_ID = "mock-store-tenant"
export const MOCK_USER_ID = "mock-owner-user"

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

export const seedMockProducts = (): MockProductRecord[] => {
  const now = new Date().toISOString()
  return [
    {
      productId: "mock-product-1",
      titleAr: "قميص قطني",
      titleEn: "Cotton Shirt",
      descriptionAr: "قميص قطني مريح للارتداء اليومي",
      descriptionEn: "Comfortable cotton shirt for everyday wear",
      slug: "cotton-shirt",
      basePrice: 75000,
      compareAtPrice: 90000,
      currencyCode: "SYP",
      status: "ACTIVE",
      seoTitle: "قميص قطني",
      seoDescription: "قميص قطني مريح",
      allowOversell: false,
      categories: [{ id: "mock-cat-apparel", nameAr: "ملابس", nameEn: "Apparel" }],
      tags: [{ id: "mock-tag-new", name: "جديد" }],
      media: [],
      options: [
        {
          productOptionId: "mock-opt-size",
          optionNameAr: "المقاس",
          optionNameEn: "Size",
          values: [
            {
              optionValueId: "mock-val-m",
              valueAr: "وسط",
              valueEn: "M",
            },
            {
              optionValueId: "mock-val-l",
              valueAr: "كبير",
              valueEn: "L",
            },
          ],
        },
      ],
      variants: [
        {
          variantId: "mock-var-m",
          attributes: { المقاس: "وسط" },
          optionValues: [
            {
              optionValueId: "mock-val-m",
              optionNameAr: "المقاس",
              optionNameEn: "Size",
              valueAr: "وسط",
              valueEn: "M",
            },
          ],
          sku: "SHIRT-M",
          price: 75000,
          stockQty: 12,
          isActive: true,
        },
        {
          variantId: "mock-var-l",
          attributes: { المقاس: "كبير" },
          optionValues: [
            {
              optionValueId: "mock-val-l",
              optionNameAr: "المقاس",
              optionNameEn: "Size",
              valueAr: "كبير",
              valueEn: "L",
            },
          ],
          sku: "SHIRT-L",
          price: 75000,
          stockQty: 8,
          isActive: true,
        },
      ],
      createdAt: now,
      updatedAt: now,
    },
    {
      productId: "mock-product-2",
      titleAr: "حذاء رياضي",
      titleEn: "Sports Shoes",
      descriptionAr: "حذاء خفيف للجري والمشي",
      descriptionEn: "Lightweight shoes for running and walking",
      slug: "sports-shoes",
      basePrice: 185000,
      currencyCode: "SYP",
      status: "DRAFT",
      allowOversell: false,
      categories: [],
      tags: [],
      media: [],
      options: [],
      variants: [],
      createdAt: now,
      updatedAt: now,
    },
  ]
}

export const createSeedDatabase = (): MockDatabase => ({
  version: 1,
  user: seedMockUser(),
  session: null,
  otps: {},
  settings: seedMockSettings(),
  reservedSlugs: ["admin", "sooq", "store", REGISTRATION_HUB_SLUG],
  products: seedMockProducts(),
})
