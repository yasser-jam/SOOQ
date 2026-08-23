"use client"

import * as React from "react"
import { AlertTriangle, Info } from "lucide-react"

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogClose,
} from "@workspace/ui/components/dialog"
import { cn } from "@workspace/ui/lib/utils"

type ConfirmAlertVariant = "default" | "destructive"

type ConfirmAlertProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  actionLabel: string
  closeLabel?: string
  onAction?: () => void
  variant?: ConfirmAlertVariant
  icon?: React.ReactNode
}

const variantIcon: Record<ConfirmAlertVariant, React.ReactNode> = {
  default: <Info data-icon="inline-start" />,
  destructive: <AlertTriangle data-icon="inline-start" />,
}

export default function ConfirmAlert({
  open,
  onOpenChange,
  title,
  description,
  actionLabel,
  closeLabel = "إلغاء",
  onAction,
  variant = "default",
  icon,
}: ConfirmAlertProps) {
  const handleAction = React.useCallback(() => {
    onAction?.()
    onOpenChange(false)
  }, [onAction, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <Alert variant={variant} className="gap-4 border-0 bg-transparent p-0">
          <div className="flex flex-col items-center gap-3 text-center">
            <Avatar className="size-12">
              <AvatarFallback
                className={cn(
                  "text-base",
                  variant === "destructive"
                    ? "bg-destructive/10 text-destructive"
                    : "bg-primary/10 text-primary"
                )}
              >
                {icon ?? variantIcon[variant]}
              </AvatarFallback>
            </Avatar>
            <AlertTitle className="text-lg font-semibold">
              {title}
            </AlertTitle>
            {description ? (
              <AlertDescription>{description}</AlertDescription>
            ) : null}
          </div>
          <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
            <DialogClose asChild>
              <Button variant="outline">{closeLabel}</Button>
            </DialogClose>
            <Button
              variant={variant === "destructive" ? "destructive" : "primary"}
              onClick={handleAction}
            >
              {actionLabel}
            </Button>
          </div>
        </Alert>
      </DialogContent>
    </Dialog>
  )
}
