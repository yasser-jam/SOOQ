"use client"

import type { RefObject } from "react"
import { Check, AlertCircle, Circle } from "lucide-react"

type Section = {
  id: string
  label: string
}

const SECTIONS: Section[] = [
  { id: "basic-info", label: "المعلومات الأساسية" },
  { id: "media", label: "الوسائط والصور" },
  { id: "pricing-inventory", label: "التسعير والمخزون" },
  { id: "variants", label: "الخيارات والمتغيرات" },
  { id: "categorization-attributes", label: "التصنيف والخصائص" },
  { id: "seo", label: "إعدادات SEO" },
]

type ValidationStatus = "empty" | "valid" | "error"

type Props = {
  activeSection: string
  onSectionChange: (section: string) => void
  /** Form column scroll root — section jumps scroll inside it, not the page */
  scrollContainerRef?: RefObject<HTMLElement | null>
  sectionValidation?: Record<string, ValidationStatus>
}

export default function ProductSidebarNavigation({
  activeSection,
  onSectionChange,
  scrollContainerRef,
  sectionValidation = {},
}: Props) {
  const handleClick = (sectionId: string) => {
    onSectionChange(sectionId)

    const container = scrollContainerRef?.current
    const el = container
      ? container.querySelector<HTMLElement>(`#${sectionId}`)
      : document.getElementById(sectionId)

    if (!el) return

    if (container) {
      const top =
        el.getBoundingClientRect().top -
        container.getBoundingClientRect().top +
        container.scrollTop
      container.scrollTo({ top, behavior: "smooth" })
      return
    }

    el.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const getStatusIcon = (sectionId: string) => {
    const status = sectionValidation[sectionId] ?? "empty"
    switch (status) {
      case "valid":
        return <Check className="size-4 text-green-500" />
      case "error":
        return <AlertCircle className="size-4 text-red-500" />
      default:
        return <Circle className="size-4 text-muted-foreground/40" />
    }
  }

  return (
    // Todo: use Card comoponent here
    <aside className="w-64 shrink-0 self-start">
      <nav className="rounded-xl bg-card/75 p-4">
        <h3 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          أقسام المنتج
        </h3>
        <ul className="space-y-1">
          {SECTIONS.map((section) => {
            const isActive = activeSection === section.id
            return (
              <li key={section.id}>
                <button
                  type="button"
                  onClick={() => handleClick(section.id)}
                  className={[
                    "w-full rounded-lg hover:bg-primary/10 cursor-pointer transition-all duration-200 px-3 py-2.5 text-right text-sm transition-all flex items-center justify-between gap-3",
                    isActive
                      ? "bg-primary/10 text-primary font-medium border-r-2 border-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  ].join(" ")}
                >
                  <span>{section.label}</span>
                  {getStatusIcon(section.id)}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}
