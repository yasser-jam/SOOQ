import type * as z from "zod"

import type {
  requestPhoneChangeSchema,
  verifyPhoneChangeSchema,
} from "./schema"

export type RequestPhoneChangeInput = z.infer<typeof requestPhoneChangeSchema>
export type VerifyPhoneChangeInput = z.infer<typeof verifyPhoneChangeSchema>
