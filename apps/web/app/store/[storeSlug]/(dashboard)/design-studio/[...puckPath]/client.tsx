"use client"

import Link from "next/link"
import {
  AutoField,
  createUsePuck,
  FieldLabel,
  Puck,
  Render,
  type Overrides,
} from "@/core"
import config from "@/core/config"
import { useDemoData } from "@/lib/use-demo-data"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import {
  CircleHelp,
  Copy,
  Check,
  Eye,
  FileJson,
  Keyboard,
  MousePointer2,
  Type,
  X,
} from "lucide-react"
import { settingsPlugin } from "@/core/config/plugins/settings"
import { HtmlBlockPaletteSync } from "@/core/config/plugins/html-block-palette"
import headingAnalyzer from "@/plugin-heading-analyzer"
import { pagesPlugin } from "@/core/config/plugins/pages"
import { zonesPlugin } from "@/core/config/plugins/zones"
import { themesPlugin } from "@/core/config/plugins/themes"
import { shopifyOutlinePlugin } from "@/core/config/plugins/shopify-editor"
import { canvasInteractionsPlugin } from "@/core/config/plugins/canvas-interactions"
import {
  applyPuckSave,
  findSitePage,
  normalizeSiteData,
  readSiteData,
  type SiteData,
} from "@/core/config/lib/site-data"
import { ThemeInjector } from "@/core/config/plugins/settings/ThemeInjector"
import type { UserData } from "@/core/config/types"
import type { FullThemeProps } from "@/core/config/theme"
import { Button } from "@workspace/ui/components/button"
import { EditorFullscreenShell } from "../_components/editor-fullscreen-shell"
import { PreviewPageShell } from "../_components/preview-page-shell"
import { PreviewThemeProvider } from "../_components/preview-theme-provider"
import {
  buildStudioEditHref,
  buildStudioPreviewHref,
} from "@/lib/design-studio-paths"

const hiddenPluginNames = new Set(["themes", "heading-analyzer", "outline"])

const EDITOR_HINT_DISMISSED_KEY = "puck-demo-editor-hint-dismissed-v1"

const isTypingTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  const tagName = target.tagName
  return tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT"
}

function JsonViewerFloatingButton({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      className="EditorHintPill"
      onClick={onOpen}
      aria-label="Open JSON viewer"
      style={{ bottom: "60px" }}
    >
      <FileJson size={16} />
      عرض JSON
    </button>
  )
}

function JsonViewerDialog({
  open,
  onClose,
  getSiteSnapshot,
}: {
  open: boolean
  onClose: () => void
  getSiteSnapshot: () => SiteData
}) {
  const usePuck = createUsePuck()
  const puckData = usePuck((s) => s.appState.data)
  const [copied, setCopied] = useState(false)

  const jsonString = useMemo(() => {
    if (!open) return ""

    return JSON.stringify(normalizeSiteData(getSiteSnapshot()), null, 2)
  }, [open, getSiteSnapshot, puckData])

  useEffect(() => {
    if (!open) {
      setCopied(false)
    }
  }, [open])

  const handleCopy = useCallback(async () => {
    if (!jsonString || typeof navigator === "undefined") return

    try {
      await navigator.clipboard.writeText(jsonString)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      const textarea = document.createElement("textarea")
      textarea.value = jsonString
      textarea.style.position = "fixed"
      textarea.style.opacity = "0"
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand("copy")
      document.body.removeChild(textarea)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    }
  }, [jsonString])

  if (!open) return null

  return (
    <div
      className="EditorShortcutOverlay"
      role="dialog"
      aria-modal="true"
      aria-label="Site JSON data"
      data-puck-no-shortcuts="true"
    >
      <button
        type="button"
        className="EditorShortcutOverlayBackdrop"
        onClick={onClose}
        aria-label="Close JSON viewer"
      />

      <div className="EditorShortcutDialog EditorJsonDialog" data-puck-no-shortcuts="true">
        <div className="EditorShortcutDialogHeader">
          <div>
            <p className="EditorShortcutEyebrow">Site data</p>
            <h2 className="EditorShortcutTitle">JSON</h2>
          </div>

          <div className="EditorJsonDialog-actions">
            <button
              type="button"
              className="EditorJsonDialog-copyBtn"
              onClick={() => void handleCopy()}
              aria-label="Copy JSON to clipboard"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? "تم النسخ" : "نسخ JSON"}
            </button>

            <button
              type="button"
              className="EditorShortcutClose"
              onClick={onClose}
              aria-label="Close JSON viewer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="EditorJsonDialog-preWrap" dir="ltr">
          <pre className="EditorJsonDialog-pre">
            <code>{jsonString}</code>
          </pre>
        </div>
      </div>
    </div>
  )
}

