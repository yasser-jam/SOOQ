import { ProductCategory } from "../types";

export const init = (category?: ProductCategory) : ProductCategory => ({
  nameAr: category?.nameAr || '',
  nameEn: category?.nameEn || '',
  slug: category?.slug || '',
  parentCategoryId: category?.parentCategoryId || null,
  sortOrder: category?.sortOrder || 0,
  descriptionAr: category?.descriptionAr || '',
  descriptionEn: category?.descriptionEn || '',
  isActive: category?.isActive ?? true,
  // Phase 5 (PRD): "__none__" = "بدون قالب" sentinel for the Select
  // (Radix SelectItem disallows empty-string values). Stripped to undefined
  // in initCategoryPayload before sending.
  templateKey: '__none__',
})
