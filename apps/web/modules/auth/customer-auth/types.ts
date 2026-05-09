import type * as z from "zod"

import type {
  requestCustomerOtpSchema,
  verifyCustomerOtpSchema,
} from "./schema"

export type RequestCustomerOtpInput = z.infer<typeof requestCustomerOtpSchema>
export type VerifyCustomerOtpInput = z.infer<typeof verifyCustomerOtpSchema>
