import * as z from "zod"

export const disablePlatformTenantSchema = z.object({
  tenantId: z.string().trim().uuid("معرّف غير صالح"),
})

export type DisablePlatformTenantInput = z.infer<
  typeof disablePlatformTenantSchema
>
