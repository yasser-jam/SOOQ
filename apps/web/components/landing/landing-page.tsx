import Image from "next/image"

import { Features } from "./features"
import { FinalCta } from "./final-cta"
import { Footer } from "./footer"
import { WhyUs } from "./WhyUs"
import { HowWeWork } from "./how-it-works"
import { Navbar } from "./navbar"
import { Stats } from "./stats"
import { TaglineBanner } from "./tagline-banner"
import { Testimonials } from "./testimonials"

/**
 * Composes the marketing-facing landing page rendered at `/` for visitors
 * without an active session. Each section is a client component because
 * they animate with framer-motion; this composer stays a server component
 * to keep the initial payload lean and optimize for performance.
 *
 * The fixed-position backdrop (`/images/hero1-element.png`) sits behind
 * the whole page at low opacity, giving every section a subtle, branded
 * watermark without overpowering the text or animations.
 */
export function LandingPage() {
  return (
    <div className="relative isolate flex min-h-screen flex-col bg-background text-foreground antialiased selection:bg-secondary/25">
   

      <Navbar />
      <main className="flex-1">
        <TaglineBanner />
        <Features />
        <HowWeWork />
        <WhyUs />
        <Stats />
        <Testimonials />
        <FinalCta />
      </main>
      <Footer />
    </div>
  )
}

function PageBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <Image
        src="/images/hero1-element.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center opacity-40 select-none md:opacity-50"
      />
      {/* Light wash on top of the photo to keep section text legible. Kept
          deliberately subtle so the hero1 image still reads through. */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/35 to-background/65"
        aria-hidden
      />
    </div>
  )
}
