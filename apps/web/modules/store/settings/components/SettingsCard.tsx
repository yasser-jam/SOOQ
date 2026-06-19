"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { cn } from "@workspace/ui/lib/utils"
import * as React from "react"

export function SettingsCard({
  className,
  ...props
}: React.ComponentProps<typeof Card>) {
  return (
    <Card
      className={cn("rounded-2xl border border-border bg-card shadow-sm h-full", className)}
      {...props}
    />
  )
}

export {
  CardContent as SettingsCardContent,
  CardDescription as SettingsCardDescription,
  CardFooter as SettingsCardFooter,
  CardHeader as SettingsCardHeader,
  CardTitle as SettingsCardTitle,
}
