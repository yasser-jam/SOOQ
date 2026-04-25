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
})
