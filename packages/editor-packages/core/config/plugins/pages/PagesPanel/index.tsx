"use client"
import React, { useCallback, useEffect, useMemo, useState } from "react"
import {
  FileText,
  Home,
  Package,
  Palette,
  Plus,
  ShoppingCart,
} from "lucide-react"
import { getClassNameFactory } from "@/core/lib"
import {
  PageDefinition,
  PAGES_UPDATED_EVENT,
  getAllPages,
  getEditPath,
  matchCurrentPage,
  normalizePagePath,
  readCustomPages,
  writeCustomPages,
} from "../../../pages"
import { componentKey } from "../../../index"
import { normalizeEditorData } from "../../../lib/normalize-editor-data"
import type { UserData } from "../../../types"
import {
  DEFAULT_SECTION_NAME,
  createSectionStarterContent,
} from "../../../blocks/Section/starter-data"
import styles from "./styles.module.css"
import Input from "@workspace/ui/components/input"
import { Button } from "@workspace/ui/components/button"

const getClassName = getClassNameFactory("PagesPanel", styles)

// ─── Icon map ─────────────────────────────────────────────────────────────────

const ICON_MAP = {
  Home: Home,
  ShoppingCart: ShoppingCart,
  Package: Package,
  Palette: Palette,
  FileText: FileText,
}

const DEFAULT_ARABIC_PAGE_LABEL = "صفحة جديدة"

const createStorageKey = (path: string) => `puck-demo:${componentKey}:${path}`

const createStarterPageData = (title: string): UserData => {
  const nonce = Date.now().toString(36)
  const starterContent = createSectionStarterContent().map((item, index) => ({
    ...item,
    props: {
      ...(item.props ?? {}),
      id: `${item.type}-${nonce}-${index}`,
    },
  }))

  return {
    root: {
      props: {
        title,
      },
    },
    zones: {},
    content: [
      {
        type: "Section",
        props: {
          id: `Section-${nonce}`,
          name: DEFAULT_SECTION_NAME,
          anchorId: "",
          visible: true,
          paddingTop: "80px",
          paddingBottom: "80px",
          paddingHorizontal: "24px",
          backgroundColor: "#ffffff",
          theme: "dark",
          maxWidth: "1280px",
          columns: 1,
          gridGap: "24px",
          content: starterContent as any,
        },
      },
    ],
  }
}

// ─── Page item ────────────────────────────────────────────────────────────────

function PageItem({
  page,
  isActive,
}: {
  page: PageDefinition
  isActive: boolean
}) {
  const IconComponent = ICON_MAP[page.iconName]
  const editPath = getEditPath(page) + "/edit"

  return (
    <a
      href={editPath}
      className={`${getClassName("item")} ${isActive ? getClassName("item--active") : ""}`}
    >
      <div className={getClassName("iconWrap")}>
        <IconComponent size={16} />
      </div>

      <div className={getClassName("text")}>
        <div className={getClassName("label")}>{page.label}</div>
        <div className={getClassName("path")}>
          {page.dynamic ? page.path : page.path}
        </div>
      </div>

      {page.dynamic && (
        <span className={getClassName("dynamicBadge")}>ديناميكية</span>
      )}

      {page.isCustom && !page.dynamic && (
        <span className={getClassName("customBadge")}>مخصصة</span>
      )}

      {isActive && <div className={getClassName("activeDot")} />}
    </a>
  )
}

// ─── Panel ────────────────────────────────────────────────────────────────────

export function PagesPanel() {
  const [pages, setPages] = useState<PageDefinition[]>(() => getAllPages())
  const [labelDraft, setLabelDraft] = useState("")
  const [pathDraft, setPathDraft] = useState("")
  const [formError, setFormError] = useState<string | null>(null)

  const refreshPages = useCallback(() => {
    setPages(getAllPages())
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return

    refreshPages()

    window.addEventListener(PAGES_UPDATED_EVENT, refreshPages)
    window.addEventListener("storage", refreshPages)

    return () => {
      window.removeEventListener(PAGES_UPDATED_EVENT, refreshPages)
      window.removeEventListener("storage", refreshPages)
    }
  }, [refreshPages])

  const currentPage = useMemo(() => {
    if (typeof window === "undefined") return undefined
    return matchCurrentPage(window.location.pathname, pages)
  }, [pages])

  const handleCreatePage: React.FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault()

    if (typeof window === "undefined") return

    const normalizedPath = normalizePagePath(pathDraft)

    if (!normalizedPath) {
      setFormError(
        "استخدم مسارًا صالحًا مثل /about-us. المسارات الديناميكية و /edit غير مسموح بهما."
      )
      return
    }

    const existingEditPaths = new Set(pages.map((page) => getEditPath(page)))
    if (existingEditPaths.has(normalizedPath)) {
      setFormError("توجد صفحة بهذا المسار بالفعل.")
      return
    }

    const normalizedLabel = labelDraft.trim() || DEFAULT_ARABIC_PAGE_LABEL

    const nextPage: PageDefinition = {
      path: normalizedPath,
      label: normalizedLabel,
      description: "صفحة مخصصة",
      iconName: "FileText",
      dynamic: false,
      isCustom: true,
    }

    const nextCustomPages = [...readCustomPages(), nextPage]
    writeCustomPages(nextCustomPages)

    const storageKey = createStorageKey(normalizedPath)
    if (!window.localStorage.getItem(storageKey)) {
      const starterData = normalizeEditorData(
        createStarterPageData(normalizedLabel)
      )
      window.localStorage.setItem(storageKey, JSON.stringify(starterData))
    }

    setFormError(null)
    setLabelDraft("")
    setPathDraft("")
  }

  return (
    <div className={getClassName()}>
      <div className={getClassName("header")}>الصفحات</div>
      <p className={getClassName("intro")}>
        أدِر الصفحات التي يمكن للمتسوقين زيارتها. تبدأ الصفحات الجديدة بقسم جاهز
        حتى لا تبدأ من مساحة فارغة.
      </p>

      <form className={getClassName("create")} onSubmit={handleCreatePage}>
        <div className={getClassName("createHeader")}>إضافة صفحة</div>

        <label className={getClassName("fieldLabel")}>
          <span>التسمية</span>
          <Input
            type="text"
            value={labelDraft}
            onChange={(event) => setLabelDraft(event.target.value)}
            placeholder="من نحن"
          />
        </label>

        <label className={getClassName("fieldLabel")}>
          <span>المسار</span>
          <Input
            type="text"
            value={pathDraft}
            onChange={(event) => setPathDraft(event.target.value)}
            placeholder="/about-us"
            required
          />
        </label>

        {formError ? (
          <p className={getClassName("error")}>{formError}</p>
        ) : null}

        <Button type="submit" variant="secondary" size="sm">
          <Plus size={14} />
          إضافة الصفحة
        </Button>
      </form>

      <div className={getClassName("list")}>
        {pages.map((page) => (
          <PageItem
            key={`${page.path}-${page.isCustom ? "custom" : "core"}`}
            page={page}
            isActive={currentPage?.path === page.path}
          />
        ))}
      </div>

      <p className={getClassName("hint")}>
        انقر على أي صفحة للتبديل إليها داخل المحرر. لكل صفحة محتواها المستقل.
      </p>
    </div>
  )
}
