/**
 * Tech / electronics seed dataset.
 *
 * Same shape/contract as the general demo dataset in `./dataset` — the seeder
 * resolves every reference by slug/key. Category and attribute slugs are kept
 * distinct from `./dataset` and `./furniture-dataset` (e.g. `mobile-phones`
 * instead of `smartphones`) so this dataset never silently reuses/renames
 * another dataset's taxonomy; only the truly generic tags/attributes
 * (`brand`, `warranty_years`, `supports_bluetooth`, `best-seller`, …) are
 * shared on purpose.
 *
 * Category order matters: `ensureCategories` creates root categories first and
 * then the children **in array order**, so a grandchild must appear after its
 * own parent.
 *
 * Product pictures come from `public/seed-images-tech/` (see `imageConfig`
 * below) instead of the default `public/seed-images/` pool.
 */

import type {
  SeedAttributeDef,
  SeedCategoryDef,
  SeedCollectionDef,
  SeedDataset,
  SeedProductDef,
  SeedTagDef,
} from "./dataset"
import type { SeedImageConfig } from "./seed-images"

/** Filenames under `public/seed-images-tech/`. Spaces/parens are URL-encoded on fetch. */
export const TECH_SEED_IMAGE_CONFIG: SeedImageConfig = {
  folder: "seed-images-tech",
  filenames: [
    "download.avif",
    "download (1).avif",
    "download (2).avif",
    "download (3).avif",
    "download (4).avif",
    "download (5).avif",
    "download (6).avif",
    "download (7).avif",
    "download (8).avif",
    "download (9).avif",
    "download (10).avif",
    "download (11).avif",
    "download (12).avif",
    "download (13).avif",
    "download (14).avif",
    "images.jpeg",
  ],
}

export const TECH_SEED_CATEGORIES: SeedCategoryDef[] = [
  // --- root ---
  {
    slug: "tech",
    nameAr: "تقنية",
    nameEn: "Tech",
    descriptionAr: "أجهزة وإلكترونيات وملحقات تقنية",
    descriptionEn: "Electronics, devices and tech accessories",
    sortOrder: 0,
  },

  // --- level 1 ---
  {
    slug: "computers",
    nameAr: "حواسيب",
    nameEn: "Computers",
    descriptionAr: "حواسيب محمولة ومكتبية وشاشات",
    descriptionEn: "Laptops, desktops and monitors",
    parentSlug: "tech",
    sortOrder: 0,
  },
  {
    slug: "mobile-devices",
    nameAr: "أجهزة محمولة",
    nameEn: "Mobile Devices",
    descriptionAr: "هواتف ذكية وأجهزة لوحية وساعات ذكية",
    descriptionEn: "Smartphones, tablets and smartwatches",
    parentSlug: "tech",
    sortOrder: 1,
  },
  {
    slug: "audio-devices",
    nameAr: "أجهزة صوت",
    nameEn: "Audio Devices",
    descriptionAr: "سماعات ومكبرات صوت ذكية",
    descriptionEn: "Headphones and smart speakers",
    parentSlug: "tech",
    sortOrder: 2,
  },
  {
    slug: "gaming",
    nameAr: "ألعاب فيديو",
    nameEn: "Gaming",
    descriptionAr: "أجهزة ألعاب وملحقاتها",
    descriptionEn: "Consoles and gaming accessories",
    parentSlug: "tech",
    sortOrder: 3,
  },
  {
    slug: "tech-accessories",
    nameAr: "ملحقات تقنية",
    nameEn: "Tech Accessories",
    descriptionAr: "شواحن وكابلات وأجهزة تخزين ولوحات مفاتيح",
    descriptionEn: "Chargers, cables, storage, keyboards and mice",
    parentSlug: "tech",
    sortOrder: 4,
  },
  {
    slug: "smart-home",
    nameAr: "المنزل الذكي",
    nameEn: "Smart Home",
    descriptionAr: "أجهزة منزلية ذكية ومتصلة",
    descriptionEn: "Connected smart-home devices",
    parentSlug: "tech",
    sortOrder: 5,
  },
  {
    slug: "cameras-photography",
    nameAr: "كاميرات وتصوير",
    nameEn: "Cameras & Photography",
    descriptionAr: "كاميرات وطائرات مسيّرة وملحقات تصوير",
    descriptionEn: "Cameras, drones and photography gear",
    parentSlug: "tech",
    sortOrder: 6,
  },

  // --- level 2: computers ---
  {
    slug: "notebook-computers",
    nameAr: "حواسيب محمولة",
    nameEn: "Laptops",
    descriptionAr: "حواسيب محمولة للعمل والألعاب",
    descriptionEn: "Laptops for work and gaming",
    parentSlug: "computers",
    sortOrder: 0,
  },
  {
    slug: "desktop-computers",
    nameAr: "حواسيب مكتبية",
    nameEn: "Desktops",
    descriptionAr: "حواسيب مكتبية وأجهزة صغيرة",
    descriptionEn: "Desktop towers and mini PCs",
    parentSlug: "computers",
    sortOrder: 1,
  },
  {
    slug: "monitors",
    nameAr: "شاشات",
    nameEn: "Monitors",
    descriptionAr: "شاشات عرض للعمل والألعاب",
    descriptionEn: "Displays for work and gaming",
    parentSlug: "computers",
    sortOrder: 2,
  },

  // --- level 2: mobile devices ---
  {
    slug: "mobile-phones",
    nameAr: "هواتف ذكية",
    nameEn: "Smartphones",
    descriptionAr: "هواتف ذكية بأحدث المواصفات",
    descriptionEn: "Latest smartphones",
    parentSlug: "mobile-devices",
    sortOrder: 0,
  },
  {
    slug: "tablets",
    nameAr: "أجهزة لوحية",
    nameEn: "Tablets",
    descriptionAr: "أجهزة لوحية للعمل والترفيه",
    descriptionEn: "Tablets for work and entertainment",
    parentSlug: "mobile-devices",
    sortOrder: 1,
  },
  {
    slug: "smart-watches",
    nameAr: "ساعات ذكية",
    nameEn: "Smartwatches",
    descriptionAr: "ساعات ذكية لتتبع اللياقة والإشعارات",
    descriptionEn: "Smartwatches for fitness and notifications",
    parentSlug: "mobile-devices",
    sortOrder: 2,
  },

  // --- level 2: audio ---
  {
    slug: "headphones-earbuds",
    nameAr: "سماعات",
    nameEn: "Headphones & Earbuds",
    descriptionAr: "سماعات سلكية ولاسلكية",
    descriptionEn: "Wired and wireless headphones",
    parentSlug: "audio-devices",
    sortOrder: 0,
  },
  {
    slug: "smart-speakers",
    nameAr: "مكبرات صوت ذكية",
    nameEn: "Smart Speakers",
    descriptionAr: "مكبرات صوت متصلة بمساعد صوتي",
    descriptionEn: "Voice-assistant connected speakers",
    parentSlug: "audio-devices",
    sortOrder: 1,
  },

  // --- level 2: gaming ---
  {
    slug: "gaming-consoles",
    nameAr: "أجهزة ألعاب",
    nameEn: "Gaming Consoles",
    descriptionAr: "أجهزة ألعاب منزلية",
    descriptionEn: "Home gaming consoles",
    parentSlug: "gaming",
    sortOrder: 0,
  },
  {
    slug: "gaming-accessories",
    nameAr: "ملحقات ألعاب",
    nameEn: "Gaming Accessories",
    descriptionAr: "أذرع تحكم وملحقات ألعاب",
    descriptionEn: "Controllers and gaming gear",
    parentSlug: "gaming",
    sortOrder: 1,
  },

  // --- level 2: tech accessories ---
  {
    slug: "chargers-cables",
    nameAr: "شواحن وكابلات",
    nameEn: "Chargers & Cables",
    descriptionAr: "شواحن وكابلات شحن سريع",
    descriptionEn: "Fast chargers and charging cables",
    parentSlug: "tech-accessories",
    sortOrder: 0,
  },
  {
    slug: "storage-devices",
    nameAr: "أجهزة تخزين",
    nameEn: "Storage Devices",
    descriptionAr: "أقراص تخزين محمولة وخارجية",
    descriptionEn: "Portable and external storage drives",
    parentSlug: "tech-accessories",
    sortOrder: 1,
  },
  {
    slug: "keyboards-mice",
    nameAr: "لوحات مفاتيح وفأرات",
    nameEn: "Keyboards & Mice",
    descriptionAr: "لوحات مفاتيح وفأرات سلكية ولاسلكية",
    descriptionEn: "Wired and wireless keyboards and mice",
    parentSlug: "tech-accessories",
    sortOrder: 2,
  },
]

