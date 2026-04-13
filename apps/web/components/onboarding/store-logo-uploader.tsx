"use client"

import { cn } from "@workspace/ui/lib/utils"
import { ImagePlus } from "lucide-react"

type StoreLogoUploaderProps = {
  id?: string
  className?: string
}

export function StoreLogoUploader({
  id = "storeLogo",
  className,
}: StoreLogoUploaderProps) {
  return (
    <div className={cn("grid gap-2", className)}>
      <span className="flex items-center gap-2 text-sm leading-none font-medium">
        <ImagePlus className="size-4" aria-hidden />
        شعار المتجر
      </span>
      <label
        htmlFor={id}
        className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted/20 px-4 py-6 text-center transition-colors hover:border-muted-foreground/50 hover:bg-muted/40 sm:py-7"
      >
        <input
          id={id}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
        />
        <ImagePlus
          className="text-muted-foreground size-8 stroke-[1.25] sm:size-9"
          aria-hidden
        />
        <span className="text-muted-foreground text-sm">
          اسحب الصورة هنا أو اضغط للاختيار
        </span>
        <span className="text-muted-foreground/80 text-xs">
          PNG أو JPG أو WebP — اختياري
        </span>
      </label>
    </div>
  )
}
