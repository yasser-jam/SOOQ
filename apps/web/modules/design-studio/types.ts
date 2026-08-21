import type { SiteData } from "@/core/config/lib/site-data"

export type TemplateSource = "SYSTEM" | "MINE"

export type GalleryTemplateSource = TemplateSource | "builtin"

/**
 * The frontend-owned JSON payload the DSN backend stores per tenant.
 * The backend only enforces that this is an object containing both
 * `web` and `mobile` keys; everything inside is our contract.
 */
export type DesignConfigJson = {
  web: Partial<SiteData> | Record<string, unknown>
  mobile: Partial<SiteData> | Record<string, unknown>
  /**
   * Editable mobile Site JSON (editor format — same schema as `web` plus
   * appBar/sidebar). Present only while web→mobile sync is disabled and the
   * merchant saved the mobile editor at least once. Absent = mobile is
   * derived from `web` (`mobile` above stays the derived screens contract
   * consumed by the app builder in both cases).
   */
  mobileSite?: Partial<SiteData> | Record<string, unknown> | null
  /**
   * Web→mobile sync preference. `true`/absent = every web save regenerates
   * the mobile design from web (historic behavior); `false` = the mobile
   * design is independent and web saves leave it untouched.
   */
  mobileSyncEnabled?: boolean
  schema_version?: string
  /**
   * Which gallery card produced this draft. Frontend-owned: the backend tracks
   * its own `seededFromTemplateId`, which cannot describe builtin templates.
   */
  templateKey?: string | null
  templateSource?: GalleryTemplateSource | null
  seededFromTenantTemplateId?: string | null
  [extra: string]: unknown
}

export type DesignPlatform = "web" | "mobile"

/** GET /public/design/templates */
export type DesignTemplateSummary = {
  templateKey: string
  templateName: string
  industryType: string
  previewImageUrl: string | null
  active: boolean
}

export type AdminDesignTemplateSummary = {
  templateId: string
  templateKey: string
  templateName: string
  industryType: string
  previewImageUrl: string | null
  source: TemplateSource
  editable: boolean
  isActive: boolean
  createdAt?: string | null
  updatedAt?: string | null
}

/** GET /public/design/templates/{key} */
export type DesignTemplateDetail = DesignTemplateSummary & {
  templateJson: DesignConfigJson
}

export type TenantTemplateDetail = AdminDesignTemplateSummary & {
  templateJson: DesignConfigJson
}

export type CreateMineTemplateInput = {
  templateName: string
  templateKey: string
  industryType?: string | null
  previewImageUrl?: string | null
  configJson?: DesignConfigJson
}

export type UpdateMineTemplateInput = Partial<CreateMineTemplateInput> & {
  templateId: string
  isActive?: boolean
}

/** GET /public/design/config?platform=... */
export type PublishedDesignConfig = {
  platform: DesignPlatform
  schemaVersion: string
  versionNumber: number
  config: Partial<SiteData> | Record<string, unknown>
}

export type DesignLifecycleStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED"

/**
 * GET /admin/design/draft, PUT /admin/design/draft, POST /admin/design/publish
 * all return the same shape.
 */
export type DesignVersion = {
  storeConfigVersionId: string
  configScope: string
  versionNumber: number | null
  lifecycleStatus: DesignLifecycleStatus
  schemaVersion: string
  configJson: DesignConfigJson
  seededFromTemplateId: string | null
  templateSource?: GalleryTemplateSource | null
  createdByUserId: string
  publishedAt: string | null
  createdAt: string
}

export type SaveDraftInput = {
  configJson: DesignConfigJson
  schemaVersion: string
}

export type ApplyTemplateInput = {
  templateKey: string
  source?: TemplateSource
}
