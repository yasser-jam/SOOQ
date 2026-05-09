"use client"

import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@workspace/ui/components/button"

import AttributeTable from "@/modules/product/attribute/components/table"

export default function ProductAttributesPage() {
  const router = useRouter()

  return (
    <div className="container">
      <div className="my-6 flex justify-between">
        <div className="flex flex-col gap-1">
          <div className="page-title">السمات المخصّصة</div>
          <p className="text-sm text-muted-foreground">
            عرّف خصائص المنتجات (لون، مادة، ضمان...) لاستخدامها في الفلاتر وسجلّ
            المنتجات.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Button
            size="md"
            variant="secondary"
            onClick={() => router.push("/products/attributes/create")}
          >
            إضافة سمة
            <Plus data-icon="inline-end" />
          </Button>
        </div>
      </div>

      <AttributeTable />
    </div>
  )
}
