import { MEDIA_CONSTRAINTS } from "./types"

export type FileValidationResult =
  | { ok: true }
  | { ok: false; error: string }

const isAllowedMediaType = (type: string): boolean =>
  (MEDIA_CONSTRAINTS.allowedTypes as readonly string[]).includes(type)

export const validateImageFile = (file: File): FileValidationResult => {
  if (!isAllowedMediaType(file.type)) {
    return { ok: false, error: "الملف يجب أن يكون JPG أو PNG أو WebP" }
  }
  if (file.size > MEDIA_CONSTRAINTS.maxBytes) {
    return { ok: false, error: "حجم الملف يجب أن يكون 5 ميغابايت أو أقل" }
  }
  return { ok: true }
}

export const getMediaPreviewUrl = (file: File): string =>
  URL.createObjectURL(file)

export const releaseMediaPreviewUrl = (url: string): void => {
  if (url.startsWith("blob:")) {
    URL.revokeObjectURL(url)
  }
}
