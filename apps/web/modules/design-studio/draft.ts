import {
  hasMobileSiteData,
  normalizeSiteData,
  readSiteData,
  resetMobileSiteFromDesktop,
  type EditorMode,
  type SiteData,
} from "@/core/config/lib/site-data"
import { readSelectedTheme } from "@/core/config/lib/selected-theme"
import { getEditorTenantId } from "@/lib/tenant-context"
import { transformWebToMobile } from "@/lib/transformer"

import {
  DESIGN_SCHEMA_VERSION,
  getDesignDraft,
  saveDesignDraft,
} from "./actions"
import { hasUsableSitePages } from "./local-site-sync"
import { resolveMobileSyncEnabled } from "./mobile-sync-preference"
import { CUSTOM_TEMPLATE_KEY, readDraftTemplateKey } from "./templates"
import type { DesignConfigJson, DesignVersion } from "./types"

export {
  applyDesignConfigToLocalStorage,
  hasUsableSitePages,
  hydrateLocalSiteFromSources,
  type HydrateLocalSiteResult,
  type HydrateLocalSiteSource,
} from "./local-site-sync"

/**
 * Falls back to an empty screen list if the site fails to convert (e.g.
 * unparseable Site JSON) — the backend requires `configJson` to carry both
 * platform keys, so the draft save must never be blocked by a mobile
 * conversion error.
 */
const emptyMobileConfig = (): Record<string, unknown> => ({ screens: [] })

/** Derives the app-builder screen contract from a Site JSON (web or mobile). */
const buildMobileConfig = (site: SiteData): Record<string, unknown> => {
  const result = transformWebToMobile(JSON.stringify(site), {
    tenantId: getEditorTenantId() ?? undefined,
  })
  return result.success
    ? (result.output as Record<string, unknown>)
    : emptyMobileConfig()
}

export const buildDesignConfigJson = (
  webSite: Partial<SiteData>,
  templateKey?: string | null
): DesignConfigJson => {
  const web = normalizeSiteData(webSite)
  return {
    web,
    mobile: buildMobileConfig(web),
    templateKey: templateKey || CUSTOM_TEMPLATE_KEY,
  }
}

/**
 * A PUT replaces `configJson` wholesale, so the design's template key has to
 * be carried over or the gallery loses track of which card is active.
 */
const resolveTemplateKey = (draft: DesignVersion | null): string =>
  readSelectedTheme()?.templateKey ??
  readDraftTemplateKey(draft) ??
  CUSTOM_TEMPLATE_KEY

/**
 * Pushes the current editor state to `PUT /admin/design/draft`. The editor
 * keeps writing localStorage as before; this is what makes a save survive
 * the browser.
 *
 * The payload depends on which editor is saving and on the web→mobile sync
 * preference (`configJson.mobileSyncEnabled`, default on):
 *
 * - **Web save, sync on** — historic behavior: `mobile` is regenerated from
 *   web, any custom `mobileSite` is dropped, and the local mobile copy is
 *   reset from desktop so both editors show the same design.
 * - **Web save, sync off** — the server's `mobileSite` is carried over
 *   untouched and `mobile` (screen contract) is regenerated from *it*, so a
 *   web save can never clobber independent mobile work.
 * - **Mobile save** — `mobileSite` becomes this browser's mobile Site JSON
 *   and `mobile` is derived from it; `web` is carried over from the server
 *   draft untouched.
 */
export const saveEditorDesignDraft = async (
  mode: EditorMode = "desktop"
): Promise<DesignVersion> => {
  const serverDraft = await getDesignDraft().catch(() => null)
  const serverConfig = serverDraft?.configJson ?? null
  const syncEnabled = resolveMobileSyncEnabled(serverConfig)

  // A mobile-mode save must not overwrite the server's web design with this
  // browser's (possibly stale) local copy — carry the server's web through.
  const web =
    mode === "mobile" && hasUsableSitePages(serverConfig?.web)
      ? (serverConfig!.web as Partial<SiteData>)
      : normalizeSiteData(readSiteData("desktop"))

  let mobileSite: Partial<SiteData> | undefined
  if (mode === "mobile") {
    mobileSite = normalizeSiteData(readSiteData("mobile"))
  } else if (!syncEnabled && hasUsableSitePages(serverConfig?.mobileSite)) {
    mobileSite = serverConfig!.mobileSite as Partial<SiteData>
  }
  // Otherwise (sync on, or no custom mobile yet): leave `mobileSite`
  // undefined — JSON.stringify drops the key, meaning "derived from web".

  const mobile = buildMobileConfig(
    normalizeSiteData(mobileSite ?? web)
  )

  const saved = await saveDesignDraft({
    configJson: {
      ...(serverConfig ?? {}),
      web,
      mobile,
      mobileSite,
      mobileSyncEnabled: syncEnabled,
      templateKey: resolveTemplateKey(serverDraft),
    },
    schemaVersion: serverDraft?.schemaVersion ?? DESIGN_SCHEMA_VERSION,
  })

  // Sync on: propagate the just-saved web design into the local mobile copy
  // too, so switching to the mobile editor shows what the server now has.
  if (mode === "desktop" && syncEnabled && hasMobileSiteData()) {
    resetMobileSiteFromDesktop()
  }

  return saved
}
