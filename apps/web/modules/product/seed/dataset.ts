/**
 * Static seed dataset for demo/testing.
 *
 * Everything is referenced by string keys (slugs) instead of ids — the seeder
 * resolves keys to real backend ids after each phase creates its rows.
 */

import type { SeedImageConfig } from "./seed-images"

export type SeedCategoryDef = {
  slug: string
  nameAr: string
  nameEn: string
  descriptionAr: string
  descriptionEn: string
  /** slug of the parent category; omit for a top-level node */
  parentSlug?: string
  sortOrder: number
}

export type SeedTagDef = {
  slug: string
  name: string
}

export type SeedAttributeOptionDef = {
  /** stable key used by products to reference this option */
  key: string
  valueAr: string
  valueEn: string
}

export type SeedAttributeDef = {
  attributeKey: string
  nameAr: string
  nameEn: string
  dataType: "TEXT" | "NUMBER" | "BOOLEAN" | "SELECT" | "MULTI_SELECT"
  isRequired?: boolean
  isFilterable?: boolean
  isVisibleOnStorefront?: boolean
  sortOrder?: number
  /** category slug this attribute is scoped to; omit for tenant-wide */
  categorySlug?: string
  /** required for SELECT / MULTI_SELECT */
  options?: SeedAttributeOptionDef[]
}

export type SeedProductAttributeValue =
  | { attributeKey: string; valueText: string }
  | { attributeKey: string; optionKeys: string[] }

export type SeedProductOption = {
  optionNameAr: string
  optionNameEn: string
  values: { valueAr: string; valueEn: string }[]
}

export type SeedProductVariant = {
  /** map of axis label (Arabic option name) → value label (Arabic value) */
  attributes: Record<string, string>
  sku: string
  price?: number
  compareAtPrice?: number
  stockQty: number
  weightGrams?: number
  barcode?: string
}

export type SeedProductDef = {
  slug: string
  titleAr: string
  titleEn: string
  descriptionAr: string
  descriptionEn: string
  basePrice: number
  compareAtPrice: number
  currencyCode: "SYP" | "USD"
  status: "DRAFT" | "ACTIVE" | "ARCHIVED"
  allowOversell?: boolean
  seoTitle?: string
  seoDescription?: string
  categorySlugs: string[]
  defaultCategorySlug: string
  tagSlugs: string[]
  options?: SeedProductOption[]
  variants?: SeedProductVariant[]
  attributes?: SeedProductAttributeValue[]
}

export type SeedManualCollectionDef = {
  slug: string
  name: string
  type: "MANUAL"
  descriptionAr: string
  descriptionEn: string
  productSlugs: string[]
}

export type SeedAutomatedCollectionDef = {
  slug: string
  name: string
  type: "AUTOMATED"
  descriptionAr: string
  descriptionEn: string
  rules: {
    fieldKey: "tag" | "category" | "title" | "price" | "stock"
    operator: "equals" | "not_equals" | "contains" | "greater_than" | "less_than"
    value: string
    logicGroup: "AND" | "OR"
  }[]
}

export type SeedCollectionDef =
  | SeedManualCollectionDef
  | SeedAutomatedCollectionDef

export type SeedDataset = {
  categories: SeedCategoryDef[]
  tags: SeedTagDef[]
  attributes: SeedAttributeDef[]
  products: SeedProductDef[]
  collections: SeedCollectionDef[]
  /** picture pool for the products phase; defaults to `DEFAULT_SEED_IMAGES` */
  imageConfig?: SeedImageConfig
}

/* ============================================================================
 * The dataset
 * ==========================================================================*/