export const TECH_SEED_TAGS: SeedTagDef[] = [
  // shared with the general dataset — reused if already created
  { slug: "best-seller", name: "الأكثر مبيعاً" },
  { slug: "new-arrival", name: "جديد" },
  { slug: "on-sale", name: "تخفيضات" },
  { slug: "free-shipping", name: "توصيل مجاني" },
  { slug: "featured", name: "منتج مميز" },
  { slug: "limited", name: "محدود" },
  // tech-specific
  { slug: "wireless", name: "لاسلكي" },
  { slug: "fast-charging", name: "شحن سريع" },
  { slug: "waterproof", name: "مقاوم للماء" },
  { slug: "noise-cancelling", name: "عزل ضوضاء" },
  { slug: "rgb-lighting", name: "إضاءة RGB" },
  { slug: "5g-ready", name: "يدعم 5G" },
  { slug: "energy-efficient", name: "موفر للطاقة" },
]

export const TECH_SEED_ATTRIBUTES: SeedAttributeDef[] = [
  /* --- tenant-wide (shared with the general dataset) --- */
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

  /* --- tenant-wide, tech specific --- */
  {
    attributeKey: "screen_size_inch",
    nameAr: "حجم الشاشة (بوصة)",
    nameEn: "Screen size (inch)",
    dataType: "NUMBER",
    isFilterable: true,
    isVisibleOnStorefront: true,
    sortOrder: 3,
  },
  {
    attributeKey: "ram_gb",
    nameAr: "الذاكرة العشوائية (RAM)",
    nameEn: "RAM",
    dataType: "SELECT",
    isFilterable: true,
    isVisibleOnStorefront: true,
    sortOrder: 4,
    options: [
      { key: "4gb", valueAr: "٤ جيجابايت", valueEn: "4GB" },
      { key: "8gb", valueAr: "٨ جيجابايت", valueEn: "8GB" },
      { key: "16gb", valueAr: "١٦ جيجابايت", valueEn: "16GB" },
      { key: "32gb", valueAr: "٣٢ جيجابايت", valueEn: "32GB" },
      { key: "64gb", valueAr: "٦٤ جيجابايت", valueEn: "64GB" },
    ],
  },
  {
    attributeKey: "storage_gb",
    nameAr: "سعة التخزين",
    nameEn: "Storage",
    dataType: "SELECT",
    isFilterable: true,
    isVisibleOnStorefront: true,
    sortOrder: 5,
    options: [
      { key: "64gb", valueAr: "٦٤ جيجابايت", valueEn: "64GB" },
      { key: "128gb", valueAr: "١٢٨ جيجابايت", valueEn: "128GB" },
      { key: "256gb", valueAr: "٢٥٦ جيجابايت", valueEn: "256GB" },
      { key: "512gb", valueAr: "٥١٢ جيجابايت", valueEn: "512GB" },
      { key: "1tb", valueAr: "١ تيرابايت", valueEn: "1TB" },
      { key: "2tb", valueAr: "٢ تيرابايت", valueEn: "2TB" },
    ],
  },
  {
    attributeKey: "connectivity",
    nameAr: "خيارات الاتصال",
    nameEn: "Connectivity",
    dataType: "MULTI_SELECT",
    isFilterable: true,
    isVisibleOnStorefront: true,
    sortOrder: 6,
    options: [
      { key: "wifi", valueAr: "واي فاي", valueEn: "Wi-Fi" },
      { key: "bluetooth", valueAr: "بلوتوث", valueEn: "Bluetooth" },
      { key: "usb-c", valueAr: "USB-C", valueEn: "USB-C" },
      { key: "nfc", valueAr: "NFC", valueEn: "NFC" },
      { key: "5g", valueAr: "5G", valueEn: "5G" },
      { key: "lte", valueAr: "LTE", valueEn: "LTE" },
    ],
  },
  {
    attributeKey: "color",
    nameAr: "اللون",
    nameEn: "Color",
    dataType: "SELECT",
    isFilterable: true,
    isVisibleOnStorefront: true,
    sortOrder: 7,
    options: [
      { key: "black", valueAr: "أسود", valueEn: "Black" },
      { key: "white", valueAr: "أبيض", valueEn: "White" },
      { key: "silver", valueAr: "فضي", valueEn: "Silver" },
      { key: "blue", valueAr: "أزرق", valueEn: "Blue" },
      { key: "red", valueAr: "أحمر", valueEn: "Red" },
      { key: "gold", valueAr: "ذهبي", valueEn: "Gold" },
    ],
  },
  {
    attributeKey: "operating_system",
    nameAr: "نظام التشغيل",
    nameEn: "Operating system",
    dataType: "SELECT",
    isFilterable: true,
    isVisibleOnStorefront: true,
    sortOrder: 8,
    options: [
      { key: "android", valueAr: "أندرويد", valueEn: "Android" },
      { key: "ios", valueAr: "iOS", valueEn: "iOS" },
      { key: "windows", valueAr: "ويندوز", valueEn: "Windows" },
      { key: "macos", valueAr: "macOS", valueEn: "macOS" },
      { key: "linux", valueAr: "لينكس", valueEn: "Linux" },
      { key: "none", valueAr: "بدون", valueEn: "None" },
    ],
  },
  {
    attributeKey: "battery_capacity_mah",
    nameAr: "سعة البطارية (mAh)",
    nameEn: "Battery capacity (mAh)",
    dataType: "NUMBER",
    isVisibleOnStorefront: true,
    sortOrder: 9,
  },
  {
    attributeKey: "waterproof_rating",
    nameAr: "تصنيف مقاومة الماء",
    nameEn: "Water resistance rating",
    dataType: "SELECT",
    isFilterable: true,
    isVisibleOnStorefront: true,
    sortOrder: 10,
    options: [
      { key: "none", valueAr: "بدون", valueEn: "None" },
      { key: "ipx4", valueAr: "IPX4", valueEn: "IPX4" },
      { key: "ipx7", valueAr: "IPX7", valueEn: "IPX7" },
      { key: "ip67", valueAr: "IP67", valueEn: "IP67" },
      { key: "ip68", valueAr: "IP68", valueEn: "IP68" },
    ],
  },

  /* --- category scoped --- */
  {
    attributeKey: "processor",
    nameAr: "المعالج",
    nameEn: "Processor",
    dataType: "TEXT",
    isVisibleOnStorefront: true,
    sortOrder: 0,
    categorySlug: "notebook-computers",
  },
  {
    attributeKey: "refresh_rate_hz",
    nameAr: "معدل التحديث (هرتز)",
    nameEn: "Refresh rate (Hz)",
    dataType: "SELECT",
    isFilterable: true,
    isVisibleOnStorefront: true,
    sortOrder: 0,
    categorySlug: "monitors",
    options: [
      { key: "60hz", valueAr: "٦٠ هرتز", valueEn: "60Hz" },
      { key: "144hz", valueAr: "١٤٤ هرتز", valueEn: "144Hz" },
      { key: "165hz", valueAr: "١٦٥ هرتز", valueEn: "165Hz" },
      { key: "240hz", valueAr: "٢٤٠ هرتز", valueEn: "240Hz" },
    ],
  },
  {
    attributeKey: "camera_mp",
    nameAr: "دقة الكاميرا (ميجابكسل)",
    nameEn: "Camera resolution (MP)",
    dataType: "NUMBER",
    isVisibleOnStorefront: true,
    sortOrder: 0,
    categorySlug: "mobile-phones",
  },
  {
    attributeKey: "noise_cancelling",
    nameAr: "عزل الضوضاء النشط",
    nameEn: "Active noise cancelling",
    dataType: "BOOLEAN",
    isFilterable: true,
    isVisibleOnStorefront: true,
    sortOrder: 0,
    categorySlug: "headphones-earbuds",
  },
  {
    attributeKey: "dpi",
    nameAr: "الدقة (DPI)",
    nameEn: "Sensor DPI",
    dataType: "NUMBER",
    isVisibleOnStorefront: true,
    sortOrder: 0,
    categorySlug: "keyboards-mice",
  },
  {
    attributeKey: "key_switch_type",
    nameAr: "نوع مفاتيح الكيبورد",
    nameEn: "Key switch type",
    dataType: "SELECT",
    isFilterable: true,
    isVisibleOnStorefront: true,
    sortOrder: 1,
    categorySlug: "keyboards-mice",
    options: [
      { key: "membrane", valueAr: "غشائي", valueEn: "Membrane" },
      { key: "mechanical-red", valueAr: "ميكانيكي أحمر", valueEn: "Mechanical (red)" },
      { key: "mechanical-blue", valueAr: "ميكانيكي أزرق", valueEn: "Mechanical (blue)" },
    ],
  },
  {
    attributeKey: "console_generation",
    nameAr: "الجيل",
    nameEn: "Generation",
    dataType: "SELECT",
    isFilterable: true,
    isVisibleOnStorefront: true,
    sortOrder: 0,
    categorySlug: "gaming-consoles",
    options: [
      { key: "current-gen", valueAr: "الجيل الحالي", valueEn: "Current-gen" },
      { key: "handheld", valueAr: "محمول", valueEn: "Handheld" },
    ],
  },
]

