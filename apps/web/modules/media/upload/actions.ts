import { api } from "@/lib/api"

import type { UploadedMedia, UploadMediaResponse } from "./types"

export const mediaKeys = {
  all: ["media"] as const,
}

type Envelope<T> = {
  success: boolean
  data?: T
  message?: string
}

export const uploadMedia = async (
  files: File[]
): Promise<UploadMediaResponse> => {
  if (files.length === 0) {
    return { items: [], assetIds: [] }
  }

  const formData = new FormData()
  files.forEach((file) => {
    formData.append("files", file)
  })

  // Axios auto-detects FormData and sets the multipart boundary; the request
  // interceptor in lib/api.ts adds the Bearer header automatically.
  const response = await api<Envelope<UploadedMedia[]>>("/media/upload", {
    method: "POST",
    body: formData,
  })

  const items = response.data ?? []
  return {
    items,
    assetIds: items.map((it) => it.assetId),
  }
}

export const getUploadMediaMutationOptions = ({
  onSuccess,
}: {
  onSuccess?: (response: UploadMediaResponse) => void
} = {}) => ({
  mutationFn: uploadMedia,
  onSuccess: (response: UploadMediaResponse) => {
    onSuccess?.(response)
  },
})
