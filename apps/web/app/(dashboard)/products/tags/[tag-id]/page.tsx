"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import PageDialog from "@/components/system/page-dialog"
import Field from "@/components/system/Field"
import { Button } from "@workspace/ui/components/button"
import { DialogClose } from "@workspace/ui/components/dialog"
import {
  createProductTag,
  getProductTagQueryOptions,
  productTagKeys,
  updateProductTag,
} from "@/modules/product/tag/actions"
import { initTag } from "@/modules/product/tag/init"
import { productTagSchema } from "@/modules/product/tag/schema"

const tagFormSchema = productTagSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

type TagFormValues = z.infer<typeof tagFormSchema>

export default function EditTagPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const params = useParams()
  const tagId = params?.["tag-id"]?.toString() ?? ""
  const isEdit = tagId !== "create"

  const form = useForm<TagFormValues>({
    resolver: zodResolver(tagFormSchema),
    defaultValues: {
      tagName: "",
      slug: "",
    },
  })

  const { data: tag, isLoading } = useQuery({
    ...getProductTagQueryOptions(tagId),
    enabled: isEdit,
  })

  React.useEffect(() => {
    if (!isEdit) {
      form.reset({
        tagName: "",
        slug: "",
      })

      return
    }

    if (!tag) return

    console.log('tet', tag)
    form.reset({
      tagName: tag.tagName,
      slug: tag.slug,
    })
  }, [form, isEdit, tag])

  const { isPending: isUpdating, mutate: updateTag } = useMutation({
    mutationFn: updateProductTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productTagKeys.all })
      router.push('/products/tags')
    },
  })

  const { isPending: isCreating, mutate: createTag } = useMutation({
    mutationFn: createProductTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productTagKeys.all })
      router.push('/products/tags')
    },
  })

  const handleSubmit = React.useCallback(
    (values: TagFormValues) => {
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
        if (!open) {
          router.back()
        }
      }}
      size="sm"
      title={isEdit ? "تعديل الوسم" : "إضافة وسم"}
      actions={
        <>
          <DialogClose asChild>
            <Button variant="outline">إلغاء</Button>
          </DialogClose>

          <Button type="submit" form="tag-form" disabled={isSubmitting}>
            حفظ
          </Button>
        </>
      }
    >
      <form id="tag-form" className="grid gap-4" onSubmit={form.handleSubmit(handleSubmit)}>
        <Field<TagFormValues>
          name="tagName"
          control={form.control}
          label="الاسم"
          placeholder="أدخل الاسم"
          inputProps={{ disabled: isSubmitting }}
        />

        <Field<TagFormValues>
          name="slug"
          control={form.control}
          label="الرابط"
          placeholder="أدخل الرابط"
          inputProps={{ disabled: isSubmitting }}
        />
      </form>
    </PageDialog>
  )
}
