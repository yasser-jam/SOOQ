"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import PageDialog from "@/components/system/page-dialog"
import { Button } from "@workspace/ui/components/button"
import { DialogClose } from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  getProductTagQueryOptions,
  productTagKeys,
  updateProductTagMutationOptions,
} from "@/modules/product/tag/actions"

export default function EditTagPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const params = useParams()
  const tagId = params?.["tag-id"]?.toString() ?? ""

  const [tagName, setTagName] = React.useState("")
  const [slug, setSlug] = React.useState("")

  const { data: tag, isLoading } = useQuery({
    ...getProductTagQueryOptions(tagId),
    enabled: Boolean(tagId),
  })

  React.useEffect(() => {
    if (!tag) return
    setTagName(tag.tagName)
    setSlug(tag.slug)
  }, [tag])

  const { isPending, mutate } = useMutation({
    ...updateProductTagMutationOptions(),
    onSuccess: (updatedTag) => {
      queryClient.setQueryData(productTagKeys.detail(tagId), updatedTag)
      queryClient.invalidateQueries({ queryKey: productTagKeys.all })
      router.back()
    },
  })

  const handleSave = React.useCallback(() => {
    const cleanTagName = tagName.trim()
    const cleanSlug = slug.trim()

    if (!tagId || !cleanTagName || !cleanSlug) return

    mutate({
      id: tagId,
      data: {
        tagName: cleanTagName,
        slug: cleanSlug,
      },
    })
  }, [mutate, slug, tagId, tagName])

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

          <Button type="button" onClick={handleSave} disabled={isPending || isLoading || !tagId}>
            حفظ
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <div>
          <Label htmlFor="tag-name">الاسم</Label>
          <Input
            id="tag-name"
            placeholder="أدخل الاسم"
            value={tagName}
            onChange={(event) => setTagName(event.target.value)}
            disabled={isLoading || isPending}
          />
        </div>

        <div>
          <Label htmlFor="tag-slug">الرابط</Label>
          <Input
            id="tag-slug"
            placeholder="أدخل الرابط"
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            disabled={isLoading || isPending}
          />
        </div>
      </div>
    </PageDialog>
  )
}
