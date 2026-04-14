"use client"

import { Toaster as SonnerToaster } from "sonner"
import type { ToasterProps } from "sonner"

export function Toaster({ toastOptions, ...props }: ToasterProps) {
  return (
    <SonnerToaster
      position="top-right"
      {...props}
      toastOptions={{
        ...toastOptions,
        classNames: {
          success:
            "!bg-green-50 !border !border-green-500/45 !text-green-950 dark:!bg-green-950/35 dark:!border-green-500/40 dark:!text-green-50",
          error:
            "!bg-destructive/10 !border !border-destructive !text-destructive dark:!bg-destructive/20",
          ...toastOptions?.classNames,
        },
      }}
    />
  )
}
