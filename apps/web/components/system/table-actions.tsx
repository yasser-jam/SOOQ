"use client"

import * as React from "react"
import { PencilIcon, Trash2Icon } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import ConfirmAlert from "@/components/system/confirm-alert"

type TableActionsProps = {
  onUpdate?: () => void
  onDelete?: () => void
  children?: React.ReactNode
}

export default function TableActions({
  onUpdate,
  onDelete,
  children,
}: TableActionsProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <div className="flex items-center justify-end gap-2">
      <Button
        variant="primary"
        className="rounded-lg"
        size="icon"
        aria-label="Edit tag"
        onClick={onUpdate}
      >
        <PencilIcon data-icon="inline-start" className="p-0.5" />
      </Button>

      <Button
        variant="destructive"
        className="rounded-lg"
        size="icon"
        aria-label="Delete tag"
        onClick={() => setOpen(true)}
      >
        <Trash2Icon data-icon="inline-start" className="p-0.5" />
      </Button>

      <ConfirmAlert
        open={open}
        onOpenChange={setOpen}
        variant="destructive"
        title="حذف الوسم"
        description="سيتم حذف الوسم نهائيا ولا يمكن التراجع عن هذا الإجراء."
        actionLabel="حذف"
        onAction={onDelete}
        icon={<Trash2Icon data-icon="inline-start" />}
      />

      {children}
    </div>
  )
}