export function Client({
  path,
  isEdit,
  isPreview = false,
}: {
  path: string
  isEdit: boolean
  isPreview?: boolean
}) {
  const metadata = {
    example: "Hello, world",
  }

  const { data, resolvedData, savePageData } = useDemoData({
    path,
    isEdit,
    metadata,
  })

  const previewPageTitle = useMemo(() => {
    const site = readSiteData()
    const page = findSitePage(site, path)
    return page?.title ?? page?.name ?? path
  }, [path])

  const pathname = usePathname()
  const router = useRouter()
  const designStudioHref = useMemo(() => {
    const match = pathname?.match(/^\/store\/([^/]+)/)
    return match ? `/store/${match[1]}/design-studio` : "/"
  }, [pathname])

  const previewHref = useMemo(
    () => buildStudioPreviewHref(designStudioHref, path),
    [designStudioHref, path]
  )

  const editHref = useMemo(
    () => buildStudioEditHref(designStudioHref, path),
    [designStudioHref, path]
  )

  const exportFileName = "site"

  const [isClient, setIsClient] = useState(false)
  const [isShortcutDialogOpen, setShortcutDialogOpen] = useState(false)
  const [isJsonDialogOpen, setJsonDialogOpen] = useState(false)
  const [showHintPill, setShowHintPill] = useState(false)
  const exportDataRef = useRef<UserData | null>(null)
  const siteDataRef = useRef<SiteData | null>(null)

  const getSiteSnapshot = useCallback(() => {
    const base = siteDataRef.current ?? readSiteData()
    const puckData = exportDataRef.current

    if (puckData) {
      return applyPuckSave(base, path, puckData)
    }

    return base
  }, [path])

  const modKeyLabel = useMemo(() => {
    if (typeof navigator === "undefined") return "Ctrl"
    return /Mac|iPhone|iPad/.test(navigator.platform) ? "Cmd" : "Ctrl"
  }, [])

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    siteDataRef.current = readSiteData()
    exportDataRef.current = null
  }, [path])

  useEffect(() => {
    if (!isClient || !isEdit) return

    const isDismissed =
      window.localStorage.getItem(EDITOR_HINT_DISMISSED_KEY) === "1"

    setShowHintPill(!isDismissed)

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShortcutDialogOpen(false)
        setJsonDialogOpen(false)
        return
      }

      if (isTypingTarget(event.target)) return

      const isQuestionShortcut =
        event.key === "?" || (event.key === "/" && event.shiftKey)

      if (!isQuestionShortcut) return

      event.preventDefault()
      setShortcutDialogOpen((previous) => !previous)
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [isClient, isEdit])

  const dismissHintPill = useCallback(() => {
    setShowHintPill(false)

    if (typeof window !== "undefined") {
      window.localStorage.setItem(EDITOR_HINT_DISMISSED_KEY, "1")
    }
  }, [])

  const handleOpenPreview = useCallback(() => {
    const puckData = exportDataRef.current ?? data
    if (puckData) {
      savePageData(puckData as UserData)
      siteDataRef.current = readSiteData()
    }
    router.push(previewHref)
  }, [data, previewHref, router, savePageData])
  const handleExportJson = () => {
    if (typeof window === "undefined") return
    const blob = new Blob(
      [JSON.stringify(normalizeSiteData(getSiteSnapshot()), null, 2)],
      {
        type: "application/json",
      }
    )
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${exportFileName}.json`
    link.click()
    window.URL.revokeObjectURL(url)
  }

  const plugins = useMemo(
    () =>
      [
        shopifyOutlinePlugin,
        zonesPlugin,
        pagesPlugin,
        themesPlugin,
        headingAnalyzer,
        settingsPlugin,
        // Must be registered last so its `overrides.puck` wraps every
        // other plugin's — that way the context menu + keyboard shortcuts
        // sit at the outermost layer of the Puck tree and can't be
        // short-circuited by a nested override that forgets to render
        // `children`.
        canvasInteractionsPlugin,
      ].filter(
        (plugin) =>
          typeof plugin.name === "string" && !hiddenPluginNames.has(plugin.name)
      ),
    []
  )

  const overrides = useMemo(
    (): Partial<Overrides> => ({
      puck: ({ children }) => (
        <>
          <HtmlBlockPaletteSync />
          {children}

          {showHintPill && !isShortcutDialogOpen ? (
            <button
              type="button"
              className="EditorHintPill"
              onClick={() => setShortcutDialogOpen(true)}
              aria-label="Open Puck editor shortcuts and tips"
            >
              <CircleHelp size={16} />
              مساعدة سريعة
              <span className="EditorHintPill-key">?</span>
            </button>
          ) : null}

          <JsonViewerFloatingButton onOpen={() => setJsonDialogOpen(true)} />

          <JsonViewerDialog
            open={isJsonDialogOpen}
            onClose={() => setJsonDialogOpen(false)}
            getSiteSnapshot={getSiteSnapshot}
          />

          {isShortcutDialogOpen ? (
            <div
              className="EditorShortcutOverlay"
              role="dialog"
              aria-modal="true"
              aria-label="Puck editor shortcuts"
              data-puck-no-shortcuts="true"
            >
              <button
                type="button"
                className="EditorShortcutOverlayBackdrop"
                onClick={() => setShortcutDialogOpen(false)}
                aria-label="Close shortcuts panel"
              />

              <div
                className="EditorShortcutDialog"
                data-puck-no-shortcuts="true"
              >
                <div className="EditorShortcutDialogHeader">
                  <div>
                    <p className="EditorShortcutEyebrow">Editor guide</p>
                    <h2 className="EditorShortcutTitle">
                      Build faster with shortcuts
                    </h2>
                  </div>

                  <button
                    type="button"
                    className="EditorShortcutClose"
                    onClick={() => setShortcutDialogOpen(false)}
                    aria-label="Close editor guide"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="EditorShortcutSections">
                  <section className="EditorShortcutSection">
                    <h3>
                      <Keyboard size={16} />
                      Core actions
                    </h3>
                    <ul>
                      <li>
                        <span>Add section</span>
                        <kbd>A</kbd>
                      </li>
                      <li>
                        <span>Insert Hero on an empty page</span>
                        <span className="EditorShortcutKeys">
                          <kbd>Shift</kbd>
                          <kbd>A</kbd>
                        </span>
                      </li>
                      <li>
                        <span>Open this guide</span>
                        <kbd>?</kbd>
                      </li>
                      <li>
                        <span>Close dialogs</span>
                        <kbd>Esc</kbd>
                      </li>
                    </ul>
                  </section>

                  <section className="EditorShortcutSection">
                    <h3>
                      <MousePointer2 size={16} />
                      Canvas editing
                    </h3>
                    <ul>
                      <li>
                        <span>Duplicate selected block</span>
                        <span className="EditorShortcutKeys">
                          <kbd>{modKeyLabel}</kbd>
                          <kbd>D</kbd>
                        </span>
                      </li>
                      <li>
                        <span>Copy or paste block</span>
                        <span className="EditorShortcutKeys">
                          <kbd>{modKeyLabel}</kbd>
                          <kbd>C</kbd>
                          <kbd>{modKeyLabel}</kbd>
                          <kbd>V</kbd>
                        </span>
                      </li>
                      <li>
                        <span>Move block up or down</span>
                        <span className="EditorShortcutKeys">
                          <kbd>{modKeyLabel}</kbd>
                          <kbd>↑</kbd>
                          <kbd>{modKeyLabel}</kbd>
                          <kbd>↓</kbd>
                        </span>
                      </li>
                      <li>
                        <span>Hide or show selected block</span>
                        <kbd>H</kbd>
                      </li>
                      <li>
                        <span>Delete selected block</span>
                        <kbd>Del</kbd>
                      </li>
                    </ul>
                  </section>
                </div>

                <p className="EditorShortcutFooter">
                  Tip: Right-click any block on the canvas to open the quick
                  action menu.
                </p>

                <div className="EditorShortcutActions">
                  <button
                    type="button"
                    className="EditorShortcutGhostButton"
                    onClick={() => {
                      dismissHintPill()
                      setShortcutDialogOpen(false)
                    }}
                  >
                    Hide floating tip
                  </button>

                  <button
                    type="button"
                    className="EditorShortcutPrimaryButton"
                    onClick={() => setShortcutDialogOpen(false)}
                  >
                    Continue editing
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </>
      ),
      // Inject theme CSS custom properties + Google Fonts into the preview iframe
      iframe: ({ children, document }) => (
        <ThemeInjector document={document}>{children}</ThemeInjector>
      ),
      fieldTypes: {
        // Example of user field provided via overrides
        userField: (props) => {
          const { readOnly, field, name, value, onChange } = props

          return (
            <FieldLabel
              label={field.label || name}
              readOnly={readOnly}
              icon={<Type size={16} />}
            >
              <AutoField
                field={{ type: "text" }}
                onChange={onChange}
                value={value}
              />
            </FieldLabel>
          )
        },
      },
      headerActions: ({ children }) => (
        <div className="EditorHeaderActions">
          <Button variant="outline" size="sm" asChild>
            <Link href={designStudioHref}>إغلاق المحرر</Link>
          </Button>
          <Button variant="outline" size="sm" onClick={handleOpenPreview}>
            <Eye size={16} />
            معاينة
          </Button>
          {children}
        </div>
      ),
    }),
    [
      designStudioHref,
      dismissHintPill,
      getSiteSnapshot,
      handleOpenPreview,
      isJsonDialogOpen,
      isShortcutDialogOpen,
      modKeyLabel,
      showHintPill,
    ]
  )

  const previewRootProps = useMemo(() => {
    const root = resolvedData?.root
    if (!root) return undefined
    return ("props" in root ? root.props : root) as Partial<FullThemeProps>
  }, [resolvedData])

  const params = isClient
    ? new URL(window.location.href).searchParams
    : new URLSearchParams()

  if (!isClient) return null

  if (isEdit) {
    return (
      <EditorFullscreenShell>
        <Puck
          config={config}
          data={data}
          height="100%"
          ui={{ rightSideBarVisible: false, leftSideBarVisible: true }}
          onChange={(nextData) => {
            exportDataRef.current = nextData
          }}
          onPublish={async (data) => {
            savePageData(data as UserData)
            siteDataRef.current = readSiteData()
          }}
          plugins={plugins}
          // Keep both built-in plugins: "blocks" for the drag-and-drop palette
          // and "outline" for the block hierarchy tree view. shopifyOutlinePlugin
          // is filtered out via hiddenPluginNames so the built-in outline is
          // shown as-is without being overridden.
          builtinPlugins={["blocks", "outline"]}
          headerPath={path}
          iframe={{
            enabled: params.get("disableIframe") === "true" ? false : true,
          }}
          fieldTransforms={{
            userField: ({ value }) => value, // Included to check types
          }}
          _experimentalFullScreenCanvas
          overrides={overrides}
          metadata={metadata}
        />
      </EditorFullscreenShell>
    )
  }

  if (isPreview) {
    if (!data?.content) {
      return (
        <PreviewPageShell pageTitle={previewPageTitle} editHref={editHref}>
          <div className="PreviewPageShell-empty">
            <h1>404</h1>
            <p>Page does not exist in site data</p>
          </div>
        </PreviewPageShell>
      )
    }

    return (
      <PreviewPageShell pageTitle={previewPageTitle} editHref={editHref}>
        <PreviewThemeProvider rootProps={previewRootProps}>
          <Render config={config} data={resolvedData} metadata={metadata} />
        </PreviewThemeProvider>
      </PreviewPageShell>
    )
  }

  if (data.content) {
    return <Render config={config} data={resolvedData} metadata={metadata} />
  }

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        textAlign: "center",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div>
        <h1>404</h1>
        <p>Page does not exist in site data</p>
      </div>
    </div>
  )
}

export default Client
