"use client"

import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { cn } from "@workspace/ui/lib/utils"

type Option = {
  label: string
  value: string
}

type OptionTabsProps = {
  label: string
  value: string
  options: Option[]
  onValueChange: (value: string) => void
}

export default function OptionTabs({ label, value, options, onValueChange }: OptionTabsProps) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-foreground">{label}</div>
      <Tabs value={value} onValueChange={onValueChange} className="w-full">
        <TabsList className={cn("flex h-auto w-full flex-wrap gap-2 bg-transparent p-0")}> 
          {options.map((option) => (
            <TabsTrigger
              key={option.value}
              value={option.value}
              className={cn(
                "flex-1 rounded-md border border-border bg-white text-xs text-foreground shadow-none",
                "data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              )}
            >
              {option.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  )
}
