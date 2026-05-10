"use client"

import { DirectionProvider } from "@radix-ui/react-direction"
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query"
import { ThemeProvider } from "next-themes"
import { useState } from "react"

import { Toaster } from "@/components/toaster"

export default function PlatformLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, retry: 1 },
        },
      })
  )

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <DirectionProvider dir="rtl">{children}</DirectionProvider>
      </QueryClientProvider>
      <Toaster position="top-right" />
    </ThemeProvider>
  )
}
