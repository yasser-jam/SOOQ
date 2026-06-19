import type { ComponentProps, ReactNode } from "react"
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
import { Input } from "@workspace/ui/components/input"

type FormFieldProps<T extends FieldValues> = {
  name: FieldPath<T>
  control: Control<T>
  label: ReactNode
  //   pass it here instead of inputProps in order to avoid duplication and make it easy to set
  placeholder?: string
  inputProps?: Omit<ComponentProps<typeof Input>, "id" | "name" | "placeholder"> & {
    placeholder?: string
  }
}

export default function Field<T extends FieldValues>({
  name,
  control,
  label,
  placeholder,
  inputProps,
}: FormFieldProps<T>) {
  const fieldId = String(name)

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <UiField data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={fieldId}>{label}</FieldLabel>
          <Input {...field} id={fieldId} name={fieldId} placeholder={placeholder} {...inputProps} />
          <FieldError errors={[fieldState.error]} />
        </UiField>
      )}
    />
  )
}
