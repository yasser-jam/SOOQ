import * as z from "zod"

import { optionalString, requiredString } from "@/lib/schema"

import { ATTRIBUTE_DATA_TYPES } from "./types"

export const attributeOptionSchema = z.object({
  attributeOptionId: optionalString(),
  optionValueAr: requiredString("القيمة بالعربية"),
  optionValueEn: requiredString("القيمة بالإنجليزية"),
  sortOrder: z.coerce.number().int().min(0).default(0),
})

export const attributeDefinitionSchema = z
  .object({
    attributeDefId: optionalString(),
    categoryId: z.string().nullable().optional(),
    attributeNameAr: requiredString("اسم السمة بالعربية"),
    attributeNameEn: requiredString("اسم السمة بالإنجليزية"),
    attributeKey: requiredString("المفتاح").regex(
      /^[a-z0-9_]+$/i,
      "أحرف وأرقام وشرطة سفلية فقط"
    ),
    dataType: z.enum(ATTRIBUTE_DATA_TYPES),
    isRequired: z.boolean().default(false),
    isFilterable: z.boolean().default(false),
    isVisibleOnStorefront: z.boolean().default(true),
    sortOrder: z.coerce.number().int().min(0).default(0),
    options: z.array(attributeOptionSchema).default([]),
  })
  .refine(
    (data) =>
      data.dataType !== "SELECT" && data.dataType !== "MULTI_SELECT"
        ? true
        : (data.options?.length ?? 0) > 0,
    {
      message: "أضف خياراً واحداً على الأقل لنوع SELECT/MULTI_SELECT",
      path: ["options"],
    }
  )
