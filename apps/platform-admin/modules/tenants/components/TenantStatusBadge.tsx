import { Badge } from "@workspace/ui/components/badge"

import { STORE_STATUS_LABELS } from "../init"
import type { StoreStatus } from "../types"

type TenantStatusBadgeProps = {
  status: StoreStatus
  disabled?: boolean
}

export function TenantStatusBadge({ status, disabled }: TenantStatusBadgeProps) {
  if (disabled) {
    return <Badge variant="destructive">معطّل</Badge>
  }

  const variant =
    status === "ACTIVE"
      ? "secondary"
      : status === "MAINTENANCE"
        ? "outline"
        : "outline"

  return (
    <Badge variant={variant}>
      {STORE_STATUS_LABELS[status] ?? status}
    </Badge>
  )
}
