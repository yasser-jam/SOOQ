export type UploadMediaResponse = {
  assetIds: string[]
}

export const MEDIA_CONSTRAINTS = {
  maxBytes: 5 * 1024 * 1024,
  allowedTypes: ["image/jpeg", "image/png", "image/webp"] as const,
} as const

export type AllowedMediaType = (typeof MEDIA_CONSTRAINTS.allowedTypes)[number]
