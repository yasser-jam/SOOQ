"use client"

import { FURNITURE_SEED_DATASET } from "@/modules/product/seed/furniture-dataset"
import { SeedDatasetCard } from "@/modules/product/seed/seed-dataset-card"

/** Products-only re-run for a store that already has the furniture taxonomy. */
export function SeedFurnitureProductsButton() {
  return (
    <SeedDatasetCard
      dataset={FURNITURE_SEED_DATASET}
      productsOnly
      title="إضافة منتجات الأثاث فقط"
      description="لمتجر تم تهيئة فئاته ووسومه وسماته مسبقاً."
      actionLabel="إضافة المنتجات مع الصور"
    />
  )
}
