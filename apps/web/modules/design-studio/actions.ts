import { queryOptions } from "@tanstack/react-query"

import { api } from "@/lib/api"
import { publicApi } from "@/lib/public-api"
import type { ApiResponse } from "@/lib/types"

import { designStudioKeys } from "./queryKeys"
import type {
  ApplyTemplateInput,
  DesignPlatform,
  DesignTemplateDetail,
  DesignTemplateSummary,
  DesignVersion,
  PublishedDesignConfig,
  SaveDraftInput,
} from "./types"

const ADMIN_BASE = "/admin/design"
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

/** Storefront read: needs tenant UUID because it's unauthenticated. */
export const getPublishedDesignConfig = async (
  tenantId: string,
  platform: DesignPlatform = "web"
): Promise<PublishedDesignConfig | null> => {
  try {
    const res = await publicApi<ApiResponse<PublishedDesignConfig>>(
      `${PUBLIC_BASE}/config`,
      {
        tenantId,
        params: { platform },
      }
    )
    return res.data ?? null
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
