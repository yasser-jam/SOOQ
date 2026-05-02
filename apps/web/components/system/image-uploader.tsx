"use client"

import { ImageIcon, X } from "lucide-react"
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

type ImageUploaderProps = {
  defaultFiles?: File[]
  onChange?: (files: string[]) => void
}

export default function ImageUploader({
  defaultFiles,
  onChange,
}: ImageUploaderProps) {
  const [files, setFiles] = React.useState<File[]>(defaultFiles || [])

  const onFileReject = React.useCallback((file: File, message: string) => {
    toast.error(message, {
      description: `"${file.name}" was rejected`,
    })
  }, [])

  const handleFileChange = React.useCallback((files: File[]) => {
    setFiles(files)

    onChange?.(files.map((file) => URL.createObjectURL(file)))
  }, [])

  return (
    <FileUpload
      accept="image/*"
      maxFiles={4}
      maxSize={4 * 1024 * 1024}
      className="w-full max-w-md"
      value={files}
      onValueChange={handleFileChange}
      onFileReject={onFileReject}
      multiple
    >
      <FileUploadDropzone className="border-primary/20 bg-primary/5 hover:bg-primary/10 data-dragging:bg-primary/10">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="rounded-lg bg-primary/10 p-3">
            <ImageIcon className="size-8 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">رفع الصور</p>
            <p className="text-xs text-muted-foreground">
              PNG, JPG, GIF up to 4MB
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
          <FileUploadItem key={index} value={file}>
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
  )
}
