"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
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
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar"
import {
  AlertCircle,
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircle2,
  CircleDot,
  Loader2,
} from "lucide-react"
import { useRouter } from "next/navigation"
import * as React from "react"
import { useForm } from "react-hook-form"

import Field from "@/components/system/Field"
import {
  FullPageLoader,
  SESSION_SHOW_STORE_SETUP_LOADER,
} from "@/components/full-page-loader"
import {
  CurrencyButtonGroup,
  type CurrencyCode,
} from "@/components/onboarding/currency-button-group"
import type { ApiError } from "@/lib/api"
import { refreshSession } from "@/lib/auth/internal"
import { useCurrentUser } from "@/modules/auth/auth/hooks/useCurrentUser"

import { buildStorefrontUrl } from "../storefront-url"
import { slugifyStoreName } from "../init"
import {
  checkStoreSlug,
  getUpdateStoreSettingsMutationOptions,
} from "@/modules/store/settings/actions"
import { identitySchema } from "@/modules/store/settings/schema"
import type {
  IdentitySettingsInput,
  StoreSettings,
} from "@/modules/store/settings/types"

type StepKey = "name" | "slug" | "currency" | "review"

const STEPS: Array<{ key: StepKey; label: string }> = [
  { key: "name", label: "اسم المتجر" },
  { key: "slug", label: "رابط المتجر" },
  { key: "currency", label: "العملة" },
  { key: "review", label: "مراجعة" },
]

const SLUG_DEBOUNCE_MS = 400

