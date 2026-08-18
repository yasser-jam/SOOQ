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
  webSite?: Partial<SiteData>
): Promise<DesignVersion> =>
  saveDesignDraft({
    configJson: buildDesignConfigJson(
      webSite ?? readSiteData("desktop"),
      await resolveTemplateKey()
    ),
    schemaVersion: DESIGN_SCHEMA_VERSION,
  })
