import * as z from "zod"

import { MEDIA_CONSTRAINTS } from "./types"

const isAllowedMediaType = (type: string): boolean =>
  (MEDIA_CONSTRAINTS.allowedTypes as readonly string[]).includes(type)

export const singleImageFileSchema = z
  .instanceof(File, { message: "اختر ملفاً" })
  .refine((file) => isAllowedMediaType(file.type), {
    message: "الملف يجب أن يكون JPG أو PNG أو WebP",
  })
  .refine((file) => file.size <= MEDIA_CONSTRAINTS.maxBytes, {
    message: "حجم الملف يجب أن يكون 5 ميغابايت أو أقل",
  })
