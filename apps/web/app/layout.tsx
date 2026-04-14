import { Almarai } from "next/font/google"

import "@workspace/ui/globals.css"
import "@/styles/style.scss"
import { Metadata } from "next";


const fontSans = Almarai({
  subsets: ["arabic"],
  weight: ["300", "400", "700", "800"],
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
