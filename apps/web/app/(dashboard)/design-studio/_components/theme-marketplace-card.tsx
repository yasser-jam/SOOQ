import Link from "next/link"
import { Loader2 } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { Card } from "@workspace/ui/components/card"
import { cn } from "@workspace/ui/lib/utils"

type ThemeMarketplaceCardProps = {
  title: string
  description: string
  previewColor?: string
  previewImage?: string
  badge?: string
  href?: string
  isActive?: boolean
  /** This card's apply-template request is in flight. */
  isApplying?: boolean
  /** A different card's apply-template request is in flight. */
  applyDisabled?: boolean
  onSelect?: () => void
  /** Rendered as an overlay in the top corner opposite the badge — e.g. a three-dot actions menu. */
  actions?: React.ReactNode
}

export default function ThemeMarketplaceCard({
  title,
  description,
  previewColor = "#64748b",
  previewImage,
  badge,
  href,
  isActive,
  isApplying,
  applyDisabled,
  onSelect,
  actions,
}: ThemeMarketplaceCardProps) {
  return (
    <Card
      size="sm"
      className={cn(
        "flex flex-col overflow-hidden p-0",
        isActive
          ? "border-2 border-primary/50"
          : "border border-border/60"
      )}
    >
      {/* Image — 4:3 aspect ratio */}
      <div
        className="relative aspect-[4/3] overflow-hidden"
        style={
          previewImage
            ? undefined
            : {
                background: `linear-gradient(135deg, ${previewColor}22, transparent 60%), linear-gradient(to bottom right, var(--color-muted), var(--color-background))`,
              }
        }
      >
        {previewImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewImage}
            alt=""
            className="absolute inset-0 size-full object-cover"
          />
        ) : (
          <>
            <span
              className="absolute start-4 top-4 size-8 rounded-full border border-border/40 shadow-sm"
              style={{ backgroundColor: previewColor }}
            />
            <div className="absolute inset-x-4 bottom-4 space-y-2">
              <div className="h-2 w-2/3 rounded-full bg-foreground/10" />
              <div className="h-2 w-1/2 rounded-full bg-foreground/10" />
            </div>
          </>
        )}

        {isActive && (
          <span className="absolute start-3 top-3 z-10 rounded-full bg-primary px-3 py-1 text-[11px] font-bold text-primary-foreground">
            الثيم الحالي
          </span>
        )}
        {!isActive && badge && (
          <span className="absolute start-3 top-3 z-10 rounded-full border border-border/60 bg-background/90 px-3 py-1 text-[11px] font-medium text-foreground">
            {badge}
          </span>
        )}

        {actions && <div className="absolute end-3 top-3 z-20">{actions}</div>}

        {isApplying && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-background/70 backdrop-blur-[1px]">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-1.5 p-5">
        <h3 className="text-base font-bold">{title}</h3>
        <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>

        <div className="mt-3 flex gap-2">
          {href && (
            <Button
              className="flex-1"
              variant="outline"
              size="sm"
              asChild
            >
              <Link href={href}>معاينة</Link>
            </Button>
          )}
          {onSelect && (
            <Button
              className="flex-1"
              variant={isActive ? "outline" : "default"}
              size="sm"
              loading={isApplying}
              disabled={isActive || applyDisabled}
              onClick={onSelect}
            >
              {isActive
                ? "الثيم الحالي"
                : isApplying
                  ? "جارٍ التطبيق..."
                  : "تطبيق الثيم"}
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
