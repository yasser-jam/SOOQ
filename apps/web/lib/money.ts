const SYP_FORMATTER = new Intl.NumberFormat("ar-SY", {
  style: "currency",
  currency: "SYP",
  maximumFractionDigits: 0,
})

const SYP_NUMBER_FORMATTER = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
})

export const formatSyp = (amount?: number | null): string => {
  if (typeof amount !== "number" || Number.isNaN(amount)) return ""

  try {
    return SYP_FORMATTER.format(amount)
  } catch {
    return `${SYP_NUMBER_FORMATTER.format(amount)} SYP`
  }
}

export const formatSypNumber = (amount?: number | null): string => {
  if (typeof amount !== "number" || Number.isNaN(amount)) return ""

  return SYP_NUMBER_FORMATTER.format(amount)
}

export const toSypInteger = (value: number): number => Math.round(value)
