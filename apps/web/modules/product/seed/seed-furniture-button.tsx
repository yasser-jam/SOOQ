"use client"

import { FURNITURE_SEED_DATASET } from "@/modules/product/seed/furniture-dataset"
import { SeedDatasetCard } from "@/modules/product/seed/seed-dataset-card"

export function SeedFurnitureButton() {
  return (
    <SeedDatasetCard
      dataset={FURNITURE_SEED_DATASET}
      title="تهيئة بيانات أثاث"
      description="كتالوج أثاث كامل (غرفة معيشة، نوم، طعام، مكتب، خارجي، تخزين)."
      actionLabel="إنشاء منتجات الأثاث"
    />
  )
}
