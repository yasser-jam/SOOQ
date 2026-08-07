"use client"

import * as React from "react"
import { PackageOpen } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

export type EmptyStateProps = {
  /** Icon (defaults to PackageOpen). Pass any lucide icon as ReactNode. */
  icon?: React.ReactNode
  title: string
  description?: string
  /** Optional CTA — clicking renders a primary button. */
  cta?: {
    label: string
    onClick?: () => void
    href?: string
  }
  className?: string
  /** Smaller variant — use inside compact cells like dialogs. */
  compact?: boolean
}

/**
 * Contextual empty-state component (NFR-UX-001).
 *
 * Use as the `emptyState` prop on DataTable, or render directly as a section
 * placeholder. Defaults are intentionally generic so you can replace them with
 * page-specific copy + icons.
 */
export default function EmptyState({
  icon,
  title,
  description,
  cta,
  className,
  compact,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 text-center",
        compact ? "py-6" : "py-12",
        className
      )}
      data-empty-state
    >
      <div
        className={cn(
          "rounded-full bg-muted/60 p-3 text-muted-foreground",
          compact ? "p-2" : "p-3"
        )}
      >
        {icon ?? <PackageOpen className={compact ? "size-5" : "size-8"} />}
      </div>
      <p className={cn("font-medium", compact ? "text-sm" : "text-base")}>
        {title}
      </p>
      {description ? (
        <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
      ) : null}
      {cta ? (
        cta.href ? (
          <Button asChild size="sm" className="mt-2">
            <a href={cta.href}>{cta.label}</a>
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            className="mt-2"
            onClick={cta.onClick}
          >
            {cta.label}
          </Button>
        )
      ) : null}
    </div>
  )
}
