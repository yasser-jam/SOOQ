"use client"

import Link from "next/link"
import {
  AutoField,
  FieldLabel,
  Puck,
  Render,
  type Overrides,
} from "@/core"
import { createUsePuck } from "@/core/lib/use-puck"
import config from "@/core/config"
import { useDemoData } from "@/lib/use-demo-data"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
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
import { MobilePaletteSync } from "@/core/config/plugins/mobile-palette"
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
  parseEditorMode,
  readSiteData,
  setActiveEditorMode,
  type EditorMode,
  type SiteData,
} from "@/core/config/lib/site-data"
import {
  clearPageDraft,
  readPageDraft,
  writePageDraft,
} from "@/core/config/lib/page-draft"
import { ThemeInjector } from "@/core/config/plugins/settings/ThemeInjector"
import type { UserData } from "@/core/config/types"
import type { FullThemeProps } from "@/core/config/theme"
import { Button } from "@workspace/ui/components/button"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { saveWebDesignDraft } from "@/modules/design-studio/draft"
import { hydrateLocalSiteFromSources } from "@/modules/design-studio/local-site-sync"
import { designStudioKeys } from "@/modules/design-studio/queryKeys"
import { useCurrentUser } from "@/modules/auth/auth/hooks/useCurrentUser"
import { EditorFullscreenShell } from "../_components/editor-fullscreen-shell"
import { PreviewPageShell } from "../_components/preview-page-shell"
import { PreviewThemeProvider } from "../_components/preview-theme-provider"
import { SiteJsonViewer } from "../_components/site-json-viewer"
import { StoreProvider } from "@/modules/storefront/components/StoreProvider"
import {
  buildStudioEditHrefFromSegment,
  buildStudioPreviewHrefFromSegment,
  resolveStudioThemeEditHref,
  resolveStudioThemePreviewHref,
  withEditorMode,
} from "@/lib/design-studio-paths"
import { useSelectedPage } from "@/core/config/lib/use-selected-page"
import { PAGES_UPDATED_EVENT } from "@/core/config/page-registry"

// shopifyOutlinePlugin registers as "sections" (الأقسام); built-in outline
// stays as "شجرة العناصر". Both tabs remain visible in the left sidebar.
const hiddenPluginNames = new Set(["themes", "heading-analyzer"])

const EDITOR_HINT_DISMISSED_KEY = "puck-demo-editor-hint-dismissed-v1"

// Must be referentially stable per editor mode — PuckProvider rebuilds when
// metadata identity changes.
const EDITOR_METADATA_DESKTOP = {
  example: "Hello, world",
  editorMode: "desktop" as const,
}

const EDITOR_METADATA_MOBILE = {
  example: "Hello, world",
  editorMode: "mobile" as const,
}

const MOBILE_VIEWPORTS = [
  { width: 360, height: "auto" as const, icon: "Smartphone" as const, label: "جوال" },
]

const MOBILE_PUCK_UI = {
  viewports: {
    current: { width: 360, height: "auto" as const },
    controlsVisible: false,
  },
}

// Stable for the same reason — feeds PuckProvider's loadedFieldTransforms.
const fieldTransforms = {
  userField: ({ value }: any) => value, // Included to check types
}

const usePuck = createUsePuck()

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
  editorMode = "desktop",
}: {
  open: boolean
  onClose: () => void
  getSiteSnapshot: () => SiteData
  editorMode?: EditorMode
}) {
  // Only subscribe to editor data while the dialog is open — otherwise every
  // keystroke in the canvas re-renders this (closed) dialog.
  const puckData = usePuck((s) => (open ? s.appState.data : null))
  const [copied, setCopied] = useState(false)

  const siteSnapshot = useMemo(() => {
    if (!open) return null
    return normalizeSiteData(getSiteSnapshot())
  }, [open, getSiteSnapshot, puckData])

  const jsonString = useMemo(
    () => (siteSnapshot ? JSON.stringify(siteSnapshot, null, 2) : ""),
    [siteSnapshot]
  )

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

  if (!open || !siteSnapshot) return null

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
            <p className="EditorShortcutEyebrow">
              {editorMode === "mobile" ? "Mobile site data" : "Site data"}
            </p>
            <h2 className="EditorShortcutTitle">
              {editorMode === "mobile" ? "JSON (الجوال)" : "JSON"}
            </h2>
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

        <SiteJsonViewer site={siteSnapshot} />
      </div>
    </div>
  )
}

