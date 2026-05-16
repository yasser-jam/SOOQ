import z from "zod"

export const createCustomerNoteSchema = z.object({
  noteText: z
    .string()
    .trim()
    .min(1, "نص الملاحظة مطلوب")
    .max(4000, "الحد الأقصى 4000 حرف"),
  isPrivate: z.boolean().optional(),
})

/**
 * The backend treats `isPrivate: null` as "no change". We model this on
 * the FE as an explicit `null` so the form can transmit "leave the flag
 * as-is" when editing only the text.
 */
export const updateCustomerNoteSchema = z.object({
  noteText: z
    .string()
    .trim()
    .min(1, "نص الملاحظة مطلوب")
    .max(4000, "الحد الأقصى 4000 حرف"),
  isPrivate: z.boolean().nullable().optional(),
})
