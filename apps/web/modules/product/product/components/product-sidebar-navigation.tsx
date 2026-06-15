"use client"

import { useState } from "react"
import { Check, AlertCircle, Circle } from "lucide-react"

type Section = {
  id: string
  label: string
  icon?: string
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
  sectionValidation?: Record<string, ValidationStatus>
}

export default function ProductSidebarNavigation({
  activeSection,
  onSectionChange,
  sectionValidation = {},
}: Props) {
  const [isSeoExpanded, setIsSeoExpanded] = useState(false)

  const handleSectionClick = (sectionId: string) => {
    if (sectionId === "seo") {
      setIsSeoExpanded(!isSeoExpanded)
    }
    onSectionChange(sectionId)
  }

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  const getStatusIcon = (sectionId: string) => {
    const status = sectionValidation[sectionId] || "empty"
    switch (status) {
      case "valid":
        return <Check className="size-4 text-green-500" />
      case "error":
        return <AlertCircle className="size-4 text-red-500" />
      default:
        return <Circle className="size-4 text-gray-300" />
    }
  }

  return (
    <aside className="sticky top-0 h-screen w-64 shrink-0 overflow-y-auto">
      <nav className="rounded-lg border-2 bg-white p-4 shadow-sm h-full" style={{ borderColor: "#E5E7EB" }}>
        <h3 className="mb-4 text-lg font-semibold" style={{ color: "#122640" }}>
          أقسام المنتج
        </h3>
        <ul className="space-y-5">
          {SECTIONS.map((section) => (
            <li key={section.id}>
              <button
                type="button"
                onClick={() => {
                  handleSectionClick(section.id)
                  scrollToSection(section.id)
                }}
                className={`w-full rounded-lg px-4 py-3 text-right transition-all flex items-center justify-between gap-3 ${
                  activeSection === section.id
                    ? "font-medium"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
                style={
                  activeSection === section.id
                    ? { color: "#BA7B1B", borderRight: "3px solid #BA7B1B" }
                    : undefined
                }
              >
                <span>{section.label}</span>
                {getStatusIcon(section.id)}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}
