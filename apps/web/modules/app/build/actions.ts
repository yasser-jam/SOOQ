import { queryOptions } from "@tanstack/react-query"

import { api } from "@/lib/api"
import { getEditorTenantId } from "@/lib/tenant-context"
import { getTenantSlug } from "@/lib/tenant-slug"
import type { ApiResponse, Page } from "@/lib/types"

import { IN_FLIGHT_BUILD_STATUSES, POLL_GIVE_UP_MS, bundleIdFor, mobileApiBaseUrl } from "./config"
import { appBuildKeys } from "./queryKeys"
import type {
  AppBuildJob,
  AppConfigJson,
  AppConfiguration,
  BuildChannel,
} from "./types"

const tenantHeaders = (): Record<string, string> | undefined => {
  const tenantId = getEditorTenantId()
  return tenantId ? { "X-Tenant-ID": tenantId } : undefined
}

/** All APP endpoints respond with the standard `{success, data, message}` envelope. */
const unwrap = <T>(response: ApiResponse<T>): T => {
  if (response.data === undefined || response.data === null) {
    throw new Error(response.message ?? "استجابة فارغة من الخادم")
  }
  return response.data
}

/** List endpoints may come back as a bare array, a Spring `Page`, or a paged envelope's `data`. */
const toArray = <T>(data: T[] | Page<T>): T[] =>
  Array.isArray(data) ? data : (data.content ?? [])

export const listBuilds = async (params?: {
  status?: string
  pageSize?: number
}): Promise<Page<AppBuildJob>> => {
  const response = await api<ApiResponse<Page<AppBuildJob> | AppBuildJob[]>>(
    "/app-builds",
    {
      headers: tenantHeaders(),
      params: { pageSize: 100, ...params },
    }
  )
  const data = unwrap(response)
  return Array.isArray(data) ? { content: data } : data
}

export const initiateBuild = async (input: {
  buildChannel: BuildChannel
  configVersionId: string
}): Promise<AppBuildJob> => {
  if (!input.configVersionId) {
    throw new Error("معرّف نسخة الإعدادات مفقود — لا يمكن بدء البناء")
  }
  return unwrap(
    await api<ApiResponse<AppBuildJob>>("/app-builds", {
      method: "POST",
      headers: tenantHeaders(),
      body: input,
    })
  )
}

export const retryBuild = async (id: string): Promise<AppBuildJob> =>
  unwrap(
    await api<ApiResponse<AppBuildJob>>(`/app-builds/${id}/retry`, {
      method: "POST",
      headers: tenantHeaders(),
    })
  )

export const listConfigurations = async (): Promise<AppConfiguration[]> => {
  const response = await api<
    ApiResponse<Page<AppConfiguration> | AppConfiguration[]>
  >("/app-configurations", { headers: tenantHeaders() })
  return toArray(unwrap(response))
}

/** Mobile app's public web-config endpoint — always sent alongside merchant-supplied config values. */
const MOBILE_CONFIG_URL =
  "https://shopengine-production-9b4c.up.railway.app/api/v1/public/design/config?platform=mobile"

export const createConfiguration = async (
  configJson: AppConfigJson
): Promise<AppConfiguration> =>
  unwrap(
    await api<ApiResponse<AppConfiguration>>("/app-configurations", {
      method: "POST",
      headers: tenantHeaders(),
      body: {
        schemaVersion: "1.0.0",
        configJson: {
			appName: configJson.appName,
			apiBaseUrl: configJson.apiBaseUrl,
			bundleId: configJson.bundleId,
			configUrl: MOBILE_CONFIG_URL,
			...(configJson.iconUrl ? { iconUrl: configJson.iconUrl } : {}),
        },
      },
    })
  )

export const publishConfiguration = async (
  id: string
): Promise<AppConfiguration> => {
  if (!id) {
    throw new Error("معرّف نسخة الإعدادات مفقود — لا يمكن النشر")
  }
  return unwrap(
    await api<ApiResponse<AppConfiguration>>(
      `/app-configurations/${id}/publish`,
      {
        method: "POST",
        headers: tenantHeaders(),
      }
    )
  )
}

