import * as z from "zod"

export const auditLogFiltersSchema = z.object({
  action: z.string().trim().optional().or(z.literal("")),
  actorUserId: z.string().trim().uuid("معرّف غير صالح").optional().or(z.literal("")),
  from: z.string().trim().optional().or(z.literal("")),
  to: z.string().trim().optional().or(z.literal("")),
  page: z.coerce.number().int().min(0).default(0),
  size: z.coerce.number().int().min(1).max(100).default(20),
})
