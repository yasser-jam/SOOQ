import { Noto_Sans_Arabic } from "next/font/google"

import "@workspace/ui/globals.css"
import "@/styles/style.scss"


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
        {children}
      </body>
    </html>
  )
}
