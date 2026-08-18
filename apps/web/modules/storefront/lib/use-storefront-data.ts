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
import { STORE_HOME_PATH } from "@/modules/storefront/lib/store-config"

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
}: {
	path?: string
	metadata?: Metadata
	tenantId: string
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

	const platform: DesignPlatform =
		storefrontMode === "mobile" ? "mobile" : "web"

	const publishedQuery = usePublishedSiteData(tenantId, platform)
	const site = publishedQuery.site

	const status = useMemo<StorefrontStatus>(() => {
		if (publishedQuery.isLoading) return "loading"
		if (publishedQuery.isError || !site) return "not-found-tenant"
		return "ready"
	}, [site, publishedQuery.isLoading, publishedQuery.isError])

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
