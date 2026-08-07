"use client"

import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import {
  BanIcon,
  GaugeIcon,
  MoreHorizontalIcon,
  PencilIcon,
  SettingsIcon,
} from "lucide-react"
import Link from "next/link"

import type { TenantSummary } from "../types"

type TenantRowActionsProps = {
  tenant: TenantSummary
  onDisable: (tenant: TenantSummary) => void
  onUpdateStatus: (tenant: TenantSummary) => void
  onUpdateRateLimit: (tenant: TenantSummary) => void
  onEditIdentity: (tenant: TenantSummary) => void
}

export function TenantRowActions({
  tenant,
  onDisable,
  onUpdateStatus,
  onUpdateRateLimit,
  onEditIdentity,
}: TenantRowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="إجراءات">
          <MoreHorizontalIcon className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/tenants/${tenant.tenantId}`}>عرض التفاصيل</Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEditIdentity(tenant)}>
          <PencilIcon className="size-4" />
          تعديل الهوية
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onUpdateStatus(tenant)}>
          <SettingsIcon className="size-4" />
          تغيير الحالة
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onUpdateRateLimit(tenant)}>
          <GaugeIcon className="size-4" />
          حد الطلبات
        </DropdownMenuItem>
        {!tenant.disabled ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => onDisable(tenant)}
            >
              <BanIcon className="size-4" />
              تعطيل المتجر
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
