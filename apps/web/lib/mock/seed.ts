import { REGISTRATION_HUB_SLUG } from "@/modules/auth/auth/types"
import type { StoreSettingsResponseDto } from "@/modules/store/settings/types"

import {
  MOCK_DB_VERSION,
  type MockCategoryRecord,
  type MockCollectionRecord,
  type MockDatabase,
  type MockProductRecord,
  type MockUser,
} from "./types"

export const MOCK_STORAGE_KEY = "sooq-mock-api-db"

export const MOCK_DEFAULT_PHONE = "+963999000111"
export const MOCK_DEFAULT_OTP = "123456"

/** UUID-shaped so `publicApi` tenant validation accepts mock sessions. */
export const MOCK_HUB_TENANT_ID = "00000000-0000-4000-8000-000000000001"
export const MOCK_STORE_TENANT_ID = "00000000-0000-4000-8000-000000000002"
export const MOCK_USER_ID = "mock-owner-user"

const mockImage = (label: string, bg: string, fg = "#ffffff"): string =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600">` +
      `<rect width="100%" height="100%" fill="${bg}"/>` +
      `<circle cx="300" cy="240" r="90" fill="${fg}" opacity="0.25"/>` +
      `<rect x="150" y="380" width="300" height="26" rx="13" fill="${fg}" opacity="0.35"/>` +
      `<text x="50%" y="46%" font-family="sans-serif" font-size="40" fill="${fg}" text-anchor="middle" dominant-baseline="middle">${label}</text>` +
      `</svg>`
  )}`

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

export const seedMockCategories = (): MockCategoryRecord[] => {
  const now = new Date().toISOString()
  return [
    {
      categoryId: "mock-cat-apparel",
      nameAr: "ملابس",
      nameEn: "Apparel",
      slug: "apparel",
      descriptionAr: "ملابس رجالية ونسائية",
      descriptionEn: "Men's and women's clothing",
      parentCategoryId: null,
      sortOrder: 0,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      categoryId: "mock-cat-footwear",
      nameAr: "أحذية",
      nameEn: "Footwear",
      slug: "footwear",
      descriptionAr: "أحذية رياضية وكلاسيكية",
      descriptionEn: "Athletic and classic shoes",
      parentCategoryId: null,
      sortOrder: 1,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      categoryId: "mock-cat-accessories",
      nameAr: "إكسسوارات",
      nameEn: "Accessories",
      slug: "accessories",
      descriptionAr: "حقائب وساعات وإكسسوارات",
      descriptionEn: "Bags, watches, and accessories",
      parentCategoryId: null,
      sortOrder: 2,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      categoryId: "mock-cat-home",
      nameAr: "منزل",
      nameEn: "Home",
      slug: "home",
      descriptionAr: "ديكور ومنزل",
      descriptionEn: "Home and decor",
      parentCategoryId: null,
      sortOrder: 3,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  ]
}

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
      defaultCategoryId: "mock-cat-apparel",
      categories: [
        { id: "mock-cat-apparel", nameAr: "ملابس", nameEn: "Apparel" },
      ],
      tags: [{ id: "mock-tag-new", name: "جديد" }],
      media: [
        {
          mediaAssetId: "mock-media-1",
          url: mockImage("قميص", "#5b7c99"),
          thumbnailUrl: mockImage("قميص", "#5b7c99"),
        },
      ],
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
      compareAtPrice: 210000,
      currencyCode: "SYP",
      status: "ACTIVE",
      allowOversell: false,
      defaultCategoryId: "mock-cat-footwear",
      categories: [
        { id: "mock-cat-footwear", nameAr: "أحذية", nameEn: "Footwear" },
      ],
      tags: [{ id: "mock-tag-sport", name: "رياضي" }],
      media: [
        {
          mediaAssetId: "mock-media-2",
          url: mockImage("حذاء", "#3f9d6e"),
          thumbnailUrl: mockImage("حذاء", "#3f9d6e"),
        },
      ],
      options: [],
      variants: [
        {
          variantId: "mock-var-shoes",
          sku: "SHOES-42",
          price: 185000,
          compareAtPrice: 210000,
          stockQty: 15,
          isActive: true,
        },
      ],
      createdAt: now,
      updatedAt: now,
    },
    {
      productId: "mock-product-3",
      titleAr: "عطر شرقي فاخر",
      titleEn: "Oriental Perfume",
      descriptionAr: "عطر شرقي بمكونات طبيعية يدوم طويلاً.",
      descriptionEn: "Long-lasting oriental perfume with natural notes.",
      slug: "oriental-perfume",
      basePrice: 85000,
      compareAtPrice: 110000,
      currencyCode: "SYP",
      status: "ACTIVE",
      allowOversell: false,
      defaultCategoryId: "mock-cat-accessories",
      categories: [
        {
          id: "mock-cat-accessories",
          nameAr: "إكسسوارات",
          nameEn: "Accessories",
        },
      ],
      tags: [{ id: "mock-tag-gift", name: "هدية" }],
      media: [
        {
          mediaAssetId: "mock-media-3",
          url: mockImage("عطر", "#7c5cbf"),
          thumbnailUrl: mockImage("عطر", "#7c5cbf"),
        },
      ],
      options: [],
      variants: [
        {
          variantId: "mock-var-perfume",
          sku: "PERF-50",
          price: 85000,
          compareAtPrice: 110000,
          stockQty: 25,
          isActive: true,
        },
      ],
      createdAt: now,
      updatedAt: now,
    },
    {
      productId: "mock-product-4",
      titleAr: "حقيبة جلدية يدوية",
      titleEn: "Leather Handbag",
      descriptionAr: "حقيبة جلد طبيعي بصناعة يدوية متقنة.",
      descriptionEn: "Handcrafted natural leather handbag.",
      slug: "leather-handbag",
      basePrice: 145000,
      currencyCode: "SYP",
      status: "ACTIVE",
      allowOversell: false,
      defaultCategoryId: "mock-cat-accessories",
      categories: [
        {
          id: "mock-cat-accessories",
          nameAr: "إكسسوارات",
          nameEn: "Accessories",
        },
      ],
      tags: [{ id: "mock-tag-leather", name: "جلد" }],
      media: [
        {
          mediaAssetId: "mock-media-4",
          url: mockImage("حقيبة", "#b8763e"),
          thumbnailUrl: mockImage("حقيبة", "#b8763e"),
        },
      ],
      options: [],
      variants: [
        {
          variantId: "mock-var-bag",
          sku: "BAG-01",
          price: 145000,
          stockQty: 6,
          isActive: true,
        },
      ],
      createdAt: now,
      updatedAt: now,
    },
    {
      productId: "mock-product-5",
      titleAr: "مزهرية سيراميك",
      titleEn: "Ceramic Vase",
      descriptionAr: "قطعة ديكور يدوية الصنع.",
      descriptionEn: "Handmade decor piece for the shelf.",
      slug: "ceramic-vase",
      basePrice: 48000,
      currencyCode: "SYP",
      status: "DRAFT",
      allowOversell: true,
      defaultCategoryId: "mock-cat-home",
      categories: [
        { id: "mock-cat-home", nameAr: "منزل", nameEn: "Home" },
      ],
      tags: [{ id: "mock-tag-handmade", name: "يدوي" }],
      media: [
        {
          mediaAssetId: "mock-media-5",
          url: mockImage("مزهرية", "#8a6a4a"),
          thumbnailUrl: mockImage("مزهرية", "#8a6a4a"),
        },
      ],
      options: [],
      variants: [],
      createdAt: now,
      updatedAt: now,
    },
  ]
}

export const seedMockCollections = (): MockCollectionRecord[] => {
  const now = new Date().toISOString()
  return [
    {
      collectionId: "mock-col-new-arrivals",
      collectionName: "وصل حديثاً",
      collectionSlug: "new-arrivals",
      collectionType: "MANUAL",
      descriptionAr: "أحدث المنتجات المضافة للمتجر",
      descriptionEn: "Newest products added to the store",
      isActive: true,
      productIds: ["mock-product-1", "mock-product-2", "mock-product-3"],
      createdAt: now,
      updatedAt: now,
    },
    {
      collectionId: "mock-col-essentials",
      collectionName: "أساسيات",
      collectionSlug: "essentials",
      collectionType: "MANUAL",
      descriptionAr: "منتجات يومية أساسية",
      descriptionEn: "Everyday essential products",
      isActive: true,
      productIds: ["mock-product-1", "mock-product-4"],
      createdAt: now,
      updatedAt: now,
    },
    {
      collectionId: "mock-col-gifts",
      collectionName: "هدايا",
      collectionSlug: "gifts",
      collectionType: "MANUAL",
      descriptionAr: "منتجات مناسبة للإهداء",
      descriptionEn: "Gift-ready products",
      isActive: true,
      productIds: ["mock-product-3", "mock-product-4"],
      createdAt: now,
      updatedAt: now,
    },
  ]
}

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
})
