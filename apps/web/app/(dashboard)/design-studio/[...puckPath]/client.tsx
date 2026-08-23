"use client"

import Link from "next/link"
import {
  AutoField,
  FieldLabel,
  Puck,
  Render,
  type Overrides,
} from "@/core"
import config from "@/core/config"
import { useDemoData } from "@/lib/use-demo-data"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { RefreshCw, Smartphone, Type, X } from "lucide-react"
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
  resetMobileSiteFromDesktop,
  setActiveEditorMode,
  syncMobilePageFromDesktop,
  syncMobileThemeFromDesktop,
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
import { Switch } from "@workspace/ui/components/switch"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { saveEditorDesignDraft } from "@/modules/design-studio/draft"
import {
  resolveMobileSyncEnabled,
  writeLocalMobileSyncPreference,
} from "@/modules/design-studio/mobile-sync-preference"
import { hydrateLocalSiteFromSources } from "@/modules/design-studio/local-site-sync"
import { designStudioKeys } from "@/modules/design-studio/queryKeys"
import { useCurrentUser } from "@/modules/auth/auth/hooks/useCurrentUser"
import { EditorFullscreenShell } from "../_components/editor-fullscreen-shell"
import { PreviewPageShell } from "../_components/preview-page-shell"
import { PreviewThemeProvider } from "../_components/preview-theme-provider"
import { StoreProvider } from "@/modules/storefront/components/StoreProvider"
import {
  buildStudioEditHrefFromSegment,
  resolveStudioThemeEditHref,
  withEditorMode,
} from "@/lib/design-studio-paths"
import { useSelectedPage } from "@/core/config/lib/use-selected-page"
import { resetSelectedPage } from "@/core/config/lib/selected-page"
import { PAGES_UPDATED_EVENT } from "@/core/config/page-registry"

// shopifyOutlinePlugin registers as "sections" (الأقسام); built-in outline
// stays as "شجرة العناصر". Both tabs remain visible in the left sidebar.
const hiddenPluginNames = new Set(["themes", "heading-analyzer"])

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

function MobileSyncFloatingButton({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      className="EditorHintPill"
      onClick={onOpen}
      aria-label="إعدادات مزامنة الجوال"
      style={{ bottom: "104px" }}
    >
      <Smartphone size={16} />
      مزامنة الجوال
    </button>
  )
}

/**
 * Web↔mobile sync controls. The switch decides whether a web save regenerates
 * the mobile design (`configJson.mobileSyncEnabled`, applied on the next
 * save); mobile mode adds the manual pull actions (current page / theme /
 * full reset from the web design). Pulls rewrite the local mobile copy only —
 * the next حفظ uploads the result.
 */
function MobileSyncDialog({
  open,
  ...contentProps
}: {
  open: boolean
  onClose: () => void
  editorMode: EditorMode
  editPath: string
  onSiteMutated: () => void
}) {
  // Mount the content fresh on every open so its state initializers re-read
  // the preference (hydration or another tab may have changed it) and the
  // reset confirmation starts collapsed — no state-syncing effect needed.
  if (!open) return null
  return <MobileSyncDialogContent {...contentProps} />
}

