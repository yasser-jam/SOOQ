"use client"

import { ImageIcon, Star, X } from "lucide-react"
import * as React from "react"
import { toast } from "sonner"

import { Button } from "@workspace/ui/components/button"
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadItem,
  FileUploadItemDelete,
  FileUploadItemMetadata,
  FileUploadItemPreview,
  FileUploadList,
  FileUploadTrigger,
} from "@workspace/ui/components/file-upload"

export const title = "Image Dropzone"

export type ExistingImage = {
  /** mediaAssetId from the server */
  id: string
  /** Display URL */
  url: string
}

export type ImageUploaderState = {
  /** IDs of existing server-side images the user wants to KEEP (in display order) */
  keptExistingIds: string[]
  /** New files the user added in this editor session — to be uploaded as multipart `files` parts */
  newFiles: File[]
}

type ImageUploaderProps = {
  /** Existing images on the server (id + display URL). Editor passes these from `product.media`. */
  existing?: ExistingImage[]
  /**
   * Fires whenever the user adds new files OR removes an existing image.
   * Editor wires this to set form fields:
   *  - `mediaAssetIds = state.keptExistingIds`
   *  - `mediaFiles = state.newFiles`
   */
  onChange?: (state: ImageUploaderState) => void
  /** Hard limit per spec (PRD-004). Default 10. */
  maxFiles?: number
  /** Max bytes per file (default 5MB per spec). */
  maxSize?: number
}

const DEFAULT_MAX_FILES = 10
const DEFAULT_MAX_SIZE = 5 * 1024 * 1024

export default function ImageUploader({
  existing = [],
  onChange,
  maxFiles = DEFAULT_MAX_FILES,
  maxSize = DEFAULT_MAX_SIZE,
}: ImageUploaderProps) {
  const [keptIds, setKeptIds] = React.useState<string[]>(() =>
    existing.map((e) => e.id)
  )
  const [newFiles, setNewFiles] = React.useState<File[]>([])

  // Re-sync when the `existing` prop changes (e.g. after server response on update)
  const existingIdsKey = existing.map((e) => e.id).join(",")
  React.useEffect(() => {
    setKeptIds(existing.map((e) => e.id))
    // intentionally NOT clearing newFiles — those are the user's in-session uploads
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingIdsKey])

  const emit = React.useCallback(
    (nextKept: string[], nextNew: File[]) => {
      onChange?.({ keptExistingIds: nextKept, newFiles: nextNew })
    },
    [onChange]
  )

  const handleNewFilesChange = React.useCallback(
    (files: File[]) => {
      const totalCount = keptIds.length + files.length
      if (totalCount > maxFiles) {
        toast.error(`الحد الأقصى ${maxFiles} صور لكل منتج`)
        const allowed = files.slice(0, Math.max(0, maxFiles - keptIds.length))
        setNewFiles(allowed)
        emit(keptIds, allowed)
        return
      }
      setNewFiles(files)
      emit(keptIds, files)
    },
    [keptIds, maxFiles, emit]
  )

  const handleRemoveExisting = React.useCallback(
    (id: string) => {
      const next = keptIds.filter((existingId) => existingId !== id)
      setKeptIds(next)
      emit(next, newFiles)
    },
    [keptIds, newFiles, emit]
  )

  const onFileReject = React.useCallback((file: File, message: string) => {
    toast.error(message, {
      description: `"${file.name}" was rejected`,
    })
  }, [])

  // Build a quick lookup for existing url-by-id to render kept items
  const existingById = React.useMemo(() => {
    const map = new Map<string, ExistingImage>()
    existing.forEach((e) => map.set(e.id, e))
    return map
  }, [existing])

  const keptExisting = keptIds
    .map((id) => existingById.get(id))
    .filter((e): e is ExistingImage => Boolean(e))

  const totalCount = keptExisting.length + newFiles.length
  const remainingSlots = Math.max(0, maxFiles - totalCount)
  const primaryHint =
    keptExisting.length > 0 ? keptExisting[0]!.id : null

  return (
    <div className="flex flex-col gap-4">
      <FileUpload
        accept="image/*"
        maxFiles={remainingSlots}
        maxSize={maxSize}
        className="w-full"
        value={newFiles}
        onValueChange={handleNewFilesChange}
        onFileReject={onFileReject}
        multiple
        disabled={remainingSlots === 0}
      >
        <FileUploadDropzone className="border-primary/20 bg-primary/5 hover:bg-primary/10 data-dragging:bg-primary/10">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="rounded-lg bg-primary/10 p-3">
              <ImageIcon className="size-8 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">رفع الصور</p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, WebP — حتى {Math.round(maxSize / 1024 / 1024)}MB •
                المتبقّي {remainingSlots}/{maxFiles}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">
                الصورة الأولى تظهر كصورة رئيسية للمنتج
              </p>
            </div>
          </div>
          <FileUploadTrigger asChild>
            <Button size="sm" className="mt-3" disabled={remainingSlots === 0}>
              اختر الصور
            </Button>
          </FileUploadTrigger>
        </FileUploadDropzone>

        {newFiles.length > 0 ? (
          <FileUploadList>
            {newFiles.map((file, index) => (
              <FileUploadItem key={`new-${index}-${file.name}`} value={file}>
                <FileUploadItemPreview />
                <FileUploadItemMetadata />
                <FileUploadItemDelete asChild>
                  <Button variant="ghost" size="icon" className="size-7">
                    <X className="size-4" />
                  </Button>
                </FileUploadItemDelete>
              </FileUploadItem>
            ))}
          </FileUploadList>
        ) : null}
      </FileUpload>

      {keptExisting.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-muted-foreground">
            الصور الحالية ({keptExisting.length})
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {keptExisting.map((img) => (
              <div
                key={img.id}
                className="relative group rounded-md overflow-hidden border bg-muted/50 aspect-square"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt=""
                  className="object-cover w-full h-full"
                />
                {primaryHint === img.id ? (
                  <span className="absolute top-1 right-1 inline-flex items-center gap-1 rounded-sm bg-primary/90 text-primary-foreground text-[10px] px-1.5 py-0.5">
                    <Star className="size-3" />
                    رئيسية
                  </span>
                ) : null}
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute bottom-1 left-1 size-7 opacity-0 group-hover:opacity-100 transition"
                  onClick={() => handleRemoveExisting(img.id)}
                  type="button"
                  aria-label="حذف الصورة"
                >
                  <X className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
