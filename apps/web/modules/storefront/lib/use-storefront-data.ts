"use client"

import { useEffect, useMemo, useState } from "react"

import { resolveAllData, type Metadata } from "@/core"
import config from "@/core/config"
import {
	composePuckData,
	findSitePage,
	resolveSitePageText,
	type SitePage,
} from "@/core/config/lib/site-data"
import type { UserData } from "@/core/config/types"
import type { RootProps } from "@/core/config/root"
import type { Components } from "@/core/config/types"
import type { DesignPlatform } from "@/modules/design-studio/types"

import { usePublishedSiteData } from "@/modules/storefront/lib/use-published-site-data"
import { useDraftSiteData } from "@/modules/storefront/lib/use-draft-site-data"
import {
	useTemplateSiteData,
	type TemplateRef,
} from "@/modules/storefront/lib/use-template-site-data"
import { STORE_HOME_PATH } from "@/modules/storefront/lib/store-config"

export type StorefrontDataSource = "published" | "draft" | "template"

export type StorefrontStatus = "loading" | "not-found-tenant" | "ready"

const MOBILE_BREAKPOINT_PX = 767

/** Viewport-only mode resolution — the published site's own data decides
 *  content, never localStorage. `?mode=mobile|desktop` overrides the viewport. */
function resolveStorefrontMode(): "desktop" | "mobile" {
	if (typeof window === "undefined") return "desktop"

	const params = new URLSearchParams(window.location.search)
	const override = params.get("mode")
	if (override === "mobile" || override === "desktop") return override

	return window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT_PX}px)`).matches
		? "mobile"
		: "desktop"
}

export function useStorefrontData({
	path = STORE_HOME_PATH,
	metadata = {},
	tenantId,
	source = "published",
	templateRef = null,
}: {
	path?: string
	metadata?: Metadata
	/** Required when `source` is "published"; unused for "draft"/"template"
	 *  (tenant comes from the admin session's JWT instead of a public tenant
	 *  cookie). */
	tenantId?: string
	source?: StorefrontDataSource
	/** Required when `source` is "template" — identifies which gallery
	 *  template's own JSON to preview (as opposed to the tenant's draft). */
	templateRef?: TemplateRef | null
}) {
	const [storefrontMode, setStorefrontMode] = useState<"desktop" | "mobile">(
		() => resolveStorefrontMode(),
	)

	useEffect(() => {
		const syncMode = () => setStorefrontMode(resolveStorefrontMode())

		syncMode()

		const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT_PX}px)`)
		mq.addEventListener("change", syncMode)
		window.addEventListener("popstate", syncMode)

		return () => {
			mq.removeEventListener("change", syncMode)
			window.removeEventListener("popstate", syncMode)
		}
	}, [])

	// `storefrontMode` still switches the rendered shell (mobile vs desktop),
	// but the site data always comes from the web config — there is no
	// separate mobile config to render here.
	const platform: DesignPlatform = "web"

	const publishedQuery = usePublishedSiteData(tenantId ?? "", platform, {
		enabled: source === "published",
	})
	const draftQuery = useDraftSiteData(platform, {
		enabled: source === "draft",
	})
	const templateQuery = useTemplateSiteData(templateRef, platform, {
		enabled: source === "template",
	})
	const activeQuery =
		source === "draft"
			? draftQuery
			: source === "template"
				? templateQuery
				: publishedQuery
	const site = activeQuery.site

	const status = useMemo<StorefrontStatus>(() => {
		if (site) return "ready"
		if (activeQuery.isLoading) return "loading"
		return "not-found-tenant"
	}, [site, activeQuery.isLoading])

	const matchedPage = useMemo<SitePage | undefined>(
		() => (site ? findSitePage(site, path) : undefined),
		[site, path],
	)

	const data = useMemo<Partial<UserData>>(
		() => (site ? composePuckData(site, path) : { content: [], zones: {} }),
		[site, path],
	)

	const [resolvedSnapshot, setResolvedSnapshot] = useState<{
		key: string
		data: Partial<UserData>
	} | null>(null)

	const resolveKey = useMemo(
		() => `${status}:${path}:${site?.pages?.length ?? 0}`,
		[status, path, site],
	)

	useEffect(() => {
		if (status !== "ready") return

		let cancelled = false

		resolveAllData<Components, RootProps>(data, config, metadata).then(
			(next) => {
				if (!cancelled) {
					setResolvedSnapshot({ key: resolveKey, data: next })
				}
			},
		)

		return () => {
			cancelled = true
		}
	}, [data, metadata, status, resolveKey])

	const resolvedData =
		resolvedSnapshot?.key === resolveKey ? resolvedSnapshot.data : data

	const isResolving =
		status === "ready" &&
		(resolvedSnapshot === null || resolvedSnapshot.key !== resolveKey)

	useEffect(() => {
		const language =
			(data?.root?.props as { language?: "ar" | "en" } | undefined)
				?.language === "en"
				? "en"
				: "ar"
		document.title =
			resolveSitePageText(matchedPage?.title, language) ||
			resolveSitePageText(matchedPage?.name, language)
	}, [matchedPage, data?.root?.props])

	return {
		data,
		resolvedData,
		isLoading: status === "loading" || isResolving,
		status,
		pageFound: Boolean(matchedPage),
		matchedPage,
		storefrontMode,
	}
}
