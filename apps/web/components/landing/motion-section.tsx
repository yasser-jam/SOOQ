"use client"

import { motion, type HTMLMotionProps, type Variants } from "framer-motion"
import * as React from "react"

const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut", when: "beforeChildren", staggerChildren: 0.1 },
  },
}

export const childVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
}

type MotionSectionProps = HTMLMotionProps<"section"> & {
  /** ID for anchor scrolling. */
  id?: string
  /** ID of the heading inside the section — wires aria-labelledby. */
  labelledBy?: string
}

export function MotionSection({
  id,
  labelledBy,
  className,
  children,
  variants,
  ...rest
}: MotionSectionProps) {
  return (
    <motion.section
      id={id}
      aria-labelledby={labelledBy}
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={variants ?? sectionVariants}
      {...rest}
    >
      {children}
    </motion.section>
  )
}