/**
 * Floating helpers rendered inside the Puck tree (needs Puck context for the
 * JSON viewer). Owns the hint-pill + shortcut/JSON dialog state and the
 * related keyboard shortcuts. This state used to live in `Client`, where each
 * toggle recreated the `overrides` object and re-initialized the whole editor
 * store (docs/editor-study-and-enhancement-plan.md §2.3).
 */
function EditorFloatingTools({
  getSiteSnapshot,
  modKeyLabel,
  editorMode = "desktop",
}: {
  getSiteSnapshot: () => SiteData
  modKeyLabel: string
  editorMode?: EditorMode
}) {
  const [isShortcutDialogOpen, setShortcutDialogOpen] = useState(false)
  const [isJsonDialogOpen, setJsonDialogOpen] = useState(false)
  const [showHintPill, setShowHintPill] = useState(false)

  useEffect(() => {
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
  }, [])

  const dismissHintPill = useCallback(() => {
    setShowHintPill(false)

    if (typeof window !== "undefined") {
      window.localStorage.setItem(EDITOR_HINT_DISMISSED_KEY, "1")
    }
  }, [])

  return (
    <>
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
        editorMode={editorMode}
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

          <div className="EditorShortcutDialog" data-puck-no-shortcuts="true">
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
              Tip: Right-click any block on the canvas to open the quick action
              menu.
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
  )
}

