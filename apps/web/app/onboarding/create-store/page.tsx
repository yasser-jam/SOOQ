"use client"

import {
  CurrencyButtonGroup,
  type CurrencyCode,
} from "@/components/onboarding/currency-button-group"
import { OnboardingProgress } from "@/components/onboarding/onboarding-progress"
import { StoreLogoUploader } from "@/components/onboarding/store-logo-uploader"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { cn } from "@workspace/ui/lib/utils"
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  Dumbbell,
  Home,
  Link2,
  Shirt,
  Smartphone,
  Sparkles,
  Store,
  UtensilsCrossed,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import * as React from "react"

const STORE_CATEGORIES: {
  id: string
  name: string
  Icon: LucideIcon
}[] = [
  { id: "fashion", name: "أزياء وملابس", Icon: Shirt },
  { id: "electronics", name: "إلكترونيات", Icon: Smartphone },
  { id: "food", name: "أطعمة ومشروبات", Icon: UtensilsCrossed },
  { id: "beauty", name: "تجميل وعناية", Icon: Sparkles },
  { id: "home", name: "منزل وديكور", Icon: Home },
  { id: "sports", name: "رياضة ولياقة", Icon: Dumbbell },
]

const TOTAL_STEPS = 3

const onboardingNavFooterClass =
  "mx-5 mb-6 mt-2 flex flex-row items-center justify-between gap-4 px-1 sm:mx-7"

export default function CreateStorePage() {
  const [step, setStep] = React.useState(0)
  const [categoryId, setCategoryId] = React.useState<string | null>(null)
  const [primaryCurrencyCode, setPrimaryCurrencyCode] =
    React.useState<CurrencyCode>("SYP")
  const [slug, setSlug] = React.useState("")

  const canGoNextFromStep1 = categoryId !== null
  const selectedCategory = STORE_CATEGORIES.find((c) => c.id === categoryId)

  function goNext() {
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1))
  }

  function goPrevious() {
    setStep((s) => Math.max(s - 1, 0))
  }

  function handleStep2Submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    goNext()
  }

  function handleStep3Submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
  }

  return (
    <Card className="w-full max-w-lg">
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
      </CardHeader>

      <div className="px-6 pb-4">
        <OnboardingProgress currentStep={step} />
      </div>

      {step === 0 && (
        <>
          <CardHeader className="space-y-1 pt-0 text-center">
            <CardTitle className="text-xl">اختر تصنيف متجرك</CardTitle>
            <CardDescription>
              يمكنك تغيير التفاصيل لاحقاً من إعدادات المتجر
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className="grid grid-cols-2 gap-3 sm:grid-cols-3"
              role="radiogroup"
              aria-label="تصنيف المتجر"
            >
              {STORE_CATEGORIES.map(({ id, name, Icon }) => {
                const selected = categoryId === id
                return (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setCategoryId(id)}
                    className={cn(
                      "flex flex-col items-center gap-3 rounded-xl border-2 p-4 text-center transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      selected
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border bg-card hover:bg-muted/50"
                    )}
                  >
                    <Avatar
                      className={cn(
                        "size-16 rounded-xl border border-border bg-muted/80",
                        selected && "border-primary/40 bg-primary/10"
                      )}
                    >
                      <AvatarFallback
                        className={cn(
                          "rounded-xl text-primary",
                          selected && "bg-primary/15"
                        )}
                      >
                        <Icon className="size-8" strokeWidth={1.5} />
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium leading-snug">
                      {name}
                    </span>
                  </button>
                )
              })}
            </div>
          </CardContent>
          <CardFooter className={onboardingNavFooterClass}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-none"
              disabled
              aria-label="السابق — غير متاح في هذه الخطوة"
            >
              السابق
              <ArrowRightIcon className="size-3.5" />
            </Button>
            <Button
              type="button"
              size="sm"
              className="flex-1 sm:flex-none"
              disabled={!canGoNextFromStep1}
              onClick={goNext}
            >
              التالي
              <ArrowLeftIcon className="size-3.5" />
            </Button>
          </CardFooter>
        </>
      )}

      {step === 1 && (
        <form onSubmit={handleStep2Submit}>
          <CardHeader className="space-y-1 pt-0 text-center">
            <CardTitle className="text-xl">بيانات المتجر</CardTitle>
            <CardDescription>
              أدخل بيانات متجرك للبدء في البيع عبر SOOQ
            </CardDescription>
          </CardHeader>
          <CardContent>
            <input type="hidden" name="storeCategoryId" value={categoryId ?? ""} />
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="storeName">
                  <Store />
                  اسم المتجر
                </Label>
                <Input
                  id="storeName"
                  name="storeName"
                  placeholder="متجري"
                  required
                  autoComplete="organization"
                />
              </div>

              <StoreLogoUploader />
            </div>
          </CardContent>
          <CardFooter className={onboardingNavFooterClass}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
              onClick={goPrevious}
            >
              السابق
              <ArrowRightIcon className="size-3.5" />
            </Button>
            <Button type="submit" size="sm" className="w-full sm:w-auto">
              التالي
              <ArrowLeftIcon className="size-3.5" />
            </Button>
          </CardFooter>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleStep3Submit}>
          <CardHeader className="space-y-1 pt-0 text-center">
            <CardTitle className="text-xl">الرابط والعملة</CardTitle>
            <CardDescription>
              حدّد عنوان متجرك على SOOQ والعملة الافتراضية للأسعار
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-6">
              <div className="rounded-xl border bg-muted/30 p-3 text-start">
                <p className="text-muted-foreground text-sm">التصنيف</p>
                <p className="font-medium">{selectedCategory?.name ?? "—"}</p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="storeSlug">
                  <Link2 className="size-4" />
                  رابط المتجر (النطاق)
                </Label>
                <Input
                  id="storeSlug"
                  name="slug"
                  value={slug}
                  onChange={(e) =>
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
                  }
                  placeholder="my-store"
                  pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  required
                  dir="ltr"
                  className="text-left"
                />
                <p className="text-muted-foreground text-xs leading-relaxed">
                  يمكنك تغيير اسم المتجر من الإعدادات
                </p>
              </div>

              <CurrencyButtonGroup
                value={primaryCurrencyCode}
                onValueChange={setPrimaryCurrencyCode}
              />
            </div>
          </CardContent>
          <CardFooter className={onboardingNavFooterClass}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
              onClick={goPrevious}
            >
              السابق
              <ArrowRightIcon className="size-3.5" />
            </Button>
            <Button type="submit" size="sm" className="w-full sm:w-auto">
              إنهاء الإعداد
              <ArrowLeftIcon className="size-3.5" />
            </Button>
          </CardFooter>
        </form>
      )}
    </Card>
  )
}
