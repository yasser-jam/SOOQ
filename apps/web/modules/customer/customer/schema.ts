import z from "zod"

const emptyToUndefined = (value: unknown) =>
  value === "" || value === null ? undefined : value

const optionalBoolean = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) return undefined
  if (typeof value === "boolean") return value
  if (typeof value === "string") {
    if (value === "true") return true
    if (value === "false") return false
  }
  return value
}, z.boolean().optional())

const optionalNonNegativeNumber = z.preprocess(
  emptyToUndefined,
  z.coerce
    .number({ message: "أدخل قيمة رقمية" })
    .min(0, "القيمة يجب أن تكون 0 أو أكثر")
    .optional()
)

export const customerSearchSchema = z
  .object({
    q: z.preprocess(emptyToUndefined, z.string().trim().optional()),
    minSpend: optionalNonNegativeNumber,
    maxSpend: optionalNonNegativeNumber,
    hasOrders: optionalBoolean,
    optedInEmail: optionalBoolean,
    optedInSms: optionalBoolean,
    sort: z.preprocess(emptyToUndefined, z.string().optional()),
    page: z.preprocess(
      emptyToUndefined,
      z.coerce.number().int().min(0).optional()
    ),
    size: z.preprocess(
      emptyToUndefined,
      z.coerce.number().int().min(1).max(200).optional()
    ),
  })
  .refine(
    (data) =>
      data.minSpend === undefined ||
      data.maxSpend === undefined ||
      data.minSpend <= data.maxSpend,
    {
      path: ["maxSpend"],
      message: "الحد الأقصى يجب أن يكون أكبر من أو يساوي الحد الأدنى",
    }
  )