export const SEED_CATEGORIES: SeedCategoryDef[] = [
  // --- top level ---
  {
    slug: "electronics",
    nameAr: "إلكترونيات",
    nameEn: "Electronics",
    descriptionAr: "الأجهزة الإلكترونية والملحقات",
    descriptionEn: "Consumer electronics and accessories",
    sortOrder: 0,
  },
  {
    slug: "fashion",
    nameAr: "أزياء",
    nameEn: "Fashion",
    descriptionAr: "ملابس وأحذية للرجال والنساء",
    descriptionEn: "Clothing and footwear for men and women",
    sortOrder: 1,
  },
  {
    slug: "home-kitchen",
    nameAr: "منزل ومطبخ",
    nameEn: "Home & Kitchen",
    descriptionAr: "مستلزمات المنزل والمطبخ",
    descriptionEn: "Home and kitchen essentials",
    sortOrder: 2,
  },
  // --- electronics children ---
  {
    slug: "smartphones",
    nameAr: "هواتف ذكية",
    nameEn: "Smartphones",
    descriptionAr: "هواتف ذكية بأحدث المواصفات",
    descriptionEn: "Latest smartphones",
    parentSlug: "electronics",
    sortOrder: 0,
  },
  {
    slug: "laptops",
    nameAr: "حواسيب محمولة",
    nameEn: "Laptops",
    descriptionAr: "حواسيب محمولة للعمل والألعاب",
    descriptionEn: "Laptops for work and gaming",
    parentSlug: "electronics",
    sortOrder: 1,
  },
  {
    slug: "headphones",
    nameAr: "سماعات",
    nameEn: "Headphones",
    descriptionAr: "سماعات سلكية ولاسلكية",
    descriptionEn: "Wired and wireless headphones",
    parentSlug: "electronics",
    sortOrder: 2,
  },
  // --- fashion children ---
  {
    slug: "mens-clothing",
    nameAr: "ملابس رجالية",
    nameEn: "Men's Clothing",
    descriptionAr: "ملابس رجالية بجميع المقاسات",
    descriptionEn: "Men's clothing in all sizes",
    parentSlug: "fashion",
    sortOrder: 0,
  },
  {
    slug: "womens-clothing",
    nameAr: "ملابس نسائية",
    nameEn: "Women's Clothing",
    descriptionAr: "ملابس نسائية عصرية",
    descriptionEn: "Modern women's clothing",
    parentSlug: "fashion",
    sortOrder: 1,
  },
  {
    slug: "footwear",
    nameAr: "أحذية",
    nameEn: "Footwear",
    descriptionAr: "أحذية رياضية ورسمية",
    descriptionEn: "Sport and formal footwear",
    parentSlug: "fashion",
    sortOrder: 2,
  },
  // --- home & kitchen children ---
  {
    slug: "kitchen-tools",
    nameAr: "أدوات مطبخ",
    nameEn: "Kitchen Tools",
    descriptionAr: "أدوات ومستلزمات المطبخ",
    descriptionEn: "Kitchen tools and utensils",
    parentSlug: "home-kitchen",
    sortOrder: 0,
  },
  {
    slug: "home-decor",
    nameAr: "ديكور",
    nameEn: "Home Decor",
    descriptionAr: "قطع ديكور لتزيين المنزل",
    descriptionEn: "Home decoration pieces",
    parentSlug: "home-kitchen",
    sortOrder: 1,
  },
]

export const SEED_TAGS: SeedTagDef[] = [
  { slug: "special-offer", name: "عرض خاص" },
  { slug: "best-seller", name: "الأكثر مبيعاً" },
  { slug: "new-arrival", name: "جديد" },
  { slug: "on-sale", name: "تخفيضات" },
  { slug: "free-shipping", name: "توصيل مجاني" },
  { slug: "featured", name: "منتج مميز" },
  { slug: "limited", name: "محدود" },
  { slug: "handmade", name: "صناعة يدوية" },
  { slug: "organic", name: "عضوي" },
  { slug: "gift-idea", name: "هدية مثالية" },
]

