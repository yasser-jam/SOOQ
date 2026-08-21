import { normalizeSiteData, type SiteData } from "@/core/config/lib/site-data"
import type { DesignPlatform } from "@/modules/design-studio/types"

function isSiteDataLike(value: unknown): value is Partial<SiteData> {
	if (!value || typeof value !== "object") return false
	const obj = value as Record<string, unknown>
	return Array.isArray(obj.pages) || obj.root != null || obj.zones != null
}

/** Shared by published (`/public/design/config`) and draft (`/admin/design/draft`)
 *  sources — both return a config object that is either a bare `SiteData` or one
 *  keyed by platform (`{ web, mobile }`). */
export function extractSiteDataFromConfig(
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
