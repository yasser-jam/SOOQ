"use client"

import { SEED_DATASET } from "@/modules/product/seed/dataset"
import { SeedDatasetCard } from "@/modules/product/seed/seed-dataset-card"

export function SeedProductsButton() {
  return (
    <SeedDatasetCard
      dataset={SEED_DATASET}
      title="تهيئة بيانات تجريبية"
      actionLabel="إنشاء المنتجات"
    />
  )
}
