"use client"

import { useQuery } from "@tanstack/react-query"

import { getDesignTemplate, getMineTemplate } from "@/modules/design-studio/actions"
import { designStudioKeys } from "@/modules/design-studio/queryKeys"
import type { DesignPlatform } from "@/modules/design-studio/types"
import type { SiteData } from "@/core/config/lib/site-data"

import { extractSiteDataFromConfig } from "@/modules/storefront/lib/site-data-extract"

export type TemplateRef = { templateId: string } | { templateKey: string }

/** Previews a gallery template's own JSON — not the tenant's draft. Mine
 *  templates (tenant-owned) are read by id via the admin endpoint; system
 *  templates are read by key via the public catalog. */
async function fetchTemplateSiteData(
	ref: TemplateRef,
	platform: DesignPlatform,
): Promise<SiteData | null> {
	const detail = "templateId" in ref
		? await getMineTemplate(ref.templateId)
		: await getDesignTemplate(ref.templateKey)

	return extractSiteDataFromConfig(detail?.templateJson, platform)
}

export function useTemplateSiteData(
	ref: TemplateRef | null,
	platform: DesignPlatform,
	{ enabled = true }: { enabled?: boolean } = {},
) {
	const queryKey =
		ref && "templateId" in ref
			? designStudioKeys.mineTemplate(ref.templateId)
			: designStudioKeys.template(ref && "templateKey" in ref ? ref.templateKey : "")

	const query = useQuery({
		queryKey: [...queryKey, "site-data", platform],
		queryFn: () => fetchTemplateSiteData(ref as TemplateRef, platform),
		enabled: enabled && ref != null,
		staleTime: 60_000,
		retry: false,
	})

	return {
		site: query.data ?? null,
		isLoading: query.isLoading,
		isError: query.isError && query.data === undefined,
		error: query.error,
	}
}
