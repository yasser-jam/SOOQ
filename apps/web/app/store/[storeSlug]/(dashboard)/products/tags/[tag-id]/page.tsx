"use client"

import { useCallback, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import PageDialog from "@/components/system/page-dialog"
import Field from "@/components/system/Field"
import { useStorePath } from "@/lib/store-path"
import { Button } from "@workspace/ui/components/button"
import { DialogClose } from "@workspace/ui/components/dialog"
import {
  createProductTag,
  getProductTag,
  updateProductTag,
} from "@/modules/product/tag/actions"
import { initTag } from "@/modules/product/tag/init"
import { productTagSchema } from "@/modules/product/tag/schema"
import { tagQueryKeys } from "@/modules/product/tag/queryKeys"
import { ProductTag } from "@/modules/product/tag/types"

export default function EditTagPage() {

  const router = useRouter()
  const storePath = useStorePath()
  const queryClient = useQueryClient()
  const params = useParams()
  const tagId = params?.["tag-id"]?.toString() ?? ""
  const isEdit = tagId !== "create"

  const form = useForm<ProductTag>({
    resolver: zodResolver(productTagSchema),
    defaultValues: {
      tagName: "",
      slug: "",
    },
  })

  const { data: tag, isLoading } = useQuery({
    queryKey: tagQueryKeys.detail(tagId),
    queryFn: () => getProductTag(tagId),
    enabled: isEdit,
  })

  useEffect(() => {
    if (!isEdit) {
      form.reset({
        tagName: "",
        slug: "",
      })

      return
    }

    form.reset({
      tagName: tag?.tagName,
      slug: tag?.slug,
    })
  }, [form, isEdit, tag])

  const { isPending: isUpdating, mutate: updateTag } = useMutation({
    mutationFn: updateProductTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagQueryKeys.all })
      router.push(storePath("/products/tags"))
    },
  })

  const { isPending: isCreating, mutate: createTag } = useMutation({
    mutationFn: createProductTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagQueryKeys.all })
      router.push(storePath("/products/tags"))
    },
  })

  const handleSubmit = useCallback(
    (values: ProductTag) => {
      if (isEdit) {
        if (!tagId) return

        updateTag(initTag(tagId, values))

        return
      }

      createTag(values)
    },
    [createTag, isEdit, tagId, updateTag]
  )

  const isSubmitting = isUpdating || isLoading || isCreating

  return (
    <PageDialog
      open
      onOpenChange={(open) => {
        if (!open) router.back()
      }}
      size="sm"
      title={isEdit ? "تعديل الوسم" : "إضافة وسم"}
      actions={
        <>
          <DialogClose asChild>
            <Button variant="ghost">إلغاء</Button>
          </DialogClose>

          <Button type="submit" form="tag-form" disabled={isSubmitting}>
            حفظ
          </Button>
        </>
      }
    >
      <form
        id="tag-form"
        className="grid gap-4"
        onSubmit={form.handleSubmit(handleSubmit)}
      >
        <Field
          name="tagName"
          control={form.control}
          label="الاسم"
          placeholder="مثال: عرض خاص"
          inputProps={{ disabled: isSubmitting }}
        />

        <Field
          name="slug"
          control={form.control}
          label="الرابط"
          placeholder="مثال: special-offer"
          inputProps={{ disabled: isSubmitting }}
        />
      </form>
    </PageDialog>
  )
}
