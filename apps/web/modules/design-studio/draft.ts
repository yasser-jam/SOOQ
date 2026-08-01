import {
  normalizeSiteData,
  readSiteData,
  type SiteData,
} from "@/core/config/lib/site-data"
import { readSelectedTheme } from "@/core/config/lib/selected-theme"

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
 * The mobile app builder doesn't exist yet, but the backend validates that
 * `configJson` carries both platform keys — so mobile ships as an empty
 * screen list until there's something to put in it.
 */
const emptyMobileConfig = (): Record<string, unknown> => ({ screens: [] })

export const buildDesignConfigJson = (
  webSite: Partial<SiteData>,
  templateKey?: string | null
): DesignConfigJson => ({
  web: normalizeSiteData(webSite),
  mobile: emptyMobileConfig(),
  templateKey: templateKey || CUSTOM_TEMPLATE_KEY,
})

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