export const TECH_SEED_PRODUCTS: SeedProductDef[] = [
  /* --------------------------------------------------------------- laptops */
  {
    slug: "quantum-ultrabook-14",
    titleAr: "كوانتم ألترابوك ١٤ بوصة",
    titleEn: "Quantum Ultrabook 14",
    descriptionAr:
      "حاسوب محمول خفيف الوزن بشاشة ١٤ بوصة وهيكل ألمنيوم، مناسب للعمل والتنقل اليومي",
    descriptionEn:
      "Lightweight 14\" ultrabook in an aluminum chassis, built for work and daily travel",
    basePrice: 780,
    compareAtPrice: 900,
    currencyCode: "USD",
    status: "ACTIVE",
    seoTitle: "Quantum Ultrabook 14",
    seoDescription: "Lightweight 14-inch ultrabook for work and travel",
    categorySlugs: ["notebook-computers", "computers"],
    defaultCategorySlug: "notebook-computers",
    tagSlugs: ["best-seller", "featured", "free-shipping"],
    options: [
      {
        optionNameAr: "اللون",
        optionNameEn: "Color",
        values: [
          { valueAr: "فضي", valueEn: "Silver" },
          { valueAr: "أسود", valueEn: "Black" },
        ],
      },
      {
        optionNameAr: "التخزين",
        optionNameEn: "Storage",
        values: [
          { valueAr: "٢٥٦ جيجابايت", valueEn: "256GB" },
          { valueAr: "٥١٢ جيجابايت", valueEn: "512GB" },
        ],
      },
    ],
    variants: [
      { attributes: { "اللون": "فضي", "التخزين": "٢٥٦ جيجابايت" }, sku: "ULB-Q14-SLV-256", price: 780, compareAtPrice: 900, stockQty: 10, weightGrams: 1300 },
      { attributes: { "اللون": "فضي", "التخزين": "٥١٢ جيجابايت" }, sku: "ULB-Q14-SLV-512", price: 860, compareAtPrice: 980, stockQty: 6, weightGrams: 1300 },
      { attributes: { "اللون": "أسود", "التخزين": "٢٥٦ جيجابايت" }, sku: "ULB-Q14-BLK-256", price: 780, compareAtPrice: 900, stockQty: 8, weightGrams: 1300 },
      { attributes: { "اللون": "أسود", "التخزين": "٥١٢ جيجابايت" }, sku: "ULB-Q14-BLK-512", price: 860, compareAtPrice: 980, stockQty: 5, weightGrams: 1300 },
    ],
    attributes: [
      { attributeKey: "brand", valueText: "SOOQ Compute" },
      { attributeKey: "warranty_years", valueText: "2" },
      { attributeKey: "supports_bluetooth", valueText: "true" },
      { attributeKey: "screen_size_inch", valueText: "14" },
      { attributeKey: "ram_gb", optionKeys: ["16gb"] },
      { attributeKey: "storage_gb", optionKeys: ["256gb", "512gb"] },
      { attributeKey: "connectivity", optionKeys: ["wifi", "bluetooth", "usb-c"] },
      { attributeKey: "operating_system", optionKeys: ["windows"] },
      { attributeKey: "processor", valueText: "Intel Core i5-1240P" },
    ],
  },
  {
    slug: "titan-gaming-laptop-17",
    titleAr: "تيتان لابتوب ألعاب ١٧ بوصة",
    titleEn: "Titan Gaming Laptop 17",
    descriptionAr:
      "حاسوب ألعاب بشاشة ١٧ بوصة معدل تحديث ١٦٥ هرتز وكرت شاشة مخصص ونظام تبريد مزدوج المروحة",
    descriptionEn:
      "17\" 165Hz gaming laptop with a discrete GPU and dual-fan cooling",
    basePrice: 1650,
    compareAtPrice: 1950,
    currencyCode: "USD",
    status: "ACTIVE",
    seoTitle: "Titan Gaming Laptop 17",
    seoDescription: "17-inch 165Hz gaming laptop with discrete GPU",
    categorySlugs: ["notebook-computers", "gaming"],
    defaultCategorySlug: "notebook-computers",
    tagSlugs: ["new-arrival", "rgb-lighting", "featured"],
    options: [
      {
        optionNameAr: "التخزين",
        optionNameEn: "Storage",
        values: [
          { valueAr: "٥١٢ جيجابايت", valueEn: "512GB" },
          { valueAr: "١ تيرابايت", valueEn: "1TB" },
        ],
      },
    ],
    variants: [
      { attributes: { "التخزين": "٥١٢ جيجابايت" }, sku: "GLP-TTN17-512", price: 1650, compareAtPrice: 1950, stockQty: 5, weightGrams: 2600 },
      { attributes: { "التخزين": "١ تيرابايت" }, sku: "GLP-TTN17-1TB", price: 1820, compareAtPrice: 2150, stockQty: 3, weightGrams: 2600 },
    ],
    attributes: [
      { attributeKey: "brand", valueText: "SOOQ Titan" },
      { attributeKey: "warranty_years", valueText: "2" },
      { attributeKey: "supports_bluetooth", valueText: "true" },
      { attributeKey: "screen_size_inch", valueText: "17" },
      { attributeKey: "ram_gb", optionKeys: ["32gb"] },
      { attributeKey: "storage_gb", optionKeys: ["512gb", "1tb"] },
      { attributeKey: "connectivity", optionKeys: ["wifi", "bluetooth", "usb-c"] },
      { attributeKey: "operating_system", optionKeys: ["windows"] },
      { attributeKey: "processor", valueText: "Intel Core i7-13700HX" },
    ],
  },

  /* -------------------------------------------------------------- desktops */
  {
    slug: "nova-mini-pc",
    titleAr: "نوفا حاسوب صغير",
    titleEn: "Nova Mini PC",
    descriptionAr:
      "حاسوب مكتبي صغير الحجم مناسب لأعمال المكتب والمنزل، بحجم راحة اليد وضجيج تشغيل منخفض",
    descriptionEn:
      "Palm-sized quiet desktop for home and office work",
    basePrice: 420,
    compareAtPrice: 500,
    currencyCode: "USD",
    status: "ACTIVE",
    seoTitle: "Nova Mini PC",
    seoDescription: "Compact quiet mini PC for home and office",
    categorySlugs: ["desktop-computers", "computers"],
    defaultCategorySlug: "desktop-computers",
    tagSlugs: ["energy-efficient", "on-sale"],
    attributes: [
      { attributeKey: "brand", valueText: "SOOQ Compute" },
      { attributeKey: "warranty_years", valueText: "2" },
      { attributeKey: "ram_gb", optionKeys: ["16gb"] },
      { attributeKey: "storage_gb", optionKeys: ["512gb"] },
      { attributeKey: "connectivity", optionKeys: ["wifi", "bluetooth", "usb-c"] },
      { attributeKey: "operating_system", optionKeys: ["windows"] },
    ],
  },
  {
    slug: "forge-gaming-tower",
    titleAr: "فورج حاسوب ألعاب مكتبي",
    titleEn: "Forge Gaming Tower",
    descriptionAr:
      "حاسوب ألعاب مكتبي بإضاءة RGB وتبريد سائل وكرت شاشة عالي الأداء يدعم الألعاب الحديثة بأعلى إعدادات",
    descriptionEn:
      "RGB-lit liquid-cooled gaming tower with a high-end GPU for modern titles at max settings",
    basePrice: 1900,
    compareAtPrice: 2300,
    currencyCode: "USD",
    status: "ACTIVE",
    seoTitle: "Forge Gaming Tower",
    seoDescription: "Liquid-cooled RGB gaming desktop tower",
    categorySlugs: ["desktop-computers", "gaming"],
    defaultCategorySlug: "desktop-computers",
    tagSlugs: ["rgb-lighting", "best-seller", "featured"],
    attributes: [
      { attributeKey: "brand", valueText: "SOOQ Titan" },
      { attributeKey: "warranty_years", valueText: "3" },
      { attributeKey: "ram_gb", optionKeys: ["32gb"] },
      { attributeKey: "storage_gb", optionKeys: ["1tb"] },
      { attributeKey: "connectivity", optionKeys: ["wifi", "bluetooth", "usb-c"] },
      { attributeKey: "operating_system", optionKeys: ["windows"] },
    ],
  },

  /* -------------------------------------------------------------- monitors */
  {
    slug: "curve-view-27-monitor",
    titleAr: "شاشة كيرف فيو منحنية ٢٧ بوصة",
    titleEn: "CurveView 27 Curved Monitor",
    descriptionAr:
      "شاشة منحنية ٢٧ بوصة بدقة QHD ومعدل تحديث ١٦٥ هرتز، مثالية لألعاب الفيديو السريعة",
    descriptionEn:
      "27\" curved QHD display with a 165Hz refresh rate, built for fast-paced gaming",
    basePrice: 340,
    compareAtPrice: 420,
    currencyCode: "USD",
    status: "ACTIVE",
    seoTitle: "CurveView 27 Curved Monitor",
    seoDescription: "27-inch curved QHD 165Hz gaming monitor",
    categorySlugs: ["monitors", "gaming"],
    defaultCategorySlug: "monitors",
    tagSlugs: ["new-arrival", "rgb-lighting"],
    attributes: [
      { attributeKey: "brand", valueText: "SOOQ Vision" },
      { attributeKey: "warranty_years", valueText: "3" },
      { attributeKey: "screen_size_inch", valueText: "27" },
      { attributeKey: "connectivity", optionKeys: ["usb-c"] },
      { attributeKey: "refresh_rate_hz", optionKeys: ["165hz"] },
    ],
  },
  {
    slug: "ultra-4k-32-monitor",
    titleAr: "شاشة ألترا ٤ كي ٣٢ بوصة",
    titleEn: "Ultra 4K 32 Monitor",
    descriptionAr:
      "شاشة احترافية بدقة ٤ كي ومقاس ٣٢ بوصة وتغطية لونية واسعة، مناسبة للتصميم ومونتاج الفيديو",
    descriptionEn:
      "32\" 4K professional display with wide color coverage for design and video editing",
    basePrice: 560,
    compareAtPrice: 680,
    currencyCode: "USD",
    status: "ACTIVE",
    seoTitle: "Ultra 4K 32 Monitor",
    seoDescription: "32-inch 4K monitor for design and video work",
    categorySlugs: ["monitors", "computers"],
    defaultCategorySlug: "monitors",
    tagSlugs: ["featured", "free-shipping"],
    attributes: [
      { attributeKey: "brand", valueText: "SOOQ Vision" },
      { attributeKey: "warranty_years", valueText: "3" },
      { attributeKey: "screen_size_inch", valueText: "32" },
      { attributeKey: "connectivity", optionKeys: ["usb-c"] },
      { attributeKey: "refresh_rate_hz", optionKeys: ["60hz"] },
    ],
  },

  /* ------------------------------------------------------------ smartphones */
  {
    slug: "nova-x-smartphone",
    titleAr: "هاتف نوفا إكس",
    titleEn: "Nova X Smartphone",
    descriptionAr:
      "هاتف ذكي بشاشة ٦.٥ بوصة وكاميرا خلفية ثلاثية ٥٠ ميجابكسل وشحن سريع ٦٥ واط",
    descriptionEn:
      "Smartphone with a 6.5\" display, 50MP triple rear camera and 65W fast charging",
    basePrice: 420,
    compareAtPrice: 500,
    currencyCode: "USD",
    status: "ACTIVE",
    seoTitle: "Nova X Smartphone",
    seoDescription: "6.5-inch smartphone with 50MP camera and fast charging",
    categorySlugs: ["mobile-phones", "mobile-devices"],
    defaultCategorySlug: "mobile-phones",
    tagSlugs: ["new-arrival", "fast-charging", "5g-ready"],
    options: [
      {
        optionNameAr: "اللون",
        optionNameEn: "Color",
        values: [
          { valueAr: "أسود", valueEn: "Black" },
          { valueAr: "أزرق", valueEn: "Blue" },
        ],
      },
      {
        optionNameAr: "التخزين",
        optionNameEn: "Storage",
        values: [
          { valueAr: "١٢٨ جيجابايت", valueEn: "128GB" },
          { valueAr: "٢٥٦ جيجابايت", valueEn: "256GB" },
        ],
      },
    ],
    variants: [
      { attributes: { "اللون": "أسود", "التخزين": "١٢٨ جيجابايت" }, sku: "PHN-NVX-BLK-128", price: 420, compareAtPrice: 500, stockQty: 20, weightGrams: 195 },
      { attributes: { "اللون": "أسود", "التخزين": "٢٥٦ جيجابايت" }, sku: "PHN-NVX-BLK-256", price: 470, compareAtPrice: 560, stockQty: 14, weightGrams: 195 },
      { attributes: { "اللون": "أزرق", "التخزين": "١٢٨ جيجابايت" }, sku: "PHN-NVX-BLU-128", price: 420, compareAtPrice: 500, stockQty: 12, weightGrams: 195 },
      { attributes: { "اللون": "أزرق", "التخزين": "٢٥٦ جيجابايت" }, sku: "PHN-NVX-BLU-256", price: 470, compareAtPrice: 560, stockQty: 9, weightGrams: 195 },
    ],
    attributes: [
      { attributeKey: "brand", valueText: "SOOQ Mobile" },
      { attributeKey: "warranty_years", valueText: "2" },
      { attributeKey: "supports_bluetooth", valueText: "true" },
      { attributeKey: "screen_size_inch", valueText: "6.5" },
      { attributeKey: "ram_gb", optionKeys: ["8gb"] },
      { attributeKey: "storage_gb", optionKeys: ["128gb", "256gb"] },
      { attributeKey: "connectivity", optionKeys: ["wifi", "bluetooth", "5g", "nfc"] },
      { attributeKey: "operating_system", optionKeys: ["android"] },
      { attributeKey: "battery_capacity_mah", valueText: "5000" },
      { attributeKey: "waterproof_rating", optionKeys: ["ip67"] },
      { attributeKey: "camera_mp", valueText: "50" },
    ],
  },
  {
    slug: "nova-lite-smartphone",
    titleAr: "هاتف نوفا لايت",
    titleEn: "Nova Lite Smartphone",
    descriptionAr: "هاتف اقتصادي بمواصفات جيدة يناسب الاستخدام اليومي",
    descriptionEn: "Budget-friendly phone with solid everyday specs",
    basePrice: 190,
    compareAtPrice: 230,
    currencyCode: "USD",
    status: "ACTIVE",
    seoTitle: "Nova Lite Smartphone",
    seoDescription: "Affordable smartphone for daily use",
    categorySlugs: ["mobile-phones", "mobile-devices"],
    defaultCategorySlug: "mobile-phones",
    tagSlugs: ["on-sale", "limited"],
    attributes: [
      { attributeKey: "brand", valueText: "SOOQ Mobile" },
      { attributeKey: "warranty_years", valueText: "1" },
      { attributeKey: "screen_size_inch", valueText: "6.1" },
      { attributeKey: "ram_gb", optionKeys: ["4gb"] },
      { attributeKey: "storage_gb", optionKeys: ["64gb"] },
      { attributeKey: "connectivity", optionKeys: ["wifi", "bluetooth", "lte"] },
      { attributeKey: "operating_system", optionKeys: ["android"] },
      { attributeKey: "battery_capacity_mah", valueText: "4500" },
      { attributeKey: "camera_mp", valueText: "13" },
    ],
  },

  /* ---------------------------------------------------------------- tablet */
  {
    slug: "aero-tablet-11",
    titleAr: "جهاز لوحي إيرو ١١ بوصة",
    titleEn: "Aero Tablet 11",
    descriptionAr:
      "جهاز لوحي بشاشة ١١ بوصة يدعم القلم الذكي، مناسب للرسم والدراسة ومشاهدة الفيديو",
    descriptionEn:
      "11\" tablet with stylus support — great for drawing, studying and video",
    basePrice: 380,
    compareAtPrice: 450,
    currencyCode: "USD",
    status: "ACTIVE",
    seoTitle: "Aero Tablet 11",
    seoDescription: "11-inch tablet with stylus support",
    categorySlugs: ["tablets", "mobile-devices"],
    defaultCategorySlug: "tablets",
    tagSlugs: ["new-arrival", "best-seller"],
    options: [
      {
        optionNameAr: "التخزين",
        optionNameEn: "Storage",
        values: [
          { valueAr: "٦٤ جيجابايت", valueEn: "64GB" },
          { valueAr: "٢٥٦ جيجابايت", valueEn: "256GB" },
        ],
      },
    ],
    variants: [
      { attributes: { "التخزين": "٦٤ جيجابايت" }, sku: "TAB-AER11-64", price: 380, compareAtPrice: 450, stockQty: 15, weightGrams: 460 },
      { attributes: { "التخزين": "٢٥٦ جيجابايت" }, sku: "TAB-AER11-256", price: 440, compareAtPrice: 520, stockQty: 8, weightGrams: 460 },
    ],
    attributes: [
      { attributeKey: "brand", valueText: "SOOQ Mobile" },
      { attributeKey: "warranty_years", valueText: "2" },
      { attributeKey: "supports_bluetooth", valueText: "true" },
      { attributeKey: "screen_size_inch", valueText: "11" },
      { attributeKey: "storage_gb", optionKeys: ["64gb", "256gb"] },
      { attributeKey: "connectivity", optionKeys: ["wifi", "bluetooth"] },
      { attributeKey: "operating_system", optionKeys: ["android"] },
      { attributeKey: "battery_capacity_mah", valueText: "7500" },
    ],
  },

  /* ----------------------------------------------------------- smartwatch */
  {
    slug: "pulse-smartwatch",
    titleAr: "ساعة بالس الذكية",
    titleEn: "Pulse Smartwatch",
    descriptionAr:
      "ساعة ذكية لتتبع اللياقة ومعدل النبض والنوم، مقاومة للماء ومزودة ببطارية تدوم أسبوعاً",
    descriptionEn:
      "Fitness smartwatch tracking heart rate and sleep, water-resistant with a week-long battery",
    basePrice: 130,
    compareAtPrice: 165,
    currencyCode: "USD",
    status: "ACTIVE",
    seoTitle: "Pulse Smartwatch",
    seoDescription: "Fitness smartwatch with week-long battery life",
    categorySlugs: ["smart-watches", "mobile-devices"],
    defaultCategorySlug: "smart-watches",
    tagSlugs: ["best-seller", "waterproof", "free-shipping"],
    options: [
      {
        optionNameAr: "اللون",
        optionNameEn: "Color",
        values: [
          { valueAr: "أسود", valueEn: "Black" },
          { valueAr: "فضي", valueEn: "Silver" },
          { valueAr: "وردي", valueEn: "Rose" },
        ],
      },
    ],
    variants: [
      { attributes: { "اللون": "أسود" }, sku: "WCH-PLS-BLK", price: 130, compareAtPrice: 165, stockQty: 25, weightGrams: 45 },
      { attributes: { "اللون": "فضي" }, sku: "WCH-PLS-SLV", price: 130, compareAtPrice: 165, stockQty: 18, weightGrams: 45 },
      { attributes: { "اللون": "وردي" }, sku: "WCH-PLS-ROS", price: 135, compareAtPrice: 170, stockQty: 11, weightGrams: 45 },
    ],
    attributes: [
      { attributeKey: "brand", valueText: "SOOQ Wear" },
      { attributeKey: "warranty_years", valueText: "1" },
      { attributeKey: "supports_bluetooth", valueText: "true" },
      { attributeKey: "connectivity", optionKeys: ["bluetooth"] },
      { attributeKey: "battery_capacity_mah", valueText: "300" },
      { attributeKey: "waterproof_rating", optionKeys: ["ip68"] },
    ],
  },

  /* ------------------------------------------------------------- audio */
  {
    slug: "echo-wireless-earbuds",
    titleAr: "سماعات إيكو اللاسلكية",
    titleEn: "Echo Wireless Earbuds",
    descriptionAr:
      "سماعات أذن لاسلكية بعزل ضوضاء نشط وعلبة شحن مغناطيسية، تدوم ٦ ساعات متواصلة",
    descriptionEn:
      "True wireless earbuds with active noise cancelling and a magnetic charging case, 6-hour battery life",
    basePrice: 95,
    compareAtPrice: 125,
    currencyCode: "USD",
    status: "ACTIVE",
    seoTitle: "Echo Wireless Earbuds",
    seoDescription: "Noise-cancelling true wireless earbuds",
    categorySlugs: ["headphones-earbuds", "audio-devices"],
    defaultCategorySlug: "headphones-earbuds",
    tagSlugs: ["best-seller", "wireless", "noise-cancelling"],
    options: [
      {
        optionNameAr: "اللون",
        optionNameEn: "Color",
        values: [
          { valueAr: "أسود", valueEn: "Black" },
          { valueAr: "أبيض", valueEn: "White" },
        ],
      },
    ],
    variants: [
      { attributes: { "اللون": "أسود" }, sku: "EAR-ECH-BLK", price: 95, compareAtPrice: 125, stockQty: 30, weightGrams: 55 },
      { attributes: { "اللون": "أبيض" }, sku: "EAR-ECH-WHT", price: 95, compareAtPrice: 125, stockQty: 22, weightGrams: 55 },
    ],
    attributes: [
      { attributeKey: "brand", valueText: "SOOQ Audio" },
      { attributeKey: "warranty_years", valueText: "1" },
      { attributeKey: "supports_bluetooth", valueText: "true" },
      { attributeKey: "connectivity", optionKeys: ["bluetooth"] },
      { attributeKey: "battery_capacity_mah", valueText: "55" },
      { attributeKey: "waterproof_rating", optionKeys: ["ipx4"] },
      { attributeKey: "noise_cancelling", valueText: "true" },
    ],
  },
  {
    slug: "boom-over-ear-headphones",
    titleAr: "سماعات بووم فوق الأذن",
    titleEn: "Boom Over-Ear Headphones",
    descriptionAr:
      "سماعات رأس فوق الأذن بعزل ضوضاء نشط وجودة صوت عالية، وسائد مبطنة مريحة للاستخدام الطويل",
    descriptionEn:
      "Over-ear headphones with active noise cancelling and premium sound, padded for long sessions",
    basePrice: 150,
    compareAtPrice: 190,
    currencyCode: "USD",
    status: "ACTIVE",
    seoTitle: "Boom Over-Ear Headphones",
    seoDescription: "Over-ear noise-cancelling headphones",
    categorySlugs: ["headphones-earbuds", "audio-devices"],
    defaultCategorySlug: "headphones-earbuds",
    tagSlugs: ["noise-cancelling", "featured"],
    attributes: [
      { attributeKey: "brand", valueText: "SOOQ Audio" },
      { attributeKey: "warranty_years", valueText: "2" },
      { attributeKey: "supports_bluetooth", valueText: "true" },
      { attributeKey: "connectivity", optionKeys: ["bluetooth"] },
      { attributeKey: "battery_capacity_mah", valueText: "600" },
      { attributeKey: "noise_cancelling", valueText: "true" },
    ],
  },
  {
    slug: "voice-hub-smart-speaker",
    titleAr: "مكبر صوت فويس هاب الذكي",
    titleEn: "Voice Hub Smart Speaker",
    descriptionAr:
      "مكبر صوت ذكي بمساعد صوتي مدمج للتحكم بالمنزل الذكي وتشغيل الموسيقى، صوت ٣٦٠ درجة",
    descriptionEn:
      "Smart speaker with a built-in voice assistant for smart-home control and 360° sound",
    basePrice: 85,
    compareAtPrice: 110,
    currencyCode: "USD",
    status: "ACTIVE",
    seoTitle: "Voice Hub Smart Speaker",
    seoDescription: "Voice-assistant smart speaker with 360° sound",
    categorySlugs: ["smart-speakers", "audio-devices"],
    defaultCategorySlug: "smart-speakers",
    tagSlugs: ["new-arrival", "wireless"],
    attributes: [
      { attributeKey: "brand", valueText: "SOOQ Audio" },
      { attributeKey: "warranty_years", valueText: "1" },
      { attributeKey: "supports_bluetooth", valueText: "true" },
      { attributeKey: "connectivity", optionKeys: ["wifi", "bluetooth"] },
    ],
  },

  /* ------------------------------------------------------------- gaming */
  {
    slug: "playmax-console-x",
    titleAr: "جهاز ألعاب بلايماكس إكس",
    titleEn: "PlayMax Console X",
    descriptionAr:
      "جهاز ألعاب منزلي يدعم دقة ٤ كي ومعدل تحديث عالٍ، مع دعم الألعاب الرقمية والفعلية",
    descriptionEn:
      "Home gaming console with 4K support and high frame rates, digital and disc games supported",
    basePrice: 500,
    compareAtPrice: 580,
    currencyCode: "USD",
    status: "ACTIVE",
    seoTitle: "PlayMax Console X",
    seoDescription: "4K home gaming console",
    categorySlugs: ["gaming-consoles", "gaming"],
    defaultCategorySlug: "gaming-consoles",
    tagSlugs: ["best-seller", "featured"],
    options: [
      {
        optionNameAr: "التخزين",
        optionNameEn: "Storage",
        values: [
          { valueAr: "٥١٢ جيجابايت", valueEn: "512GB" },
          { valueAr: "١ تيرابايت", valueEn: "1TB" },
        ],
      },
    ],
    variants: [
      { attributes: { "التخزين": "٥١٢ جيجابايت" }, sku: "CON-PMX-512", price: 500, compareAtPrice: 580, stockQty: 9, weightGrams: 3900 },
      { attributes: { "التخزين": "١ تيرابايت" }, sku: "CON-PMX-1TB", price: 560, compareAtPrice: 650, stockQty: 6, weightGrams: 3900 },
    ],
    attributes: [
      { attributeKey: "brand", valueText: "SOOQ Titan" },
      { attributeKey: "warranty_years", valueText: "2" },
      { attributeKey: "storage_gb", optionKeys: ["512gb", "1tb"] },
      { attributeKey: "connectivity", optionKeys: ["wifi", "bluetooth", "usb-c"] },
      { attributeKey: "console_generation", optionKeys: ["current-gen"] },
    ],
  },
  {
    slug: "strike-wireless-controller",
    titleAr: "يد تحكم سترايك اللاسلكية",
    titleEn: "Strike Wireless Controller",
    descriptionAr:
      "يد تحكم لاسلكية بتصميم مريح واستجابة سريعة، تدعم الاتصال بالحاسوب والأجهزة المحمولة",
    descriptionEn:
      "Ergonomic low-latency wireless controller, compatible with PC and mobile",
    basePrice: 55,
    compareAtPrice: 70,
    currencyCode: "USD",
    status: "ACTIVE",
    seoTitle: "Strike Wireless Controller",
    seoDescription: "Wireless gaming controller for PC and mobile",
    categorySlugs: ["gaming-accessories", "gaming"],
    defaultCategorySlug: "gaming-accessories",
    tagSlugs: ["wireless", "rgb-lighting"],
    options: [
      {
        optionNameAr: "اللون",
        optionNameEn: "Color",
        values: [
          { valueAr: "أسود", valueEn: "Black" },
          { valueAr: "أزرق", valueEn: "Blue" },
        ],
      },
    ],
    variants: [
      { attributes: { "اللون": "أسود" }, sku: "CTL-STK-BLK", price: 55, compareAtPrice: 70, stockQty: 20, weightGrams: 230 },
      { attributes: { "اللون": "أزرق" }, sku: "CTL-STK-BLU", price: 55, compareAtPrice: 70, stockQty: 14, weightGrams: 230 },
    ],
    attributes: [
      { attributeKey: "brand", valueText: "SOOQ Titan" },
      { attributeKey: "warranty_years", valueText: "1" },
      { attributeKey: "supports_bluetooth", valueText: "true" },
      { attributeKey: "connectivity", optionKeys: ["bluetooth", "usb-c"] },
      { attributeKey: "battery_capacity_mah", valueText: "800" },
    ],
  },

  /* ----------------------------------------------------- tech accessories */
  {
    slug: "rapid-gan-charger-65w",
    titleAr: "شاحن رابيد GaN بقدرة ٦٥ واط",
    titleEn: "Rapid GaN Charger 65W",
    descriptionAr:
      "شاحن حائط GaN بقدرة ٦٥ واط ومنفذين USB-C، يشحن اللابتوب والهاتف في آن واحد",
    descriptionEn:
      "65W GaN wall charger with dual USB-C ports — charges a laptop and phone at once",
    basePrice: 35,
    compareAtPrice: 45,
    currencyCode: "USD",
    status: "ACTIVE",
    seoTitle: "Rapid GaN Charger 65W",
    seoDescription: "65W dual USB-C GaN wall charger",
    categorySlugs: ["chargers-cables", "tech-accessories"],
    defaultCategorySlug: "chargers-cables",
    tagSlugs: ["fast-charging", "best-seller"],
    attributes: [
      { attributeKey: "brand", valueText: "SOOQ Power" },
      { attributeKey: "warranty_years", valueText: "1" },
      { attributeKey: "connectivity", optionKeys: ["usb-c"] },
    ],
  },
  {
    slug: "vault-portable-ssd-1tb",
    titleAr: "قرص فولت المحمول ١ تيرابايت",
    titleEn: "Vault Portable SSD",
    descriptionAr:
      "قرص تخزين SSD محمول بسرعة نقل عالية وهيكل مقاوم للصدمات، متوافق مع الحاسوب والهاتف",
    descriptionEn:
      "Shock-resistant portable SSD with high transfer speeds, works with computers and phones",
    basePrice: 95,
    compareAtPrice: 120,
    currencyCode: "USD",
    status: "ACTIVE",
    seoTitle: "Vault Portable SSD",
    seoDescription: "Shock-resistant portable SSD drive",
    categorySlugs: ["storage-devices", "tech-accessories"],
    defaultCategorySlug: "storage-devices",
    tagSlugs: ["best-seller", "free-shipping"],
    options: [
      {
        optionNameAr: "السعة",
        optionNameEn: "Capacity",
        values: [
          { valueAr: "٥١٢ جيجابايت", valueEn: "512GB" },
          { valueAr: "١ تيرابايت", valueEn: "1TB" },
          { valueAr: "٢ تيرابايت", valueEn: "2TB" },
        ],
      },
    ],
    variants: [
      { attributes: { "السعة": "٥١٢ جيجابايت" }, sku: "SSD-VLT-512", price: 65, compareAtPrice: 85, stockQty: 18, weightGrams: 55 },
      { attributes: { "السعة": "١ تيرابايت" }, sku: "SSD-VLT-1TB", price: 95, compareAtPrice: 120, stockQty: 12, weightGrams: 55 },
      { attributes: { "السعة": "٢ تيرابايت" }, sku: "SSD-VLT-2TB", price: 165, compareAtPrice: 210, stockQty: 7, weightGrams: 55 },
    ],
    attributes: [
      { attributeKey: "brand", valueText: "SOOQ Power" },
      { attributeKey: "warranty_years", valueText: "3" },
      { attributeKey: "storage_gb", optionKeys: ["512gb", "1tb", "2tb"] },
      { attributeKey: "connectivity", optionKeys: ["usb-c"] },
    ],
  },
  {
    slug: "mech-rgb-keyboard",
    titleAr: "لوحة مفاتيح ميكانيكية RGB",
    titleEn: "Mech RGB Keyboard",
    descriptionAr:
      "لوحة مفاتيح ميكانيكية بإضاءة RGB قابلة للتخصيص ومفاتيح قابلة للاستبدال السريع",
    descriptionEn:
      "Mechanical keyboard with customizable RGB lighting and hot-swappable switches",
    basePrice: 110,
    compareAtPrice: 140,
    currencyCode: "USD",
    status: "ACTIVE",
    seoTitle: "Mech RGB Keyboard",
    seoDescription: "Mechanical hot-swappable RGB keyboard",
    categorySlugs: ["keyboards-mice", "tech-accessories"],
    defaultCategorySlug: "keyboards-mice",
    tagSlugs: ["rgb-lighting", "new-arrival"],
    attributes: [
      { attributeKey: "brand", valueText: "SOOQ Titan" },
      { attributeKey: "warranty_years", valueText: "2" },
      { attributeKey: "connectivity", optionKeys: ["usb-c"] },
      { attributeKey: "key_switch_type", optionKeys: ["mechanical-red"] },
    ],
  },
  {
    slug: "precision-wireless-mouse",
    titleAr: "فأرة برسيجن اللاسلكية",
    titleEn: "Precision Wireless Mouse",
    descriptionAr:
      "فأرة لاسلكية بدقة تتبع عالية وتصميم مريح، تدعم عدة أجهزة متصلة في آن واحد",
    descriptionEn:
      "High-precision wireless mouse with an ergonomic shape and multi-device pairing",
    basePrice: 45,
    compareAtPrice: 60,
    currencyCode: "USD",
    status: "ACTIVE",
    seoTitle: "Precision Wireless Mouse",
    seoDescription: "High-precision multi-device wireless mouse",
    categorySlugs: ["keyboards-mice", "tech-accessories"],
    defaultCategorySlug: "keyboards-mice",
    tagSlugs: ["wireless", "on-sale"],
    attributes: [
      { attributeKey: "brand", valueText: "SOOQ Titan" },
      { attributeKey: "warranty_years", valueText: "1" },
      { attributeKey: "supports_bluetooth", valueText: "true" },
      { attributeKey: "connectivity", optionKeys: ["bluetooth", "usb-c"] },
      { attributeKey: "dpi", valueText: "16000" },
    ],
  },

  /* ------------------------------------------------------------ smart home */
  {
    slug: "glow-smart-bulb-pack",
    titleAr: "طقم لمبات غلو الذكية",
    titleEn: "Glow Smart Bulb Pack",
    descriptionAr:
      "طقم من أربع لمبات ذكية قابلة للتحكم عبر التطبيق أو المساعد الصوتي، تدعم ملايين الألوان",
    descriptionEn:
      "Pack of four app/voice-controlled smart bulbs supporting millions of colors",
    basePrice: 48,
    compareAtPrice: 65,
    currencyCode: "USD",
    status: "ACTIVE",
    seoTitle: "Glow Smart Bulb Pack",
    seoDescription: "Pack of four color-changing smart bulbs",
    categorySlugs: ["smart-home"],
    defaultCategorySlug: "smart-home",
    tagSlugs: ["energy-efficient", "new-arrival"],
    attributes: [
      { attributeKey: "brand", valueText: "SOOQ Home" },
      { attributeKey: "warranty_years", valueText: "1" },
      { attributeKey: "connectivity", optionKeys: ["wifi"] },
    ],
  },

  /* --------------------------------------------------------------- camera */
  {
    slug: "skyview-drone-4k",
    titleAr: "طائرة سكاي فيو المسيّرة ٤ كي",
    titleEn: "SkyView 4K Drone",
    descriptionAr:
      "طائرة مسيّرة بكاميرا ٤ كي مثبتة وزمن طيران يصل إلى ٣٠ دقيقة، تدعم أوضاع طيران ذكية",
    descriptionEn:
      "4K stabilized-camera drone with up to 30 minutes of flight time and smart flight modes",
    basePrice: 480,
    compareAtPrice: 580,
    currencyCode: "USD",
    status: "ACTIVE",
    seoTitle: "SkyView 4K Drone",
    seoDescription: "4K camera drone with 30-minute flight time",
    categorySlugs: ["cameras-photography"],
    defaultCategorySlug: "cameras-photography",
    tagSlugs: ["new-arrival", "featured", "limited"],
    attributes: [
      { attributeKey: "brand", valueText: "SOOQ Vision" },
      { attributeKey: "warranty_years", valueText: "1" },
      { attributeKey: "connectivity", optionKeys: ["wifi"] },
      { attributeKey: "battery_capacity_mah", valueText: "5000" },
      { attributeKey: "camera_mp", valueText: "48" },
    ],
  },
]