export const SEED_ATTRIBUTES: SeedAttributeDef[] = [
  // --- tenant-wide ---
  {
    attributeKey: "brand",
    nameAr: "العلامة التجارية",
    nameEn: "Brand",
    dataType: "TEXT",
    isFilterable: true,
    isVisibleOnStorefront: true,
    sortOrder: 0,
  },
  {
    attributeKey: "warranty_years",
    nameAr: "الضمان (بالسنوات)",
    nameEn: "Warranty (years)",
    dataType: "NUMBER",
    isVisibleOnStorefront: true,
    sortOrder: 1,
  },
  {
    attributeKey: "supports_bluetooth",
    nameAr: "يدعم بلوتوث",
    nameEn: "Supports Bluetooth",
    dataType: "BOOLEAN",
    isFilterable: true,
    isVisibleOnStorefront: true,
    sortOrder: 2,
  },
  // --- scoped to smartphones ---
  {
    attributeKey: "storage_capacity",
    nameAr: "سعة التخزين",
    nameEn: "Storage capacity",
    dataType: "SELECT",
    isFilterable: true,
    isVisibleOnStorefront: true,
    sortOrder: 0,
    categorySlug: "smartphones",
    options: [
      { key: "64gb", valueAr: "٦٤ جيجابايت", valueEn: "64GB" },
      { key: "128gb", valueAr: "١٢٨ جيجابايت", valueEn: "128GB" },
      { key: "256gb", valueAr: "٢٥٦ جيجابايت", valueEn: "256GB" },
      { key: "512gb", valueAr: "٥١٢ جيجابايت", valueEn: "512GB" },
    ],
  },
  // --- scoped to mens-clothing ---
  {
    attributeKey: "material",
    nameAr: "المادة",
    nameEn: "Material",
    dataType: "MULTI_SELECT",
    isFilterable: true,
    isVisibleOnStorefront: true,
    sortOrder: 0,
    categorySlug: "mens-clothing",
    options: [
      { key: "cotton", valueAr: "قطن", valueEn: "Cotton" },
      { key: "polyester", valueAr: "بوليستر", valueEn: "Polyester" },
      { key: "leather", valueAr: "جلد", valueEn: "Leather" },
      { key: "wool", valueAr: "صوف", valueEn: "Wool" },
    ],
  },
]

