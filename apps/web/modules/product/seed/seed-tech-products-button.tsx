"use client"

import { TECH_SEED_DATASET } from "@/modules/product/seed/tech-dataset"
import { SeedDatasetCard } from "@/modules/product/seed/seed-dataset-card"

/** Products-only re-run for a store that already has the tech taxonomy. */
export function SeedTechProductsButton() {
  return (
    <SeedDatasetCard
      dataset={TECH_SEED_DATASET}
      productsOnly
      title="إضافة منتجات التقنية فقط"
      description="لمتجر تم تهيئة فئاته ووسومه وسماته مسبقاً."
      actionLabel="إضافة المنتجات مع الصور"
    />
  )
}
