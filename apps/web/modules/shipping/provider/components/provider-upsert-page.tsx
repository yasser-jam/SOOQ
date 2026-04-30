"use client"

import { useCallback, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"

import PageDialog from "@/components/system/page-dialog"
import Field from "@/components/system/Field"
import { Button } from "@workspace/ui/components/button"
import { DialogClose } from "@workspace/ui/components/dialog"

import { shippingProviderSchema } from "../schema"
import type { ShippingProvider, ShippingProviderUpsertPayload } from "../types"
import {
  createShippingProvider,
  getShippingProvider,
  updateShippingProvider,
} from "../actions"
import { shippingProviderQueryKeys } from "../queryKeys"
import { initShippingProviderUpdate } from "../init"

const providerFormSchema = shippingProviderSchema.omit({
  id: true,
  hasApiKey: true,
  hasWebhookSecret: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
})

export default function ShippingProviderUpsertPageView({
  providerId,
}: {
  providerId: string
}) {
  const router = useRouter()
  const queryClient = useQueryClient()

  const isEdit = providerId !== "create"

  const form = useForm<ShippingProvider>({
    resolver: zodResolver(providerFormSchema),
    defaultValues: {
      providerCode: "",
      providerName: "",
      apiBaseUrl: "",
      apiKey: "",
      webhookSecret: "",
      priority: 10,
    },
  })

  const { data: provider, isLoading } = useQuery({
    queryKey: shippingProviderQueryKeys.detail(providerId),
    queryFn: () => getShippingProvider(providerId),
    enabled: isEdit,
  })

  useEffect(() => {
    if (!isEdit) {
      form.reset({
        providerCode: "",
        providerName: "",
        apiBaseUrl: "",
        apiKey: "",
        webhookSecret: "",
        priority: 10,
      })
      return
    }

    form.reset({
      providerCode: provider?.providerCode ?? "",
      providerName: provider?.providerName ?? "",
      apiBaseUrl: provider?.apiBaseUrl ?? "",
      apiKey: "",
      webhookSecret: "",
      priority: provider?.priority ?? 10,
    })
  }, [form, isEdit, provider])

  const { isPending: isCreating, mutate: create } = useMutation({
    mutationFn: createShippingProvider,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: shippingProviderQueryKeys.all })
      router.push("/logistics/shipping/providers")
    },
  })

  const { isPending: isUpdating, mutate: update } = useMutation({
    mutationFn: updateShippingProvider,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: shippingProviderQueryKeys.all })
      await queryClient.invalidateQueries({
        queryKey: shippingProviderQueryKeys.detail(providerId),
      })
      router.push("/logistics/shipping/providers")
    },
  })

  const handleSubmit = useCallback(
    (values: ShippingProvider) => {
      const payload: ShippingProviderUpsertPayload = {
        providerCode: values.providerCode,
        providerName: values.providerName,
        apiBaseUrl: values.apiBaseUrl,
        apiKey: values.apiKey,
        webhookSecret: values.webhookSecret,
        priority: values.priority,
      }

      if (isEdit) {
        update(initShippingProviderUpdate(providerId, { ...values, ...payload }))
        return
      }

      create(payload)
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

          <Button type="submit" form="shipping-provider-form" disabled={isSubmitting}>
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
          inputProps={{ disabled: isSubmitting }}
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
          label="الأولوية"
          placeholder="10"
          inputProps={{ disabled: isSubmitting, type: "number" }}
        />

        <Field
          name="apiKey"
          control={form.control}
          label="API Key"
          placeholder="(اختياري)"
          inputProps={{ disabled: isSubmitting, dir: "ltr" }}
        />

        <Field
          name="webhookSecret"
          control={form.control}
          label="Webhook Secret"
          placeholder="(اختياري)"
          inputProps={{ disabled: isSubmitting, dir: "ltr" }}
        />
      </form>
    </PageDialog>
  )
}
