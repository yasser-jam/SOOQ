"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Field as UiField,
  FieldError,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Textarea } from "@workspace/ui/components/textarea"
import * as React from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"

import { getUpdateStoreStatusMutationOptions } from "../actions"
import { updateStoreStatusDefaultValues } from "../init"
import { updateStoreStatusSchema } from "../schema"
import type { StoreStatus, UpdateStoreStatusInput } from "../types"

const statusOptions: Array<{ value: StoreStatus; label: string; hint: string }> = [
  { value: "ACTIVE", label: "نشط", hint: "المتجر متاح للعملاء بشكل طبيعي." },
  { value: "PAUSED", label: "متوقف مؤقتاً", hint: "المتجر يعرض رسالة الصيانة (HTTP 503)." },
  {
    value: "MAINTENANCE",
    label: "صيانة",
    hint: "المتجر تحت الصيانة (HTTP 503).",
  },
  {
    value: "PASSWORD_PROTECTED",
    label: "محمي بكلمة مرور",
    hint: "يطلب من العملاء كلمة المرور للوصول.",
  },
  { value: "CLOSED", label: "مغلق", hint: "المتجر مغلق نهائياً (HTTP 410)." },
]

type FormInput = z.input<typeof updateStoreStatusSchema>

export default function StoreStatusForm({
  tenantId,
  initialStatus,
  initialMaintenanceMessage,
}: {
  tenantId: string
  initialStatus?: StoreStatus
  initialMaintenanceMessage?: string | null
}) {
  const queryClient = useQueryClient()

  const form = useForm<FormInput>({
    resolver: zodResolver(updateStoreStatusSchema),
    defaultValues: {
      ...updateStoreStatusDefaultValues,
      status: initialStatus ?? updateStoreStatusDefaultValues.status,
      maintenanceMessage: initialMaintenanceMessage ?? "",
    },
  })

  const status = form.watch("status")
  const showMessage = status === "PAUSED" || status === "MAINTENANCE"
  const showPassword = status === "PASSWORD_PROTECTED"

  const { isPending, mutate } = useMutation({
    ...getUpdateStoreStatusMutationOptions({
      queryClient,
      onSuccess: () => {
        toast.success("تم تحديث حالة المتجر")
      },
    }),
  })

  const handleSubmit = (data: FormInput) => {
    const parsed = updateStoreStatusSchema.parse(data) as UpdateStoreStatusInput
    mutate({ tenantId, data: parsed })
  }

  const currentStatusHint = statusOptions.find((o) => o.value === status)?.hint

  return (
    <Card>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <CardHeader>
          <CardTitle>حالة المتجر</CardTitle>
          <CardDescription>
            تحكّم في توفّر المتجر للعملاء.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          <UiField data-invalid={Boolean(form.formState.errors.status)}>
            <FieldLabel htmlFor="status">الحالة</FieldLabel>
            <Controller
              name="status"
              control={form.control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="status" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {currentStatusHint && (
              <p className="text-xs text-muted-foreground">{currentStatusHint}</p>
            )}
            <FieldError errors={[form.formState.errors.status]} />
          </UiField>

          {showMessage && (
            <UiField
              data-invalid={Boolean(form.formState.errors.maintenanceMessage)}
            >
              <FieldLabel htmlFor="maintenanceMessage">
                رسالة الصيانة
              </FieldLabel>
              <Controller
                name="maintenanceMessage"
                control={form.control}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    id="maintenanceMessage"
                    placeholder="نحن نقوم بصيانة سريعة. عودوا قريباً."
                    className="min-h-24"
                  />
                )}
              />
              <FieldError errors={[form.formState.errors.maintenanceMessage]} />
            </UiField>
          )}

          {showPassword && (
            <UiField data-invalid={Boolean(form.formState.errors.storePassword)}>
              <FieldLabel htmlFor="storePassword">كلمة مرور المتجر</FieldLabel>
              <Controller
                name="storePassword"
                control={form.control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="storePassword"
                    type="password"
                    placeholder="4 أحرف على الأقل"
                  />
                )}
              />
              <FieldError errors={[form.formState.errors.storePassword]} />
            </UiField>
          )}
        </CardContent>

        <CardFooter className="justify-end">
          <Button type="submit" loading={isPending}>
            حفظ
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
