import { Geist, Geist_Mono } from "next/font/google"
import { Noto_Sans_Arabic } from "next/font/google"

import "@workspace/ui/globals.css"
import "@/styles/style.scss"

import Providers from "@/components/Providers";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

const fontSans = Noto_Sans_Arabic({
  subsets: ["arabic"],
  variable: "--font-sans",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="ar"
      suppressHydrationWarning
      dir="rtl"
      className={fontSans.variable}
    >
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
