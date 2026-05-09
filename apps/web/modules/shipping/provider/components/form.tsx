"use client"

import { useCallback, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { ShieldAlert } from "lucide-react"

import PageDialog from "@/components/system/page-dialog"
import Field from "@/components/system/Field"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { DialogClose } from "@workspace/ui/components/dialog"
import { Label } from "@workspace/ui/components/label"

import { shippingProviderSchema } from "../schema"
import type { ShippingProvider } from "../types"
import {
  createShippingProvider,
  getShippingProvider,
  updateShippingProvider,
} from "../actions"
import { shippingProviderQueryKeys } from "../queryKeys"
import {
  buildCreateShippingProviderPayload,
  buildUpdateShippingProviderPayload,
  initShippingProviderFormValues,
  initShippingProviderUpdate,
  shippingProviderFormDefaults,
} from "../init"

export default function ShippingProviderUpsertPageView({
  providerId,
}: {
  providerId: string
}) {
  const router = useRouter()
  const queryClient = useQueryClient()

  const isEdit = providerId !== "create"

  const form = useForm<ShippingProvider>({
    resolver: zodResolver(shippingProviderSchema) as never,
    defaultValues: shippingProviderFormDefaults,
  })

  const { data: provider, isLoading } = useQuery({
    queryKey: shippingProviderQueryKeys.detail(providerId),
    queryFn: () => getShippingProvider(providerId),
    enabled: isEdit,
  })

  useEffect(() => {
    if (!isEdit) {
      form.reset(shippingProviderFormDefaults)
      return
    }

    if (!provider) return

    form.reset(initShippingProviderFormValues(provider))
  }, [form, isEdit, provider])

  const { isPending: isCreating, mutate: create } = useMutation({
    mutationFn: createShippingProvider,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: shippingProviderQueryKeys.all,
      })
      router.push("/logistics/shipping/providers")
    },
  })

  const { isPending: isUpdating, mutate: update } = useMutation({
    mutationFn: updateShippingProvider,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: shippingProviderQueryKeys.all,
      })
      router.push("/logistics/shipping/providers")
    },
  })

  const handleSubmit = useCallback(
    (values: ShippingProvider) => {
      if (isEdit) {
        update(
          initShippingProviderUpdate(
            providerId,
            buildUpdateShippingProviderPayload(values)
          )
        )
        return
      }

      create(buildCreateShippingProviderPayload(values))
    },
    [create, isEdit, providerId, update]
  )

  const isSubmitting = isLoading || isCreating || isUpdating

  return (
    <PageDialog
      open
      onOpenChange={(open) => {
        if (!open) router.back()
      }}
      size="sm"
      title={isEdit ? "تعديل مزود الشحن" : "إضافة مزود شحن"}
      actions={
        <>
          <DialogClose asChild>
            <Button variant="outline">إلغاء</Button>
          </DialogClose>

          <Button
            type="submit"
            form="shipping-provider-form"
            disabled={isSubmitting}
          >
            حفظ
          </Button>
        </>
      }
    >
      <form
        id="shipping-provider-form"
        className="grid gap-4"
        onSubmit={form.handleSubmit(handleSubmit)}
      >
        <Field
          name="providerName"
          control={form.control}
          label="الاسم"
          placeholder="مثال: دمشق إكسبريس"
          inputProps={{ disabled: isSubmitting }}
        />

        <Field
          name="providerCode"
          control={form.control}
          label="الكود"
          placeholder="مثال: DAMASCUS_EXPRESS"
          inputProps={{ disabled: isSubmitting || isEdit }}
        />

        <Field
          name="apiBaseUrl"
          control={form.control}
          label="API Base URL"
          placeholder="https://api.example.com/v1"
          inputProps={{ disabled: isSubmitting, dir: "ltr" }}
        />

        <Field
          name="priority"
          control={form.control}
          label="الأولوية (الأرقام الأعلى تأخذ الأسبقية)"
          placeholder="10"
          inputProps={{
            disabled: isSubmitting,
            type: "number",
            min: "0",
          }}
        />

        {isEdit ? (
          <Alert className="rounded-xl border-amber-200 bg-amber-50">
            <ShieldAlert className="size-5 text-amber-700" />
            <AlertTitle className="text-amber-900">
              المفاتيح السرية محفوظة
            </AlertTitle>
            <AlertDescription className="text-amber-800">
              {provider?.hasApiKey ? "API Key مُهيَّأ. " : "API Key غير مُهيَّأ. "}
              {provider?.hasWebhookSecret
                ? "Webhook Secret مُهيَّأ."
                : "Webhook Secret غير مُهيَّأ."}{" "}
              اترك الحقول فارغة للحفاظ على القيم الحالية، أو املأها لتحديثها.
            </AlertDescription>
          </Alert>
        ) : null}

        <Field
          name="apiKey"
          control={form.control}
          label="API Key"
          placeholder={isEdit ? "اتركه فارغاً للحفاظ على القيمة" : "(اختياري)"}
          inputProps={{
            disabled: isSubmitting,
            dir: "ltr",
            type: "password",
            autoComplete: "off",
          }}
        />

        <Field
          name="webhookSecret"
          control={form.control}
          label="Webhook Secret"
          placeholder={isEdit ? "اتركه فارغاً للحفاظ على القيمة" : "(اختياري)"}
          inputProps={{
            disabled: isSubmitting,
            dir: "ltr",
            type: "password",
            autoComplete: "off",
          }}
        />

        {isEdit ? (
          <Controller
            name="isActive"
            control={form.control}
            render={({ field }) => (
              <div className="flex items-center gap-3 rounded-xl border bg-card p-3">
                <Checkbox
                  id="isActive"
                  checked={Boolean(field.value)}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                  disabled={isSubmitting}
                />
                <Label htmlFor="isActive" className="cursor-pointer">
                  مزود نشط (يظهر في خيارات الشحن)
                </Label>
              </div>
            )}
          />
        ) : null}
      </form>
    </PageDialog>
  )
}
