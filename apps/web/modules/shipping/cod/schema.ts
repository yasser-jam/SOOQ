import * as z from "zod"

import { optionalString } from "@/lib/schema"

export const createCodReconciliationBatchSchema = z.object({
  shippingProviderId: z.string().trim().min(1, "الرجاء اختيار مزود الشحن"),
  providerFeePercentage: z.coerce
    .number()
    .min(0, "يجب أن تكون النسبة 0 أو أكثر")
    .max(100, "يجب أن تكون النسبة 100 أو أقل"),
  settlementDate: z.string().trim().min(1, "الرجاء اختيار التاريخ"),
  notes: optionalString(),
})
