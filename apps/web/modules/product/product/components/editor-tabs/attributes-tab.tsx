"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Boxes } from "lucide-react"

type Props = {
  isSubmitting: boolean
}

/**
 * Attributes tab — Phase 2 placeholder. Phase 3B will fill it with:
 *  - GET /admin/product-attributes?categoryId=... (filtered by product's category)
 *  - Render appropriate input per `dataType` (TEXT/NUMBER/BOOLEAN/SELECT/MULTI_SELECT)
 *  - Bind values to ProductUpsertRequestDto.attributes[] form field
 */
export default function AttributesTab({ isSubmitting }: Props) {
  void isSubmitting

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">السمات المخصّصة</CardTitle>
        <CardDescription>
          سمات EAV تعريفها يتم في صفحة إعدادات المتجر. ستظهر هنا حسب الفئة المختارة
          للمنتج.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-12 text-center">
          <Boxes className="size-10 text-muted-foreground" />
          <p className="text-sm font-medium text-muted-foreground">
            تأتي مع المرحلة 3B
          </p>
          <p className="text-xs text-muted-foreground max-w-sm">
            سيتم إضافة محرّر قيم السمات المخصّصة هنا (Color, Material, Warranty،
            إلخ) وفق تعريفات السمات المُسجّلة لكل فئة.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
