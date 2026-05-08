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
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@workspace/ui/components/input-otp"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar"
import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  AlertCircle,
  ArrowLeftIcon,
  PhoneIcon,
  ShieldCheckIcon,
  UserIcon,
} from "lucide-react"
import * as React from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"

import Field from "@/components/system/Field"
import {
  FullPageLoader,
  SESSION_SHOW_STORE_SETUP_LOADER,
} from "@/components/full-page-loader"
import { CategoryStep, STORE_CATEGORIES } from "@/components/onboarding/steps/category-step"
import {
  CurrencyButtonGroup,
  type CurrencyCode,
} from "@/components/onboarding/currency-button-group"
import { StoreLogoUploader } from "@/components/onboarding/store-logo-uploader"
import type { ApiError } from "@/lib/api"
import { phoneSchema, requiredString } from "@/lib/schema"
import { categoryIdToStoreCategory } from "@/lib/store-category"
import {
  getRequestOtpMutationOptions,
  getVerifyOtpMutationOptions,
} from "@/modules/auth/auth/actions"
import { useOtpCooldown } from "@/modules/auth/auth/hooks/useOtpCooldown"
import { uploadMedia } from "@/modules/media/upload/actions"
import { validateImageFile } from "@/modules/media/upload/init"

import {
  checkStoreSlugQueryOptions,
  getCreateStoreMutationOptions,
} from "../actions"
import { initCreateStorePayload, slugifyStoreName } from "../init"
import type { CreateStoreInput, StoreRegistrationResponse } from "../types"

type Step = "form" | "otp" | "provisioning" | "error"

const formSchema = z.object({
  storeName: requiredString("اسم المتجر"),
  slug: z
    .string()
    .trim()
    .min(1, "الرابط مطلوب")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "أحرف لاتينية صغيرة وأرقام فقط"),
  storeCategory: requiredString("التصنيف"),
  primaryCurrencyCode: z.enum(["SYP", "USD"]).default("SYP"),
  phone: phoneSchema,
  fullName: z.string().trim().optional(),
})

type FormValues = z.input<typeof formSchema>

const PROVISIONING_FAILED_STEP_LABEL: Record<"upload" | "create", string> = {
  upload: "رفع الشعار",
  create: "إنشاء المتجر",
}

const buildStorefrontUrl = (slug: string): string | null => {
  const base = process.env.NEXT_PUBLIC_STOREFRONT_BASE
  if (!base) return null
  const trimmedBase = base.replace(/\/+$/, "")
  return `${trimmedBase}/${encodeURIComponent(slug)}`
}

