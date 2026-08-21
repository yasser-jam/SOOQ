import {
  normalizeSiteData,
  writeSiteData,
  type SiteData,
} from "@/core/config/lib/site-data"
import {
  backfillEmptyBilingual,
  needsBilingualBackfill,
} from "@/core/config/lib/backfill-bilingual"
import { clearAllPageDrafts } from "@/core/config/lib/page-draft"
import { readSelectedTheme } from "@/core/config/lib/selected-theme"
import {
  isBuiltinThemeKey,
  loadBuiltinThemeSiteData,
} from "@/core/themes"

import {
  DESIGN_SCHEMA_VERSION,
  getDesignDraft,
  saveDesignDraft,
} from "./actions"
import { writeLocalMobileSyncPreference } from "./mobile-sync-preference"
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

  // `mobileSite` is the editable mobile Site JSON (independent mobile design);
  // legacy `mobile` only matches when an old draft stored Site JSON there —
  // today it carries the app-builder screens contract, which has no pages.
  const mobileSiteSource = hasUsableSitePages(config.mobileSite)
    ? config.mobileSite
    : hasUsableSitePages(config.mobile)
      ? config.mobile
      : null

  if (mobileSiteSource) {
    writeSiteData(normalizeSiteData(mobileSiteSource), "mobile")
    wrote = true
  }

  if (typeof config.mobileSyncEnabled === "boolean") {
    writeLocalMobileSyncPreference(config.mobileSyncEnabled)
  }

  if (wrote) {
    clearAllPageDrafts()
  }

  return wrote
}

export type HydrateLocalSiteSource =
  | "api"
  | "api-backfilled"
  | "builtin-file"
  | "unchanged"

export type HydrateLocalSiteResult = {
  source: HydrateLocalSiteSource
}

/**
 * When a builtin theme was applied before English copy existed, the API draft
 * still has empty `en` fields. Copy EN from the bundled JSON (by block id)
 * without wiping merchant structure.
 */
async function backfillBuiltinEnglish(
  site: SiteData,
  templateKey: string
): Promise<{ site: SiteData; filled: number } | null> {
  if (!needsBilingualBackfill(site)) return null
  const builtin = await loadBuiltinThemeSiteData(templateKey)
  if (!builtin) return null
  const { site: next, filledCount } = backfillEmptyBilingual(
    structuredClone(normalizeSiteData(site)),
    normalizeSiteData(builtin)
  )
  if (filledCount <= 0) return null
  return { site: next, filled: filledCount }
}

/**
 * Source-of-truth order for the Design Studio editor:
 * 1. API draft (`GET /admin/design/draft`) when it has pages
 *    — with automatic EN backfill from the builtin file when needed
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
  const templateKey =
    readTemplateKey(draft) ?? readSelectedTheme()?.templateKey ?? null

  if (config && hasUsableSitePages(config.web)) {
    let web = normalizeSiteData(config.web)
    let source: HydrateLocalSiteSource = "api"

    if (templateKey && isBuiltinThemeKey(templateKey)) {
      const backfilled = await backfillBuiltinEnglish(web, templateKey)
      if (backfilled) {
        web = backfilled.site
        source = "api-backfilled"
        // Persist so the storefront / next hydrate also see EN.
        await saveDesignDraft({
          configJson: {
            ...config,
            web,
            mobile: config.mobile ?? {},
            templateKey,
          },
          schemaVersion: draft?.schemaVersion ?? DESIGN_SCHEMA_VERSION,
        }).catch(() => null)
      }
    }

    applyDesignConfigToLocalStorage({
      ...config,
      web,
      templateKey: templateKey ?? config.templateKey,
    })
    return { source }
  }

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
