import { Almarai } from "next/font/google"
import type { Metadata } from "next"

import { siteConfig } from "@/config/site-config"

import "@workspace/ui/globals.css"
import "@/styles/style.scss"

const fontSans = Almarai({
  subsets: ["arabic"],
  weight: ["300", "400", "700", "800"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.description,
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="ar"
      suppressHydrationWarning
      dir="rtl"
      className={fontSans.variable}
    >
      <body>{children}</body>
    </html>
  )
}