const sameConfig = (a: AppConfigJson, b: AppConfigJson): boolean =>
  a.appName === b.appName &&
  a.apiBaseUrl === b.apiBaseUrl &&
  a.bundleId === b.bundleId

const desiredConfigFor = (appName: string): AppConfigJson => ({
  appName,
  apiBaseUrl: mobileApiBaseUrl(),
  bundleId: bundleIdFor(getTenantSlug()),
})

/**
 * The config version matching the tenant's current derived values, split by
 * publish state. `draft` surfaces a version that was created but whose
 * `/publish` call previously failed, so callers can retry publishing it
 * instead of minting yet another version on every attempt.
 */
export const getRelevantConfig = async (
  appName: string
): Promise<{
  desired: AppConfigJson
  published?: AppConfiguration
  draft?: AppConfiguration
}> => {
  const desired = desiredConfigFor(appName)
  const matching = (await listConfigurations())
    .filter((c) => sameConfig(c.configJson, desired))
    .sort((a, b) => b.versionNumber - a.versionNumber)

  return {
    desired,
    published: matching.find((c) => c.isPublished),
    draft: matching.find((c) => !c.isPublished),
  }
}

/**
 * Reuses the newest published config version whose derived values already
 * match; reuses an existing unpublished draft (created by a prior attempt
 * whose publish step failed) instead of creating a new version; otherwise
 * creates and publishes a fresh one. Returns its id.
 */
export const ensurePublishedConfig = async (
  appName: string
): Promise<string> => {
  const { desired, published, draft } = await getRelevantConfig(appName)
  if (published) return published.appConfigurationId

  const target = draft ?? (await createConfiguration(desired))
  if (!target.appConfigurationId) {
    throw new Error("لم يتم العثور على معرّف نسخة الإعدادات بعد إنشائها")
  }
  await publishConfiguration(target.appConfigurationId)
  return target.appConfigurationId
}

/**
 * Force-creates and publishes a brand-new config version, ignoring any
 * existing published/draft match. The API has no delete/unpublish endpoint,
 * so this is the "start over" escape hatch when a stuck config needs to be
 * superseded rather than reused.
 */
export const createAndPublishNewConfig = async (
  appName: string
): Promise<string> => {
  const created = await createConfiguration(desiredConfigFor(appName))
  if (!created.appConfigurationId) {
    throw new Error("لم يتم العثور على معرّف نسخة الإعدادات بعد إنشائها")
  }
  await publishConfiguration(created.appConfigurationId)
  return created.appConfigurationId
}

export const configStatusQueryOptions = (appName: string) =>
  queryOptions({
    queryKey: appBuildKeys.configStatus(appName),
    queryFn: () => getRelevantConfig(appName),
    enabled: !!appName,
  })

/**
 * The single source of truth for the mobile app card: the last 100 builds,
 * newest last. Current status/date is derived from the last array item —
 * no separate "latest"/"last success"/per-build-detail calls.
 */
export const recentBuildsQueryOptions = () =>
  queryOptions({
    queryKey: appBuildKeys.list(),
    queryFn: () => listBuilds(),
    staleTime: 10_000,
    refetchInterval: (query) => {
      const builds = query.state.data?.content ?? []
      const current = builds[builds.length - 1]
      if (!current || !IN_FLIGHT_BUILD_STATUSES.includes(current.buildStatus)) {
        return false
      }
      const queuedAt = current.queuedAt ? new Date(current.queuedAt).getTime() : null
      if (queuedAt !== null && Date.now() - queuedAt > POLL_GIVE_UP_MS) return false
      return 10_000
    },
  })

/**
 * Creates a new config version from merchant-supplied values, publishes it,
 * then immediately triggers a build with it — the "create new config" flow
 * from the Design Studio mobile app card.
 */
export const createConfigPublishAndBuild = async (
  configJson: AppConfigJson
): Promise<AppBuildJob> => {
  const created = await createConfiguration(configJson)
  if (!created.appConfigurationId) {
    throw new Error("لم يتم العثور على معرّف نسخة الإعدادات بعد إنشائها")
  }
  await publishConfiguration(created.appConfigurationId)
  return initiateBuild({
    buildChannel: "BETA",
    configVersionId: created.appConfigurationId,
  })
}
