"use client"

import { useState, type ReactNode } from "react"
import { format, startOfDay } from "date-fns"
import { ar } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form"

import { Button } from "@workspace/ui/components/button"
import { Calendar } from "@workspace/ui/components/calendar"
import {
  Field as UiField,
  FieldError,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import { cn } from "@workspace/ui/lib/utils"

const pad = (n: number) => String(n).padStart(2, "0")

const toLocalDateTimeValue = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`

const parseLocalDateTimeValue = (value?: string): Date | undefined => {
  if (!value) return undefined
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

const mergeDateAndTime = (date: Date, time: string) => {
  const [hours = "0", minutes = "0"] = time.split(":")
  const next = new Date(date)
  next.setHours(Number(hours), Number(minutes), 0, 0)
  return next
}

type DatePickerFieldProps<T extends FieldValues> = {
  name: FieldPath<T>
  control: Control<T>
  label: ReactNode
  placeholder?: string
  disabled?: boolean
  /** Earliest selectable calendar day (inclusive). */
  minDate?: Date
  className?: string
}

export default function DatePickerField<T extends FieldValues>({
  name,
  control,
  label,
  placeholder = "اختر التاريخ والوقت",
  disabled,
  minDate,
  className,
}: DatePickerFieldProps<T>) {
  const fieldId = String(name)
  const [open, setOpen] = useState(false)

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const selected = parseLocalDateTimeValue(field.value)
        const timeValue = selected
          ? `${pad(selected.getHours())}:${pad(selected.getMinutes())}`
          : "00:00"
        const display = selected
          ? format(selected, "yyyy-MM-dd HH:mm", { locale: ar })
          : null

        return (
          <UiField data-invalid={fieldState.invalid} className={className}>
            <FieldLabel htmlFor={fieldId}>{label}</FieldLabel>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  id={fieldId}
                  type="button"
                  variant="outline"
                  disabled={disabled}
                  data-empty={!selected}
                  className={cn(
                    "h-12 w-full justify-start rounded-lg font-normal data-[empty=true]:text-muted-foreground"
                  )}
                >
                  <CalendarIcon data-icon="inline-start" />
                  {display ?? <span>{placeholder}</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-auto gap-3 p-3">
                <Calendar
                  mode="single"
                  selected={selected}
                  onSelect={(date) => {
                    if (!date) {
                      field.onChange("")
                      return
                    }
                    const next = mergeDateAndTime(date, timeValue)
                    field.onChange(toLocalDateTimeValue(next))
                  }}
                  disabled={
                    minDate
                      ? (date) => startOfDay(date) < startOfDay(minDate)
                      : undefined
                  }
                  locale={ar}
                />
                <div className="flex flex-col gap-1.5 border-t border-border pt-3">
                  <FieldLabel htmlFor={`${fieldId}-time`}>الوقت</FieldLabel>
                  <Input
                    id={`${fieldId}-time`}
                    type="time"
                    value={timeValue}
                    disabled={disabled || !selected}
                    onChange={(event) => {
                      if (!selected) return
                      const next = mergeDateAndTime(
                        selected,
                        event.target.value || "00:00"
                      )
                      field.onChange(toLocalDateTimeValue(next))
                    }}
                  />
                </div>
              </PopoverContent>
            </Popover>
            <FieldError errors={[fieldState.error]} />
          </UiField>
        )
      }}
    />
  )
}
