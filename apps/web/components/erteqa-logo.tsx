import Image from "next/image"

import { cn } from "@workspace/ui/lib/utils"

type ErteqaLogoProps = {
  /** Display size — pick from a few preset heights to keep the wordmark
   *  readable. The intrinsic image is roughly square (glyph stacked over the
   *  "erteqa" wordmark). */
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
  /** When true, render with priority — use on above-the-fold placements
   *  (navbar, auth/onboarding headers) to avoid LCP delay. */
  priority?: boolean
}

const SIZE_PX: Record<NonNullable<ErteqaLogoProps["size"]>, number> = {
  sm: 44,
  md: 56,
  lg: 80,
  xl: 112,
}

/**
 * Official brand mark for the إرتقاء / erteqa platform.
 *
 * Single source of truth for the logo across the app — navbar, auth screens,
 * onboarding, and store-creation flow all import from here. The bitmap lives
 * at `/images/erteqa-logo.png` with a transparent background so it composes
 * cleanly on any surface.
 */
export function ErteqaLogo({ size = "sm", className, priority }: ErteqaLogoProps) {
  const px = SIZE_PX[size]
  return (
    <span
      className={cn("inline-flex items-center", className)}
      style={{ height: px }}
      role="img"
      aria-label="إرتقاء — erteqa"
    >
      <Image
        src="/images/sooq-logo.png"
        alt=""
        width={px}
        height={px}
        priority={priority}
        className="h-full w-auto select-none object-contain"
      />
    </span>
  )
}