export default function CreateStoreFlow() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user, isAuthenticated, isLoading } = useCurrentUser()

  const [stepIndex, setStepIndex] = React.useState(0)
  const currentStep = STEPS[stepIndex]!.key
  const [submitting, setSubmitting] = React.useState(false)
  // Brief settle window after entering the review step. The "متابعة"
  // and "فعّل متجري" buttons share a DOM slot, so a double-click on
  // متابعة would otherwise land its second click on the freshly-mounted
  // submit button at the same position and silently submit the form.
  const [reviewSubmitReady, setReviewSubmitReady] = React.useState(false)
  React.useEffect(() => {
    if (currentStep !== "review") {
      setReviewSubmitReady(false)
      return
    }
    const handle = window.setTimeout(() => setReviewSubmitReady(true), 400)
    return () => window.clearTimeout(handle)
  }, [currentStep])

  const form = useForm<IdentitySettingsInput>({
    resolver: zodResolver(identitySchema),
    defaultValues: {
      storeName: "",
      slug: "",
      primaryCurrencyCode: "SYP",
    },
    mode: "onChange",
  })

  const storeName = form.watch("storeName")
  const slug = form.watch("slug")
  const primaryCurrencyCode = form.watch("primaryCurrencyCode") as CurrencyCode

  // Auto-fill slug from storeName until the user manually edits it.
  const userTouchedSlug = React.useRef(false)
  React.useEffect(() => {
    if (userTouchedSlug.current) return
    const generated = slugifyStoreName(storeName ?? "")
    if (generated !== form.getValues("slug")) {
      form.setValue("slug", generated, { shouldValidate: false })
    }
  }, [storeName, form])

  // Guard: unauthenticated visitors can't create a store. Bounce to OTP.
  React.useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) {
      router.replace("/request-otp")
    }
  }, [isAuthenticated, isLoading, router])

  // ── Slug live availability ──────────────────────────────────────────────
  // We debounce the user's slug input and only fire the query once it
  // clears the local regex check. Server-side validation runs on submit.
  const [debouncedSlug, setDebouncedSlug] = React.useState("")
  React.useEffect(() => {
    const trimmed = (slug ?? "").trim()
    const handle = window.setTimeout(() => {
      setDebouncedSlug(trimmed)
    }, SLUG_DEBOUNCE_MS)
    return () => window.clearTimeout(handle)
  }, [slug])

  const slugLocallyValid = React.useMemo(() => {
    const trimmed = (debouncedSlug ?? "").trim()
    if (!trimmed) return false
    return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(trimmed)
  }, [debouncedSlug])

  const slugAvailabilityQuery = useQuery({
    queryKey: ["store-slug-availability", debouncedSlug],
    queryFn: () => checkStoreSlug(debouncedSlug),
    enabled: slugLocallyValid && currentStep === "slug",
    staleTime: 15_000,
  })

  const saveSettingsMutation = useMutation({
    ...getUpdateStoreSettingsMutationOptions({
      queryClient,
      onSuccess: async (settings: StoreSettings) => {
        // Refresh the JWT so the new `tenantSlug` claim is in cookies
        // before we hard-navigate to the merchant dashboard. The page
        // reload below re-reads cookies + re-runs the auth context, so
        // we don't need to invalidate `authKeys.currentUser` here.
        await refreshSession().catch(() => undefined)

        if (typeof window !== "undefined") {
          sessionStorage.setItem(SESSION_SHOW_STORE_SETUP_LOADER, "1")
        }

        const targetSlug = settings.slug ?? form.getValues("slug")
        const target = buildStorefrontUrl(targetSlug)
        if (target && typeof window !== "undefined") {
          window.location.href = target
          return
        }
        router.replace("/")
      },
    }),
    onError: (error: ApiError) => {
      // Slug taken at submit time — bounce back to the slug step so the
      // user can pick another. The error toast is surfaced by the axios
      // interceptor; we add the inline form error here.
      if (error?.errorCode === "ERR_1003") {
        form.setError("slug", {
          type: "taken",
          message: "هذا الرابط محجوز، اختر رابطاً آخر",
        })
        const slugStepIndex = STEPS.findIndex((s) => s.key === "slug")
        if (slugStepIndex >= 0) setStepIndex(slugStepIndex)
      }
      setSubmitting(false)
    },
  })

  // ── Step navigation ─────────────────────────────────────────────────────

  const canAdvanceFromName = !!storeName?.trim()

  const canAdvanceFromSlug = React.useMemo(() => {
    const value = (slug ?? "").trim()
    if (!value) return false
    if (!slugLocallyValid) return false
    // If the query is in-flight we let the user wait. If it returned, we
    // only allow advance when the server says the slug is free.
    if (slugAvailabilityQuery.isFetching) return false
    if (slugAvailabilityQuery.data && !slugAvailabilityQuery.data.available) {
      return false
    }
    return true
  }, [slug, slugLocallyValid, slugAvailabilityQuery])

  const canAdvanceFromCurrency = !!primaryCurrencyCode

  const canAdvanceFromCurrentStep = () => {
    switch (currentStep) {
      case "name":
        return canAdvanceFromName
      case "slug":
        return canAdvanceFromSlug
      case "currency":
        return canAdvanceFromCurrency
      case "review":
        return true
    }
  }

  const handleNext = () => {
    if (!canAdvanceFromCurrentStep()) return
    setStepIndex((idx) => Math.min(idx + 1, STEPS.length - 1))
  }

  const handleBack = () => {
    setStepIndex((idx) => Math.max(idx - 1, 0))
  }

  const submitWizard = form.handleSubmit(async (values) => {
    setSubmitting(true)
    try {
      const payload = {
        storeName: values.storeName.trim(),
        slug: values.slug.trim().toLowerCase(),
        primaryCurrencyCode: values.primaryCurrencyCode.trim().toUpperCase(),
      }
      await saveSettingsMutation.mutateAsync(payload)
    } catch {
      // mutation.onError already handled — keep the wizard up.
    }
  })

  // Only the review step is allowed to fire the real submit. On earlier
  // steps, hitting Enter inside an input (browser default form submit)
  // would otherwise skip straight to the mutation and bypass review —
  // route those to a step-advance instead. The `reviewSubmitReady`
  // gate also swallows accidental double-clicks while the page is
  // transitioning from currency → review.
  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (currentStep === "review" && reviewSubmitReady) {
      void submitWizard(event)
      return
    }
    if (currentStep !== "review") {
      handleNext()
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <Card className="w-full max-w-xl p-8 text-center text-muted-foreground">
        جاري التحميل…
      </Card>
    )
  }

  if (!isAuthenticated) {
    // The redirect in useEffect handles navigation; render nothing in the
    // meantime so we don't flash the wizard chrome.
    return null
  }

  if (submitting && saveSettingsMutation.isPending) {
    return <FullPageLoader active />
  }

  return (
    <Card className="w-full max-w-xl">
      <CardHeader className="text-center">
        <Avatar className="mx-auto mb-2 rounded-lg bg-primary p-8 text-5xl">
          <AvatarImage src="/logo.png" alt="logo" />
          <AvatarFallback className="font-bold text-primary-foreground">
            SOOQ
          </AvatarFallback>
        </Avatar>
        <CardTitle className="text-xl">أنشئ متجرك</CardTitle>
        <CardDescription>
          {user?.username ? `مسجّل الدخول كـ ${user.username}` : ""}
          <br />
          أكمل البيانات الأساسية لتفعيل متجرك.
        </CardDescription>
        <StepIndicator stepIndex={stepIndex} />
      </CardHeader>

      <form onSubmit={handleFormSubmit} noValidate>
        <CardContent className="flex flex-col gap-6 min-h-[180px]">
          {currentStep === "name" && (
            <Field<IdentitySettingsInput>
              name="storeName"
              control={form.control}
              label="اسم المتجر"
              placeholder="متجر الكرمة"
              inputProps={{ autoFocus: true, disabled: submitting }}
            />
          )}

          {currentStep === "slug" && (
            <SlugStep
              form={form}
              userTouchedSlug={userTouchedSlug}
              slug={slug}
              debouncedSlug={debouncedSlug}
              slugLocallyValid={slugLocallyValid}
              isChecking={slugAvailabilityQuery.isFetching}
              availability={slugAvailabilityQuery.data ?? null}
              disabled={submitting}
            />
          )}

          {currentStep === "currency" && (
            <UiField>
              <FieldLabel>العملة الأساسية</FieldLabel>
              <CurrencyButtonGroup
                value={primaryCurrencyCode}
                onValueChange={(v) =>
                  form.setValue("primaryCurrencyCode", v, {
                    shouldValidate: true,
                  })
                }
              />
              <FieldError
                errors={[form.formState.errors.primaryCurrencyCode]}
              />
            </UiField>
          )}

          {currentStep === "review" && (
            <ReviewStep
              values={form.getValues()}
              onEdit={(stepKey) => {
                const idx = STEPS.findIndex((s) => s.key === stepKey)
                if (idx >= 0) setStepIndex(idx)
              }}
            />
          )}
        </CardContent>

        <CardFooter className="flex flex-row-reverse justify-between gap-2">
          {currentStep === "review" ? (
            <Button
              key="review-submit"
              type="submit"
              size="lg"
              loading={saveSettingsMutation.isPending}
              disabled={submitting || !reviewSubmitReady}
            >
              فعّل متجري
              <ArrowLeftIcon />
            </Button>
          ) : (
            <Button
              key="step-next"
              type="button"
              size="lg"
              onClick={handleNext}
              disabled={!canAdvanceFromCurrentStep()}
            >
              متابعة
              <ArrowLeftIcon />
            </Button>
          )}

          <Button
            type="button"
            variant="ghost"
            onClick={handleBack}
            disabled={stepIndex === 0 || submitting}
          >
            <ArrowRightIcon />
            رجوع
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

function StepIndicator({ stepIndex }: { stepIndex: number }) {
  return (
    <div
      className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground"
      aria-label="مراحل الإعداد"
    >
      {STEPS.map((step, idx) => {
        const isCurrent = idx === stepIndex
        const isDone = idx < stepIndex
        return (
          <div key={step.key} className="flex items-center gap-1">
            {isDone ? (
              <CheckCircle2 className="size-4 text-primary" />
            ) : isCurrent ? (
              <CircleDot className="size-4 text-primary" />
            ) : (
              <CircleDot className="size-4 opacity-40" />
            )}
            <span
              className={
                isCurrent
                  ? "font-medium text-foreground"
                  : isDone
                    ? "text-foreground/70"
                    : ""
              }
            >
              {step.label}
            </span>
            {idx < STEPS.length - 1 && (
              <span className="px-1 opacity-40">·</span>
            )}
          </div>
        )
      })}
    </div>
  )
}

type SlugStepProps = {
  form: ReturnType<typeof useForm<IdentitySettingsInput>>
  userTouchedSlug: React.MutableRefObject<boolean>
  slug: string
  debouncedSlug: string
  slugLocallyValid: boolean
  isChecking: boolean
  availability: { available: boolean; slug: string } | null
  disabled: boolean
}

function SlugStep({
  form,
  userTouchedSlug,
  slug,
  debouncedSlug,
  slugLocallyValid,
  isChecking,
  availability,
  disabled,
}: SlugStepProps) {
  const showStatus =
    slugLocallyValid && debouncedSlug.length > 0 && debouncedSlug === slug.trim()

  return (
    <div className="flex flex-col gap-2">
      <Field<IdentitySettingsInput>
        name="slug"
        control={form.control}
        label="رابط المتجر"
        placeholder="al-karma-store"
        inputProps={{
          autoFocus: true,
          disabled,
          dir: "ltr",
          onInput: () => {
            userTouchedSlug.current = true
          },
        }}
      />
      <p className="text-xs text-muted-foreground">
        أحرف لاتينية صغيرة، أرقام، وشرطات فقط — مثال:{" "}
        <span dir="ltr" className="font-mono">
          al-karma-store
        </span>
      </p>

      {showStatus && (
        <div className="mt-1 flex items-center gap-2 text-xs">
          {isChecking ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              <span className="text-muted-foreground">
                جاري التحقق من توفّر الرابط…
              </span>
            </>
          ) : availability ? (
            availability.available ? (
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
    </div>
  )
}

function ReviewStep({
  values,
  onEdit,
}: {
  values: IdentitySettingsInput
  onEdit: (step: StepKey) => void
}) {
  return (
    <dl className="flex flex-col divide-y rounded-md border bg-muted/20 text-sm">
      <ReviewRow
        label="اسم المتجر"
        value={values.storeName}
        onEdit={() => onEdit("name")}
      />
      <ReviewRow
        label="رابط المتجر"
        value={values.slug}
        dir="ltr"
        onEdit={() => onEdit("slug")}
      />
      <ReviewRow
        label="العملة الأساسية"
        value={values.primaryCurrencyCode}
        onEdit={() => onEdit("currency")}
      />
    </dl>
  )
}

function ReviewRow({
  label,
  value,
  dir,
  onEdit,
}: {
  label: string
  value: string
  dir?: "ltr" | "rtl"
  onEdit: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-3 p-3">
      <dt className="text-muted-foreground">{label}</dt>
      <div className="flex items-center gap-3">
        <dd dir={dir} className="font-medium">
          {value || "—"}
        </dd>
        <Button type="button" variant="ghost" size="sm" onClick={onEdit}>
          تعديل
        </Button>
      </div>
    </div>
  )
}