export const TECH_SEED_COLLECTIONS: SeedCollectionDef[] = [
  {
    slug: "starter-workstation",
    name: "محطة العمل الأساسية",
    type: "MANUAL",
    descriptionAr: "كل ما يلزم لإعداد محطة عمل متكاملة",
    descriptionEn: "Everything needed for a complete workstation setup",
    productSlugs: [
      "quantum-ultrabook-14",
      "mech-rgb-keyboard",
      "precision-wireless-mouse",
      "ultra-4k-32-monitor",
    ],
  },
  {
    slug: "mobile-essentials",
    name: "أساسيات التنقل",
    type: "MANUAL",
    descriptionAr: "أجهزة محمولة وملحقاتها للاستخدام اليومي",
    descriptionEn: "Mobile devices and accessories for everyday use",
    productSlugs: [
      "nova-x-smartphone",
      "pulse-smartwatch",
      "echo-wireless-earbuds",
    ],
  },
  {
    slug: "gamers-corner",
    name: "ركن اللاعبين",
    type: "MANUAL",
    descriptionAr: "أجهزة وملحقات مخصصة لعشاق الألعاب",
    descriptionEn: "Gear picked for gaming enthusiasts",
    productSlugs: [
      "titan-gaming-laptop-17",
      "playmax-console-x",
      "strike-wireless-controller",
      "curve-view-27-monitor",
    ],
  },
  {
    slug: "smart-living-tech",
    name: "منزل ذكي متصل",
    type: "MANUAL",
    descriptionAr: "أجهزة ذكية لتحويل منزلك إلى بيئة متصلة",
    descriptionEn: "Smart devices for a connected home",
    productSlugs: ["glow-smart-bulb-pack", "voice-hub-smart-speaker"],
  },
  {
    slug: "on-sale-tech",
    name: "عروض التقنية",
    type: "AUTOMATED",
    descriptionAr: "كل منتجات التقنية المخفضة الآن",
    descriptionEn: "All tech products currently on sale",
    rules: [
      { fieldKey: "tag", operator: "equals", value: "on-sale", logicGroup: "AND" },
    ],
  },
  {
    slug: "wireless-tech",
    name: "أجهزة لاسلكية",
    type: "AUTOMATED",
    descriptionAr: "منتجات تعمل بتقنية لاسلكية",
    descriptionEn: "Products built around wireless connectivity",
    rules: [
      { fieldKey: "tag", operator: "equals", value: "wireless", logicGroup: "AND" },
    ],
  },
]

export const TECH_SEED_DATASET: SeedDataset = {
  categories: TECH_SEED_CATEGORIES,
  tags: TECH_SEED_TAGS,
  attributes: TECH_SEED_ATTRIBUTES,
  products: TECH_SEED_PRODUCTS,
  collections: TECH_SEED_COLLECTIONS,
  imageConfig: TECH_SEED_IMAGE_CONFIG,
}
