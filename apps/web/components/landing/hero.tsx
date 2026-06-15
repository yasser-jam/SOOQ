"use client"

import { motion } from "framer-motion"
import { ArrowLeft, PlayCircle, Sparkles } from "lucide-react"
import Link from "next/link"

import { buttonVariants } from "@workspace/ui/components/button"

export function Hero() {
  return (
    <section
      id="home"
      aria-labelledby="hero-heading"
      className="relative isolate overflow-hidden pb-24 pt-16 md:pb-32 md:pt-24"
    >
      <FloatingBackdrop />

      <motion.div
        className="mx-auto flex w-full max-w-4xl flex-col items-center px-4 text-center md:px-8"
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        <span className="inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary/10 px-3 py-1 text-xs font-medium text-secondary md:text-sm">
          <Sparkles className="size-3.5" aria-hidden />
          منصة التجارة الإلكترونية لعملاء الوطن العربي
        </span>

        <h1
          id="hero-heading"
          className="mt-6 text-balance text-4xl font-extrabold leading-[1.2] text-primary md:text-6xl lg:text-7xl lg:leading-[1.1]"
        >
          أطلق متجرك الإلكتروني <br className="hidden md:inline" />
          وتطبيقك الخاص{" "}
          <span className="relative inline-block whitespace-nowrap text-secondary">
            في مكان واحد
            <motion.span
              className="absolute -bottom-1 right-0 left-0 h-2 origin-right rounded-full bg-secondary/30"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
              aria-hidden
            />
          </span>
        </h1>

        <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg lg:text-xl">
          ابني متجرك في دقائق، خصّصه بحريّة، وانطلق لعملائك بثقة — بدون أي خبرة تقنية مطلوبة.
          كل ما تحتاجه لإدارة مبيعاتك ومخزونك وعملائك من شاشة واحدة أنيقة.
        </p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
          >
            <Link
              href="/request-otp"
              className={buttonVariants({
                variant: "secondary",
                size: "lg",
                className: "w-full sm:w-auto",
              })}
            >
              ابدأ تجربتك المجانية
              <ArrowLeft className="size-4" aria-hidden />
            </Link>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
          >
            <a
              href="#how-it-works"
              className={buttonVariants({
                variant: "ghost",
                size: "lg",
                className: "w-full sm:w-auto",
              })}
            >
              <PlayCircle className="size-5" aria-hidden />
              شاهد كيف يعمل
            </a>
          </motion.div>
        </div>

        <ul className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <span className="inline-block size-2 rounded-full bg-emerald-500" aria-hidden />
            بدون بطاقة ائتمان
          </li>
          <li className="flex items-center gap-2">
            <span className="inline-block size-2 rounded-full bg-emerald-500" aria-hidden />
            إعداد أوّلي خلال ٥ دقائق
          </li>
          <li className="flex items-center gap-2">
            <span className="inline-block size-2 rounded-full bg-emerald-500" aria-hidden />
            دعم فني عربي
          </li>
        </ul>
      </motion.div>
    </section>
  )
}

function FloatingBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
      <motion.div
        className="absolute -top-32 -right-32 size-[28rem] rounded-full bg-gradient-to-br from-secondary/40 via-secondary/10 to-transparent blur-3xl"
        animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-40 -left-32 size-[32rem] rounded-full bg-gradient-to-tr from-primary/30 via-primary/10 to-transparent blur-3xl"
        animate={{ x: [0, -25, 0], y: [0, -15, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(186,123,27,0.06),transparent_60%)]" />
    </div>
  )
}
