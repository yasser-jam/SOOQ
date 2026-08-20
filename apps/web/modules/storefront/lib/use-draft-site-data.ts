"use client"

import { useQuery } from "@tanstack/react-query"

import { getDesignDraft } from "@/modules/design-studio/actions"
import { designStudioKeys } from "@/modules/design-studio/queryKeys"
import type { DesignPlatform } from "@/modules/design-studio/types"
import type { SiteData } from "@/core/config/lib/site-data"

import { extractSiteDataFromConfig } from "@/modules/storefront/lib/site-data-extract"

/** Admin draft read: tenant comes from the JWT (`api()`'s Bearer/X-Tenant-Slug
 *  headers) — unlike the published config, no tenantId needs to be passed in.
 *  `configJson` already carries both platform keys, so one fetch covers the
 *  mobile→web fallback too. */
async function fetchDraftSiteData(
	platform: DesignPlatform,
): Promise<SiteData | null> {
	const draft = await getDesignDraft()
	return extractSiteDataFromConfig(draft?.configJson, platform)
}

export function useDraftSiteData(
	platform: DesignPlatform,
	{ enabled = true }: { enabled?: boolean } = {},
) {
	const query = useQuery({
		queryKey: [...designStudioKeys.draft, platform],
		queryFn: () => fetchDraftSiteData(platform),
		enabled,
		staleTime: 15_000,
		refetchOnMount: "always",
		refetchOnWindowFocus: false,
		retry: false,
	})

	return {
		site: query.data ?? null,
		isLoading: query.isLoading,
		isError: query.isError && query.data === undefined,
		error: query.error,
	}
}
