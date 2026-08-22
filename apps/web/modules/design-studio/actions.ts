import { queryOptions } from "@tanstack/react-query"

import { api } from "@/lib/api"
import { publicApi } from "@/lib/public-api"
import type { ApiResponse } from "@/lib/types"

import { designStudioKeys } from "./queryKeys"
import type {
  ApplyTemplateInput,
  AdminDesignTemplateSummary,
  CreateMineTemplateInput,
  DesignPlatform,
  DesignTemplateDetail,
  DesignTemplateSummary,
  DesignVersion,
  PublishedDesignConfig,
  TenantTemplateDetail,
  UpdateMineTemplateInput,
  SaveDraftInput,
} from "./types"

const ADMIN_BASE = "/admin/design"
const ADMIN_TEMPLATES_BASE = `${ADMIN_BASE}/templates`
const ADMIN_MINE_TEMPLATES_BASE = `${ADMIN_TEMPLATES_BASE}/mine`
const PUBLIC_BASE = "/public/design"

export const DESIGN_SCHEMA_VERSION = "1.0"

// ─── Public endpoints ─────────────────────────────────────────────────────

export const listDesignTemplates = async (): Promise<
  DesignTemplateSummary[]
> => {
  const res = await api<ApiResponse<DesignTemplateSummary[]>>(
    `${PUBLIC_BASE}/templates`
  )
  return res.data ?? []
}

export const listDesignTemplatesQueryOptions = () =>
  queryOptions({
    queryKey: designStudioKeys.templates,
    queryFn: listDesignTemplates,
    staleTime: 5 * 60_000,
  })

export const listAdminDesignTemplates = async (): Promise<
  AdminDesignTemplateSummary[]
> => {
  const res = await api<ApiResponse<AdminDesignTemplateSummary[]>>(
    ADMIN_TEMPLATES_BASE
  )
  return res.data ?? []
}

export const listAdminDesignTemplatesQueryOptions = () =>
  queryOptions({
    queryKey: designStudioKeys.adminTemplates,
    queryFn: listAdminDesignTemplates,
    staleTime: 60_000,
  })

export const listMineTemplates = async (): Promise<TenantTemplateDetail[]> => {
  const res = await api<ApiResponse<TenantTemplateDetail[]>>(
    ADMIN_MINE_TEMPLATES_BASE
  )
  return res.data ?? []
}

export const listMineTemplatesQueryOptions = () =>
  queryOptions({
    queryKey: designStudioKeys.mineTemplates,
    queryFn: listMineTemplates,
    staleTime: 30_000,
  })

export const getDesignTemplate = async (
  templateKey: string
): Promise<DesignTemplateDetail> => {
  const res = await api<ApiResponse<DesignTemplateDetail>>(
    `${PUBLIC_BASE}/templates/${encodeURIComponent(templateKey)}`
  )
  if (!res.data) throw new Error("Empty design-template response")
  return res.data
}

export const getDesignTemplateQueryOptions = (templateKey: string) =>
  queryOptions({
    queryKey: designStudioKeys.template(templateKey),
    queryFn: () => getDesignTemplate(templateKey),
    enabled: Boolean(templateKey),
    staleTime: 5 * 60_000,
  })

export const getMineTemplate = async (
  templateId: string
): Promise<TenantTemplateDetail> => {
  const res = await api<ApiResponse<TenantTemplateDetail>>(
    `${ADMIN_MINE_TEMPLATES_BASE}/${encodeURIComponent(templateId)}`
  )
  if (!res.data) throw new Error("Empty mine-template response")
  return res.data
}

export const getMineTemplateQueryOptions = (templateId: string) =>
  queryOptions({
    queryKey: designStudioKeys.mineTemplate(templateId),
    queryFn: () => getMineTemplate(templateId),
    enabled: Boolean(templateId),
    staleTime: 30_000,
  })

/** Storefront read: needs tenant UUID because it's unauthenticated. */
/**
 * HTTP revalidation cache for the published design config.
 *
 * NOT a data source: on any cache miss the request behaves exactly as before —
 * this only lets the backend answer `304 Not Modified` (empty body, `config_json`
 * never loaded server-side) instead of re-sending the large payload when the
 * published version is unchanged. Distinct from the editor's Site JSON buffer
 * (`@/core/config/lib/site-data.ts`) which remains the Design Studio's private
 * working storage — see `apps/store/CLAUDE.md`.
 */
const publishedConfigCacheKey = (tenantId: string, platform: DesignPlatform) =>
  `sooq:published-design-config:${tenantId}:${platform}`

const readPublishedConfigCache = (
  tenantId: string,
  platform: DesignPlatform
): PublishedDesignConfig | null => {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(
      publishedConfigCacheKey(tenantId, platform)
    )
    if (!raw) return null
    const cached = JSON.parse(raw) as PublishedDesignConfig
    return typeof cached?.versionNumber === "number" ? cached : null
  } catch {
    return null
  }
}

const writePublishedConfigCache = (
  tenantId: string,
  platform: DesignPlatform,
  config: PublishedDesignConfig
) => {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(
      publishedConfigCacheKey(tenantId, platform),
      JSON.stringify(config)
    )
  } catch {
    // Quota exceeded / private mode — the cache is best-effort by design.
  }
}