export const SEED_PRODUCTS: SeedProductDef[] = [
  // --- smartphones (with variants + storage attribute) ---
  {
    slug: "sooq-smartphone-x1",
    titleAr: "هاتف SOOQ X1",
    titleEn: "SOOQ Smartphone X1",
    descriptionAr: "هاتف ذكي بشاشة 6.5 بوصة وكاميرا 48 ميجابكسل",
    descriptionEn: "Smartphone with 6.5\" display and 48MP camera",
    basePrice: 350,
    compareAtPrice: 420,
    currencyCode: "USD",
    status: "ACTIVE",
    seoTitle: "SOOQ Smartphone X1",
    seoDescription: "Powerful smartphone at an affordable price",
    categorySlugs: ["smartphones"],
    defaultCategorySlug: "smartphones",
    tagSlugs: ["new-arrival", "featured", "free-shipping"],
    options: [
      {
        optionNameAr: "اللون",
        optionNameEn: "Color",
        values: [
          { valueAr: "أسود", valueEn: "Black" },
          { valueAr: "فضي", valueEn: "Silver" },
        ],
      },
      {
        optionNameAr: "السعة",
        optionNameEn: "Capacity",
        values: [
          { valueAr: "١٢٨ جيجابايت", valueEn: "128GB" },
          { valueAr: "٢٥٦ جيجابايت", valueEn: "256GB" },
        ],
      },
    ],
    variants: [
      { attributes: { "اللون": "أسود", "السعة": "١٢٨ جيجابايت" }, sku: "SOOQ-X1-BLK-128", price: 350, compareAtPrice: 420, stockQty: 15, weightGrams: 180 },
      { attributes: { "اللون": "أسود", "السعة": "٢٥٦ جيجابايت" }, sku: "SOOQ-X1-BLK-256", price: 400, compareAtPrice: 480, stockQty: 10, weightGrams: 180 },
      { attributes: { "اللون": "فضي", "السعة": "١٢٨ جيجابايت" }, sku: "SOOQ-X1-SLV-128", price: 350, compareAtPrice: 420, stockQty: 8, weightGrams: 180 },
      { attributes: { "اللون": "فضي", "السعة": "٢٥٦ جيجابايت" }, sku: "SOOQ-X1-SLV-256", price: 400, compareAtPrice: 480, stockQty: 5, weightGrams: 180 },
    ],
    attributes: [
      { attributeKey: "brand", valueText: "SOOQ" },
      { attributeKey: "warranty_years", valueText: "2" },
      { attributeKey: "supports_bluetooth", valueText: "true" },
      { attributeKey: "storage_capacity", optionKeys: ["128gb", "256gb"] },
    ],
  },
  {
    slug: "sooq-smartphone-lite",
    titleAr: "هاتف SOOQ لايت",
    titleEn: "SOOQ Smartphone Lite",
    descriptionAr: "هاتف اقتصادي بميزات ممتازة",
    descriptionEn: "Budget-friendly phone with great features",
    basePrice: 180,
    compareAtPrice: 220,
    currencyCode: "USD",
    status: "ACTIVE",
    seoTitle: "SOOQ Smartphone Lite",
    seoDescription: "Affordable smartphone with essential features",
    categorySlugs: ["smartphones"],
    defaultCategorySlug: "smartphones",
    tagSlugs: ["on-sale", "special-offer"],
    attributes: [
      { attributeKey: "brand", valueText: "SOOQ" },
      { attributeKey: "warranty_years", valueText: "1" },
      { attributeKey: "storage_capacity", optionKeys: ["64gb"] },
    ],
  },

  // --- laptops ---
  {
    slug: "pro-laptop-15",
    titleAr: "حاسوب برو 15",
    titleEn: "Pro Laptop 15",
    descriptionAr: "حاسوب محمول احترافي بمعالج قوي",
    descriptionEn: "Professional laptop with powerful processor",
    basePrice: 1200,
    compareAtPrice: 1400,
    currencyCode: "USD",
    status: "ACTIVE",
    seoTitle: "Pro Laptop 15",
    seoDescription: "Professional laptop for demanding work",
    categorySlugs: ["laptops"],
    defaultCategorySlug: "laptops",
    tagSlugs: ["best-seller", "featured"],
    attributes: [
      { attributeKey: "brand", valueText: "SOOQ Pro" },
      { attributeKey: "warranty_years", valueText: "2" },
      { attributeKey: "supports_bluetooth", valueText: "true" },
    ],
  },

  // --- headphones (variants: color) ---
  {
    slug: "wireless-headphones-pro",
    titleAr: "سماعات لاسلكية برو",
    titleEn: "Wireless Headphones Pro",
    descriptionAr: "سماعات لاسلكية بجودة صوت عالية",
    descriptionEn: "Wireless headphones with premium sound",
    basePrice: 89,
    compareAtPrice: 120,
    currencyCode: "USD",
    status: "ACTIVE",
    seoTitle: "Wireless Headphones Pro",
    seoDescription: "Premium wireless headphones",
    categorySlugs: ["headphones"],
    defaultCategorySlug: "headphones",
    tagSlugs: ["best-seller", "on-sale", "free-shipping"],
    options: [
      {
        optionNameAr: "اللون",
        optionNameEn: "Color",
        values: [
          { valueAr: "أسود", valueEn: "Black" },
          { valueAr: "أبيض", valueEn: "White" },
          { valueAr: "أحمر", valueEn: "Red" },
        ],
      },
    ],
    variants: [
      { attributes: { "اللون": "أسود" }, sku: "WHP-BLK", price: 89, compareAtPrice: 120, stockQty: 25 },
      { attributes: { "اللون": "أبيض" }, sku: "WHP-WHT", price: 89, compareAtPrice: 120, stockQty: 18 },
      { attributes: { "اللون": "أحمر" }, sku: "WHP-RED", price: 95, compareAtPrice: 125, stockQty: 7 },
    ],
    attributes: [
      { attributeKey: "brand", valueText: "SOOQ Audio" },
      { attributeKey: "warranty_years", valueText: "1" },
      { attributeKey: "supports_bluetooth", valueText: "true" },
    ],
  },

  // --- mens clothing (variants: size, uses material attr) ---
  {
    slug: "classic-cotton-tshirt",
    titleAr: "تيشيرت قطني كلاسيكي",
    titleEn: "Classic Cotton T-Shirt",
    descriptionAr: "تيشيرت قطن 100% بقصة عصرية",
    descriptionEn: "100% cotton t-shirt with modern fit",
    basePrice: 15,
    compareAtPrice: 20,
    currencyCode: "USD",
    status: "ACTIVE",
    seoTitle: "Classic Cotton T-Shirt",
    seoDescription: "Comfortable cotton t-shirt",
    categorySlugs: ["mens-clothing"],
    defaultCategorySlug: "mens-clothing",
    tagSlugs: ["best-seller", "new-arrival"],
    options: [
      {
        optionNameAr: "المقاس",
        optionNameEn: "Size",
        values: [
          { valueAr: "صغير", valueEn: "S" },
          { valueAr: "متوسط", valueEn: "M" },
          { valueAr: "كبير", valueEn: "L" },
          { valueAr: "كبير جداً", valueEn: "XL" },
        ],
      },
    ],
    variants: [
      { attributes: { "المقاس": "صغير" }, sku: "TSHIRT-S", price: 15, compareAtPrice: 20, stockQty: 30 },
      { attributes: { "المقاس": "متوسط" }, sku: "TSHIRT-M", price: 15, compareAtPrice: 20, stockQty: 45 },
      { attributes: { "المقاس": "كبير" }, sku: "TSHIRT-L", price: 15, compareAtPrice: 20, stockQty: 40 },
      { attributes: { "المقاس": "كبير جداً" }, sku: "TSHIRT-XL", price: 17, compareAtPrice: 22, stockQty: 20 },
    ],
    attributes: [
      { attributeKey: "brand", valueText: "SOOQ Basics" },
      { attributeKey: "material", optionKeys: ["cotton"] },
    ],
  },

  // --- women's clothing ---
  {
    slug: "summer-floral-dress",
    titleAr: "فستان صيفي مزهر",
    titleEn: "Summer Floral Dress",
    descriptionAr: "فستان خفيف بنقشة مزهرة",
    descriptionEn: "Lightweight floral summer dress",
    basePrice: 45,
    compareAtPrice: 60,
    currencyCode: "USD",
    status: "ACTIVE",
    seoTitle: "Summer Floral Dress",
    seoDescription: "Elegant floral dress for summer",
    categorySlugs: ["womens-clothing"],
    defaultCategorySlug: "womens-clothing",
    tagSlugs: ["new-arrival", "featured", "limited"],
    attributes: [
      { attributeKey: "brand", valueText: "SOOQ Femme" },
    ],
  },

  // --- footwear ---
  {
    slug: "sport-running-shoes",
    titleAr: "حذاء رياضي للجري",
    titleEn: "Sport Running Shoes",
    descriptionAr: "حذاء رياضي مريح للجري اليومي",
    descriptionEn: "Comfortable running shoes for daily use",
    basePrice: 75,
    compareAtPrice: 95,
    currencyCode: "USD",
    status: "ACTIVE",
    seoTitle: "Sport Running Shoes",
    seoDescription: "Everyday running shoes",
    categorySlugs: ["footwear"],
    defaultCategorySlug: "footwear",
    tagSlugs: ["best-seller", "on-sale"],
    attributes: [
      { attributeKey: "brand", valueText: "SOOQ Sport" },
    ],
  },

  // --- kitchen tools ---
  {
    slug: "stainless-steel-cookware-set",
    titleAr: "طقم أواني ستانلس ستيل",
    titleEn: "Stainless Steel Cookware Set",
    descriptionAr: "طقم أواني كامل من الستانلس ستيل",
    descriptionEn: "Complete stainless-steel cookware set",
    basePrice: 220,
    compareAtPrice: 300,
    currencyCode: "USD",
    status: "ACTIVE",
    seoTitle: "Stainless Steel Cookware Set",
    seoDescription: "Full stainless-steel cookware set",
    categorySlugs: ["kitchen-tools"],
    defaultCategorySlug: "kitchen-tools",
    tagSlugs: ["best-seller", "gift-idea"],
    attributes: [
      { attributeKey: "brand", valueText: "SOOQ Home" },
      { attributeKey: "warranty_years", valueText: "5" },
    ],
  },
  {
    slug: "organic-coffee-beans",
    titleAr: "حبوب قهوة عضوية",
    titleEn: "Organic Coffee Beans",
    descriptionAr: "حبوب قهوة عضوية بجودة عالية",
    descriptionEn: "Premium organic coffee beans",
    basePrice: 18,
    compareAtPrice: 24,
    currencyCode: "USD",
    status: "ACTIVE",
    seoTitle: "Organic Coffee Beans",
    seoDescription: "Fresh organic coffee beans",
    categorySlugs: ["kitchen-tools"],
    defaultCategorySlug: "kitchen-tools",
    tagSlugs: ["organic", "new-arrival"],
  },

  // --- home decor ---
  {
    slug: "handmade-ceramic-vase",
    titleAr: "مزهرية سيراميك يدوية",
    titleEn: "Handmade Ceramic Vase",
    descriptionAr: "مزهرية سيراميك بصناعة يدوية",
    descriptionEn: "Handcrafted ceramic vase",
    basePrice: 55,
    compareAtPrice: 70,
    currencyCode: "USD",
    status: "ACTIVE",
    seoTitle: "Handmade Ceramic Vase",
    seoDescription: "Unique handcrafted ceramic vase",
    categorySlugs: ["home-decor"],
    defaultCategorySlug: "home-decor",
    tagSlugs: ["handmade", "limited", "gift-idea"],
    attributes: [
      { attributeKey: "brand", valueText: "SOOQ Craft" },
    ],
  },
  {
    slug: "modern-wall-clock",
    titleAr: "ساعة حائط عصرية",
    titleEn: "Modern Wall Clock",
    descriptionAr: "ساعة حائط بتصميم عصري",
    descriptionEn: "Contemporary wall clock",
    basePrice: 32,
    compareAtPrice: 45,
    currencyCode: "USD",
    status: "ACTIVE",
    seoTitle: "Modern Wall Clock",
    seoDescription: "Stylish wall clock",
    categorySlugs: ["home-decor"],
    defaultCategorySlug: "home-decor",
    tagSlugs: ["new-arrival", "free-shipping"],
    attributes: [
      { attributeKey: "brand", valueText: "SOOQ Home" },
    ],
  },
]

