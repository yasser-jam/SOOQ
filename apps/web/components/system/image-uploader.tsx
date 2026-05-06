"use client"

import { ImageIcon, X } from "lucide-react"
import * as React from "react"

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

type ImageUploaderProps = {
  existingFiles?: string[]
  onChange?: (files: File[]) => void
}

export default function ImageUploader({
  existingFiles = [],
  onChange,
}: ImageUploaderProps) {
  const [files, setFiles] = React.useState<File[]>([])

  const handleFileChange = React.useCallback((files: File[]) => {
    setFiles(files)
    onChange?.(files)
  }, [onChange])

  return (
    <div className="flex flex-col gap-4">
      {existingFiles.length ? (
        <div className="flex flex-col gap-3">
          <div className="text-sm font-medium">الصور الحالية</div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {existingFiles.map((fileUrl) => (
              <div
                key={fileUrl}
                className="overflow-hidden rounded-lg border bg-muted/30"
              >
                <div className="aspect-square w-full bg-background">
                  <img
                    src={fileUrl}
                    alt="صورة المنتج"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <FileUpload
        accept="image/*"
        maxFiles={4}
        maxSize={4 * 1024 * 1024}
        className="w-full"
        value={files}
        onValueChange={handleFileChange}
        multiple
      >
        <FileUploadDropzone className="border-primary/20 bg-primary/5 hover:bg-primary/10 data-dragging:bg-primary/10">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="rounded-lg bg-primary/10 p-3">
              <ImageIcon className="size-8 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">رفع صور جديدة</p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, GIF حتى 4MB
              </p>
            </div>
          </div>
          <FileUploadTrigger asChild>
            <Button size="sm" className="mt-3">
              اختر الصور
            </Button>
          </FileUploadTrigger>
        </FileUploadDropzone>
        <FileUploadList>
          {files.map((file, index) => (
            <FileUploadItem key={`${file.name}-${index}`} value={file}>
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
      </FileUpload>
    </div>
  )
}
