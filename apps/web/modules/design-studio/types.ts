import type { SiteData } from "@/core/config/lib/site-data"

/**
 * The frontend-owned JSON payload the DSN backend stores per tenant.
 * The backend only enforces that this is an object containing both
 * `web` and `mobile` keys; everything inside is our contract.
 */
export type DesignConfigJson = {
  web: Partial<SiteData> | Record<string, unknown>
  mobile: Partial<SiteData> | Record<string, unknown>
  schema_version?: string
  /**
   * Which gallery card produced this draft. Frontend-owned: the backend tracks
   * its own `seededFromTemplateId`, which cannot describe builtin templates.
   */
  templateKey?: string | null
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

/** GET /public/design/templates/{key} */
export type DesignTemplateDetail = DesignTemplateSummary & {
  templateJson: DesignConfigJson
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
}
