"use client"

import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"

import {
  builtinThemeCatalog,
  isBuiltinThemeKey,
  loadBuiltinThemeSiteData,
} from "@/core/themes"
import { normalizeSiteData } from "@/core/config/lib/site-data"
import {
  FALLBACK_THEME_NAME,
  writeSelectedTheme,
} from "@/core/config/lib/selected-theme"

import {
  DESIGN_SCHEMA_VERSION,
  applyDesignTemplate,
  listDesignTemplatesQueryOptions,
  saveDesignDraft,
} from "./actions"
import { applyDesignConfigToLocalStorage } from "./local-site-sync"
import type { DesignConfigJson, DesignVersion } from "./types"

/** Marks a draft built by the custom-theme wizard rather than a template. */
export const CUSTOM_TEMPLATE_KEY = "custom"

/**
 * One gallery card, regardless of whether the design ships in the bundle or
 * comes from `GET /public/design/templates`.
 */
export type StudioTemplateCard = {
  templateKey: string
  templateName: string
  description: string
  previewImageUrl: string | null
  source: "builtin" | "remote"
}

const builtinTemplateCards: StudioTemplateCard[] = builtinThemeCatalog.map(
  (theme) => ({
    templateKey: theme.templateKey,
    templateName: theme.templateName,
    description: theme.description,
    previewImageUrl: theme.previewImageUrl,
    source: "builtin",
  })
)

/**
 * Backend templates are seeded with empty `templateJson`, so applying one
 * produces a blank storefront. Hide those until they carry real content.
 */
const hasUsableJson = (config: DesignConfigJson | undefined | null): boolean => {
  const web = config?.web as { pages?: unknown[] } | undefined
  return Array.isArray(web?.pages) && web.pages.length > 0
}

export function useStudioTemplates() {
  const { data: remoteTemplates = [], isPending } = useQuery(
    listDesignTemplatesQueryOptions()
  )

  const templates = useMemo<StudioTemplateCard[]>(() => {
    const remote: StudioTemplateCard[] = remoteTemplates
      .filter((template) => template.active)
      .map((template) => ({
        templateKey: template.templateKey,
        templateName: template.templateName,
        description: template.industryType,
        previewImageUrl: template.previewImageUrl,
        source: "remote",
      }))

    const remoteKeys = new Set(remote.map((t) => t.templateKey))

    return [
      ...remote,
      ...builtinTemplateCards.filter((t) => !remoteKeys.has(t.templateKey)),
    ]
  }, [remoteTemplates])

  return { templates, isPending }
}

/** Guarantees the `{ web, mobile }` pair the backend validates on write. */
const withTemplateKey = (
  config: DesignConfigJson | undefined | null,
  templateKey: string
): DesignConfigJson => ({
  ...(config ?? {}),
  web: config?.web ?? {},
  mobile: config?.mobile ?? {},
  templateKey,
})

export async function applyStudioTemplate(
  card: StudioTemplateCard
): Promise<DesignVersion> {
  if (card.source === "builtin") {
    const siteData = await loadBuiltinThemeSiteData(card.templateKey)
    if (!siteData) {
      throw new Error(`Unknown builtin theme: ${card.templateKey}`)
    }

    const version = await saveDesignDraft({
      configJson: withTemplateKey(
        { web: normalizeSiteData(siteData), mobile: {} },
        card.templateKey
      ),
      schemaVersion: DESIGN_SCHEMA_VERSION,
    })
    // Mirror into localStorage immediately so opening the editor never
    // boots the previous cached Site JSON.
    applyDesignConfigToLocalStorage(version.configJson)
    return version
  }

  const applied = await applyDesignTemplate({ templateKey: card.templateKey })

  // apply-template overwrites the draft from the template, which carries no
  // templateKey of its own — stamp it back so the gallery can mark the card.
  const version = await saveDesignDraft({
    configJson: withTemplateKey(applied.configJson, card.templateKey),
    schemaVersion: applied.schemaVersion || DESIGN_SCHEMA_VERSION,
  })
  applyDesignConfigToLocalStorage(version.configJson)
  return version
}

export function readDraftTemplateKey(
  draft: DesignVersion | null | undefined
): string | null {
  const key = draft?.configJson?.templateKey
  return typeof key === "string" && key ? key : null
}

/**
 * Resolves the display name for the active design, preferring the matching
 * gallery card so the studio URL segment stays stable across reloads.
 */
export function resolveActiveThemeName(
  draft: DesignVersion | null | undefined,
  templates: StudioTemplateCard[]
): string {
  const templateKey = readDraftTemplateKey(draft)
  if (!templateKey) return draft ? "تصميم مخصص" : ""

  const match = templates.find((t) => t.templateKey === templateKey)
  if (match) return match.templateName

  return templateKey === CUSTOM_TEMPLATE_KEY ? "تصميم مخصص" : templateKey
}

/**
 * Mirrors the active design into the UI-only selected-theme cache that the
 * studio href builders read.
 */
export function syncSelectedThemeCache(
  draft: DesignVersion | null | undefined,
  templates: StudioTemplateCard[]
): void {
  if (!draft) return

  const templateKey = readDraftTemplateKey(draft) ?? CUSTOM_TEMPLATE_KEY
  const match = templates.find((t) => t.templateKey === templateKey)

  writeSelectedTheme({
    templateKey,
    name:
      match?.templateName ||
      resolveActiveThemeName(draft, templates) ||
      FALLBACK_THEME_NAME,
    previewImageUrl: match?.previewImageUrl ?? null,
  })
}

export { isBuiltinThemeKey }
