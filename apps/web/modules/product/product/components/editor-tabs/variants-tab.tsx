"use client"

import { useState } from "react"
import { Plus, Trash2Icon } from "lucide-react"
import { useFormContext, useWatch } from "react-hook-form"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { FieldError } from "@workspace/ui/components/field"

import VariantOptionDialog from "@/modules/product/product/components/option-dialog"
import { normalizeOptionSortOrder } from "@/modules/product/product/helpers"
import type {
  ProductOption,
  ProductOptionValue,
} from "@/modules/product/product/types"

type Props = {
  isSubmitting: boolean
}

/**
 * Phase 2: option-axis builder + display (existing UX preserved verbatim).
 * Phase 3A will add the full Cartesian variant matrix below the options card.
 */
export default function VariantsTab({ isSubmitting }: Props) {
  const form = useFormContext()
  const [optionsDialogOpen, setOptionsDialogOpen] = useState(false)

  const productOptions: ProductOption[] =
    (useWatch({
      control: form.control,
      name: "options",
    }) as ProductOption[] | undefined) ?? []

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">خيارات المنتج</CardTitle>
          <CardDescription>
            حتى 3 محاور خيارات (المقاس، اللون، المادة...). كل قيمة تُولّد متغيّراً
            تلقائياً.
          </CardDescription>
          <CardAction>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOptionsDialogOpen(true)}
              disabled={isSubmitting}
            >
              إضافة خيار
              <Plus data-icon="inline-end" />
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {productOptions.map((option, optionIndex) => (
              <Card key={`${option.optionNameAr}-${optionIndex}`} size="sm">
                <CardHeader>
                  <CardTitle className="text-lg">
                    {option.optionNameAr}
                  </CardTitle>
                  <CardDescription>{option.optionNameEn}</CardDescription>
                  <CardAction>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => {
                        const nextOptions = productOptions.filter(
                          (_, index) => index !== optionIndex
                        )

                        form.setValue(
                          "options",
                          normalizeOptionSortOrder(nextOptions),
                          {
                            shouldDirty: true,
                            shouldValidate: true,
                          }
                        )
                      }}
                      disabled={isSubmitting}
                    >
                      <Trash2Icon data-icon="inline-start" className="p-0.5" />
                    </Button>
                  </CardAction>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {option.values.map((value: ProductOptionValue, valueIndex: number) => (
                      <Badge
                        key={`${value.valueAr}-${valueIndex}`}
                        variant="secondary"
                      >
                        {value.valueAr}
                        {value.colorHex ? ` (${value.colorHex})` : ""}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}

            {!productOptions.length && (
              <div className="rounded-lg border p-4 text-sm text-muted-foreground">
                لا يوجد خيارات مضافة بعد.
              </div>
            )}
          </div>
          <FieldError errors={[form.formState.errors.options]} />
        </CardContent>
      </Card>

      <VariantOptionDialog
        open={optionsDialogOpen}
        onOpenChange={setOptionsDialogOpen}
        disabled={isSubmitting}
        nextSortOrder={productOptions.length}
        onChange={(option) => {
          form.setValue(
            "options",
            normalizeOptionSortOrder([...productOptions, option]),
            {
              shouldDirty: true,
              shouldValidate: true,
            }
          )
        }}
      />
    </>
  )
}
