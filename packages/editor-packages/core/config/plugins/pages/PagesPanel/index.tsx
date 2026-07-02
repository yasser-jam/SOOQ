"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import {
  ArrowLeft,
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
} from "../../../pages"
import {
  addSitePage,
  readSiteData,
  writeSiteData,
} from "../../../lib/site-data"
import { normalizeEditorData } from "../../../lib/normalize-editor-data"
import type { UserData } from "../../../types"
import {
  DEFAULT_SECTION_NAME,
  createSectionStarterContent,
} from "../../../blocks/Section/starter-data"
import {
  buildStudioEditHref,
  getStudioBaseFromPathname,
} from "../../../lib/studio-paths"
import styles from "./styles.module.css"
import { Input } from "@workspace/ui/components/input"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { cn } from "@workspace/ui/lib/utils"

const getClassName = getClassNameFactory("PagesPanel", styles)

const ICON_MAP = {
  Home,
  ShoppingCart,
  Package,
  Palette,
  FileText,
} as const

const ICON_ACCENT: Record<
  PageDefinition["iconName"],
  { bg: string; text: string }
> = {
  Home: { bg: "bg-sky-100", text: "text-sky-700" },
  ShoppingCart: { bg: "bg-emerald-100", text: "text-emerald-700" },
  Package: { bg: "bg-amber-100", text: "text-amber-700" },
  Palette: { bg: "bg-violet-100", text: "text-violet-700" },
  FileText: { bg: "bg-slate-100", text: "text-slate-700" },
}

const DEFAULT_ARABIC_PAGE_LABEL = "صفحة جديدة"

const createStarterPageContent = (title: string): UserData["content"] => {
  const nonce = Date.now().toString(36)
  const starterContent = createSectionStarterContent().map((item, index) => ({
    ...item,
    props: {
      ...(item.props ?? {}),
      id: `${item.type}-${nonce}-${index}`,
    },
  }))

  return [
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
  ] as UserData["content"]
}

function PageCard({
  page,
  isActive,
  editHref,
}: {
  page: PageDefinition
  isActive: boolean
  editHref: string
}) {
  const IconComponent = ICON_MAP[page.iconName]
  const accent = ICON_ACCENT[page.iconName]
  const displayPath = page.dynamic ? page.path : getEditPath(page)

  return (
    <a href={editHref} className="block no-underline">
      <Card
        size="sm"
        className={cn(
          "cursor-pointer border transition-all hover:border-primary/30 hover:shadow-sm",
          isActive
            ? "border-primary bg-primary/5 ring-2 ring-primary/20"
            : "border-border/70 bg-card"
        )}
      >
        <CardHeader className="grid-cols-[auto_1fr_auto] items-center gap-3">
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl",
              accent.bg,
              accent.text
            )}
          >
            <IconComponent size={18} />
          </div>

          <div className="min-w-0 space-y-1">
            <CardTitle className="truncate text-sm font-semibold text-foreground">
              {page.label}
            </CardTitle>
            <CardDescription
              className="truncate font-mono text-xs text-muted-foreground"
              dir="ltr"
            >
              {displayPath}
            </CardDescription>
          </div>

          <CardAction className="flex flex-col items-end gap-1.5">
            {page.dynamic ? (
              <Badge variant="secondary-tonal" className="text-[10px]">
                ديناميكية
              </Badge>
            ) : null}
            {page.isCustom && !page.dynamic ? (
              <Badge variant="primary" className="text-[10px]">
                مخصصة
              </Badge>
            ) : null}
            {isActive ? (
              <Badge variant="default" className="text-[10px]">
                الحالية
              </Badge>
            ) : (
              <ArrowLeft
                size={14}
                className="text-muted-foreground opacity-60"
                aria-hidden
              />
            )}
          </CardAction>
        </CardHeader>

        {page.description ? (
          <CardContent className="pt-0">
            <p className="text-xs leading-relaxed text-muted-foreground">
              {page.description}
            </p>
          </CardContent>
        ) : null}
      </Card>
    </a>
  )
}

