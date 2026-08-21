"use client"

import Link from "next/link"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { PackagePlus, PackageSearch, Palette, Ticket } from "lucide-react"

const quickActions = [
  { icon: PackagePlus, label: "إضافة منتج", href: "/products/create" },
  { icon: PackageSearch, label: "تعديل المخزون", href: "/inventory/bulk-adjust" },
  { icon: Ticket, label: "كود خصم", href: "/discount-codes/create" },
  { icon: Palette, label: "تعديل الثيم", href: "/design-studio" },
] as const

type QuickActionsCardProps = {
  storePath: (path: string) => string
}

export function QuickActionsCard({ storePath }: QuickActionsCardProps) {
  return (
    <Card size="sm" className="gap-4.5">
      <CardHeader className="p-0">
        <CardTitle className="mb-1.5 text-lg">إجراءات سريعة</CardTitle>
        <CardDescription>المهام الأكثر استخدامًا في متناول يدك.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3 p-0">
        {quickActions.map((action) => (
          <Link
            key={action.label}
            href={storePath(action.href)}
            className="border-border bg-muted/30 hover:bg-muted flex flex-col items-start gap-2.5 rounded-2xl border p-4 text-start transition-colors"
          >
            <action.icon className="text-secondary size-5" />
            <span className="text-[14.5px] font-bold">{action.label}</span>
          </Link>
        ))}
      </CardContent>
    </Card>
  )
}
