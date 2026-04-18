export function getInitials(value: string, maxParts = 2) {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, maxParts)
    .map((part) => part[0]?.toUpperCase())
    .join("")
}
