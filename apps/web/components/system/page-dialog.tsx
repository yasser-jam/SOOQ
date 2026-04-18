"use client"

import type { ReactNode } from "react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"

type PageDialogProps = {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  title: string
  description?: string
  size?: "sm" | "md" | "lg"
  children: ReactNode
  actions?: ReactNode
}

export default function PageDialog({
  open,
  onOpenChange,
  title,
  description,
  size = "md",
  children,
  actions,
}: PageDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size={size}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>
        {children}
        {actions ? <DialogFooter>{actions}</DialogFooter> : null}
      </DialogContent>
    </Dialog>
  )
}
