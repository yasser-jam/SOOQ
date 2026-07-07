import Link from "next/link"

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
import { cn } from "@workspace/ui/lib/utils"

type ThemeMarketplaceCardProps = {
  title: string
  description: string
  previewColor?: string
  previewImage?: string
  badge?: string
  href?: string
  isActive?: boolean
  onSelect?: () => void
}

export default function ThemeMarketplaceCard({
  title,
  description,
  previewColor = "#64748b",
  previewImage,
  badge,
  href,
  isActive,
  onSelect,
}: ThemeMarketplaceCardProps) {
  return (
    <Card
      size="sm"
      className={cn(
        "border border-border/60",
        isActive && "ring-2 ring-primary/30"
      )}
    >
      <CardContent>
        <div
          className="relative h-32 overflow-hidden rounded-xl border border-border/60"
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
        </div>
      </CardContent>

      <CardHeader className="gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            <CardDescription className="text-sm">{description}</CardDescription>
          </div>
          {isActive ? (
            <Badge variant="secondary-tonal">الثيم الحالي</Badge>
          ) : badge ? (
            <Badge variant="outline">{badge}</Badge>
          ) : null}
        </div>
      </CardHeader>

      {(onSelect || href) && (
        <CardFooter className="gap-2">
          {onSelect ? (
            <Button
              className="w-full"
              variant={isActive ? "outline" : "primary"}
              size="sm"
              onClick={onSelect}
            >
              {isActive ? "الثيم المطبّق" : "تطبيق الثيم"}
            </Button>
          ) : null}
          {href ? (
            <Button className="w-full" variant="outline" size="sm" asChild>
              <Link href={href}>معاينة</Link>
            </Button>
          ) : null}
        </CardFooter>
      )}
    </Card>
  )
}
