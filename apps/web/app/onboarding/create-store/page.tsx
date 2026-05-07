"use client"

import type { CurrencyCode } from "@/components/onboarding/currency-button-group"
import { OnboardingProgress } from "@/components/onboarding/onboarding-progress"
import {
  CategoryStep,
  STORE_CATEGORIES,
} from "@/components/onboarding/steps/category-step"
import { DomainCurrencyStep } from "@/components/onboarding/steps/domain-currency-step"
import { StoreDetailsStep } from "@/components/onboarding/steps/store-details-step"
import { categoryIdToStoreCategory } from "@/lib/store-category"
import { getCreateStoreMutationOptions } from "@/modules/auth/store/actions"
import { initCreateStorePayload } from "@/modules/auth/store/init"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { SESSION_SHOW_STORE_SETUP_LOADER } from "@/components/full-page-loader"
import { useRouter } from "next/navigation"
import * as React from "react"

const TOTAL_STEPS = 3

type OnboardingStepHeader = {
  title: string
  description: string
  descriptionClassName?: string
}

const ONBOARDING_STEP_HEADERS: OnboardingStepHeader[] = [
  {
    title: "اختر تصنيف متجرك",
    description:
      "أخبرنا بنوع المنتجات التي سستقوم ببيعها لنتمكن من تخصيص تجربتك بشكل أفضل.",
    descriptionClassName: "text-gray-500",
  },
  {
    title: "هوية المتجر",
    description:
      "قم بتخصيص العلامة التجارية لمتجرك لتظهر بشكل احترافي أمام عملائك.",
  },
  {
    title: "الرابط والعملة",
    description:
      "حدّد عنوان متجرك على SOOQ والعملة الافتراضية للأسعار",
  },
]

export default function CreateStorePage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [step, setStep] = React.useState(0)
  const [categoryId, setCategoryId] = React.useState<string | null>(null)
  const [storeName, setStoreName] = React.useState("")
  const [primaryCurrencyCode, setPrimaryCurrencyCode] =
    React.useState<CurrencyCode>("SYP")
  const [slug, setSlug] = React.useState("")

  const selectedCategory = STORE_CATEGORIES.find((c) => c.id === categoryId)

  const { isPending, mutate } = useMutation({
    ...getCreateStoreMutationOptions({
      queryClient,
      onSuccess: () => {
        if (typeof window !== "undefined") {
          sessionStorage.setItem(SESSION_SHOW_STORE_SETUP_LOADER, "1")
        }
        router.push("/")
      },
    }),
  })

  function goNext() {
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1))
  }

  function goPrevious() {
    setStep((s) => Math.max(s - 1, 0))
  }

  function handleStoreDetailsSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    goNext()
  }

  function handleDomainCurrencySubmit(e: React.FormEvent) {
    e.preventDefault()
    const name = storeName.trim()
    const storeSlug = slug.trim()
    if (!categoryId || !name || !storeSlug) return

    mutate(
      initCreateStorePayload({
        storeName: name,
        slug: storeSlug,
        primaryCurrencyCode,
        storeCategory: categoryIdToStoreCategory(categoryId),
        themeCode: "DEFAULT",
      })
    )
  }

  const stepHeader = ONBOARDING_STEP_HEADERS[step]!

  return (
    <Card className="w-full max-w-xl">
      <CardHeader className="mb-2 space-y-1 text-center">
        <Avatar className="mx-auto mb-2 rounded-lg bg-primary p-8 text-5xl">
          <AvatarImage src="/logo.png" alt="logo" />
          <AvatarFallback className="font-bold text-primary-foreground">
            SOOQ
          </AvatarFallback>
        </Avatar>

        <CardTitle className="text-xl">{stepHeader.title}</CardTitle>
        <CardDescription className={stepHeader.descriptionClassName}>
          {stepHeader.description}
        </CardDescription>

        <div className="mt-4 mb-8 flex justify-center">
          <OnboardingProgress currentStep={step} />
        </div>
      </CardHeader>

      {step === 0 && (
        <CategoryStep
          categoryId={categoryId}
          onCategoryChange={setCategoryId}
          onNext={goNext}
        />
      )}

      {step === 1 && (
        <StoreDetailsStep
          categoryId={categoryId}
          storeName={storeName}
          onStoreNameChange={setStoreName}
          onSubmit={handleStoreDetailsSubmit}
          onPrevious={goPrevious}
        />
      )}

      {step === 2 && (
        <DomainCurrencyStep
          categoryLabel={selectedCategory?.name ?? "—"}
          slug={slug}
          onSlugChange={setSlug}
          primaryCurrencyCode={primaryCurrencyCode}
          onPrimaryCurrencyChange={setPrimaryCurrencyCode}
          onSubmit={handleDomainCurrencySubmit}
          onPrevious={goPrevious}
          isSubmitting={isPending}
        />
      )}
    </Card>
  )
}