export const getPublishedDesignConfig = async (
  tenantId: string,
  platform: DesignPlatform = "web"
): Promise<PublishedDesignConfig | null> => {
  const cached = readPublishedConfigCache(tenantId, platform)
  try {
    const res = await publicApi<ApiResponse<PublishedDesignConfig> | "">(
      `${PUBLIC_BASE}/config`,
      {
        tenantId,
        params: { platform },
        ...(cached
          ? {
              // Server ETag contract (SOOQ-Back DSN.md): "<platform>-v<versionNumber>".
              // Built from the cached body so we never need to read the ETag response
              // header (not CORS-exposed).
              headers: {
                "If-None-Match": `"${platform}-v${cached.versionNumber}"`,
              },
              // Let 304 resolve normally — the default validateStatus would route it
              // through the error interceptor, which toasts.
              validateStatus: (status: number) =>
                (status >= 200 && status < 300) || status === 304,
            }
          : {}),
      }
    )
    // 304 Not Modified has an empty body: the cached copy is still current.
    if (!res || typeof res !== "object") return cached
    const fresh = res.data ?? null
    if (fresh) writePublishedConfigCache(tenantId, platform, fresh)
    return fresh
  } catch (err) {
    const status = (err as { status?: number })?.status
    if (status === 404) return null
    throw err
  }
}

export const getPublishedDesignConfigQueryOptions = (
  tenantId: string,
  platform: DesignPlatform = "web"
) =>
  queryOptions({
    queryKey: designStudioKeys.publishedConfig(tenantId, platform),
    queryFn: () => getPublishedDesignConfig(tenantId, platform),
    enabled: Boolean(tenantId),
    staleTime: 30_000,
  })

// ─── Admin endpoints (JWT; tenant from token) ─────────────────────────────

export const applyDesignTemplate = async (
  input: ApplyTemplateInput
): Promise<DesignVersion> => {
  const res = await api<ApiResponse<DesignVersion>>(
    `${ADMIN_BASE}/apply-template`,
    { method: "POST", body: input }
  )
  if (!res.data) throw new Error("Empty apply-template response")
  return res.data
}

export const createBlankDraft = async (): Promise<DesignVersion> => {
  const res = await api<ApiResponse<DesignVersion>>(`${ADMIN_BASE}/blank`, {
    method: "POST",
  })
  if (!res.data) throw new Error("Empty blank-draft response")
  return res.data
}

export const createMineTemplate = async (
  input: CreateMineTemplateInput
): Promise<TenantTemplateDetail> => {
  const res = await api<ApiResponse<TenantTemplateDetail>>(
    ADMIN_MINE_TEMPLATES_BASE,
    {
      method: "POST",
      body: input,
    }
  )
  if (!res.data) throw new Error("Empty create-mine-template response")
  return res.data
}

export const updateMineTemplate = async (
  input: UpdateMineTemplateInput
): Promise<TenantTemplateDetail> => {
  const { templateId, ...body } = input
  const res = await api<ApiResponse<TenantTemplateDetail>>(
    `${ADMIN_MINE_TEMPLATES_BASE}/${encodeURIComponent(templateId)}`,
    {
      method: "PUT",
      body,
    }
  )
  if (!res.data) throw new Error("Empty update-mine-template response")
  return res.data
}

export const deleteMineTemplate = async (templateId: string): Promise<void> => {
  await api<ApiResponse<null>>(
    `${ADMIN_MINE_TEMPLATES_BASE}/${encodeURIComponent(templateId)}`,
    { method: "DELETE" }
  )
}

export const getDesignDraft = async (): Promise<DesignVersion | null> => {
  try {
    const res = await api<ApiResponse<DesignVersion>>(`${ADMIN_BASE}/draft`)
    return res.data ?? null
  } catch (err) {
    const status = (err as { status?: number })?.status
    if (status === 404) return null
    throw err
  }
}

export const getDesignDraftQueryOptions = () =>
  queryOptions({
    queryKey: designStudioKeys.draft,
    queryFn: getDesignDraft,
    staleTime: 15_000,
  })

export const saveDesignDraft = async (
  input: SaveDraftInput
): Promise<DesignVersion> => {
  const res = await api<ApiResponse<DesignVersion>>(`${ADMIN_BASE}/draft`, {
    method: "PUT",
    body: input,
  })
  if (!res.data) throw new Error("Empty save-draft response")
  return res.data
}

export const publishDesign = async (): Promise<DesignVersion> => {
  const res = await api<ApiResponse<DesignVersion>>(`${ADMIN_BASE}/publish`, {
    method: "POST",
  })
  if (!res.data) throw new Error("Empty publish response")
  return res.data
}

export const listDesignVersions = async (): Promise<DesignVersion[]> => {
  const res = await api<ApiResponse<DesignVersion[]>>(
    `${ADMIN_BASE}/versions`
  )
  return res.data ?? []
}

export const listDesignVersionsQueryOptions = () =>
  queryOptions({
    queryKey: designStudioKeys.versions,
    queryFn: listDesignVersions,
    staleTime: 30_000,
  })
