import * as z from "zod"

import { optionalString, requiredString } from "@/lib/schema"

export const shippingProviderSchema = z.object({
  id: optionalString(),
  providerCode: requiredString("الكود"),
  providerName: requiredString("الاسم"),
  apiBaseUrl: optionalString(),
  apiKey: optionalString(),
  webhookSecret: optionalString(),
  priority: z.coerce.number().int().optional(),
  hasApiKey: z.boolean().optional(),
  hasWebhookSecret: z.boolean().optional(),
  isActive: z.boolean().optional(),
  createdAt: optionalString(),
  updatedAt: optionalString(),
})
