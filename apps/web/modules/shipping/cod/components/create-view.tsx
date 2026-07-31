"use client"

import { useCallback } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import DatePickerField from "@/components/system/date-picker"
import Field from "@/components/system/Field"
import PageDialog from "@/components/system/page-dialog"
import TextareaField from "@/components/system/textarea"
import { useStorePath } from "@/lib/store-path"
import { listShippingProviders } from "@/modules/shipping/provider/actions"
import { shippingProviderQueryKeys } from "@/modules/shipping/provider/queryKeys"
import { Button } from "@workspace/ui/components/button"
import { DialogClose } from "@workspace/ui/components/dialog"
import {
  Field as UiField,
  FieldError,
  FieldLabel,
} from "@workspace/ui/components/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

import { createCodReconciliationBatch } from "../actions"
import {
  buildCreateCodReconciliationBatchPayload,
  initCodReconciliationBatchFormValues,
} from "../init"
import { codReconciliationQueryKeys } from "../queryKeys"
import { createCodReconciliationBatchSchema } from "../schema"
import type { CodReconciliationBatchFormValues } from "../types"

export default function CodReconciliationCreatePageView() {
  const router = useRouter()
  const storePath = useStorePath()
  const queryClient = useQueryClient()

  const form = useForm<CodReconciliationBatchFormValues>({
    resolver: zodResolver(createCodReconciliationBatchSchema) as never,
    defaultValues: initCodReconciliationBatchFormValues(),
  })

  const { data: providers, isLoading: isProvidersLoading } = useQuery({
    queryKey: shippingProviderQueryKeys.all,
    queryFn: listShippingProviders,
  })

  const { mutate: create, isPending: isCreating } = useMutation({
    mutationFn: createCodReconciliationBatch,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: codReconciliationQueryKeys.all,
      })
      toast.success("تم إنشاء دفعة التسوية بنجاح")
      router.push(storePath("/finance/shipping/cod-reconciliation"))
    },
  })

  const handleSubmit = useCallback(
    (values: CodReconciliationBatchFormValues) => {
      create(buildCreateCodReconciliationBatchPayload(values))
    },
    [create]
  )

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
            <Button variant="ghost">إلغاء</Button>
          </DialogClose>

          <Button
            type="submit"
            form="cod-reconciliation-form"
            disabled={isSubmitting}
          >
            حفظ
          </Button>
        </>
      }
    >
      <form
        id="cod-reconciliation-form"
        className="grid gap-4"
        onSubmit={form.handleSubmit(handleSubmit)}
      >
        <Controller
          name="shippingProviderId"
          control={form.control}
          render={({ field, fieldState }) => (
            <UiField data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="shippingProviderId">مزود الشحن</FieldLabel>
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={isSubmitting}
              >
                <SelectTrigger
                  id="shippingProviderId"
                  aria-invalid={fieldState.invalid || undefined}
                >
                  <SelectValue placeholder="اختر مزود الشحن" />
                </SelectTrigger>
                <SelectContent>
                  {providers?.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id ?? ""}>
                      {provider.providerName ?? provider.providerCode ?? "-"}
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

        <DatePickerField
          name="settlementDate"
          control={form.control}
          label="تاريخ التسوية"
          placeholder="اختر تاريخ التسوية"
          disabled={isSubmitting}
          includeTime={false}
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
