import * as z from "zod"

export const revokeSessionSchema = z.object({
  jti: z.string().trim().min(1, "معرف الجلسة مطلوب"),
})

export type RevokeSessionInput = z.infer<typeof revokeSessionSchema>
