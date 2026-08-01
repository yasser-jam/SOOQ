import {
  normalizeSiteData,
  writeSiteData,
  type SiteData,
} from "@/core/config/lib/site-data"
import { clearAllPageDrafts } from "@/core/config/lib/page-draft"
import { readSelectedTheme } from "@/core/config/lib/selected-theme"
import {
  isBuiltinThemeKey,
  loadBuiltinThemeSiteData,
} from "@/core/themes"

import { getDesignDraft } from "./actions"
import type { DesignConfigJson, DesignVersion } from "./types"

const isBrowser = typeof window !== "undefined"

/** True when a platform blob has at least one page to render. */
export const hasUsableSitePages = (site: unknown): site is Partial<SiteData> => {
  const pages = (site as SiteData | undefined)?.pages
  return Array.isArray(pages) && pages.length > 0
}

const readTemplateKey = (
  draft: DesignVersion | null | undefined
): string | null => {
  const key = draft?.configJson?.templateKey
  return typeof key === "string" && key ? key : null
}

/**
 * Writes a design config into localStorage (desktop, and mobile when present)
 * and clears crash-safety page drafts so they can't overlay the previous theme.
 */
export function applyDesignConfigToLocalStorage(
  config: DesignConfigJson | undefined | null
): boolean {
  if (!isBrowser || !config) return false

  let wrote = false

  if (hasUsableSitePages(config.web)) {
    writeSiteData(normalizeSiteData(config.web), "desktop")
    wrote = true
  }

  if (hasUsableSitePages(config.mobile)) {
    writeSiteData(normalizeSiteData(config.mobile), "mobile")
    wrote = true
  }

  if (wrote) {
    clearAllPageDrafts()
  }

  return wrote
}

export type HydrateLocalSiteSource = "api" | "builtin-file" | "unchanged"

export type HydrateLocalSiteResult = {
  source: HydrateLocalSiteSource
}

/**
 * Source-of-truth order for the Design Studio editor:
 * 1. API draft (`GET /admin/design/draft`) when it has pages
 * 2. Builtin theme JSON file keyed by the draft / selected-theme templateKey
 * 3. Leave existing localStorage alone
 *
 * Every successful resolve from (1) or (2) overwrites localStorage so "apply
 * theme → open editor" never keeps a stale cached site.
 */
export async function hydrateLocalSiteFromSources(): Promise<HydrateLocalSiteResult> {
  if (!isBrowser) return { source: "unchanged" }

  const draft = await getDesignDraft().catch(() => null)
  const config = draft?.configJson

  if (config && hasUsableSitePages(config.web)) {
    applyDesignConfigToLocalStorage(config)
    return { source: "api" }
  }

  const templateKey =
    readTemplateKey(draft) ?? readSelectedTheme()?.templateKey ?? null

  if (templateKey && isBuiltinThemeKey(templateKey)) {
    const siteData = await loadBuiltinThemeSiteData(templateKey)
    if (siteData) {
      writeSiteData(normalizeSiteData(siteData), "desktop")
      clearAllPageDrafts()
      return { source: "builtin-file" }
    }
  }

  return { source: "unchanged" }
}
