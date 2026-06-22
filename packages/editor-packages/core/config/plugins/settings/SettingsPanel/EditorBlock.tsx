"use client"

import { getClassNameFactory } from "@/core/lib"
import styles from "./styles.module.css"
import type { SettingsRootProps } from "./index"
import OptionTabs from "./OptionTabs"

const getClassName = getClassNameFactory("SettingsPanel", styles)

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="space-y-2 block">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <input
        type="number"
        value={value}
        onChange={(event) => {
          const nextValue = Number(event.target.value)
          if (Number.isNaN(nextValue)) return
          onChange(nextValue)
        }}
        className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </label>
  )
}

const MONOSPACE_OPTIONS = [
  { label: "لا", value: "false" },
  { label: "نعم", value: "true" },
]

export default function EditorBlock({ rootProps, updateProps }: { rootProps?: SettingsRootProps; updateProps: (p: Partial<SettingsRootProps>) => void }) {
  const editorMaxWidth = rootProps?.editorMaxWidth ?? 900
  const editorUseMonospace = rootProps?.editorUseMonospace ?? false

  return (
    <div className={getClassName("section")}>
      <div className={getClassName("sectionTitle")}>محرر المحتوى</div>
      <p className={getClassName("sectionHint")}>
        إعدادات المحرر مثل أقصى العرض وخيارات الخط.
      </p>

      <div className={getClassName("field")}>
        <NumberField label="أقصى عرض للمحرر (px)" value={editorMaxWidth} onChange={(nextValue) => updateProps({ editorMaxWidth: nextValue } as any)} />
      </div>

      <div className={getClassName("field")}>
        <OptionTabs label="استخدام خط أحادي المسافة للمحرر" value={editorUseMonospace ? "true" : "false"} options={MONOSPACE_OPTIONS} onValueChange={(v) => updateProps({ editorUseMonospace: v === "true" } as any)} />
      </div>
    </div>
  )
}
