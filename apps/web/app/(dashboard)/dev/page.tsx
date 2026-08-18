"use client"

import { SeedFurnitureButton } from "@/modules/product/seed/seed-furniture-button"
import { SeedFurnitureProductsButton } from "@/modules/product/seed/seed-furniture-products-button"
import { SeedProductsButton } from "@/modules/product/seed/seed-products-button"

export default function DevPage() {
  return (
    <div className="container space-y-6 py-6">
      <header className="space-y-1">
        <h1 className="page-title mb-0">أدوات المطورين</h1>
        <p className="text-muted-foreground text-sm">
          مولّدات بيانات تجريبية لاستخدام التطوير المحلي فقط.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <SeedProductsButton />
        <SeedFurnitureButton />
        <SeedFurnitureProductsButton />
      </div>
    </div>
  )
}