function MobileSyncDialogContent({
  onClose,
  editorMode,
  editPath,
  onSiteMutated,
}: {
  onClose: () => void
  editorMode: EditorMode
  editPath: string
  onSiteMutated: () => void
}) {
  const [syncEnabled, setSyncEnabled] = useState(() => resolveMobileSyncEnabled())
  const [confirmReset, setConfirmReset] = useState(false)

  const handleToggle = (checked: boolean) => {
    setSyncEnabled(checked)
    writeLocalMobileSyncPreference(checked)
    toast.success(
      checked
        ? "سيُعاد توليد تصميم الجوال من الويب عند كل حفظ"
        : "أصبح تصميم الجوال مستقلاً — حفظ الويب لن يمسّه"
    )
  }

  const runMobilePull = (message: string, pull: () => void) => {
    pull()
    onSiteMutated()
    toast.success(`${message} — اضغط حفظ لرفع النتيجة للخادم`)
    onClose()
  }

  return (
    <div
      className="EditorShortcutOverlay"
      role="dialog"
      aria-modal="true"
      aria-label="إعدادات مزامنة الجوال"
      data-puck-no-shortcuts="true"
    >
      <button
        type="button"
        className="EditorShortcutOverlayBackdrop"
        onClick={onClose}
        aria-label="إغلاق"
      />

      <div
        className="EditorShortcutDialog"
        data-puck-no-shortcuts="true"
        dir="rtl"
      >
        <div className="EditorShortcutDialogHeader">
          <div>
            <p className="EditorShortcutEyebrow">الويب والجوال</p>
            <h2 className="EditorShortcutTitle">مزامنة تصميم الجوال</h2>
          </div>

          <button
            type="button"
            className="EditorShortcutClose"
            onClick={onClose}
            aria-label="إغلاق"
          >
            <X size={16} />
          </button>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            padding: "4px 2px",
          }}
        >
          <label
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              cursor: "pointer",
            }}
          >
            <span>
              <span style={{ display: "block", fontSize: 14, fontWeight: 600 }}>
                تطبيق تغييرات الويب على الجوال تلقائياً
              </span>
              <span
                style={{
                  display: "block",
                  fontSize: 12,
                  color: "#6b7280",
                  marginTop: 4,
                  lineHeight: 1.6,
                }}
              >
                عند التفعيل: كل حفظ لتصميم الويب يعيد توليد تصميم الجوال منه
                ويستبدل أي تعديلات يدوية عليه. عند الإيقاف: تصميم الجوال مستقل
                ولا يتأثر بحفظ الويب.
              </span>
            </span>
            <Switch checked={syncEnabled} onCheckedChange={handleToggle} />
          </label>

          {editorMode === "mobile" && syncEnabled ? (
            <p
              style={{
                fontSize: 12,
                color: "#7a5a10",
                background: "#fdf6e3",
                border: "1px solid #e0b252",
                borderRadius: 8,
                padding: "8px 12px",
                margin: 0,
                lineHeight: 1.6,
              }}
            >
              تنبيه: المزامنة التلقائية مفعّلة — أي حفظ لتصميم الويب سيستبدل
              تعديلات الجوال الحالية.
            </p>
          ) : null}

          {editorMode === "mobile" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>
                سحب يدوي من تصميم الويب
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  runMobilePull("تم نسخ هذه الصفحة من تصميم الويب", () =>
                    syncMobilePageFromDesktop(editPath)
                  )
                }
              >
                <RefreshCw size={14} />
                مزامنة هذه الصفحة من الويب
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  runMobilePull("تمت مزامنة الثيم من تصميم الويب", () =>
                    syncMobileThemeFromDesktop()
                  )
                }
              >
                <RefreshCw size={14} />
                مزامنة الثيم فقط من الويب
              </Button>
              <Button
                variant={confirmReset ? "destructive" : "outline"}
                size="sm"
                onClick={() => {
                  if (!confirmReset) {
                    setConfirmReset(true)
                    return
                  }
                  runMobilePull("تمت إعادة تعيين تصميم الجوال من الويب", () =>
                    resetMobileSiteFromDesktop()
                  )
                }}
              >
                <RefreshCw size={14} />
                {confirmReset
                  ? "اضغط مرة أخرى للتأكيد — سيستبدل كل تصميم الجوال"
                  : "إعادة تعيين الجوال كاملاً من الويب"}
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

/**
 * Floating helpers rendered inside the Puck tree (needs Puck context for the
 * mobile-sync dialog). Owns that dialog's open state so toggling it never
 * recreates the `overrides` object and re-initializes the whole editor
 * store (docs/editor-study-and-enhancement-plan.md §2.3).
 */
