"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@workspace/ui/components/button"
import {
  Field as UiField,
  FieldError,
  FieldLabel,
} from "@workspace/ui/components/field"
import {
  AlertCircle,
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircle2,
  Loader2,
  BookOpen,
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
import { setTenantSlug } from "@/lib/tenant-slug"
import { useCurrentUser } from "@/modules/auth/auth/hooks/useCurrentUser"

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

import Image from "next/image"

type StepKey = "name" | "slug" | "currency" | "review"

const STEPS: Array<{ key: StepKey; label: string; subLabel: string }> = [
  { key: "name", label: "الخطوة الأولى", subLabel: "اسم المتجر" },
  { key: "slug", label: "الخطوة الثانية", subLabel: "رابط المتجر" },
  { key: "currency", label: "الخطوة الثالثة", subLabel: "العملة" },
  { key: "review", label: "الخطوة الرابعة", subLabel: "مراجعة" },
]

const SLUG_DEBOUNCE_MS = 400

export default function CreateStoreFlow() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user, isAuthenticated, isLoading } = useCurrentUser()

  const [stepIndex, setStepIndex] = React.useState(0)
  const currentStep = STEPS[stepIndex]!.key
  const [submitting, setSubmitting] = React.useState(false)
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

  // توليد الرابط تلقائياً بناءً على اسم المتجر حتى يقوم المستخدم بتعديله بنفسه
  const userTouchedSlug = React.useRef(false)
  React.useEffect(() => {
    if (userTouchedSlug.current) return
    const generated = slugifyStoreName(storeName ?? "")
    if (generated !== form.getValues("slug")) {
      form.setValue("slug", generated, { shouldValidate: false })
    }
  }, [storeName, form])

    // Guard: unauthenticated visitors can't create a store. Bounce to OTP.
  /*React.useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) {
      router.replace("/request-otp")
    }
  }, [isAuthenticated, isLoading, router])*/


  // ── منطق التحقق من صحة الرابط وتوفره ──────────────────
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
        await refreshSession().catch(() => undefined)
        const targetSlug = settings.slug ?? form.getValues("slug")
        setTenantSlug(targetSlug)
        if (typeof window !== "undefined") {
          sessionStorage.setItem(SESSION_SHOW_STORE_SETUP_LOADER, "1")
        }
        router.replace("/")
      },
    }),
    onError: (error: ApiError) => {
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

  // شروط الانتقال بين الخطوات بعد تنظيف الحقول الزائدة
  const canAdvanceFromName = !!storeName?.trim()
  
  const canAdvanceFromSlug = React.useMemo(() => {
    const value = (slug ?? "").trim()
    if (!value) return false
    if (!slugLocallyValid) return false
    if (slugAvailabilityQuery.isFetching) return false
    if (slugAvailabilityQuery.data && !slugAvailabilityQuery.data.available) {
      return false
    }
    return true
  }, [slug, slugLocallyValid, slugAvailabilityQuery])

  const canAdvanceFromCurrency = !!primaryCurrencyCode

  const canAdvanceFromCurrentStep = () => {
    switch (currentStep) {
      case "name": return canAdvanceFromName
      case "slug": return canAdvanceFromSlug
      case "currency": return canAdvanceFromCurrency
      case "review": return true
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
      // التعامل مع الخطأ يتم بواسطة Mutation onError
    }
  })

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

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-[#f4f7f9] flex items-center justify-center font-sans antialiased">
        <div className="w-full max-w-xl p-8 text-center text-muted-foreground bg-white rounded-xl border shadow-sm">
          جاري التحميل…
        </div>
      </div>
    )
  }
  /*if (!isAuthenticated) {
    // The redirect in useEffect handles navigation; render nothing in the
    // meantime so we don't flash the wizard chrome.
    return null
  }*/
  if (submitting && saveSettingsMutation.isPending) {
    return <FullPageLoader active />
  }

  return (
    <div className="min-h-screen w-full bg-[#f4f7f9] flex flex-col md:flex-row-reverse relative overflow-hidden font-sans antialiased" dir="rtl">
      
      {/* ── شريط الخطوات الجانبي المعدل لضبط المسافات ── */}
      <div className="w-full md:w-[35%] p-6 md:p-8 flex flex-col justify-center items-center z-10 relative border-l border-gray-200/50 gap-6">
        
        {/* ── حاوية الشاب والبطاقة النصية المدمجة بمسافات متناسقة وعمودية ── */}
        <div className="w-full flex flex-col items-center justify-center relative pointer-events-none mb-2">
          <div className="relative w-full max-w-[150px] md:max-w-[170px] flex flex-col items-center pointer-events-auto">
            
            {/* صورة الشاب المفرغة */}
            <img 
              src="/images/CreateStoreFlow.png" 
             // alt="Success Character" 
              className="w-full h-auto object-contain select-none"
            />
            
            {/* بطاقة النص المنبثقة بجانب الشاب */}
            <div className="absolute right-[-35px] bottom-[25%] bg-white/95 backdrop-blur-sm border border-gray-100 px-3 py-1.5 rounded-xl shadow-xl max-w-[130px] text-center border-b-4 border-gray-200">
              <p className="text-[10px] md:text-[11px] font-black text-[#b97a23] leading-relaxed">
                متجرك بين يديك في لحظات
              </p>
            </div>
          </div>
        </div>

        {/* ── حاوية الأزرار والخطوات الجانبية ── */}
        <div className="w-full flex flex-col items-center gap-4">
          <div className="relative flex flex-col gap-8 md:gap-10 items-center w-full max-w-[220px]">
            <div className="absolute top-4 bottom-4 right-[50%] w-[2px] border-r-2 border-dashed border-[#1e3a47]/20 z-0"></div>
            
            {STEPS.map((step, idx) => {
              const isCurrent = idx === stepIndex
              const isDone = idx < stepIndex

              return (
                <div key={step.key} className="z-10 w-full relative flex flex-col items-center">
                  {isCurrent && (
                    <div className="absolute -top-5 right-4 bg-white p-1 rounded-md border border-gray-200 shadow-sm z-20 animate-bounce">
                      <BookOpen className="size-3 text-[#b97a23]" />
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => idx <= stepIndex && setStepIndex(idx)}
                    disabled={idx > stepIndex}
                    style={{ transform: "rotateX(20deg) rotateZ(-10deg)" }}
                    className={`
                      w-full py-3.5 px-4 rounded-xl text-center font-black text-sm tracking-wide
                      transition-all duration-300 shadow-lg relative perspective-sm
                      ${isCurrent 
                        ? "bg-[#b97a23] text-white scale-105 border-b-4 border-[#935f16]" 
                        : isDone 
                          ? "bg-[#1e3a47] text-white opacity-95 border-b-4 border-[#0f212a]"
                          : "bg-white text-[#1e3a47] border border-gray-200 border-b-4 border-gray-300"
                      }
                    `}
                  >
                    <span>{step.label}</span>
                  </button>
                  
                  {isCurrent && (
                    <span className="text-xs text-gray-500 font-bold mt-1.5">
                      {step.subLabel}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* اسم المستخدم في الأسفل */}
        <div className="mt-4 text-center w-full relative">
          {user?.username && (
            <span className="text-[11px] text-muted-foreground block">
              مسجّل كـ {user.username}
            </span>
          )}
        </div>
      </div>

      {/* ── نافذة الإدخال الرئيسية ── */}
      <div className="w-full md:w-[65%] p-4 md:p-12 flex items-center justify-center z-10">
        <div className="w-full max-w-3xl bg-white rounded-tr-[3rem] rounded-bl-[3rem] rounded-tl-xl rounded-br-xl border-2 border-r-4 border-b-4 border-[#1e3a47] shadow-2xl overflow-hidden p-8 md:p-14 min-h-[580px] flex flex-col justify-between">
          
          <form onSubmit={handleFormSubmit} noValidate className="h-full flex flex-col justify-between flex-1">
            <div className="flex-1">
              <h2 className="text-3xl md:text-4xl font-black text-[#1e3a47] mb-10 text-right tracking-tight">
                ادخل بيانات متجرك
              </h2>

              <div className="space-y-6">
                {/* ── خطوة الاسم فقط ── */}
                {currentStep === "name" && (
                  <div className="space-y-5 text-right">
                    <div className="space-y-2">
                      <Field<IdentitySettingsInput>
                        name="storeName"
                        control={form.control}
                        label="اسم المتجر"
                        placeholder="ادخل اسم متجرك"
                        inputProps={{ 
                          autoFocus: true, 
                          disabled: submitting,
                          className: "w-full bg-[#f4f7f9] border border-gray-200 rounded-xl p-4 text-right text-sm font-medium focus:ring-2 focus:ring-[#b97a23] focus:bg-white transition-all" 
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* ── خطوة رابط المتجر ── */}
                {currentStep === "slug" && (
                  <div className="space-y-4 text-right">
                    <Field<IdentitySettingsInput>
                      name="slug"
                      control={form.control}
                      label="رابط المتجر"
                      placeholder="al-karma-store"
                      inputProps={{
                        autoFocus: true,
                        disabled: submitting,
                        dir: "ltr",
                        onInput: () => {
                          userTouchedSlug.current = true
                        },
                        className: "w-full bg-[#f4f7f9] border border-gray-200 rounded-xl p-4 text-left font-mono text-sm focus:ring-2 focus:ring-[#b97a23] focus:bg-white transition-all"
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      أحرف لاتينية صغيرة، أرقام، وشرطات فقط — مثال:{" "}
                      <span dir="ltr" className="font-mono bg-gray-100 px-1 rounded">
                        al-karma-store
                      </span>
                    </p>

                    {slugLocallyValid && debouncedSlug.length > 0 && debouncedSlug === slug.trim() && (
                      <div className="mt-2 flex items-center gap-2 text-xs justify-start" dir="rtl">
                        {slugAvailabilityQuery.isFetching ? (
                          <>
                            <Loader2 className="size-3.5 animate-spin text-gray-500" />
                            <span className="text-muted-foreground">جاري التحقق من توفّر الرابط…</span>
                          </>
                        ) : slugAvailabilityQuery.data ? (
                          slugAvailabilityQuery.data.available ? (
                            <>
                              <CheckCircle2 className="size-3.5 text-emerald-600" />
                              <span className="text-emerald-600 font-bold">الرابط متاح للاستخدام</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="size-3.5 text-destructive" />
                              <span className="text-destructive font-bold">هذا الرابط محجوز، اختر رابطاً آخر</span>
                            </>
                          )
                        ) : null}
                      </div>
                    )}
                  </div>
                )}

                {/* ── خطوة اختيار العملة ── */}
                {currentStep === "currency" && (
                  <UiField className="text-right space-y-3">
                    <FieldLabel className="text-sm font-bold text-[#1e3a47]">العملة الأساسية</FieldLabel>
                    <div className="bg-[#f4f7f9] p-3 rounded-xl border border-gray-100">
                      <CurrencyButtonGroup
                        value={primaryCurrencyCode}
                        onValueChange={(v) =>
                          form.setValue("primaryCurrencyCode", v, {
                            shouldValidate: true,
                          })
                        }
                      />
                    </div>
                    <FieldError errors={[form.formState.errors.primaryCurrencyCode]} />
                  </UiField>
                )}

                {/* ── خطوة المراجعة النهائية ── */}
                {currentStep === "review" && (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-500 text-right font-medium mb-4">يرجى مراجعة بيانات المتجر قبل التفعيل:</p>
                    <dl className="flex flex-col divide-y divide-gray-100 rounded-2xl border border-gray-200 bg-[#f4f7f9]/50 text-sm overflow-hidden">
                      <ReviewRow
                        label="اسم المتجر"
                        value={storeName}
                        onEdit={() => setStepIndex(STEPS.findIndex((s) => s.key === "name"))}
                      />
                      <ReviewRow
                        label="رابط المتجر"
                        value={slug}
                        dir="ltr"
                        onEdit={() => setStepIndex(STEPS.findIndex((s) => s.key === "slug"))}
                      />
                      <ReviewRow
                        label="العملة الأساسية"
                        value={primaryCurrencyCode}
                        onEdit={() => setStepIndex(STEPS.findIndex((s) => s.key === "currency"))}
                      />
                    </dl>
                  </div>
                )}
              </div>
            </div>

            {/* ── أزرار التحكم والـ Footer ── */}
            <div className="flex flex-row-reverse justify-between gap-4 mt-12 pt-6 border-t border-gray-100">
              {currentStep === "review" ? (
                <Button
                  key="review-submit"
                  type="submit"
                  className="bg-[#1e3a47] hover:bg-[#152933] text-white px-8 py-6 rounded-xl font-bold transition-all shadow-md flex items-center gap-2"
                  loading={saveSettingsMutation.isPending}
                  disabled={submitting || !reviewSubmitReady}
                >
                  <span>فعّل متجري</span>
                  <ArrowLeftIcon className="size-4" />
                </Button>
              ) : (
                <Button
                  key="step-next"
                  type="button"
                  className="bg-[#1e3a47] hover:bg-[#152933] text-white px-8 py-6 rounded-xl font-bold transition-all shadow-md flex items-center gap-2 disabled:opacity-40 disabled:pointer-events-none"
                  onClick={handleNext}
                  disabled={!canAdvanceFromCurrentStep()}
                >
                  <span>متابعة</span>
                  <ArrowLeftIcon className="size-4" />
                </Button>
              )}

              <Button
                type="button"
                variant="ghost"
                onClick={handleBack}
                disabled={stepIndex === 0 || submitting}
                className="text-[#1e3a47] font-bold hover:bg-gray-100 rounded-xl px-6"
              >
                <ArrowRightIcon className="size-4 ml-2" />
                <span>رجوع</span>
              </Button>
            </div>
          </form>

        </div>
      </div>
    </div>
  )
}

// ── مكون المساعدة الداخلي المخصص لعرض المراجعة ──
function ReviewRow({
  label,
  value,
  dir = "rtl",
  onEdit,
}: {
  label: string
  value: string
  dir?: "ltr" | "rtl"
  onEdit: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 p-4 hover:bg-white transition-colors">
      <dt className="text-gray-500 font-bold text-xs">{label}</dt>
      <div className="flex items-center gap-4">
        <dd dir={dir} className="font-bold text-[#1e3a47] text-sm">
          {value || "—"}
        </dd>
        <button 
          type="button" 
          onClick={onEdit}
          className="text-xs font-black text-[#b97a23] hover:underline"
        >
          تعديل
        </button>
      </div>
    </div>
  )
}