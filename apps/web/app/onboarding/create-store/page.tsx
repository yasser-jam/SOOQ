"use client"

import type { CurrencyCode } from "@/components/onboarding/currency-button-group"
import { OnboardingProgress } from "@/components/onboarding/onboarding-progress"
import {
  CategoryStep,
  STORE_CATEGORIES,
} from "@/components/onboarding/steps/category-step"
import { DomainCurrencyStep } from "@/components/onboarding/steps/domain-currency-step"
import { StoreDetailsStep } from "@/components/onboarding/steps/store-details-step"
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
import * as React from "react"

const TOTAL_STEPS = 3

export default function CreateStorePage() {
  const [step, setStep] = React.useState(0)
  const [categoryId, setCategoryId] = React.useState<string | null>(null)
  const [primaryCurrencyCode, setPrimaryCurrencyCode] =
    React.useState<CurrencyCode>("SYP")
  const [slug, setSlug] = React.useState("")

  const selectedCategory = STORE_CATEGORIES.find((c) => c.id === categoryId)

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

  function handleDomainCurrencySubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
  }

  return (
    <Card className="w-full max-w-xl">
      <CardHeader className="mb-2 text-center">
        <Avatar className="mx-auto mb-2 rounded-lg bg-primary p-8 text-5xl">
          <AvatarImage src="/logo.png" alt="logo" />
          <AvatarFallback className="font-bold text-primary-foreground">
            SOOQ
          </AvatarFallback>
        </Avatar>

        <CardTitle>إنشاء متجر</CardTitle>
        <CardDescription>
          أكمل الخطوات التالية للبدء في البيع عبر SOOQ
        </CardDescription>

        <div className="mt-4 flex justify-center">
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
        />
      )}
    </Card>
  )
}
