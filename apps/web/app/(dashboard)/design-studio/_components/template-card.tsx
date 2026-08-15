"use client"

import { CheckCircle2, Pencil, Play, Trash2 } from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

export type MineTemplateCardProps = {
  title: string
  description: string
  updatedAt: string
  badge?: string
  isActive?: boolean
  editable?: boolean
  onEdit?: () => void
  onDelete?: () => void
  onToggleActive?: () => void
  onApply?: () => void
}

export default function MineTemplateCard({
  title,
  description,
  updatedAt,
  badge,
  isActive,
  editable = false,
  onEdit,
  onDelete,
  onToggleActive,
  onApply,
}: MineTemplateCardProps) {
  return (
    <Card size="sm" className="border border-border/60">
      <CardHeader className="gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription className="text-sm">{description}</CardDescription>
          </div>
          <div className="flex flex-col items-end gap-2">
            {badge ? <Badge variant="secondary-tonal">{badge}</Badge> : null}
            {isActive ? (
              <Badge variant="outline" className="gap-1">
                <CheckCircle2 className="size-3" />
                مفعّل
              </Badge>
            ) : null}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="rounded-xl border border-border/60 bg-muted/25 p-4">
          <div className="text-xs font-medium text-muted-foreground">
            آخر تحديث: {updatedAt}
          </div>
          <div className="mt-3 h-2 w-2/3 rounded-full bg-foreground/10" />
          <div className="mt-2 h-2 w-1/2 rounded-full bg-foreground/10" />
        </div>
      </CardContent>

      <CardFooter className="flex flex-wrap gap-2">
        {onApply ? (
          <Button variant={isActive ? "outline" : "secondary"} size="sm" onClick={onApply} disabled={isActive}>
            <Play className="size-4" />
            {isActive ? "مطبق حالياً" : "إعادة التطبيق"}
          </Button>
        ) : null}
        {editable && onToggleActive ? (
          <Button variant="outline" size="sm" onClick={onToggleActive}>
            {isActive ? "إلغاء التفعيل" : "تفعيل"}
          </Button>
        ) : null}
        {editable && onEdit ? (
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Pencil className="size-4" />
            تعديل
          </Button>
        ) : null}
        {editable && onDelete ? (
          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={onDelete}>
            <Trash2 className="size-4" />
            حذف
          </Button>
        ) : null}
      </CardFooter>
    </Card>
  )
}
