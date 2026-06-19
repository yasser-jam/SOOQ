"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import {
  Field as UiField,
  FieldError,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Textarea } from "@workspace/ui/components/textarea"
import { AlertTriangle } from "lucide-react"
import { useMemo, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"

import {
  getCancelStoreDeletionMutationOptions,
  getRequestStoreDeletionMutationOptions,
} from "../actions"
import { storeDeletionRequestSchema } from "../schema"
import type { StoreSettingsResponseDto } from "../types"
import {
  SettingsCard,
  SettingsCardContent,
  SettingsCardDescription,
  SettingsCardFooter,
  SettingsCardHeader,
  SettingsCardTitle,
} from "./SettingsCard"

type FormInput = z.input<typeof storeDeletionRequestSchema>
type FormOutput = z.output<typeof storeDeletionRequestSchema>

function daysUntil(target: string): number {
  const now = Date.now()
  const purge = new Date(target).getTime()
  return Math.max(0, Math.ceil((purge - now) / (1000 * 60 * 60 * 24)))
}

export default function DangerZoneTab({
  settings,
}: {
  settings: StoreSettingsResponseDto
}) {
  const queryClient = useQueryClient()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmName, setConfirmName] = useState("")

  const storeName =
    settings.profileNameAr || settings.profileNameEn || "المتجر"

  const form = useForm<FormInput>({
    resolver: zodResolver(storeDeletionRequestSchema),
    defaultValues: { reason: "", graceDays: 30 },
  })

  const requestMutation = useMutation({
    ...getRequestStoreDeletionMutationOptions({
      queryClient,
      onSuccess: () => {
        toast.success("تم تسجيل طلب الحذف")
        setConfirmOpen(false)
        setConfirmName("")
        form.reset({ reason: "", graceDays: 30 })
      },
    }),
  })

  const cancelMutation = useMutation({
    ...getCancelStoreDeletionMutationOptions({
      queryClient,
      onSuccess: () => {
        toast.success("تم إلغاء طلب الحذف")
      },
    }),
  })

  const remaining = useMemo(
    () =>
      settings.deletionPurgeAt ? daysUntil(settings.deletionPurgeAt) : 0,
    [settings.deletionPurgeAt]
  )

  const handleConfirmedSubmit = () => {
    const raw = form.getValues()
    const data = storeDeletionRequestSchema.parse(raw) as FormOutput
    requestMutation.mutate(data)
  }

  if (settings.deletionRequested) {
    return (
      <SettingsCard className="border-destructive/40">
        <SettingsCardHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="size-5" />
            <SettingsCardTitle>طلب حذف معلّق</SettingsCardTitle>
          </div>
          <SettingsCardDescription>
            سيُحذف المتجر نهائياً عند انتهاء مهلة السماح.
          </SettingsCardDescription>
        </SettingsCardHeader>
        <SettingsCardContent className="space-y-3">
          <Alert variant="destructive">
            <AlertDescription>
              متبقي <strong>{remaining}</strong> يوم على الحذف النهائي.
            </AlertDescription>
          </Alert>
          <div className="space-y-1 text-sm text-muted-foreground">
            {settings.deletionRequestedAt && (
              <p>
                تاريخ الطلب:{" "}
                <span dir="ltr">
                  {new Date(settings.deletionRequestedAt).toLocaleString()}
                </span>
              </p>
            )}
            {settings.deletionPurgeAt && (
              <p>
                موعد الحذف:{" "}
                <span dir="ltr">
                  {new Date(settings.deletionPurgeAt).toLocaleString()}
                </span>
              </p>
            )}
          </div>
        </SettingsCardContent>
        <SettingsCardFooter className="justify-end">
          <Button
            type="button"
            variant="outline"
            loading={cancelMutation.isPending}
            onClick={() => cancelMutation.mutate()}
          >
            إلغاء طلب الحذف
          </Button>
        </SettingsCardFooter>
      </SettingsCard>
    )
  }

  return (
    <>
      <SettingsCard className="border-destructive/40">
        <SettingsCardHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="size-5" />
            <SettingsCardTitle>حذف المتجر نهائياً</SettingsCardTitle>
          </div>
          <SettingsCardDescription>
            ستُمحى جميع بيانات المتجر بعد انتهاء مهلة السماح. هذا الإجراء لا
            يمكن التراجع عنه.
          </SettingsCardDescription>
        </SettingsCardHeader>
        <SettingsCardContent className="grid gap-4 md:grid-cols-[2fr_1fr]">
          <UiField data-invalid={Boolean(form.formState.errors.reason)}>
            <FieldLabel htmlFor="reason">سبب الحذف (اختياري)</FieldLabel>
            <Controller
              name="reason"
              control={form.control}
              render={({ field }) => (
                <Textarea
                  {...field}
                  id="reason"
                  placeholder="مثلاً: إغلاق النشاط التجاري"
                  className="min-h-20"
                />
              )}
            />
            <FieldError errors={[form.formState.errors.reason]} />
          </UiField>

          <UiField data-invalid={Boolean(form.formState.errors.graceDays)}>
            <FieldLabel htmlFor="graceDays">مهلة السماح (أيام)</FieldLabel>
            <Controller
              name="graceDays"
              control={form.control}
              render={({ field }) => (
                <Input
                  id="graceDays"
                  name={field.name}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  type="number"
                  min={1}
                  max={60}
                  value={
                    typeof field.value === "number"
                      ? field.value
                      : Number(field.value ?? 30)
                  }
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              )}
            />
            <FieldError errors={[form.formState.errors.graceDays]} />
          </UiField>
        </SettingsCardContent>
        <SettingsCardFooter className="justify-end">
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              form.trigger().then((valid) => {
                if (valid) setConfirmOpen(true)
              })
            }}
          >
            طلب الحذف
          </Button>
        </SettingsCardFooter>
      </SettingsCard>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد طلب الحذف</DialogTitle>
            <DialogDescription>
              للتأكيد، اكتب اسم المتجر:{" "}
              <strong dir="auto">{storeName}</strong>
            </DialogDescription>
          </DialogHeader>
          <UiField>
            <FieldLabel htmlFor="confirmName">اسم المتجر</FieldLabel>
            <Input
              id="confirmName"
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder={storeName}
            />
          </UiField>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmOpen(false)}
            >
              إلغاء
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={confirmName.trim() !== storeName.trim()}
              loading={requestMutation.isPending}
              onClick={handleConfirmedSubmit}
            >
              حذف نهائي
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
