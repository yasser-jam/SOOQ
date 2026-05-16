"use client"

import { useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"

import { createCustomerNoteSchema } from "@/modules/customer/customer-note/schema"
import type { CustomerNote } from "@/modules/customer/customer-note/types"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import {
  Field as UiField,
  FieldError,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Textarea } from "@workspace/ui/components/textarea"

export type CustomerNoteFormValues = {
  noteText: string
  isPrivate: boolean
}

interface CustomerNoteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "create" | "edit"
  initialNote?: CustomerNote
  onSubmit: (values: CustomerNoteFormValues) => void
  isSubmitting?: boolean
}

const emptyDefaults: CustomerNoteFormValues = {
  noteText: "",
  isPrivate: false,
}

export default function CustomerNoteDialog({
  open,
  onOpenChange,
  mode,
  initialNote,
  onSubmit,
  isSubmitting = false,
}: CustomerNoteDialogProps) {
  // Both create and edit use the same client-side rules (text required,
  // ≤4000 chars). The backend's null-means-"no change" semantics on update
  // aren't surfaced in the UI — the checkbox is always a concrete boolean.
  // The create schema infers `isPrivate?: boolean | undefined`. We model the
  // form value as a concrete `boolean` so the checkbox always has a definite
  // state; cast the resolver to match the wider form type.
  const form = useForm<CustomerNoteFormValues>({
    resolver: zodResolver(
      createCustomerNoteSchema
    ) as unknown as import("react-hook-form").Resolver<CustomerNoteFormValues>,
    defaultValues: emptyDefaults,
  })

  useEffect(() => {
    if (open) {
      form.reset(
        initialNote
          ? { noteText: initialNote.noteText, isPrivate: initialNote.isPrivate }
          : emptyDefaults
      )
    }
  }, [open, initialNote, form])

  const handleSubmit = form.handleSubmit((values) => {
    onSubmit(values)
  })

  const noteError = form.formState.errors.noteText

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "إضافة ملاحظة" : "تحرير الملاحظة"}
          </DialogTitle>
        </DialogHeader>

        <form
          id="customer-note-form"
          className="flex flex-col gap-4"
          onSubmit={handleSubmit}
        >
          <UiField data-invalid={Boolean(noteError)}>
            <FieldLabel htmlFor="customer-note-text">
              نص الملاحظة
            </FieldLabel>
            <Controller
              name="noteText"
              control={form.control}
              render={({ field }) => (
                <Textarea
                  {...field}
                  id="customer-note-text"
                  rows={5}
                  placeholder="مثلاً: يفضّل التسليم بعد الظهر فقط، أو لا يفضّل المكالمات."
                  disabled={isSubmitting}
                  className="min-h-28"
                />
              )}
            />
            <FieldError errors={noteError ? [noteError] : []} />
          </UiField>

          <UiField orientation="horizontal">
            <Controller
              name="isPrivate"
              control={form.control}
              render={({ field }) => (
                <Checkbox
                  id="customer-note-private"
                  checked={field.value === true}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                  disabled={isSubmitting}
                />
              )}
            />
            <FieldLabel htmlFor="customer-note-private">
              ملاحظة خاصة (يراها OWNER/MANAGER فقط)
            </FieldLabel>
          </UiField>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            إلغاء
          </Button>
          <Button
            type="submit"
            form="customer-note-form"
            disabled={isSubmitting}
          >
            {isSubmitting ? "جاري الحفظ…" : "حفظ"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
