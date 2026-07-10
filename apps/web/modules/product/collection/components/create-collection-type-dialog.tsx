"use client"

import { Bot, Hand } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectManual: () => void
  onSelectAutomated: () => void
}

export default function CreateCollectionTypeDialog({
  open,
  onOpenChange,
  onSelectManual,
  onSelectAutomated,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>نوع المجموعة</DialogTitle>
          <DialogDescription>
            اختر كيفية إضافة المنتجات إلى هذه المجموعة.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 pt-2">
          <Button
            variant="outline"
            className="h-auto flex-col items-start gap-2 p-4 text-right"
            onClick={onSelectManual}
          >
            <div className="flex w-full items-center gap-2">
              <Hand className="size-5 shrink-0 text-primary" />
              <span className="font-medium">مجموعة يدوية</span>
            </div>
            <span className="text-xs font-normal text-muted-foreground">
              اختر المنتجات يدوياً وأعد ترتيبها كما تشاء.
            </span>
          </Button>

          <Button
            variant="outline"
            className="h-auto flex-col items-start gap-2 p-4 text-right"
            onClick={onSelectAutomated}
          >
            <div className="flex w-full items-center gap-2">
              <Bot className="size-5 shrink-0 text-secondary-foreground" />
              <span className="font-medium">مجموعة تلقائية</span>
            </div>
            <span className="text-xs font-normal text-muted-foreground">
              حدّد قواعد لإضافة المنتجات تلقائياً حسب الشروط.
            </span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
