import {
  normalizeSiteData,
  readSiteData,
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
 * Falls back to an empty screen list if the web site fails to convert (e.g.
 * unparseable Site JSON) — the backend requires `configJson` to carry both
 * platform keys, so the draft save must never be blocked by a mobile
 * conversion error.
 */
const emptyMobileConfig = (): Record<string, unknown> => ({ screens: [] })

/** Derives the mobile screen config from the web Site JSON via the web→mobile converter. */
const buildMobileConfig = (site: SiteData): Record<string, unknown> => {
  const result = transformWebToMobile(JSON.stringify(site), {
    tenantId: getEditorTenantId() ?? undefined,
  })
  return result.success
    ? (result.output as Record<string, unknown>)
    : emptyMobileConfig()
}

/**
 * A draft PUT always replaces both platform keys. `web` is whatever the desktop
 * Site JSON holds — a save made from the mobile editor passes the *untouched*
 * desktop site, so mobile edits never leak into web. `mobile` is the converter
 * output of `mobileSite` when the mobile editor made the save, else of `web`
 * (editing web therefore re-derives the mobile app too).
 */
export const buildDesignConfigJson = (
  webSite: Partial<SiteData>,
  templateKey?: string | null,
  mobileSite?: Partial<SiteData> | null
): DesignConfigJson => {
  const web = normalizeSiteData(webSite)
  return {
    web,
    mobile: buildMobileConfig(mobileSite ? normalizeSiteData(mobileSite) : web),
    templateKey: templateKey || CUSTOM_TEMPLATE_KEY,
  }
}

/**
 * A PUT replaces `configJson` wholesale, so the design's template key has to
 * be carried over or the gallery loses track of which card is active.
 */
const resolveTemplateKey = async (): Promise<string> => {
  const cached = readSelectedTheme()?.templateKey
  if (cached) return cached

  const draft = await getDesignDraft().catch(() => null)
  return readDraftTemplateKey(draft) ?? CUSTOM_TEMPLATE_KEY
}

/**
 * Pushes the web Site JSON to `PUT /admin/design/draft`. The editor keeps
 * writing localStorage as before; this is what makes a save survive the
 * browser.
 */
export const saveWebDesignDraft = async (
  webSite?: Partial<SiteData>,
  mobileSite?: Partial<SiteData> | null
): Promise<DesignVersion> =>
  saveDesignDraft({
    configJson: buildDesignConfigJson(
      webSite ?? readSiteData("desktop"),
      await resolveTemplateKey(),
      mobileSite
    ),
    schemaVersion: DESIGN_SCHEMA_VERSION,
  })
