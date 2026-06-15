"use client"

import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useTransform,
} from "framer-motion"
import * as React from "react"

import { childVariants, MotionSection } from "./motion-section"

type Stat = {
  /** Final numeric value used for the count-up animation. */
  value: number
  /** Optional formatter — by default values are localized as Arabic-Indic decimals. */
  format?: (value: number) => string
  prefix?: string
  suffix?: string
  label: string
}

const STATS: readonly Stat[] = [
  { prefix: "+", value: 1000, label: "تاجر يثق بنا" },
  { prefix: "+", value: 50000, label: "طلب تمّت معالجته" },
  {
    value: 99.9,
    suffix: "%",
    label: "Uptime موثوق",
    format: (v) => v.toFixed(1).toString(),
  },
] as const

export function Stats() {
  return (
    <MotionSection
      id="stats"
      labelledBy="stats-heading"
      className="relative py-20 md:py-24"
    >
      <div className="mx-auto w-full max-w-7xl px-4 md:px-8">
        <h2 id="stats-heading" className="sr-only">
          إحصائيات المنصّة
        </h2>

        <div className="overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-primary via-primary/95 to-primary/90 p-8 shadow-2xl md:p-14">
          <ul className="grid gap-10 md:grid-cols-3 md:gap-6">
            {STATS.map((stat) => (
              <StatItem key={stat.label} stat={stat} />
            ))}
          </ul>
        </div>
      </div>
    </MotionSection>
  )
}

function StatItem({ stat }: { stat: Stat }) {
  const ref = React.useRef<HTMLLIElement>(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })
  const motionValue = useMotionValue(0)
  const display = useTransform(motionValue, (v) =>
    stat.format ? stat.format(v) : Math.round(v).toLocaleString("ar-EG")
  )

  React.useEffect(() => {
    if (!inView) return
    const controls = animate(motionValue, stat.value, {
      duration: 1.6,
      ease: "easeOut",
    })
    return () => controls.stop()
  }, [inView, motionValue, stat.value])

  return (
    <motion.li
      ref={ref}
      variants={childVariants}
      className="flex flex-col items-center text-center text-primary-foreground"
    >
      <span className="flex items-baseline gap-1 text-4xl font-extrabold tracking-tight md:text-5xl lg:text-6xl">
        {stat.prefix && <span className="text-secondary">{stat.prefix}</span>}
        <motion.span>{display}</motion.span>
        {stat.suffix && <span className="text-secondary">{stat.suffix}</span>}
      </span>
      <span className="mt-3 text-sm font-medium text-primary-foreground/80 md:text-base">
        {stat.label}
      </span>
    </motion.li>
  )
}
