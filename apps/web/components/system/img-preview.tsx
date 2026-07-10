"use client"

import type { ImgHTMLAttributes, ReactNode } from "react"

import { resolveMediaUrl } from "@/lib/media"

type ImgPreviewProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  url?: string | null
  fallback?: ReactNode
}

export default function ImgPreview({
  url,
  fallback = null,
  alt = "",
  ...props
}: ImgPreviewProps) {
  const src = resolveMediaUrl(url)

  if (!src) return <>{fallback}</>

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...props} />
  )
}
