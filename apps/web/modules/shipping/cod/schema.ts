import { z } from "zod"

export const createCodReconciliationBatchSchema = z.object({
  shippingProviderId: z.string().min(1, "الرجاء اختيار مزود الشحن"),
  providerFeePercentage: z
    .number()
    .min(0, "يجب أن تكون النسبة 0 أو أكثر")
    .max(100, "يجب أن تكون النسبة 100 أو أقل"),
  settlementDate: z.string().min(1, "الرجاء اختيار التاريخ"),
  notes: z.string().optional(),
})
