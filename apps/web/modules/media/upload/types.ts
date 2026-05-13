export type UploadedMedia = {
  assetId: string
  publicUrl: string
  mimeType: string
  filename: string
}

export type UploadMediaResponse = {
  items: UploadedMedia[]
  /** Convenience — same order as `items` for callers that only need the ids. */
  assetIds: string[]
}

export const MEDIA_CONSTRAINTS = {
  maxBytes: 5 * 1024 * 1024,
  allowedTypes: ["image/jpeg", "image/png", "image/webp"] as const,
} as const

export type AllowedMediaType = (typeof MEDIA_CONSTRAINTS.allowedTypes)[number]
