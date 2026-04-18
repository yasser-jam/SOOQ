"use client"

import * as React from "react"
import { PencilIcon, Trash2Icon } from "lucide-react"

import { Button } from "@workspace/ui/components/button"

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
        onClick={onDelete}
      >
        <Trash2Icon data-icon="inline-start" className="p-0.5" />
      </Button>

      {children}
    </div>
  )
}
