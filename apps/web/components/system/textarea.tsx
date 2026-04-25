import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form"
import {
  Field as UiField,
  FieldError,
  FieldLabel,
} from "@workspace/ui/components/field"
import { ComponentProps, ReactNode } from "react"
import { Textarea as UiTextarea } from "@workspace/ui/components/textarea"

type FormFieldProps<T extends FieldValues> = {
  name: FieldPath<T>
  control: Control<T>
  label: ReactNode
  //   pass it here instead of inputProps in order to avoid duplication and make it easy to set
  placeholder?: string
  textareaProps?: Omit<
    ComponentProps<typeof UiTextarea>,
    "id" | "name" | "placeholder"
  >
}

export default function TextareaField<T extends FieldValues>({
  name,
  control,
  label,
  placeholder,
  textareaProps,
}: FormFieldProps<T>) {
  const fieldId = String(name)

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <UiField data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={fieldId}>{label}</FieldLabel>
          <UiTextarea
            {...field}
            id={fieldId}
            name={fieldId}
            placeholder={placeholder}
            rows={4}
            className="min-h-24"
            {...textareaProps}
          />
          <FieldError errors={[fieldState.error]} />
        </UiField>
      )}
    />
  )
}
