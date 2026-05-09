"use client"

import * as React from "react"

import { cn } from "@workspace/ui/lib/utils"

/**
 * Lightweight Tabs primitive matching the shadcn/ui Tabs API exactly.
 * Uses pure React state (no @radix-ui/react-tabs dependency).
 *
 * Usage:
 *   <Tabs defaultValue="basics" value={tab} onValueChange={setTab}>
 *     <TabsList>
 *       <TabsTrigger value="basics">Basics</TabsTrigger>
 *       <TabsTrigger value="seo">SEO</TabsTrigger>
 *     </TabsList>
 *     <TabsContent value="basics">...</TabsContent>
 *     <TabsContent value="seo">...</TabsContent>
 *   </Tabs>
 *
 * Can be swapped for `@workspace/ui/components/tabs` (shadcn Radix wrapper)
 * with no consumer changes if/when that dependency is added.
 */

type TabsContextValue = {
  value: string
  setValue: (next: string) => void
  baseId: string
}

const TabsContext = React.createContext<TabsContextValue | null>(null)

function useTabsContext(component: string): TabsContextValue {
  const ctx = React.useContext(TabsContext)
  if (!ctx) {
    throw new Error(`<${component}> must be used inside <Tabs>`)
  }
  return ctx
}

type TabsProps = React.HTMLAttributes<HTMLDivElement> & {
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
}

export function Tabs({
  defaultValue = "",
  value: controlledValue,
  onValueChange,
  className,
  children,
  ...rest
}: TabsProps) {
  const isControlled = controlledValue !== undefined
  const [internal, setInternal] = React.useState(defaultValue)
  const value = isControlled ? controlledValue! : internal

  const setValue = React.useCallback(
    (next: string) => {
      if (!isControlled) setInternal(next)
      onValueChange?.(next)
    },
    [isControlled, onValueChange]
  )

  const baseId = React.useId()

  const ctx = React.useMemo<TabsContextValue>(
    () => ({ value, setValue, baseId }),
    [value, setValue, baseId]
  )

  return (
    <TabsContext.Provider value={ctx}>
      <div className={cn("flex flex-col gap-4", className)} {...rest}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

type TabsListProps = React.HTMLAttributes<HTMLDivElement>

export function TabsList({ className, children, ...rest }: TabsListProps) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex flex-wrap items-center gap-1 rounded-md bg-muted p-1 text-muted-foreground",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  )
}

type TabsTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  value: string
}

export function TabsTrigger({
  value,
  className,
  children,
  disabled,
  onClick,
  ...rest
}: TabsTriggerProps) {
  const { value: active, setValue, baseId } = useTabsContext("TabsTrigger")
  const selected = active === value
  return (
    <button
      type="button"
      role="tab"
      id={`${baseId}-trigger-${value}`}
      aria-selected={selected}
      aria-controls={`${baseId}-panel-${value}`}
      data-state={selected ? "active" : "inactive"}
      disabled={disabled}
      tabIndex={selected ? 0 : -1}
      onClick={(e) => {
        if (!disabled) setValue(value)
        onClick?.(e)
      }}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium",
        "ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow",
        className
      )}
      {...rest}
    >
      {children}
    </button>
  )
}

type TabsContentProps = React.HTMLAttributes<HTMLDivElement> & {
  value: string
  /** When true, mounts the content even when inactive (kept hidden via CSS). Useful for forms with shared state. Default: true. */
  forceMount?: boolean
}

export function TabsContent({
  value,
  forceMount = true,
  className,
  children,
  ...rest
}: TabsContentProps) {
  const { value: active, baseId } = useTabsContext("TabsContent")
  const selected = active === value

  if (!forceMount && !selected) return null

  return (
    <div
      role="tabpanel"
      id={`${baseId}-panel-${value}`}
      aria-labelledby={`${baseId}-trigger-${value}`}
      hidden={!selected}
      data-state={selected ? "active" : "inactive"}
      tabIndex={0}
      className={cn(
        "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        !selected && "hidden",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  )
}