export default function CreateStoreFlow() {
  const queryClient = useQueryClient()
  const cooldown = useOtpCooldown(60)

  const [step, setStep] = React.useState<Step>("form")
  const [logoFile, setLogoFile] = React.useState<File | null>(null)
  const [logoError, setLogoError] = React.useState<string | null>(null)
  const [otp, setOtp] = React.useState("")
  const [provisioningError, setProvisioningError] = React.useState<string | null>(
    null
  )
  const [failedStep, setFailedStep] = React.useState<"upload" | "create" | null>(
    null
  )

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      storeName: "",
      slug: "",
      storeCategory: "",
      primaryCurrencyCode: "SYP",
      phone: "",
      fullName: "",
    },
  })

  const storeName = form.watch("storeName")
  const slug = form.watch("slug")
  const phone = form.watch("phone")
  const fullName = form.watch("fullName")
  const primaryCurrencyCode = form.watch("primaryCurrencyCode") as CurrencyCode
  const categoryId = form.watch("storeCategory")

  // Auto-fill slug from storeName until the user manually edits it.
  const userTouchedSlug = React.useRef(false)
  React.useEffect(() => {
    if (userTouchedSlug.current) return
    const generated = slugifyStoreName(storeName ?? "")
    if (generated !== form.getValues("slug")) {
      form.setValue("slug", generated, { shouldValidate: false })
    }
  }, [storeName, form])

  const requestOtpMutation = useMutation({
    ...getRequestOtpMutationOptions(),
    onSuccess: () => {
      cooldown.start(60)
    },
    onError: (error: ApiError) => {
      if (error.action === "show-cooldown") {
        cooldown.start(error.retryAfterSeconds ?? 60)
      }
    },
  })

  const verifyOtpMutation = useMutation({
    ...getVerifyOtpMutationOptions({
      queryClient,
      onSuccess: () => {
        // We're already on the onboarding page — skip the module's hub redirect.
        setStep("provisioning")
        runProvisioning()
      },
    }),
    onError: (error: ApiError) => {
      if (error.action === "show-field-error" && error.fieldKey === "otpCode") {
        setOtp("")
      }
    },
  })

  const createStoreMutation = useMutation({
    ...getCreateStoreMutationOptions({
      queryClient,
      onSuccess: (response: StoreRegistrationResponse) => {
        if (typeof window !== "undefined") {
          sessionStorage.setItem(SESSION_SHOW_STORE_SETUP_LOADER, "1")
        }
        const target = buildStorefrontUrl(response.store.slug)
        if (target && typeof window !== "undefined") {
          window.location.href = target
        } else if (typeof window !== "undefined") {
          window.location.href = "/"
        }
      },
    }),
  })

  const runProvisioning = React.useCallback(async () => {
    setProvisioningError(null)
    setFailedStep(null)

    let assetId: string | undefined
    if (logoFile) {
      try {
        const result = await uploadMedia([logoFile])
        assetId = result.assetIds[0]
      } catch (error) {
        const message =
          (error as ApiError | undefined)?.message ?? "تعذّر رفع الشعار"
        setProvisioningError(message)
        setFailedStep("upload")
        setStep("error")
        return
      }
    }

    try {
      const values = form.getValues()
      const payload: CreateStoreInput = initCreateStorePayload({
        storeName: values.storeName,
        slug: values.slug,
        storeCategory: categoryIdToStoreCategory(values.storeCategory),
        primaryCurrencyCode: values.primaryCurrencyCode ?? "SYP",
        themeCode: "DEFAULT",
        storeLogo: assetId ?? "",
      })
      await createStoreMutation.mutateAsync(payload)
    } catch (error) {
      const message =
        (error as ApiError | undefined)?.message ?? "تعذّر إنشاء المتجر"
      setProvisioningError(message)
      setFailedStep("create")
      setStep("error")
    }
  }, [logoFile, form, createStoreMutation])

  const handleFormSubmit = form.handleSubmit(async (values) => {
    setLogoError(null)

    if (logoFile) {
      const validation = validateImageFile(logoFile)
      if (!validation.ok) {
        setLogoError(validation.error)
        return
      }
    }

    // Pre-flight slug check.
    try {
      const result = await queryClient.fetchQuery(
        checkStoreSlugQueryOptions(values.slug)
      )
      if (!result.available) {
        form.setError("slug", {
          type: "taken",
          message: "هذا الرابط محجوز، اختر رابطاً آخر",
        })
        return
      }
    } catch {
      // Fall through; the OTP request will surface a clearer error if backend is down.
    }

    // Request OTP.
    try {
      await requestOtpMutation.mutateAsync({
        phone: values.phone,
        role: "OWNER",
        fullName: values.fullName?.trim() || undefined,
        tenantSlug: undefined,
        tenantId: undefined,
      })
      setOtp("")
      setStep("otp")
    } catch {
      // Toast already surfaced by the axios interceptor / cooldown handled in onError.
    }
  })

  const handleOtpSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (otp.length !== 6) return
    verifyOtpMutation.mutate({
      phone: phone,
      otpCode: otp,
      totpCode: undefined,
      backupCode: undefined,
      tenantSlug: undefined,
      tenantId: undefined,
    })
  }

  const handleResendOtp = () => {
    if (cooldown.isCooling) return
    requestOtpMutation.mutate({
      phone: phone,
      role: "OWNER",
      fullName: fullName?.trim() || undefined,
      tenantSlug: undefined,
      tenantId: undefined,
    })
    toast.success("تم إعادة إرسال الرمز")
  }

  const handleErrorRetry = () => {
    if (failedStep === null) return
    setStep("provisioning")
    runProvisioning()
  }

  // ── Provisioning view ─────────────────────────────────────────────
  if (step === "provisioning") {
    return <FullPageLoader active />
  }

  // ── Error view ────────────────────────────────────────────────────
  if (step === "error") {
    return (
      <Card className="w-full max-w-xl">
        <CardHeader className="text-center">
          <Avatar className="mx-auto mb-2 rounded-lg bg-destructive/10 p-4">
            <AvatarFallback className="bg-transparent text-destructive">
              <AlertCircle className="size-8" />
            </AvatarFallback>
          </Avatar>
          <CardTitle>تعذّر إكمال الإعداد</CardTitle>
          <CardDescription>
            فشلت خطوة:{" "}
            <strong>
              {failedStep ? PROVISIONING_FAILED_STEP_LABEL[failedStep] : "—"}
            </strong>
            <br />
            {provisioningError}
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-center gap-2">
          <Button variant="outline" onClick={() => setStep("otp")}>
            رجوع
          </Button>
          <Button onClick={handleErrorRetry}>إعادة المحاولة</Button>
        </CardFooter>
      </Card>
    )
  }

  // ── OTP view ──────────────────────────────────────────────────────
  if (step === "otp") {
    return (
      <Card className="w-full max-w-xl">
        <form onSubmit={handleOtpSubmit}>
          <CardHeader className="mb-4 text-center">
            <Avatar className="mx-auto mb-2 rounded-lg bg-primary p-8 text-5xl">
              <AvatarImage src="/logo.png" alt="logo" />
              <AvatarFallback className="font-bold text-primary-foreground">
                SOOQ
              </AvatarFallback>
            </Avatar>
            <CardTitle>تأكيد رقم الهاتف</CardTitle>
            <CardDescription>
              أدخل الرمز المكوّن من 6 أرقام الذي أرسلناه إلى
              <br />
              <span className="font-mono" dir="ltr">
                {phone}
              </span>
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col gap-4">
            <UiField>
              <FieldLabel htmlFor="onboard-otp" className="justify-center gap-2">
                <ShieldCheckIcon className="size-4" />
                رمز التحقق
              </FieldLabel>
              <div className="flex justify-center" dir="ltr">
                <InputOTP
                  maxLength={6}
                  id="onboard-otp"
                  value={otp}
                  onChange={setOtp}
                  required
                >
                  <InputOTPGroup>
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <InputOTPSlot
                        key={i}
                        index={i}
                        className="h-12 w-10 text-base"
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </UiField>

            <div className="flex items-center justify-center gap-2 text-sm">
              <span className="text-muted-foreground">لم يصلك الرمز؟</span>
              <Button
                type="button"
                variant="link"
                size="sm"
                disabled={cooldown.isCooling || requestOtpMutation.isPending}
                onClick={handleResendOtp}
              >
                {cooldown.isCooling
                  ? `إعادة الإرسال خلال ${cooldown.remaining} ثانية`
                  : "إعادة الإرسال"}
              </Button>
            </div>
          </CardContent>

          <CardFooter className="flex-col gap-2">
            <Button
              type="submit"
              size="lg"
              className="w-full"
              loading={verifyOtpMutation.isPending}
              disabled={otp.length !== 6}
            >
              تأكيد ومتابعة
              <ArrowLeftIcon />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setStep("form")}
              disabled={verifyOtpMutation.isPending}
            >
              رجوع لتعديل البيانات
            </Button>
          </CardFooter>
        </form>
      </Card>
    )
  }

  // ── Form view (default) ───────────────────────────────────────────
  const isFormSubmitting = requestOtpMutation.isPending

  return (
    <Card className="w-full max-w-2xl">
      <form onSubmit={handleFormSubmit}>
        <CardHeader className="text-center">
          <Avatar className="mx-auto mb-2 rounded-lg bg-primary p-8 text-5xl">
            <AvatarImage src="/logo.png" alt="logo" />
            <AvatarFallback className="font-bold text-primary-foreground">
              SOOQ
            </AvatarFallback>
          </Avatar>
          <CardTitle className="text-xl">أنشئ متجرك</CardTitle>
          <CardDescription>
            املأ بيانات متجرك ثم سنرسل رمز تحقق إلى رقم هاتفك لإكمال الإعداد.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-8">
          {/* Section 1 — Brand */}
          <section className="flex flex-col gap-4">
            <h2 className="text-sm font-semibold text-foreground">
              هوية العلامة التجارية
            </h2>

            <Field<FormValues>
              name="storeName"
              control={form.control}
              label="اسم المتجر"
              placeholder="متجر الكرمة"
              inputProps={{ disabled: isFormSubmitting }}
            />

            <StoreLogoUploader
              value={logoFile}
              onChange={setLogoFile}
              error={logoError}
              disabled={isFormSubmitting}
            />

            <UiField data-invalid={Boolean(form.formState.errors.storeCategory)}>
              <FieldLabel>التصنيف</FieldLabel>
              <Controller
                name="storeCategory"
                control={form.control}
                render={({ field }) => (
                  <div
                    className="grid grid-cols-2 gap-3 sm:grid-cols-3"
                    role="radiogroup"
                    aria-label="تصنيف المتجر"
                  >
                    {STORE_CATEGORIES.map(({ id, name, Icon }) => {
                      const selected = field.value === id
                      return (
                        <Button
                          key={id}
                          type="button"
                          variant="outline"
                          disabled={isFormSubmitting}
                          onClick={() => field.onChange(id)}
                          className={
                            selected
                              ? "h-auto flex-col gap-2 border-2 border-primary bg-primary/5 p-3"
                              : "h-auto flex-col gap-2 border-2 p-3"
                          }
                        >
                          <Icon className="size-5" strokeWidth={1.5} />
                          <span className="text-xs font-medium">{name}</span>
                        </Button>
                      )
                    })}
                  </div>
                )}
              />
              <FieldError errors={[form.formState.errors.storeCategory]} />
            </UiField>
          </section>

          {/* Section 2 — Store identity */}
          <section className="flex flex-col gap-4">
            <h2 className="text-sm font-semibold text-foreground">هوية المتجر</h2>

            <Field<FormValues>
              name="slug"
              control={form.control}
              label="رابط المتجر"
              placeholder="al-karma-store"
              inputProps={{
                disabled: isFormSubmitting,
                dir: "ltr",
                onInput: () => {
                  userTouchedSlug.current = true
                },
              }}
            />

            <UiField>
              <CurrencyButtonGroup
                value={primaryCurrencyCode}
                onValueChange={(v) =>
                  form.setValue("primaryCurrencyCode", v, { shouldValidate: true })
                }
              />
            </UiField>
          </section>

          {/* Section 3 — Contact */}
          <section className="flex flex-col gap-4">
            <h2 className="text-sm font-semibold text-foreground">التواصل</h2>

            <Field<FormValues>
              name="phone"
              control={form.control}
              placeholder="+963 9XX XXX XXX"
              label={
                <>
                  <PhoneIcon className="size-4" />
                  رقم الهاتف
                </>
              }
              inputProps={{
                type: "tel",
                dir: "ltr",
                disabled: isFormSubmitting,
              }}
            />

            <Field<FormValues>
              name="fullName"
              control={form.control}
              label={
                <>
                  <UserIcon className="size-4" />
                  الاسم الكامل (اختياري)
                </>
              }
              placeholder="محمد علي"
              inputProps={{ disabled: isFormSubmitting }}
            />
          </section>

          {isFormSubmitting && (
            <div className="flex flex-col gap-2 rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
              <span>جاري التحقق من الرابط وإرسال رمز التحقق...</span>
              <Skeleton className="h-2 w-full" />
            </div>
          )}
        </CardContent>

        <CardFooter className="justify-end">
          <Button
            type="submit"
            size="lg"
            loading={isFormSubmitting}
            disabled={!categoryId}
          >
            متابعة
            <ArrowLeftIcon />
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
