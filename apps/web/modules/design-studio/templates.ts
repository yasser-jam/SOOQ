"use client"

import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"

import { isBuiltinThemeKey, loadBuiltinThemeSiteData } from "@/core/themes"
import { normalizeSiteData } from "@/core/config/lib/site-data"
import {
  FALLBACK_THEME_NAME,
  writeSelectedTheme,
} from "@/core/config/lib/selected-theme"

import {
  DESIGN_SCHEMA_VERSION,
  applyDesignTemplate,
  listAdminDesignTemplatesQueryOptions,
  saveDesignDraft,
} from "./actions"
import { applyDesignConfigToLocalStorage } from "./local-site-sync"
import type {
  AdminDesignTemplateSummary,
  DesignConfigJson,
  DesignVersion,
  TemplateSource,
} from "./types"

/** Marks a draft built by the custom-theme wizard rather than a template. */
export const CUSTOM_TEMPLATE_KEY = "custom"

/**
 * A gallery card for the server-backed template catalog.
 * Builtin themes are intentionally hidden for now to keep the gallery as a
 * single source of truth from the admin/server template list.
 */
export type StudioTemplateCard = {
  templateId?: string | null
  templateKey: string
  templateName: string
  description: string
  previewImageUrl: string | null
  source: TemplateSource
  editable: boolean
  isActive: boolean
}

export function useStudioTemplates() {
  const { data: adminTemplates = [], isPending } = useQuery(
    listAdminDesignTemplatesQueryOptions()
  )

  const templates = useMemo<StudioTemplateCard[]>(() => {
    return adminTemplates.map((template: AdminDesignTemplateSummary) => ({
      templateId: template.templateId,
      templateKey: template.templateKey,
      templateName: template.templateName,
      description: template.industryType,
      previewImageUrl: template.previewImageUrl,
      source: template.source,
      editable: template.editable,
      isActive: template.isActive,
    }))
  }, [adminTemplates])

  return { templates, isPending }
}

/** Guarantees the `{ web, mobile }` pair the backend validates on write. */
const withTemplateKey = (
  config: DesignConfigJson | undefined | null,
  templateKey: string,
  templateSource: DesignConfigJson["templateSource"] = null,
  seededFromTenantTemplateId: string | null = null
): DesignConfigJson => ({
  ...(config ?? {}),
  web: config?.web ?? {},
  mobile: config?.mobile ?? {},
  templateKey,
  templateSource,
  seededFromTenantTemplateId,
})

export async function applyStudioTemplate(
  card: StudioTemplateCard
): Promise<DesignVersion> {
  if (card.source === "builtin") {
    throw new Error("Builtin templates are hidden and not available in this gallery.")
  }

  const applied = await applyDesignTemplate({
    templateKey: card.templateKey,
    source: card.source,
  })

  // apply-template overwrites the draft from the template, which carries no
  // templateKey of its own — stamp it back so the gallery can mark the card.
  const version = await saveDesignDraft({
    configJson: withTemplateKey(
      applied.configJson,
      card.templateKey,
      card.source,
      applied.seededFromTemplateId
    ),
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
