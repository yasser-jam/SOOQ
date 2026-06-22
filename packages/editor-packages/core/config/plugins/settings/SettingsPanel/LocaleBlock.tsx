"use client"

import { getClassNameFactory } from "@/core/lib"
import styles from "./styles.module.css"
import type { SettingsRootProps } from "./index"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@workspace/ui/components/select"

const getClassName = getClassNameFactory("SettingsPanel", styles)

const LANGUAGE_OPTIONS = [
  { label: "العربية", value: "ar" },
  { label: "English", value: "en" },
]

const CURRENCY_OPTIONS = [
  { label: "الليرة السورية (SYP)", value: "SYP" },
  { label: "الدولار الأمريكي (USD)", value: "USD" },
  { label: "اليورو (EUR)", value: "EUR" },
]

export default function LocaleBlock({
  rootProps,
  updateProps,
}: {
  rootProps?: SettingsRootProps
  updateProps: (patch: Partial<SettingsRootProps>) => void
}) {
  const language = (rootProps?.language ?? "ar") as "ar" | "en"
  const currency = (rootProps?.currency ?? "SYP") as "SYP" | "USD" | "EUR"

  return (
    <div className={getClassName("section")}>
      <div className={getClassName("sectionTitle")}>اللغة والعملة</div>

      <div className={getClassName("field")}>
        <div className="text-xs font-medium text-foreground mb-1">اللغة الافتراضية</div>
        <Select value={language} onValueChange={(v) => updateProps({ language: v as "ar" | "en", direction: v === "ar" ? "rtl" : "ltr" })}>
          <SelectTrigger size="sm">
            <SelectValue placeholder="اختر لغة" />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className={getClassName("field")}>
        <div className="text-xs font-medium text-foreground mb-1">عملة العرض</div>
        <Select value={currency} onValueChange={(v) => updateProps({ currency: v as "SYP" | "USD" | "EUR" })}>
          <SelectTrigger size="sm">
            <SelectValue placeholder="اختر عملة" />
          </SelectTrigger>
          <SelectContent>
            {CURRENCY_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
