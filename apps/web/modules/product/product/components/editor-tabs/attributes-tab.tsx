"use client"

import { useEffect, useMemo } from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { Controller, useFormContext, useWatch } from "react-hook-form"
import { Boxes, ExternalLink } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Field as UiField,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

import {
  attributeQueryKeys,
  listAttributeDefinitions,
} from "@/modules/product/attribute/actions"
import type {
  ProductAttributeDefinition,
  ProductAttributeValue,
} from "@/modules/product/attribute/types"

type Props = {
  isSubmitting: boolean
}

/**
 * Per-product attribute value editor.
 * Reads attribute SCHEMA from the backend (filtered by the product's
 * defaultCategoryId so merchants only see relevant attributes), then renders
 * the appropriate input for each `dataType` and binds value(s) to the form's
 * `attributes` field (which is sent inside ProductUpsertRequestDto.attributes).
 */
export default function AttributesTab({ isSubmitting }: Props) {
  const form = useFormContext()

  const defaultCategoryId = useWatch({
    control: form.control,
    name: "defaultCategoryId",
  }) as string | undefined

  const { data: definitions, isPending } = useQuery({
    queryKey: attributeQueryKeys.list(defaultCategoryId ?? null),
    queryFn: () =>
      listAttributeDefinitions(defaultCategoryId ? defaultCategoryId : null),
  })

  // Existing values from the form (initialized empty, populated when editing)
  const currentAttributes = useWatch({
    control: form.control,
    name: "attributes",
  }) as ProductAttributeValue[] | undefined

  const valuesByDef = useMemo(() => {
    const map = new Map<string, ProductAttributeValue>()
    for (const v of currentAttributes ?? []) {
      if (v.attributeDefId) map.set(v.attributeDefId, v)
    }
    return map
  }, [currentAttributes])

  // Make sure the field exists in the form (even if empty) so set/get works
  useEffect(() => {
    if (currentAttributes === undefined) {
      form.setValue("attributes", [], { shouldDirty: false })
    }
  }, [currentAttributes, form])

  const writeValue = (
    defId: string,
    next: Partial<ProductAttributeValue>
  ) => {
    const list = (currentAttributes ?? []).filter(
      (v) => v.attributeDefId !== defId
    )
    const merged: ProductAttributeValue = {
      attributeDefId: defId,
      ...valuesByDef.get(defId),
      ...next,
    }
    // Trim empty entries (no valueText, no options)
    const isEmpty =
      !merged.valueText &&
      (!merged.attributeOptionIds || merged.attributeOptionIds.length === 0)
    form.setValue(
      "attributes",
      isEmpty ? list : [...list, merged],
      { shouldDirty: true, shouldValidate: false }
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">السمات المخصّصة</CardTitle>
        <CardDescription>
          تعريف السمات يتم في{" "}
          <Link
            href="/products/attributes"
            className="underline underline-offset-2"
          >
            صفحة السمات
          </Link>
          . تظهر هنا حسب الفئة الافتراضية للمنتج.
        </CardDescription>
        <CardAction>
          <Button asChild variant="ghost" size="sm">
            <Link href="/products/attributes">
              إدارة السمات <ExternalLink className="size-4" />
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : !definitions || definitions.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-10 text-center">
            <Boxes className="size-8 text-muted-foreground" />
            <p className="text-sm font-medium">
              لا توجد سمات مرتبطة بهذه الفئة
            </p>
            <p className="text-xs text-muted-foreground max-w-sm">
              أنشئ سمات على المتجر أو على الفئة المختارة لإسناد قيم لها هنا.
            </p>
          </div>
        ) : (
          <fieldset disabled={isSubmitting} className="flex flex-col gap-4">
            {definitions.map((def) =>
              renderAttributeField(
                def,
                valuesByDef.get(def.attributeDefId!),
                writeValue,
                form
              )
            )}
          </fieldset>
        )}
        <FieldError
          errors={[
            (form.formState.errors as Record<string, unknown>)
              .attributes as never,
          ]}
        />
      </CardContent>
    </Card>
  )
}

function renderAttributeField(
  def: ProductAttributeDefinition,
  current: ProductAttributeValue | undefined,
  writeValue: (
    defId: string,
    next: Partial<ProductAttributeValue>
  ) => void,
  form: ReturnType<typeof useFormContext>
) {
  const defId = def.attributeDefId!
  const baseLabel = (
    <FieldLabel htmlFor={`attr-${defId}`}>
      {def.attributeNameAr}{" "}
      {def.isRequired ? <span className="text-destructive">*</span> : null}
    </FieldLabel>
  )

  switch (def.dataType) {
    case "TEXT":
      return (
        <UiField key={defId}>
          {baseLabel}
          <Input
            id={`attr-${defId}`}
            value={current?.valueText ?? ""}
            onChange={(e) => writeValue(defId, { valueText: e.target.value })}
            placeholder={def.attributeNameEn}
          />
        </UiField>
      )

    case "NUMBER":
      return (
        <UiField key={defId}>
          {baseLabel}
          <Input
            id={`attr-${defId}`}
            type="number"
            value={current?.valueText ?? ""}
            onChange={(e) => writeValue(defId, { valueText: e.target.value })}
          />
          <FieldDescription>قيمة رقمية</FieldDescription>
        </UiField>
      )

    case "BOOLEAN":
      return (
        <UiField key={defId} className="flex items-center gap-3">
          <input
            id={`attr-${defId}`}
            type="checkbox"
            checked={current?.valueText === "true"}
            onChange={(e) =>
              writeValue(defId, { valueText: e.target.checked ? "true" : "false" })
            }
            className="size-4"
          />
          <FieldLabel htmlFor={`attr-${defId}`} className="m-0">
            {def.attributeNameAr}
          </FieldLabel>
        </UiField>
      )

    case "SELECT":
      return (
        <UiField key={defId}>
          {baseLabel}
          <Controller
            name={`attributes-shadow.${defId}`}
            control={form.control}
            defaultValue={current?.attributeOptionIds?.[0] ?? ""}
            render={({ field }) => (
              <Select
                value={field.value ?? ""}
                onValueChange={(v) => {
                  field.onChange(v)
                  writeValue(defId, { attributeOptionIds: [v] })
                }}
              >
                <SelectTrigger id={`attr-${defId}`}>
                  <SelectValue placeholder="اختر القيمة" />
                </SelectTrigger>
                <SelectContent>
                  {(def.options ?? []).map((opt) => (
                    <SelectItem
                      key={opt.attributeOptionId}
                      value={opt.attributeOptionId ?? ""}
                    >
                      {opt.optionValueAr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </UiField>
      )

    case "MULTI_SELECT": {
      const selected = new Set(current?.attributeOptionIds ?? [])
      return (
        <UiField key={defId}>
          {baseLabel}
          <div className="flex flex-wrap gap-2 rounded-lg border p-2">
            {(def.options ?? []).map((opt) => {
              const id = opt.attributeOptionId ?? ""
              const isOn = selected.has(id)
              return (
                <button
                  key={id}
                  type="button"
                  className={
                    "rounded-full border px-3 py-1 text-xs transition " +
                    (isOn
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-foreground hover:bg-accent")
                  }
                  onClick={() => {
                    const next = new Set(selected)
                    if (isOn) next.delete(id)
                    else next.add(id)
                    writeValue(defId, { attributeOptionIds: Array.from(next) })
                  }}
                >
                  {opt.optionValueAr}
                </button>
              )
            })}
          </div>
        </UiField>
      )
    }

    default:
      return null
  }
}
