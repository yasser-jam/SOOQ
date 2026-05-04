"use client"

import { useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"

import PageDialog from "@/components/system/page-dialog"
import Field from "@/components/system/Field"
import TextareaField from "@/components/system/textarea"
import { Button } from "@workspace/ui/components/button"
import { DialogClose } from "@workspace/ui/components/dialog"

import { createCodReconciliationBatch } from "../actions"
import { createCodReconciliationBatchSchema } from "../schema"
import { codReconciliationQueryKeys } from "../queryKeys"
import ShippingProviderSelect from "../../provider/components/select"
import { initCodReconciliationBatch } from "../init"
import { CreateCodReconciliationBatchPayload } from "../types"

export default function CodReconciliationCreatePageView() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const form = useForm<CreateCodReconciliationBatchPayload>({
    resolver: zodResolver(createCodReconciliationBatchSchema),
    defaultValues: initCodReconciliationBatch(),
  })

  useEffect(() => {
    form.reset(initCodReconciliationBatch())
  }, [form])

  const { mutate: create, isPending: isCreating } = useMutation({
    mutationFn: createCodReconciliationBatch,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: codReconciliationQueryKeys.all,
      })
      router.push("/finance/shipping/cod-reconciliation")
    },
  })

  const isSubmitting = isCreating

  return (
    <PageDialog
      open
      onOpenChange={(open) => {
        if (!open) router.back()
      }}
      size="sm"
      title="إنشاء دفعة تسوية"
      actions={
        <>
          <DialogClose asChild>
            <Button variant="outline">إلغاء</Button>
          </DialogClose>

          <Button
            type="submit"
            form="cod-reconciliation-form"
            disabled={isSubmitting}
          >
            إنشاء
          </Button>
        </>
      }
    >
      <form
        id="cod-reconciliation-form"
        className="grid gap-4"
        // onSubmit={form.handleSubmit((values) => create(values))}
      >
        <Field
          name="shippingProviderId"
          control={form.control}
          label="نسبة عمولة المزود (%)"
          placeholder="5"
          inputProps={{ disabled: isSubmitting, type: "number", step: "0.01" }}
        />

        <Field
          name="providerFeePercentage"
          control={form.control}
          label="نسبة عمولة المزود (%)"
          placeholder="5"
          inputProps={{ disabled: isSubmitting, type: "number", step: "0.01" }}
        />

        <Field
          name="settlementDate"
          control={form.control}
          label="تاريخ التسوية"
          inputProps={{ disabled: isSubmitting, type: "date", dir: "ltr" }}
        />

        <TextareaField
          name="notes"
          control={form.control}
          label="ملاحظات"
          placeholder="(اختياري)"
          textareaProps={{ disabled: isSubmitting }}
        />
      </form>
    </PageDialog>
  )
}
