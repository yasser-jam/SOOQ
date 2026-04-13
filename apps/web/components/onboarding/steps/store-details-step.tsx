"use client"

import { StoreLogoUploader } from "@/components/onboarding/store-logo-uploader"
import { Button } from "@workspace/ui/components/button"
import { CardContent, CardFooter } from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { ArrowLeftIcon, ArrowRightIcon, Store } from "lucide-react"
import * as React from "react"

type StoreDetailsStepProps = {
  categoryId: string | null
  storeName: string
  onStoreNameChange: (value: string) => void
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  onPrevious: () => void
}

export function StoreDetailsStep({
  categoryId,
  storeName,
  onStoreNameChange,
  onSubmit,
  onPrevious,
}: StoreDetailsStepProps) {
  return (
    <form onSubmit={onSubmit}>
      <CardContent>
        <input type="hidden" name="storeCategoryId" value={categoryId ?? ""} />
        <div className="flex flex-col gap-6">
          <div className="grid gap-2">
            <Label htmlFor="storeName" className="text-sm text-muted-foreground">
              <Store className="size-4" />
              اسم المتجر
            </Label>
            <Input
              id="storeName"
              name="storeName"
              value={storeName}
              onChange={(e) => onStoreNameChange(e.target.value)}
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
          size="lg"
          className="w-full sm:w-auto"
          onClick={onPrevious}
        >
          السابق
          <ArrowRightIcon className="size-3.5" />
        </Button>

        <Button
          type="submit"
          variant="secondary"
          size="lg"
        >
          التالي
          <ArrowLeftIcon className="size-3.5" />
        </Button>
      </CardFooter>
    </form>
  )
}
