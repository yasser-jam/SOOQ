"use client"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import { ImagePlus, X } from "lucide-react"
import * as React from "react"

import {
  getMediaPreviewUrl,
  releaseMediaPreviewUrl,
  validateImageFile,
} from "@/modules/media/upload/init"
import { MEDIA_CONSTRAINTS } from "@/modules/media/upload/types"

type StoreLogoUploaderProps = {
  id?: string
  value: File | null
  onChange: (file: File | null) => void
  disabled?: boolean
  error?: string | null
  className?: string
}

export function StoreLogoUploader({
  id = "storeLogo",
  value,
  onChange,
  disabled,
  error,
  className,
}: StoreLogoUploaderProps) {
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null)
  const [localError, setLocalError] = React.useState<string | null>(null)
  const inputRef = React.useRef<HTMLInputElement | null>(null)

  React.useEffect(() => {
    if (!value) {
      setPreviewUrl(null)
      return
    }
    const url = getMediaPreviewUrl(value)
    setPreviewUrl(url)
    return () => releaseMediaPreviewUrl(url)
  }, [value])

  const handleFile = (file: File | null) => {
    setLocalError(null)
    if (!file) {
      onChange(null)
      return
    }
    const result = validateImageFile(file)
    if (!result.ok) {
      setLocalError(result.error)
      onChange(null)
      return
    }
    onChange(file)
  }

  const displayedError = error ?? localError
  const acceptAttr = MEDIA_CONSTRAINTS.allowedTypes.join(",")

  return (
    <div className={cn("grid gap-2", className)}>
      <span className="flex items-center gap-2 text-sm leading-none font-medium">
        <ImagePlus className="size-4" aria-hidden />
        شعار المتجر
      </span>

      {previewUrl ? (
        <div className="flex items-center gap-3 rounded-xl border bg-card p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="معاينة الشعار"
            className="size-16 rounded-lg object-cover"
          />
          <div className="flex flex-col gap-1 text-xs text-muted-foreground">
            <span className="line-clamp-1 text-foreground">{value?.name}</span>
            <span>{value ? `${Math.round(value.size / 1024)} KB` : ""}</span>
          </div>
          <div className="ms-auto flex gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled}
              onClick={() => inputRef.current?.click()}
            >
              تغيير
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={disabled}
              onClick={() => handleFile(null)}
              aria-label="إزالة الشعار"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>
      ) : (
        <label
          htmlFor={id}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted/20 px-4 py-6 text-center transition-colors hover:border-muted-foreground/50 hover:bg-muted/40 sm:py-7",
            disabled && "pointer-events-none opacity-60"
          )}
        >
          <ImagePlus
            className="text-muted-foreground size-8 stroke-[1.25] sm:size-9"
            aria-hidden
          />
          <span className="text-muted-foreground text-sm">
            اسحب الصورة هنا أو اضغط للاختيار
          </span>
          <span className="text-muted-foreground/80 text-xs">
            PNG أو JPG أو WebP — حتى 5 ميغابايت
          </span>
        </label>
      )}

      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={acceptAttr}
        className="sr-only"
        disabled={disabled}
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />

      {displayedError ? (
        <span className="text-xs text-destructive">{displayedError}</span>
      ) : null}
    </div>
  )
}
