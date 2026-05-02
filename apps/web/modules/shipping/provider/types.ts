import * as z from "zod"

import { shippingProviderSchema } from "./schema"

export type ShippingProvider = z.infer<typeof shippingProviderSchema>
