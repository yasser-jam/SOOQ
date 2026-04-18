"use client"

import { useParams, useRouter } from "next/navigation"

import PageDialog from "@/components/system/page-dialog"
import { Button } from "@workspace/ui/components/button"
import { DialogClose } from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"

export default function EditTagPage() {
  const router = useRouter()
  const params = useParams()
  const tagId = params?.["tag-id"]?.toString() ?? ""

  return (
    <PageDialog
      open
      onOpenChange={(open) => {
        if (!open) {
          router.back()
        }
      }}
      size="sm"
      title="تعديل الوسم"
      actions={
        <>
          <DialogClose asChild>
            <Button variant="outline">إلغاء</Button>
          </DialogClose>
          
          <Button type="button">حفظ</Button>
        </>
      }
    >
      <div className="grid gap-4">
        <div>
          <Label htmlFor="tag-name">الاسم</Label>
          <Input id="tag-name" placeholder="أدخل الاسم" />
        </div>

        <div>
          <Label htmlFor="tag-slug">الرابط</Label>
          <Input id="tag-slug" placeholder="أدخل الرابط" />
        </div>
      </div>
    </PageDialog>
  )
}
