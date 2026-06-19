"use client"

import { Switch } from "@workspace/ui/components/switch"
import { cn } from "@workspace/ui/lib/utils"

type SysSwitchVariant = "primary" | "secondary" | "neutral"

type SysSwitchProps = {
  label: string
  description?: string
  value: boolean
  onChange: (value: boolean) => void
  variant?: SysSwitchVariant
  disabled?: boolean
}

const containerVariants: Record<SysSwitchVariant, string> = {
  primary: "border-primary bg-primary/5",
  secondary: "border-secondary bg-secondary/5",
  neutral: "border-border bg-muted/50",
}

const switchVariants: Record<SysSwitchVariant, string> = {
  primary: "data-[state=checked]:bg-primary",
  secondary: "data-[state=checked]:bg-secondary",
  neutral: "data-[state=checked]:bg-muted-foreground",
}

export default function SysSwitch(props: SysSwitchProps) {
  const {
    label,
    description,
    value,
    onChange,
    variant = "primary",
    disabled,
  } = props

  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-lg border border-dashed px-4 py-2",
        containerVariants[variant]
      )}
    >
      <div>
        <label htmlFor="switch">{label}</label>
        {description ? (
          <div className="mt-1 text-sm text-muted-foreground">{description}</div>
        ) : null}
      </div>

      <Switch
        checked={value}
        onCheckedChange={onChange}
        disabled={disabled}
        className={switchVariants[variant]}
      />
    </div>
  )
}
