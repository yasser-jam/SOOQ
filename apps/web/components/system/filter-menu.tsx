"use client"

import type { ReactNode } from "react"
import { Filter } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"

type FilterMenuProps = {
  children: ReactNode
}

export default function FilterMenu({ children }: FilterMenuProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" size="icon" variant="ghost" aria-label="Filter">
          <Filter data-icon="inline-start" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-4">
        {children}
      </PopoverContent>
    </Popover>
  )
}
