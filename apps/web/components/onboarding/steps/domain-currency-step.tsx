"use client"

import {
  CurrencyButtonGroup,
  type CurrencyCode,
} from "@/components/onboarding/currency-button-group"
import { Button } from "@workspace/ui/components/button"
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { ArrowLeftIcon, ArrowRightIcon, Link2 } from "lucide-react"
import * as React from "react"

type DomainCurrencyStepProps = {
  categoryLabel: string
  slug: string
  onSlugChange: (value: string) => void
  primaryCurrencyCode: CurrencyCode
  onPrimaryCurrencyChange: (code: CurrencyCode) => void
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  onPrevious: () => void
}

export function DomainCurrencyStep({
  categoryLabel,
  slug,
  onSlugChange,
  primaryCurrencyCode,
  onPrimaryCurrencyChange,
  onSubmit,
  onPrevious,
}: DomainCurrencyStepProps) {
  return (
    <form onSubmit={onSubmit}>
      <CardHeader className="space-y-1 pt-0 text-center">
        <CardTitle className="text-xl">الرابط والعملة</CardTitle>
        <CardDescription>
          حدّد عنوان متجرك على SOOQ والعملة الافتراضية للأسعار
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-6">
          <div className="rounded-xl border bg-muted/30 p-3 text-start">
            <p className="text-sm text-muted-foreground">التصنيف</p>
            <p className="font-medium">{categoryLabel}</p>
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
                onSlugChange(
                  e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")
                )
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
            <p className="text-xs leading-relaxed text-muted-foreground">
              يمكنك تغيير اسم المتجر من الإعدادات
            </p>
          </div>

          <CurrencyButtonGroup
            value={primaryCurrencyCode}
            onValueChange={onPrimaryCurrencyChange}
          />
        </div>
      </CardContent>
      <CardFooter className="onboarding-step-footer">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full sm:w-auto"
          onClick={onPrevious}
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
  )
}
