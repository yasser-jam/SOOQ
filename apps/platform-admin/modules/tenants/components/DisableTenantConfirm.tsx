"use client"

import ConfirmAlert from "@/components/system/ConfirmAlert"

type DisableTenantConfirmProps = {
  open: boolean
  storeName?: string
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function DisableTenantConfirm({
  open,
  storeName,
  onOpenChange,
  onConfirm,
}: DisableTenantConfirmProps) {
  return (
    <ConfirmAlert
      open={open}
      onOpenChange={onOpenChange}
      title="تعطيل المتجر"
      description={
        storeName
          ? `سيتم تعطيل "${storeName}" وإغلاقه نهائياً. لا يمكن التراجع عن هذه العملية من نفس الصفحة.`
          : undefined
      }
      actionLabel="تعطيل"
      variant="destructive"
      onAction={onConfirm}
    />
  )
}
