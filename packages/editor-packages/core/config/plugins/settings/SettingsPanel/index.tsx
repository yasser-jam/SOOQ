"use client"
import { useAppStore } from "@/core/store"
import { getClassNameFactory } from "@/core/lib"
import {
  FullThemeProps,
} from "../../../theme"
import styles from "./styles.module.css"
import { cn } from "@workspace/ui/lib/utils"
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@workspace/ui/components/collapsible"
import LocaleBlock from "./LocaleBlock"
import FontsBlock from "./FontsBlock"
import ColorsBlock from "./ColorsBlock"
import ButtonVariantsBlock from "./ButtonVariantsBlock"
// import LookBlock from "./LookBlock"
// import EditorBlock from "./EditorBlock"
import { ChevronDown } from "lucide-react"

const getClassName = getClassNameFactory("SettingsPanel", styles)

const collapsibleTriggerClassName = cn(
  "group flex w-full items-center justify-between border-t-1 bg-white px-4 py-2 text-start text-sm transition-colors hover:bg-white/50",
  getClassName("collapsibleTrigger")
)

const collapsibleIconClassName =
  "shrink-0 text-gray-600 transition-transform duration-200 ease-in-out group-data-[state=open]:rotate-180"

// ─── Panel ───────────────────────────────────────────────────────────────────

/** Root props stored in page data (theme + editor toggles not on FullThemeProps). */
export type SettingsRootProps = Partial<FullThemeProps> & {
  enableHtmlRichTextBlock?: boolean
  // SOOQ locale (DSN-001 / CUR module). Defaults: rtl / ar / SYP.
  direction?: "rtl" | "ltr"
  language?: "ar" | "en"
  currency?: "SYP" | "USD" | "EUR"
  editorMaxWidth?: number
  editorUseMonospace?: boolean
}

export function SettingsPanel() {
  const rootProps = useAppStore(
    (s) => s.state.data.root.props as SettingsRootProps | undefined
  )
  const dispatch = useAppStore((s) => s.dispatch)

  const updateProps = (patch: Partial<SettingsRootProps>) => {
    dispatch({
      type: "replaceRoot",
      root: {
        props: { ...(rootProps ?? {}), ...patch } as any,
      },
    })
  }

  return (
    <div className={getClassName()}>
      <div className={cn(getClassName("header"), 'mt-4')}>إعدادات المتجر الأولية</div>
      <p className={getClassName("intro")}>
        اضبط مظهر وسلوك متجرك. هذه الإعدادات تؤثر على كل الصفحات والمحتوى، لذا
        اختر بعناية! لا تقلق، يمكنك دائمًا العودة وتعديلها لاحقًا.
      </p>

      {/* Collapsible panels (one per section). Triggers are full-width white rows; content uses transparent sidebar background. */}
      <div className={getClassName("collapsibleList")}>
        {/* LOCALE */}
        <Collapsible>
          <div className={getClassName("collapsibleItem")}>
            <CollapsibleTrigger className={collapsibleTriggerClassName}>
              <div>إعدادات اللغة</div>

              <ChevronDown className={collapsibleIconClassName} size={16} />
            </CollapsibleTrigger>
            <CollapsibleContent className={cn("p-3 bg-transparent", getClassName("collapsibleContent"))}>
              <LocaleBlock rootProps={rootProps} updateProps={updateProps} />
            </CollapsibleContent>
          </div>
        </Collapsible>

        {/* FONTS */}
        <Collapsible>
          <div className={getClassName("collapsibleItem")}>
            <CollapsibleTrigger className={collapsibleTriggerClassName}>
              <div>الخطوط</div>

              <ChevronDown className={collapsibleIconClassName} size={16} />
            </CollapsibleTrigger>
            <CollapsibleContent className={cn("p-3 bg-transparent", getClassName("collapsibleContent"))}>
              <FontsBlock rootProps={rootProps} updateProps={updateProps} />
            </CollapsibleContent>
          </div>
        </Collapsible>

        {/* COLORS */}
        <Collapsible>
          <div className={getClassName("collapsibleItem")}>
            <CollapsibleTrigger className={collapsibleTriggerClassName}>
              <div>الألوان</div>

              <ChevronDown className={collapsibleIconClassName} size={16} />
            </CollapsibleTrigger>
            <CollapsibleContent className={cn("p-3 bg-transparent", getClassName("collapsibleContent"))}>
              <ColorsBlock rootProps={rootProps} updateProps={updateProps} />
            </CollapsibleContent>
          </div>
        </Collapsible>

        {/* LOOK — hidden, keep code */}
        {/* <Collapsible>
          <div className={getClassName("collapsibleItem")}>
            <CollapsibleTrigger className={collapsibleTriggerClassName}>
              <div>المظهر</div>

              <ChevronDown className={collapsibleIconClassName} size={16} />
            </CollapsibleTrigger>
            <CollapsibleContent className={cn("p-3 bg-transparent", getClassName("collapsibleContent"))}>
              <LookBlock rootProps={rootProps} updateProps={updateProps} />
            </CollapsibleContent>
          </div>
        </Collapsible> */}

        {/* BUTTON VARIANTS */}
        <Collapsible>
          <div className={getClassName("collapsibleItem")}>
            <CollapsibleTrigger className={collapsibleTriggerClassName}>
              <div>أنماط الأزرار</div>

              <ChevronDown className={collapsibleIconClassName} size={16} />
            </CollapsibleTrigger>
            <CollapsibleContent className={cn("p-3 bg-transparent", getClassName("collapsibleContent"))}>
              <ButtonVariantsBlock rootProps={rootProps} updateProps={updateProps} />
            </CollapsibleContent>
          </div>
        </Collapsible>

        {/* EDITOR — hidden, keep code */}
        {/* <Collapsible>
          <div className={getClassName("collapsibleItem")}>
            <CollapsibleTrigger className={collapsibleTriggerClassName}>
              <div>المحرر</div>

              <ChevronDown className={collapsibleIconClassName} size={16} />
            </CollapsibleTrigger>
            <CollapsibleContent className={cn("p-3 bg-transparent", getClassName("collapsibleContent"))}>
              <EditorBlock rootProps={rootProps} updateProps={updateProps} />
            </CollapsibleContent>
          </div>
        </Collapsible> */}
      </div>
    </div>
  )
}
