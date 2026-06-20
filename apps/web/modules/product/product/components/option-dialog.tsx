"use client"

import { useMemo, type FormEvent } from "react"

import { zodResolver } from "@hookform/resolvers/zod"
import { Minus, Plus } from "lucide-react"
import { useFieldArray, useForm } from "react-hook-form"
import { z } from "zod"

import Field from "@/components/system/Field"
import type { ProductOption, VariantOptionValues } from "@/modules/product/product/types"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { FieldError } from "@workspace/ui/components/field"
import { variantOptionSchema } from "../schema"




type VariantOptionDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onChange: (option: ProductOption) => void
  disabled?: boolean
  nextSortOrder?: number
}

const defaultValues: VariantOptionValues = {
  optionNameAr: "",
  optionNameEn: "",
  values: [{ valueAr: "", valueEn: "" }],
}

export default function VariantOptionDialog({
  open,
  onOpenChange,
  onChange,
  disabled,
  nextSortOrder = 0,
}: VariantOptionDialogProps) {
  const form = useForm<VariantOptionValues>({
    resolver: zodResolver(variantOptionSchema),
    defaultValues,
  })

  const valuesError = form.formState.errors.values

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "values",
  })

  const canRemoveRows = useMemo(() => fields.length > 1, [fields.length])

  const handleSave = form.handleSubmit((values) => {
    onChange({
      optionNameAr: values.optionNameAr,
      optionNameEn: values.optionNameEn,
      sortOrder: nextSortOrder,
      values: values.values.map((value, index) => ({
        valueAr: value.valueAr,
        valueEn: value.valueEn,
        colorHex: undefined,
        sortOrder: index,
      })),
    })

    form.reset(defaultValues)
    onOpenChange(false)
  })

  const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    event.stopPropagation()
    void handleSave(event)
  }

  const handleDialogChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      form.reset(defaultValues)
    }

    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent size="md" showCloseButton={!disabled}>
        <DialogHeader>
          <DialogTitle>إضافة خيار</DialogTitle>
          {/* <DialogDescription>
            أضف اسم الخيار ثم أنشئ القيم كسطور منفصلة بالعربية والإنجليزية.
          </DialogDescription> */}
        </DialogHeader>

        <form
          id="variant-option-form"
          className="flex flex-col gap-5"
          onSubmit={handleFormSubmit}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field
              name="optionNameAr"
              control={form.control}
              label="اسم الخيار بالعربية"
              placeholder="مثال: اللون"
              inputProps={{ disabled }}
            />

            <Field
              name="optionNameEn"
              control={form.control}
              label="اسم الخيار بالإنجليزية"
              placeholder="Example: Color"
              inputProps={{ disabled }}
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <h3 className="text-sm font-medium">القيم</h3>
              <p className="text-sm text-muted-foreground">
                كل صف يمثل قيمة واحدة لهذا الخيار.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ valueAr: "", valueEn: "" })}
              disabled={disabled}
            >
              <Plus data-icon="inline-end" />
              إضافة صف
            </Button>
          </div>

          <div className="flex flex-col gap-3">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="rounded-xl border border-border/70 bg-muted/35 p-4"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="text-sm font-medium">
                    القيمة {index + 1}
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                    disabled={disabled || !canRemoveRows}
                  >
                    <Minus data-icon="inline-end" />
                    حذف الصف
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field
                    name={`values.${index}.valueAr`}
                    control={form.control}
                    label="القيمة بالعربية"
                    placeholder="مثال: أحمر"
                    inputProps={{ disabled }}
                  />

                  <Field
                    name={`values.${index}.valueEn`}
                    control={form.control}
                    label="القيمة بالإنجليزية"
                    placeholder="Example: Red"
                    inputProps={{ disabled }}
                  />
                </div>
              </div>
            ))}
          </div>

          <FieldError errors={valuesError ? [valuesError] : []} />
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleDialogChange(false)}
            disabled={disabled}
          >
            إلغاء
          </Button>
          <Button
            type="button"
            onClick={() => void handleSave()}
            disabled={disabled}
          >
            حفظ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
