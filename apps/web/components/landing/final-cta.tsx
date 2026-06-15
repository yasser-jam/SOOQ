"use client"

import { motion } from "framer-motion"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

import { buttonVariants } from "@workspace/ui/components/button"

import { MotionSection } from "./motion-section"

export function FinalCta() {
  return (
    <MotionSection
      id="final-cta"
      labelledBy="final-cta-heading"
      className="relative py-20 md:py-28"
    >
      <div className="mx-auto w-full max-w-7xl px-4 md:px-8">
        <div className="relative isolate overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-primary via-primary to-primary/90 p-10 text-center shadow-2xl md:p-16">
          <DecorativeOrbs />

          <div className="relative z-10 mx-auto max-w-2xl">
            <h2
              id="final-cta-heading"
              className="text-balance text-3xl font-extrabold text-primary-foreground md:text-4xl lg:text-5xl"
            >
              جاهز لتبدأ رحلتك التجارية؟
            </h2>
            <p className="mt-5 text-base text-primary-foreground/80 md:text-lg">
              انضم لأكثر من +1,000 تاجر يبنون مستقبلهم الرقمي بثقة وسهولة على إرتقاء.
            </p>

            <motion.div
              className="relative mt-10 inline-flex"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: "spring", stiffness: 350, damping: 20 }}
            >
              {/*
                The blurred halo sits behind the button. `pointer-events-none`
                is required: `filter: blur(...)` promotes the span to its own
                stacking context, which would otherwise paint above the
                button and swallow clicks.
              */}
              <span
                className="pointer-events-none absolute -inset-3 rounded-2xl bg-secondary/30 blur-xl"
                aria-hidden
              />
              <Link
                href="/request-otp"
                className={buttonVariants({
                  variant: "secondary",
                  size: "lg",
                  className: "relative px-10 text-base md:text-lg",
                })}
              >
                أنشئ متجرك الآن
                <ArrowLeft className="size-5" aria-hidden />
              </Link>
            </motion.div>

            <p className="mt-6 text-sm text-primary-foreground/60">
              مجاناً للبدء — بدون بطاقة ائتمان مطلوبة
            </p>
          </div>
        </div>
      </div>
    </MotionSection>
  )
}

function DecorativeOrbs() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
      <motion.div
        className="absolute -top-24 -right-16 size-72 rounded-full bg-secondary/30 blur-3xl"
        animate={{ x: [0, 20, 0], y: [0, 14, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-32 -left-12 size-80 rounded-full bg-secondary/20 blur-3xl"
        animate={{ x: [0, -18, 0], y: [0, -10, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05),transparent_60%)]" />
    </div>
  )
}
