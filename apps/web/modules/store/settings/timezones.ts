import { PREFERRED_TIMEZONES } from "./init"

export type TimezoneOption = {
  value: string
  label: string
}

const preferredValues = new Set(
  PREFERRED_TIMEZONES.map((timezone) => timezone.value)
)

function getIntlTimezones(): string[] {
  try {
    return Intl.supportedValuesOf("timeZone")
  } catch {
    return PREFERRED_TIMEZONES.map((timezone) => timezone.value)
  }
}

/** Full IANA timezone list for searchable pickers. */
export function getAllTimezoneOptions(): TimezoneOption[] {
  return getIntlTimezones().map((value) => ({ value, label: value }))
}

/** Preferred Arabic-region zones first, then the remaining Intl zones. */
export function getTimezonePickerOptions(): TimezoneOption[] {
  const all = getAllTimezoneOptions()
  const rest = all.filter((timezone) => !preferredValues.has(timezone.value))
  return [...PREFERRED_TIMEZONES, ...rest]
}

export function getTimezoneLabel(value: string): string {
  return (
    PREFERRED_TIMEZONES.find((timezone) => timezone.value === value)?.label ??
    value
  )
}
