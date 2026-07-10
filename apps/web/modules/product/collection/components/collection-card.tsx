"use client"

import { useState } from "react"
import { Bot, Hand, Layers3, MoreHorizontal, Pencil, Trash2 } from "lucide-react"

import ConfirmAlert from "@/components/system/confirm-alert"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar"

import type { ProductCollection } from "../types"

type Props = {
  collection: ProductCollection
  onEdit: () => void
  onDelete: () => void
}

function CollectionTypeBadge({ type }: { type: ProductCollection["collectionType"] }) {
  if (type === "MANUAL") {
    return (
      <Badge variant="primary" className="gap-1.5">
        <Hand size={14} />
        <span>يدوي</span>
      </Badge>
    )
  }

  return (
    <Badge variant="secondary" className="gap-1.5">
      <Bot size={14} />
      <span>تلقائي</span>
    </Badge>
  )
}

export default function CollectionCard({ collection, onEdit, onDelete }: Props) {
  const [deleteOpen, setDeleteOpen] = useState(false)

  const description =
    collection.descriptionAr?.trim() ||
    collection.descriptionEn?.trim() ||
    "لا يوجد وصف"

  return (
    <>
      <Card size="sm" className="flex flex-col border border-border/60">
        <CardHeader className="gap-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <Avatar className="size-9 shrink-0">
                <AvatarFallback>
                  <Layers3 size={16} />
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 space-y-1">
                <CardTitle className="truncate text-base">
                  {collection.collectionName}
                </CardTitle>
                <CardDescription className="truncate font-mono text-xs">
                  {collection.collectionSlug}
                </CardDescription>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="إجراءات المجموعة">
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>إجراءات المجموعة</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil className="size-4" />
                  تعديل
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="size-4" />
                  حذف
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col gap-3">
          <p className="line-clamp-3 flex-1 text-sm text-muted-foreground">
            {description}
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <CollectionTypeBadge type={collection.collectionType} />
            {collection.isActive ? (
              <Badge variant="secondary-tonal">نشطة</Badge>
            ) : (
              <Badge variant="outline">غير نشطة</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <ConfirmAlert
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        variant="destructive"
        title="حذف المجموعة"
        description="سيتم حذف المجموعة نهائياً ولا يمكن التراجع عن هذا الإجراء."
        actionLabel="حذف"
        onAction={onDelete}
        icon={<Trash2 data-icon="inline-start" />}
      />
    </>
  )
}
