"use client"

import { TECH_SEED_DATASET } from "@/modules/product/seed/tech-dataset"
import { SeedDatasetCard } from "@/modules/product/seed/seed-dataset-card"

export function SeedTechButton() {
  return (
    <SeedDatasetCard
      dataset={TECH_SEED_DATASET}
      title="تهيئة بيانات تقنية"
      description="كتالوج تقنية كامل (حواسيب، هواتف، صوتيات، ألعاب، ملحقات، منزل ذكي)."
      actionLabel="إنشاء منتجات التقنية"
    />
  )
}
