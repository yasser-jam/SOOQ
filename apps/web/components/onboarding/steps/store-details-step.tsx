"use client"

import { StoreLogoUploader } from "@/components/onboarding/store-logo-uploader"
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
import { ArrowLeftIcon, ArrowRightIcon, Store } from "lucide-react"
import * as React from "react"

type StoreDetailsStepProps = {
  categoryId: string | null
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  onPrevious: () => void
}

export function StoreDetailsStep({
  categoryId,
  onSubmit,
  onPrevious,
}: StoreDetailsStepProps) {
  return (
    <form onSubmit={onSubmit}>
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
          التالي
          <ArrowLeftIcon className="size-3.5" />
        </Button>
      </CardFooter>
    </form>
  )
}
