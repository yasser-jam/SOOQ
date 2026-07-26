"use client"

import { useQuery } from "@tanstack/react-query"

import {
	getPublishedDesignConfig,
} from "@/modules/design-studio/actions"
import { designStudioKeys } from "@/modules/design-studio/queryKeys"
import type { DesignPlatform } from "@/modules/design-studio/types"
import {
	normalizeSiteData,
	type SiteData,
} from "@/core/config/lib/site-data"

function isSiteDataLike(value: unknown): value is Partial<SiteData> {
	if (!value || typeof value !== "object") return false
	const obj = value as Record<string, unknown>
	return Array.isArray(obj.pages) || obj.root != null || obj.zones != null
}

function extractSiteDataFromConfig(
	config: unknown,
	platform: DesignPlatform,
): SiteData | null {
	if (!config || typeof config !== "object") return null

	const record = config as Record<string, unknown>

	if (Array.isArray(record.pages)) {
		const normalized = normalizeSiteData(config as SiteData)
		return normalized.pages.length > 0 ? normalized : null
	}

	const platformData =
		record[platform] ??
		(platform === "mobile" ? record.web : undefined) ??
		record.web

	if (!isSiteDataLike(platformData)) return null

	const normalized = normalizeSiteData(platformData as SiteData)
	return normalized.pages.length > 0 ? normalized : null
}

async function fetchPublishedSiteData(
	tenantId: string,
	platform: DesignPlatform,
): Promise<SiteData | null> {
	const primary = await getPublishedDesignConfig(tenantId, platform)
	let site = extractSiteDataFromConfig(primary?.config, platform)

	if (site) return site

	if (platform === "mobile") {
		const fallback = await getPublishedDesignConfig(tenantId, "web")
		site = extractSiteDataFromConfig(fallback?.config, "web")
	}

	return site
}

export function usePublishedSiteData(
	tenantId: string,
	platform: DesignPlatform,
	{ enabled = true }: { enabled?: boolean } = {},
) {
	const query = useQuery({
		queryKey: designStudioKeys.publishedConfig(tenantId, platform),
		queryFn: () => fetchPublishedSiteData(tenantId, platform),
		enabled: enabled && Boolean(tenantId),
		staleTime: 30_000,
		retry: false,
	})

	return {
		site: query.data ?? null,
		isLoading: query.isLoading || query.isFetching,
		isError: query.isError,
		error: query.error,
	}
}
