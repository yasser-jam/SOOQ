"use client"

import { useFormContext } from "react-hook-form"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

import ImageUploader, {
  type ImageUploaderState,
} from "@/components/system/image-uploader"

type Props = {
  isSubmitting: boolean
  existing?: { id: string; url: string }[]
  onChange: (state: ImageUploaderState) => void
}

export default function MediaTab({ isSubmitting, existing, onChange }: Props) {
  // useFormContext is here for parity with other tabs and for future
  // form-level helpers (e.g. surfacing errors), even though no fields read it now.
  useFormContext()

  return (
    <Card>
      <CardHeader>
        <CardTitle>صور المنتج</CardTitle>
      </CardHeader>
      <CardContent>
        <fieldset disabled={isSubmitting} className="contents">
          <ImageUploader existing={existing ?? []} onChange={onChange} />
        </fieldset>
      </CardContent>
    </Card>
  )
}
