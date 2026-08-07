import * as z from "zod"

import { optionalString } from "@/lib/schema"

export const auditLogFiltersSchema = z.object({
  action: optionalString(),
  actorUserId: optionalString(),
  from: optionalString(),
  to: optionalString(),
  page: z.number().int().min(0).default(0),
  size: z.number().int().min(1).max(100).default(20),
})
