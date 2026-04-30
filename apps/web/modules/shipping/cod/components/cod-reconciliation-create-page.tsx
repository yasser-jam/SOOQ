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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  Field as UiField,
  FieldError,
  FieldLabel,
} from "@workspace/ui/components/field"

import { listShippingProviders } from "../../provider/actions"
import { shippingProviderQueryKeys } from "../../provider/queryKeys"
import { createCodReconciliationBatch } from "../actions"
import { createCodReconciliationBatchSchema } from "../schema"
import { codReconciliationQueryKeys } from "../queryKeys"

type CreateFormValues = {
  shippingProviderId: string
  providerFeePercentage: number
  settlementDate: string
  notes?: string
}

export default function CodReconciliationCreatePageView() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const form = useForm<CreateFormValues>({
    resolver: zodResolver(createCodReconciliationBatchSchema),
    defaultValues: {
      shippingProviderId: "",
      providerFeePercentage: 5,
      settlementDate: new Date().toISOString().slice(0, 10),
      notes: "",
    },
  })

  useEffect(() => {
    form.reset({
      shippingProviderId: "",
      providerFeePercentage: 5,
      settlementDate: new Date().toISOString().slice(0, 10),
      notes: "",
    })
  }, [form])

  const { data: providers, isLoading: isProvidersLoading } = useQuery({
    queryKey: shippingProviderQueryKeys.all,
    queryFn: listShippingProviders,
  })

  const { mutate: create, isPending: isCreating } = useMutation({
    mutationFn: createCodReconciliationBatch,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: codReconciliationQueryKeys.all })
      router.push("/finance/shipping/cod-reconciliation")
    },
  })

  const isSubmitting = isProvidersLoading || isCreating

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

          <Button type="submit" form="cod-reconciliation-form" disabled={isSubmitting}>
            إنشاء
          </Button>
        </>
      }
    >
      <form
        id="cod-reconciliation-form"
        className="grid gap-4"
        onSubmit={form.handleSubmit((values) => create(values))}
      >
        <Controller
          name="shippingProviderId"
          control={form.control}
          render={({ field, fieldState }) => (
            <UiField data-invalid={fieldState.invalid}>
              <FieldLabel>مزود الشحن</FieldLabel>
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر مزود الشحن" />
                </SelectTrigger>
                <SelectContent>
                  {(providers ?? []).map((p) => (
                    <SelectItem key={p.id} value={p.id ?? ""}>
                      {p.providerName ?? p.providerCode ?? "-"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError errors={[fieldState.error]} />
            </UiField>
          )}
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
