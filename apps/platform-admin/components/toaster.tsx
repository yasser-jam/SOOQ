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
            "!bg-green-50 !border !border-green-500 !text-green-800 dark:!bg-green-950 dark:!border-green-600 dark:!text-green-100 [&_[data-icon]]:!text-green-600 dark:[&_[data-icon]]:!text-green-400",
          error:
            "!bg-red-50 !border !border-red-500 !text-red-800 dark:!bg-red-950 dark:!border-red-600 dark:!text-red-100 [&_[data-icon]]:!text-red-600 dark:[&_[data-icon]]:!text-red-400",
          ...toastOptions?.classNames,
        },
      }}
    />
  )
}
