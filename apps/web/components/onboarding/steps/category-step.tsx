"use client"

import {
  Avatar,
  AvatarFallback,
} from "@workspace/ui/components/avatar"
import { Button } from "@workspace/ui/components/button"
import { CardContent, CardFooter } from "@workspace/ui/components/card"
import { cn } from "@workspace/ui/lib/utils"
import {
  ArrowLeftIcon,
  Dumbbell,
  Home,
  Shirt,
  Smartphone,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

export const STORE_CATEGORIES: {
  id: string
  name: string
  Icon: LucideIcon
}[] = [
  { id: "fashion", name: "أزياء وملابس", Icon: Shirt },
  { id: "electronics", name: "إلكترونيات", Icon: Smartphone },
  { id: "food", name: "أطعمة ومشروبات", Icon: UtensilsCrossed },
  { id: "beauty", name: "تجميل وعناية", Icon: Sparkles },
  { id: "home", name: "منزل وديكور", Icon: Home },
  { id: "sports", name: "رياضة ولياقة", Icon: Dumbbell },
]

type CategoryStepProps = {
  categoryId: string | null
  onCategoryChange: (id: string) => void
  onNext: () => void
}

export function CategoryStep({
  categoryId,
  onCategoryChange,
  onNext,
}: CategoryStepProps) {
  const canGoNext = categoryId !== null

  return (
    <>
      <CardContent>
        <div
          className="grid grid-cols-2 gap-3 sm:grid-cols-3"
          role="radiogroup"
          aria-label="تصنيف المتجر"
        >
          {STORE_CATEGORIES.map(({ id, name, Icon }) => {
            const selected = categoryId === id
            return (
              <Button
                key={id}
                type="button"
                variant="outline"
                onClick={() => onCategoryChange(id)}
                className={cn(
                  "h-auto min-h-0 w-full flex-col gap-3 rounded-xl border-2 p-4 text-center font-normal whitespace-normal shadow-none transition-colors",
                  selected
                    ? "border-primary bg-primary/5 shadow-sm hover:bg-primary/10"
                    : "border-border bg-card hover:bg-muted/50"
                )}
              >
                <Avatar
                  className={cn(
                    "size-16 rounded-full border border-border bg-muted/80",
                    selected && "border-primary/40 bg-primary/10"
                  )}
                >
                  <AvatarFallback
                    className={cn(
                      "rounded-full text-primary",
                      selected && "bg-primary/15"
                    )}
                  >
                    <Icon className="size-8" strokeWidth={1.5} />
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm leading-snug font-medium">{name}</span>
              </Button>
            )
          })}
        </div>
      </CardContent>
      <CardFooter className="onboarding-step-footer !mx-auto">
        <Button
          type="button"
          variant="secondary"
          size="lg"
          disabled={!canGoNext}
          onClick={onNext}
        >
          التالي
          <ArrowLeftIcon className="size-3.5" />
        </Button>
      </CardFooter>
    </>
  )
}