export function PagesPanel() {
  const [pages, setPages] = useState<PageDefinition[]>(() => getAllPages())
  const [labelDraft, setLabelDraft] = useState("")
  const [pathDraft, setPathDraft] = useState("")
  const [formError, setFormError] = useState<string | null>(null)

  const studioBase = useMemo(() => {
    if (typeof window === "undefined") return null
    return getStudioBaseFromPathname(window.location.pathname)
  }, [])

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

  const { corePages, customPages } = useMemo(() => {
    const core: PageDefinition[] = []
    const custom: PageDefinition[] = []

    for (const page of pages) {
      if (page.isCustom) {
        custom.push(page)
      } else {
        core.push(page)
      }
    }

    return { corePages: core, customPages: custom }
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

    const site = readSiteData()
    const starterContent = normalizeEditorData({
      root: { props: { title: normalizedLabel } },
      content: createStarterPageContent(normalizedLabel),
      zones: {},
    }).content

    const nextSite = addSitePage(
      site,
      {
        path: normalizedPath,
        name: normalizedLabel,
        link: normalizedPath,
        title: normalizedLabel,
        description: "صفحة مخصصة",
        iconName: "FileText",
        isCustom: true,
      },
      starterContent
    )

    writeSiteData(nextSite)
    refreshPages()

    setFormError(null)
    setLabelDraft("")
    setPathDraft("")
  }

  const renderPageGroup = (
    title: string,
    groupPages: PageDefinition[],
    emptyMessage?: string
  ) => {
    if (groupPages.length === 0) {
      return emptyMessage ? (
        <p className="px-1 text-xs text-muted-foreground">{emptyMessage}</p>
      ) : null
    }

    return (
      <div className="space-y-2">
        <h3 className={getClassName("groupTitle")}>{title}</h3>
        <div className="space-y-2">
          {groupPages.map((page) => {
            const editHref = studioBase
              ? buildStudioEditHref(studioBase, getEditPath(page))
              : `${getEditPath(page)}/edit`

            return (
              <PageCard
                key={`${page.path}-${page.isCustom ? "custom" : "core"}`}
                page={page}
                isActive={currentPage?.path === page.path}
                editHref={editHref}
              />
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className={getClassName()}>
      <div className={getClassName("header")}>الصفحات</div>
      <p className={getClassName("intro")}>
        أدِر الصفحات التي يمكن للمتسوقين زيارتها. تبدأ الصفحات الجديدة بقسم جاهز
        حتى لا تبدأ من مساحة فارغة.
      </p>

      <Card size="sm" className="mx-3 mb-4 border-border/70 bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">إضافة صفحة</CardTitle>
          <CardDescription className="text-xs">
            أنشئ صفحة مخصصة بمسار URL واضح.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleCreatePage}>
            <FieldGroup className="gap-4">
              <Field>
                <FieldLabel htmlFor="page-label">التسمية</FieldLabel>
                <Input
                  id="page-label"
                  type="text"
                  value={labelDraft}
                  onChange={(event) => setLabelDraft(event.target.value)}
                  placeholder="من نحن"
                  className="h-9 text-sm"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="page-path">المسار</FieldLabel>
                <Input
                  id="page-path"
                  type="text"
                  value={pathDraft}
                  onChange={(event) => setPathDraft(event.target.value)}
                  placeholder="/about-us"
                  required
                  dir="ltr"
                  className="h-9 font-mono text-sm"
                />
              </Field>

              {formError ? <FieldError>{formError}</FieldError> : null}

              <Button type="submit" variant="secondary" size="sm" className="w-full">
                <Plus size={14} />
                إضافة الصفحة
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      <div className={getClassName("list")}>
        {renderPageGroup("الصفحات الأساسية", corePages)}
        {customPages.length > 0
          ? renderPageGroup("الصفحات المخصصة", customPages)
          : null}
      </div>

      <p className={getClassName("hint")}>
        انقر على أي صفحة للتبديل إليها داخل المحرر. لكل صفحة محتواها المستقل.
      </p>
    </div>
  )
}