export function Client({
  path: pathProp,
  themeSlug,
  isEdit,
  isPreview = false,
}: {
  path?: string
  themeSlug?: string
  isEdit: boolean
  isPreview?: boolean
}) {
  const selectedPagePath = useSelectedPage()
  const path = themeSlug ? selectedPagePath : (pathProp ?? "/")

  const searchParams = useSearchParams()
  const editorMode: EditorMode = parseEditorMode(searchParams.get("mode"))
  const isMobileEditor = editorMode === "mobile"

  setActiveEditorMode(editorMode)

  const editorMetadata = isMobileEditor
    ? EDITOR_METADATA_MOBILE
    : EDITOR_METADATA_DESKTOP

  const router = useRouter()
  const queryClient = useQueryClient()
    const { hasRole } = useCurrentUser()
    const canWrite = hasRole(["OWNER", "MANAGER"])
  const designStudioHref = useMemo(() => "/design-studio", [])

  const previewHref = useMemo(
    () =>
      withEditorMode(
        themeSlug
          ? buildStudioPreviewHrefFromSegment(designStudioHref, themeSlug)
          : resolveStudioThemePreviewHref(designStudioHref),
        editorMode
      ),
    [designStudioHref, themeSlug, editorMode]
  )

  const editHref = useMemo(
    () =>
      withEditorMode(
        themeSlug
          ? buildStudioEditHrefFromSegment(designStudioHref, themeSlug)
          : resolveStudioThemeEditHref(designStudioHref),
        editorMode
      ),
    [designStudioHref, themeSlug, editorMode]
  )

  const exportFileName = isMobileEditor ? "site-mobile" : "site"

  const [isClient, setIsClient] = useState(false)
  // Gate the editor until API/file → localStorage hydration finishes so we
  // never flash the previously cached theme after "تطبيق الثيم".
  const [siteReady, setSiteReady] = useState(false)
  const [siteRevision, setSiteRevision] = useState(0)
  const exportDataRef = useRef<UserData | null>(null)
  const siteDataRef = useRef<SiteData | null>(null)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        const result = await hydrateLocalSiteFromSources()
        if (cancelled) return

        if (result.source === "api") {
          toast.success("تم تحديث التصميم المحلي من الخادم")
        } else if (result.source === "builtin-file") {
          toast.success("تم تحديث التصميم المحلي من القالب")
        }
      } catch {
        // Keep whatever is already in localStorage if the draft fetch fails.
      } finally {
        if (!cancelled) {
          setSiteRevision((n) => n + 1)
          setSiteReady(true)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  const { data, resolvedData, savePageData } = useDemoData({
    path,
    isEdit,
    mode: editorMode,
    metadata: editorMetadata,
    revision: siteRevision,
  })

  const previewPageTitle = useMemo(() => {
    if (!siteReady) return path
    const site = readSiteData(editorMode)
    const page = findSitePage(site, path)
    return page?.title ?? page?.name ?? path
  }, [path, editorMode, siteReady, siteRevision])

  // --- Draft autosave (crash safety) -------------------------------------
  // Edits are debounce-written to a per-page draft key; publish stays
  // explicit. On mount, an unpublished draft (if it differs from the saved
  // page) is restored into the editor with a notice offering to discard it.
  const [draftEpoch, setDraftEpoch] = useState(0)
  const initialDraft = useMemo(() => {
    if (!isEdit) return null
    const draft = readPageDraft(path, editorMode)
    if (!draft) return null
    if (JSON.stringify(draft.data) === JSON.stringify(data)) return null
    return draft
    // draftEpoch: bumped when the user discards the draft, forcing a re-read.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, path, data, draftEpoch, editorMode])

  const editorData = initialDraft?.data ?? data

  const [draftNoticeVisible, setDraftNoticeVisible] = useState(false)
  useEffect(() => {
    setDraftNoticeVisible(Boolean(initialDraft))
  }, [initialDraft])

  const draftTimerRef = useRef<number | null>(null)
  // First debounced snapshot after mount becomes the baseline instead of a
  // draft: Puck fires onChange during mount-time resolveData, and treating
  // that as a user edit would leave phantom "unsaved draft" notices behind.
  const draftBaselineRef = useRef<string | null>(null)

  const scheduleDraftWrite = useCallback(
    (nextData: UserData) => {
      if (typeof window === "undefined") return
      if (draftTimerRef.current) window.clearTimeout(draftTimerRef.current)

      draftTimerRef.current = window.setTimeout(() => {
        draftTimerRef.current = null
        const json = JSON.stringify(nextData)

        if (draftBaselineRef.current === null) {
          draftBaselineRef.current = json
          return
        }

        if (json === draftBaselineRef.current) {
          // User edited back to the baseline — no unsaved work left.
          clearPageDraft(path, editorMode)
          return
        }

        writePageDraft(path, nextData, editorMode)
      }, 1000)
    },
    [path, editorMode]
  )

  // On page switch / unmount: flush any pending edit into the draft so fast
  // page-hopping can't drop the last second of work.
  useEffect(() => {
    draftBaselineRef.current = null

    return () => {
      if (draftTimerRef.current) {
        window.clearTimeout(draftTimerRef.current)
        draftTimerRef.current = null
        const pending = exportDataRef.current
        if (pending && draftBaselineRef.current !== null) {
          writePageDraft(path, pending, editorMode)
        }
      }
    }
  }, [path, editorMode])

  const handleDiscardDraft = useCallback(() => {
    if (draftTimerRef.current) {
      window.clearTimeout(draftTimerRef.current)
      draftTimerRef.current = null
    }
    clearPageDraft(path, editorMode)
    draftBaselineRef.current = null
    exportDataRef.current = null
    // Remounts <Puck> with the saved page data.
    setDraftEpoch((epoch) => epoch + 1)
  }, [path, editorMode])

  // After an explicit save (publish / preview), the crash-safety draft is
  // obsolete: cancel any pending debounced write so it can't resurrect a
  // stale draft, and treat the saved payload as the new baseline.
  const markPageSaved = useCallback(
    (savedData: UserData) => {
      if (draftTimerRef.current) {
        window.clearTimeout(draftTimerRef.current)
        draftTimerRef.current = null
      }
      clearPageDraft(path, editorMode)
      draftBaselineRef.current = JSON.stringify(savedData)
      setDraftNoticeVisible(false)
    },
    [path, editorMode]
  )
  // ------------------------------------------------------------------------

  // Lets handleOpenPreview read the latest data without depending on it —
  // keeps the callback (and therefore `overrides`) referentially stable.
  const latestDataRef = useRef(editorData)

  useEffect(() => {
    latestDataRef.current = editorData
  }, [editorData])

  const getSiteSnapshot = useCallback(() => {
    const base = siteDataRef.current ?? readSiteData(editorMode)
    const puckData = exportDataRef.current

    if (puckData) {
      return applyPuckSave(base, path, puckData)
    }

    return base
  }, [path, editorMode])

  const modKeyLabel = useMemo(() => {
    if (typeof navigator === "undefined") return "Ctrl"
    return /Mac|iPhone|iPad/.test(navigator.platform) ? "Cmd" : "Ctrl"
  }, [])

  useEffect(() => {
    if (!siteReady) return
    siteDataRef.current = readSiteData(editorMode)
    exportDataRef.current = null
  }, [path, editorMode, siteReady, siteRevision])

  // The pages panel can add or delete pages without changing `path`, which
  // would leave this snapshot (used by the JSON viewer / export) describing a
  // site that no longer exists.
  useEffect(() => {
    const refreshSiteSnapshot = () => {
      siteDataRef.current = readSiteData(editorMode)
    }

    window.addEventListener(PAGES_UPDATED_EVENT, refreshSiteSnapshot)
    return () =>
      window.removeEventListener(PAGES_UPDATED_EVENT, refreshSiteSnapshot)
  }, [editorMode])

  const handleOpenPreview = useCallback(async () => {
    const puckData = exportDataRef.current ?? latestDataRef.current
    if (puckData) {
      savePageData(puckData as UserData)
      siteDataRef.current = readSiteData(editorMode)
      markPageSaved(puckData as UserData)
    }

    // Editing a named template (not the tenant's live draft) still uses the
    // local-storage preview — /design-preview only ever renders the admin
    // draft or a gallery template's own saved JSON, neither of which is
    // "this template plus my unsaved local edits".
    if (themeSlug) {
      router.push(previewHref)
      return
    }

    // Editing the tenant's live draft — push local edits to the backend
    // first so /design-preview (GET /admin/design/draft) reflects what's on
    // screen instead of a stale server copy.
    if (canWrite) {
      try {
        await saveWebDesignDraft(readSiteData("desktop"))
        await queryClient.invalidateQueries({ queryKey: designStudioKeys.all })
      } catch {
        toast.error("تعذر حفظ التصميم على الخادم. ستظهر المعاينة بآخر نسخة محفوظة.")
      }
    }

    router.push("/design-preview")
  }, [
    previewHref,
    router,
    savePageData,
    markPageSaved,
    editorMode,
    themeSlug,
    canWrite,
    queryClient,
  ])

  // The header "حفظ" button: local write (unchanged) + the draft PUT that
  // makes the design survive this browser. Only `configJson.web` carries data
  // today — the mobile app builder has no screens to send yet.
  const handleSave = useCallback(
    async (puckData: UserData) => {
      if (!canWrite) return
      savePageData(puckData)
      siteDataRef.current = readSiteData(editorMode)
      markPageSaved(puckData)

      try {
        await saveWebDesignDraft(readSiteData("desktop"))
        await queryClient.invalidateQueries({ queryKey: designStudioKeys.all })
        toast.success("تم حفظ التصميم")
      } catch {
        toast.error("تعذر حفظ التصميم على الخادم. التغييرات محفوظة محلياً فقط.")
      }
    },
    [canWrite, editorMode, markPageSaved, queryClient, savePageData]
  )

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
          <MobilePaletteSync editorMode={editorMode} />
          {children}
          {/* Owns its own dialog/hint state so toggling it never recreates
              `overrides` (which would reset the whole Puck store). */}
          <EditorFloatingTools
            getSiteSnapshot={getSiteSnapshot}
            modKeyLabel={modKeyLabel}
            editorMode={editorMode}
          />
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
          {canWrite ? children : null}
        </div>
      ),
    }),
    [
      canWrite,
      designStudioHref,
      getSiteSnapshot,
      handleOpenPreview,
      modKeyLabel,
      editorMode,
    ]
  )

  const previewRootProps = useMemo(() => {
    const root = resolvedData?.root
    if (!root) return undefined
    return ("props" in root ? root.props : root) as Partial<FullThemeProps> & {
      language?: "ar" | "en"
    }
  }, [resolvedData])

  // Referentially stable for the same reason as EDITOR_METADATA — the query
  // param can only change with a full navigation, which remounts this tree.
  const iframeConfig = useMemo(() => {
    if (typeof window === "undefined") return { enabled: true }
    const params = new URL(window.location.href).searchParams
    return { enabled: params.get("disableIframe") !== "true" }
  }, [])

  if (!isClient || !siteReady) return null

  if (isEdit) {
    return (
      <EditorFullscreenShell>
        {draftNoticeVisible && initialDraft ? (
          <div
            dir="rtl"
            role="status"
            style={{
              position: "fixed",
              top: 64,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 60,
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "8px 16px",
              borderRadius: 999,
              border: "1px solid #e0b252",
              background: "#fdf6e3",
              color: "#7a5a10",
              fontSize: 13,
              boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
            }}
          >
            <span>
              تمت استعادة مسودة غير منشورة (
              {new Date(initialDraft.savedAt).toLocaleTimeString("ar", {
                hour: "2-digit",
                minute: "2-digit",
              })}
              )
            </span>
            <button
              type="button"
              onClick={() => setDraftNoticeVisible(false)}
              style={{
                border: "none",
                background: "#7a5a10",
                color: "#fff",
                borderRadius: 999,
                padding: "4px 12px",
                cursor: "pointer",
                fontSize: 12,
              }}
            >
              متابعة التحرير
            </button>
            <button
              type="button"
              onClick={handleDiscardDraft}
              style={{
                border: "1px solid currentColor",
                background: "transparent",
                color: "inherit",
                borderRadius: 999,
                padding: "4px 12px",
                cursor: "pointer",
                fontSize: 12,
              }}
            >
              تجاهل المسودة
            </button>
          </div>
        ) : null}
        <Puck
          key={`${path}:${editorMode}:${draftEpoch}:${siteRevision}`}
          config={config}
          data={editorData}
          height="100%"
          permissions={
            canWrite
              ? undefined
              : {
                  drag: false,
                  duplicate: false,
                  delete: false,
                  edit: false,
                  insert: false,
                }
          }
          ui={{
            rightSideBarVisible: true,
            leftSideBarVisible: true,
            ...(isMobileEditor ? MOBILE_PUCK_UI : {}),
          }}
          viewports={isMobileEditor ? MOBILE_VIEWPORTS : undefined}
          onChange={(nextData) => {
            if (!canWrite) return
            exportDataRef.current = nextData
            scheduleDraftWrite(nextData)
          }}
          onPublish={canWrite ? (data) => handleSave(data as UserData) : undefined}
          plugins={plugins}
          // "blocks" = drag-and-drop palette; "outline" = شجرة العناصر tree.
          // shopifyOutlinePlugin ("sections" / الأقسام) is a separate tab.
          builtinPlugins={["blocks", "outline"]}
          headerPath={path}
          headerTitle={isMobileEditor ? "محرر الجوال" : undefined}
          iframe={iframeConfig}
          fieldTransforms={fieldTransforms}
          _experimentalFullScreenCanvas
          overrides={overrides}
          metadata={editorMetadata}
        />
      </EditorFullscreenShell>
    )
  }

  if (isPreview) {
    if (!data?.content) {
      return (
        <PreviewPageShell
          pageTitle={previewPageTitle}
          editHref={editHref}
          variant={isMobileEditor ? "mobile" : "desktop"}
        >
          <div className="PreviewPageShell-empty">
            <h1>404</h1>
            <p>Page does not exist in site data</p>
          </div>
        </PreviewPageShell>
      )
    }

    return (
      <PreviewPageShell pageTitle={previewPageTitle} editHref={editHref}>
        {/* StoreProvider so /settings address bindings + showCondition see
            the customer session (same cookie the published storefront uses). */}
        <StoreProvider
          initialLanguage={
            previewRootProps?.language === "en" ? "en" : "ar"
          }
        >
          <PreviewThemeProvider rootProps={previewRootProps}>
            <Render
              config={config}
              data={resolvedData}
              metadata={editorMetadata}
            />
          </PreviewThemeProvider>
        </StoreProvider>
      </PreviewPageShell>
    )
  }

  if (data.content) {
    return (
      <Render config={config} data={resolvedData} metadata={editorMetadata} />
    )
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
