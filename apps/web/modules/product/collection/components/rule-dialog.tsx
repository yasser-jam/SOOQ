"use client"

import { useCallback } from "react"
import { useForm } from "react-hook-form"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import PageDialog from "@/components/system/page-dialog"
import Field from "@/components/system/Field"
import { Button } from "@workspace/ui/components/button"
import { DialogClose } from "@workspace/ui/components/dialog"

import { addCollectionRule } from "../actions"
import { collectionQueryKeys } from "../queryKeys"
import type { CollectionRule } from "../types"

type Props = {
  collectionId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function RuleDialog({ collectionId, open, onOpenChange }: Props) {
  const queryClient = useQueryClient()

  const form = useForm<CollectionRule>({
    defaultValues: { fieldKey: "tag", operator: "equals", value: "", logicGroup: "AND" },
  })

  const { isPending, mutate } = useMutation({
    mutationFn: (data: CollectionRule) => addCollectionRule({ id: collectionId, data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: collectionQueryKeys.rules(collectionId) })
      onOpenChange(false)
    },
  })

  const handleSubmit = useCallback((values: CollectionRule) => {
    mutate(values)
  }, [mutate])

  return (
    <PageDialog
      open={open}
      onOpenChange={onOpenChange}
      size="sm"
      title="إضافة قاعدة مجموعة"
      actions={
        <>
          <DialogClose asChild>
            <Button variant="outline">إلغاء</Button>
          </DialogClose>
          <Button type="submit" form="rule-form" disabled={isPending}>حفظ</Button>
        </>
      }
    >
      <form id="rule-form" className="grid gap-4" onSubmit={form.handleSubmit(handleSubmit)}>
        <Field name="fieldKey" control={form.control} label="حقل" placeholder="fieldKey" />
        <Field name="operator" control={form.control} label="المعامل" placeholder="operator" />
        <Field name="value" control={form.control} label="القيمة" placeholder="value" />
        <Field name="logicGroup" control={form.control} label="مجموعة المنطق" placeholder="AND|OR" />
      </form>
    </PageDialog>
  )
}