export const SEED_COLLECTIONS: SeedCollectionDef[] = [
  {
    slug: "featured-picks",
    name: "منتجاتنا المميزة",
    type: "MANUAL",
    descriptionAr: "مجموعة مختارة من أفضل منتجاتنا",
    descriptionEn: "A hand-picked selection of our best products",
    productSlugs: [
      "sooq-smartphone-x1",
      "pro-laptop-15",
      "wireless-headphones-pro",
      "summer-floral-dress",
    ],
  },
  {
    slug: "gift-shop",
    name: "أفكار الهدايا",
    type: "MANUAL",
    descriptionAr: "مجموعة رائعة من أفكار الهدايا لكل مناسبة",
    descriptionEn: "Great gift ideas for every occasion",
    productSlugs: [
      "handmade-ceramic-vase",
      "stainless-steel-cookware-set",
      "wireless-headphones-pro",
    ],
  },
  {
    slug: "on-sale",
    name: "التخفيضات",
    type: "AUTOMATED",
    descriptionAr: "كل المنتجات المخفضة الآن",
    descriptionEn: "All products currently on sale",
    rules: [
      { fieldKey: "tag", operator: "equals", value: "on-sale", logicGroup: "AND" },
    ],
  },
  {
    slug: "best-sellers",
    name: "الأكثر مبيعاً",
    type: "AUTOMATED",
    descriptionAr: "المنتجات الأكثر مبيعاً في المتجر",
    descriptionEn: "Top-selling products in the store",
    rules: [
      { fieldKey: "tag", operator: "equals", value: "best-seller", logicGroup: "AND" },
    ],
  },
]

export const SEED_DATASET: SeedDataset = {
  categories: SEED_CATEGORIES,
  tags: SEED_TAGS,
  attributes: SEED_ATTRIBUTES,
  products: SEED_PRODUCTS,
  collections: SEED_COLLECTIONS,
}
