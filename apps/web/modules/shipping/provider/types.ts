import * as z from "zod"

import { shippingProviderSchema } from "./schema"

export type ShippingProvider = z.infer<typeof shippingProviderSchema>

export type ShippingProviderUpsertPayload = {
  providerCode: ShippingProvider["providerCode"]
  providerName: ShippingProvider["providerName"]
  apiBaseUrl?: ShippingProvider["apiBaseUrl"]
  apiKey?: ShippingProvider["apiKey"]
  webhookSecret?: ShippingProvider["webhookSecret"]
  priority?: ShippingProvider["priority"]
}

export type UpdateShippingProviderInput = {
  id: string
  data: Partial<ShippingProviderUpsertPayload>
}
