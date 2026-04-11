import { Noto_Sans_Arabic } from "next/font/google"

import "@workspace/ui/globals.css"
import "@/styles/style.scss"
import { Metadata } from "next";


const fontSans = Noto_Sans_Arabic({
  subsets: ["arabic"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: 'SOOQ - المتجر الإلكتروني',
  description: 'SOOQ - المتجر الإلكتروني',
};


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
