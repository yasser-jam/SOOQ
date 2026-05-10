"use client"

import "react-phone-number-input/style.css"

import { forwardRef, type ComponentProps, type ReactNode } from "react"
import PhoneInput, { type Country } from "react-phone-number-input"
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form"

import { Input } from "@workspace/ui/components/input"
import {
  Field as UiField,
  FieldError,
  FieldLabel,
} from "@workspace/ui/components/field"
import { cn } from "@workspace/ui/lib/utils"

// The Input component in @workspace/ui doesn't forward refs (function component
// using props spread). react-phone-number-input requires its inputComponent to
// accept a ref, so we wrap it once here. Don't change Input itself — other
// callers don't need the ref.
const ForwardedInput = forwardRef<HTMLInputElement, ComponentProps<typeof Input>>(
  function ForwardedInput(props, ref) {
    return <Input {...props} ref={ref} />
  }
)

type PhoneFieldProps<T extends FieldValues> = {
  name: FieldPath<T>
  control: Control<T>
  label: ReactNode
  /** ISO 3166-1 alpha-2 country code; defaults to SY (Syria). */
  defaultCountry?: Country
  disabled?: boolean
  placeholder?: string
  /** Hide the country selector (useful for a read-only Syria-only context). */
  international?: boolean
}

export default function PhoneField<T extends FieldValues>({
  name,
  control,
  label,
  defaultCountry = "SY",
  disabled,
  placeholder,
  international = true,
}: PhoneFieldProps<T>) {
  const fieldId = String(name)

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <UiField data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={fieldId}>{label}</FieldLabel>
          <PhoneInput
            id={fieldId}
            international={international}
            defaultCountry={defaultCountry}
            value={field.value ?? ""}
            onChange={(value) => field.onChange(value ?? "")}
            onBlur={field.onBlur}
            disabled={disabled}
            placeholder={placeholder}
            inputComponent={ForwardedInput}
            // Phone number is always LTR even inside an RTL form.
            dir="ltr"
            className={cn(
              "phone-field flex items-center gap-2",
              fieldState.invalid && "aria-invalid"
            )}
          />
          <FieldError errors={[fieldState.error]} />
        </UiField>
      )}
    />
  )
}
