export const formatShipmentDateTime = (value?: string | null) => {
  if (!value) return ""

  const parsedDate = new Date(value)

  if (Number.isNaN(parsedDate.getTime())) return value

  return parsedDate.toLocaleString("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}
