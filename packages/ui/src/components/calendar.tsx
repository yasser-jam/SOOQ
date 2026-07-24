"use client"

import * as React from "react"
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns"
import { ar } from "date-fns/locale"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

type CalendarProps = {
  mode?: "single"
  selected?: Date
  onSelect?: (date: Date | undefined) => void
  disabled?: (date: Date) => boolean
  locale?: typeof ar
  className?: string
  initialFocus?: boolean
}

function Calendar({
  selected,
  onSelect,
  disabled,
  locale = ar,
  className,
}: CalendarProps) {
  const [month, setMonth] = React.useState<Date>(selected ?? new Date())

  React.useEffect(() => {
    if (selected) setMonth(selected)
  }, [selected])

  const days = React.useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 6 })
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 6 })
    return eachDayOfInterval({ start, end })
  }, [month])

  const weekdays = React.useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 6 })
    return eachDayOfInterval({
      start,
      end: endOfWeek(start, { weekStartsOn: 6 }),
    }).map((day) => format(day, "EEEEEE", { locale }))
  }, [locale])

  return (
    <div data-slot="calendar" className={cn("w-fit p-1", className)}>
      <div className="mb-2 flex items-center justify-between gap-2 px-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => setMonth((current) => subMonths(current, 1))}
        >
          <ChevronRightIcon />
          <span className="sr-only">الشهر السابق</span>
        </Button>
        <div className="text-sm font-medium">
          {format(month, "MMMM yyyy", { locale })}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => setMonth((current) => addMonths(current, 1))}
        >
          <ChevronLeftIcon />
          <span className="sr-only">الشهر التالي</span>
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
        {weekdays.map((weekday) => (
          <div key={weekday} className="flex size-8 items-center justify-center">
            {weekday}
          </div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {days.map((day) => {
          const isSelected = selected ? isSameDay(day, selected) : false
          const isOutside = !isSameMonth(day, month)
          const isDisabled = disabled?.(day) ?? false

          return (
            <Button
              key={day.toISOString()}
              type="button"
              variant={isSelected ? "secondary" : "ghost"}
              size="icon"
              disabled={isDisabled}
              className={cn(
                "size-8 text-sm font-normal",
                isOutside && "text-muted-foreground/50",
                isToday(day) && !isSelected && "border border-secondary",
                isSelected && "text-secondary-foreground"
              )}
              onClick={() => onSelect?.(day)}
            >
              {format(day, "d")}
            </Button>
          )
        })}
      </div>
    </div>
  )
}

export { Calendar }
export type { CalendarProps }
