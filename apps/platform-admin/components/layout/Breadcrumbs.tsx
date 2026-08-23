"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronLeftIcon } from "lucide-react"

const LABELS: Record<string, string> = {
  dashboard: "لوحة التحكم",
  tenants: "المتاجر",
  "audit-log": "سجل التدقيق",
  account: "حسابي",
  sessions: "الجلسات",
  security: "الأمان",
  phone: "رقم الهاتف",
  audit: "سجل التدقيق",
}

export function Breadcrumbs() {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)

  if (segments.length <= 1) return null

  const crumbs = segments.map((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join("/")}`
    const label = LABELS[segment] ?? segment.slice(0, 8)
    return { href, label, isLast: index === segments.length - 1 }
  })

  return (
    <nav aria-label="مسار التنقل" className="mb-4 flex items-center gap-1 text-sm text-muted-foreground">
      {crumbs.map((crumb) => (
        <span key={crumb.href} className="flex items-center gap-1">
          {crumb.isLast ? (
            <span className="text-foreground">{crumb.label}</span>
          ) : (
            <Link href={crumb.href} className="hover:text-foreground">
              {crumb.label}
            </Link>
          )}
          {!crumb.isLast ? <ChevronLeftIcon className="size-3" /> : null}
        </span>
      ))}
    </nav>
  )
}
