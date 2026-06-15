"use client"

import { useQuery } from "@tanstack/react-query"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Field as UiField,
  FieldError,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import * as React from "react"
import { Controller, useFormContext } from "react-hook-form"

import {
  CurrencyButtonGroup,
  type CurrencyCode,
} from "@/components/onboarding/currency-button-group"

import { checkStoreSlug } from "../actions"
import type { AllSettingsInput, StoreSettingsResponseDto } from "../types"

const SLUG_DEBOUNCE_MS = 400
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export default function IdentityTab({
  settings,
}: {
  settings: StoreSettingsResponseDto
}) {
  const form = useFormContext<AllSettingsInput>()

  const slug = form.watch("slug")
  const primaryCurrencyCode = form.watch("primaryCurrencyCode") as CurrencyCode

  const initialSlug = settings.slug ?? ""

  // ── Slug live availability ─────────────────────────────────────────────
  const [debouncedSlug, setDebouncedSlug] = React.useState(initialSlug)
  React.useEffect(() => {
    const trimmed = (slug ?? "").trim()
    const handle = window.setTimeout(() => {
      setDebouncedSlug(trimmed)
    }, SLUG_DEBOUNCE_MS)
    return () => window.clearTimeout(handle)
  }, [slug])

  const slugUnchanged = debouncedSlug === initialSlug
  const slugLocallyValid = SLUG_REGEX.test(debouncedSlug)

  const slugAvailabilityQuery = useQuery({
    queryKey: ["store-slug-availability", debouncedSlug],
    queryFn: () => checkStoreSlug(debouncedSlug),
    enabled: slugLocallyValid && !slugUnchanged,
    staleTime: 15_000,
  })

  const slugTrimmed = (slug ?? "").trim()
  const slugChanged = slugTrimmed !== initialSlug
  const showSlugStatus =
    slugChanged && slugLocallyValid && debouncedSlug === slugTrimmed

  return (
    <Card className="rounded-2xl border-gray-200/50 shadow-sm bg-white">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-[#1e3a47]">هوية المتجر</CardTitle>
        <CardDescription className="text-sm text-gray-600 font-medium">
          الاسم العام، الرابط (Slug) الذي يظهر في عنوان المتجر، والعملة
          الأساسية. تغيير الرابط يؤثر على روابط متجرك القائمة.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-6">
        {settings.isConfigured === false && (
          <Alert>
            <AlertCircle className="size-4" />
            <AlertDescription>
              لم يتم تفعيل متجرك بعد. أكمل هذه الحقول لتفعيله.
            </AlertDescription>
          </Alert>
        )}

        <UiField data-invalid={Boolean(form.formState.errors.storeName)}>
          <FieldLabel htmlFor="storeName">اسم المتجر</FieldLabel>
          <Controller
            name="storeName"
            control={form.control}
            render={({ field }) => (
              <Input
                {...field}
                value={field.value ?? ""}
                id="storeName"
                placeholder="متجر الكرمة"
              />
            )}
          />
          <FieldError errors={[form.formState.errors.storeName]} />
        </UiField>

        <UiField data-invalid={Boolean(form.formState.errors.slug)}>
          <FieldLabel htmlFor="slug">رابط المتجر</FieldLabel>
          <Controller
            name="slug"
            control={form.control}
            render={({ field }) => (
              <Input
                {...field}
                value={field.value ?? ""}
                id="slug"
                placeholder="al-karma-store"
                dir="ltr"
              />
            )}
          />
          <p className="text-xs text-muted-foreground">
            أحرف لاتينية صغيرة، أرقام، وشرطات فقط — يظهر في عنوان متجرك.
          </p>

          {showSlugStatus && (
            <div className="mt-1 flex items-center gap-2 text-xs">
              {slugAvailabilityQuery.isFetching ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span className="text-muted-foreground">
                    جاري التحقق من توفّر الرابط…
                  </span>
                </>
              ) : slugAvailabilityQuery.data ? (
                slugAvailabilityQuery.data.available ? (
                  <>
                    <CheckCircle2 className="size-3.5 text-emerald-600" />
                    <span className="text-emerald-600">الرابط متاح</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="size-3.5 text-destructive" />
                    <span className="text-destructive">الرابط محجوز</span>
                  </>
                )
              ) : null}
            </div>
          )}

          <FieldError errors={[form.formState.errors.slug]} />
        </UiField>

        <UiField
          data-invalid={Boolean(form.formState.errors.primaryCurrencyCode)}
        >
          <FieldLabel>العملة الأساسية</FieldLabel>
          <CurrencyButtonGroup
            value={primaryCurrencyCode}
            onValueChange={(v) =>
              form.setValue("primaryCurrencyCode", v, {
                shouldValidate: true,
                shouldDirty: true,
              })
            }
          />
          <FieldError
            errors={[form.formState.errors.primaryCurrencyCode]}
          />
        </UiField>
      </CardContent>
    </Card>
  )
}