function EditorFloatingTools({
  editorMode = "desktop",
  editPath = "/",
  canWrite = false,
  onSiteMutated,
}: {
  editorMode?: EditorMode
  editPath?: string
  canWrite?: boolean
  onSiteMutated?: () => void
}) {
  const [isMobileSyncDialogOpen, setMobileSyncDialogOpen] = useState(false)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileSyncDialogOpen(false)
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  return (
    <>
      {canWrite ? (
        <MobileSyncFloatingButton onOpen={() => setMobileSyncDialogOpen(true)} />
      ) : null}

      <MobileSyncDialog
        open={isMobileSyncDialogOpen}
        onClose={() => setMobileSyncDialogOpen(false)}
        editorMode={editorMode}
        editPath={editPath}
        onSiteMutated={onSiteMutated ?? (() => {})}
      />
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
  // Every fresh mount of the editor (opening it, or reopening after closing)
  // must start on the home page, never on whatever page was last edited.
  const hasResetSelectedPageRef = useRef(false)
  if (!hasResetSelectedPageRef.current) {
    resetSelectedPage()
    hasResetSelectedPageRef.current = true
  }

  const selectedPagePath = useSelectedPage()
  const path = themeSlug ? selectedPagePath : (pathProp ?? "/")

  const searchParams = useSearchParams()
  const editorMode: EditorMode = parseEditorMode(searchParams.get("mode"))
  const isMobileEditor = editorMode === "mobile"

  setActiveEditorMode(editorMode)

  const editorMetadata = isMobileEditor
    ? EDITOR_METADATA_MOBILE
    : EDITOR_METADATA_DESKTOP

  const queryClient = useQueryClient()
    const { hasRole } = useCurrentUser()
    const canWrite = hasRole(["OWNER", "MANAGER"])
  const designStudioHref = useMemo(() => "/design-studio", [])

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

  // Remounts <Puck> with freshly-read storage after an external site mutation
  // (e.g. a mobile pull from the web design). Stable — safe inside overrides.
  const refreshSite = useCallback(() => {
    setSiteRevision((revision) => revision + 1)
  }, [])

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

  const getSiteSnapshot = useCallback(() => {
    const base = siteDataRef.current ?? readSiteData(editorMode)
    const puckData = exportDataRef.current

    if (puckData) {
      return applyPuckSave(base, path, puckData)
    }

    return base
  }, [path, editorMode])

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

  // The header "حفظ" button: local write (unchanged) + the draft PUT that
  // makes the design survive this browser. `configJson.web` is always the
  // desktop Site JSON — a save from the mobile editor sends it untouched and
  // only re-converts `configJson.mobile` from the mobile site, so mobile edits
  // never rewrite web.
  // makes the design survive this browser. Which halves of `configJson` the
  // PUT updates depends on the editor mode and the web→mobile sync preference
  // (see saveEditorDesignDraft in modules/design-studio/draft.ts).
  const handleSave = useCallback(
    async (puckData: UserData) => {
      if (!canWrite) return
      savePageData(puckData)
      siteDataRef.current = readSiteData(editorMode)
      markPageSaved(puckData)

      try {
        await saveEditorDesignDraft(editorMode)
        await queryClient.invalidateQueries({ queryKey: designStudioKeys.all })
        toast.success("تم حفظ التصميم")
      } catch {
        toast.error("تعذر حفظ التصميم على الخادم. التغييرات محفوظة محلياً فقط.")
      }
    },
    [
      canWrite,
      editorMode,
      isMobileEditor,
      markPageSaved,
      queryClient,
      savePageData,
    ]
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
            editorMode={editorMode}
            editPath={path}
            canWrite={canWrite}
            onSiteMutated={refreshSite}
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
          {canWrite ? children : null}
        </div>
      ),
    }),
    [canWrite, designStudioHref, editorMode, path, refreshSite]
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
