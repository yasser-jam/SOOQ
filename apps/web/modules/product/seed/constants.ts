/**
 * Categories / tags already present in the store (from merchant setup).
 * Used as a fallback when slug matching finds a typo variant in the API.
 */
export const KNOWN_CATEGORY_IDS: Record<string, string> = {
  groceries: "a541c963-ae14-4af6-95f8-8a13596ee90d",
  "kitchen-accessories": "68dac72d-8ed9-4368-a57f-d7259b63d711",
}

export const KNOWN_TAG_IDS: Record<string, string> = {
  "household-essentials": "a3ddfad6-b118-4ec6-a99d-ff0a2d33923d",
  "kitchen-appliances": "87e7ac73-1236-4af8-a9dd-d375f62d3ee7",
}

/** Slug aliases so typos in existing data still resolve. */
export const CATEGORY_SLUG_ALIASES: Record<string, string[]> = {
  groceries: ["groceries", "grocceries"],
  "kitchen-accessories": ["kitchen-accessories", "kitechen-accessories"],
  "home-decoration": ["home-decoration", "home-decor"],
}

export const CATEGORY_META: Record<
  string,
  {
    nameAr: string
    nameEn: string
    descriptionAr: string
    descriptionEn: string
  }
> = {
  groceries: {
    nameAr: "بقالة",
    nameEn: "Groceries",
    descriptionAr: "منتجات غذائية وبقالة",
    descriptionEn: "Food and grocery products",
  },
  "kitchen-accessories": {
    nameAr: "مستلزمات المطبخ",
    nameEn: "Kitchen Accessories",
    descriptionAr: "أدوات ومستلزمات المطبخ",
    descriptionEn: "Kitchen tools and accessories",
  },
  "home-decoration": {
    nameAr: "ديكور منزلي",
    nameEn: "Home Decoration",
    descriptionAr: "منتجات ديكور وتزيين المنزل",
    descriptionEn: "Home decoration products",
  },
}
