"use client"

import { useEffect, useMemo, useState } from "react"

import { resolveAllData, type Metadata } from "@/core"
import config from "@/core/config"
import { PAGES_UPDATED_EVENT } from "@/core/config/page-registry"
import {
	composePuckData,
	findSitePage,
	getSiteStorageKey,
	readSiteData,
	readStorefrontSiteData,
	resolveStorefrontMode,
	type SitePage,
} from "@/core/config/lib/site-data"
import type { UserData } from "@/core/config/types"
import type { RootProps } from "@/core/config/root"
import type { Components } from "@/core/config/types"
import type { DesignPlatform } from "@/modules/design-studio/types"

import { usePublishedSiteData } from "@/modules/storefront/lib/use-published-site-data"
import { STORE_HOME_PATH } from "@/modules/storefront/lib/store-config"

export type StorefrontStatus = "loading" | "not-found-tenant" | "ready"

function hasPersistedSiteOverride(mode: "desktop" | "mobile"): boolean {
	if (typeof window === "undefined") return false
	return window.localStorage.getItem(getSiteStorageKey(mode)) !== null
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
		() =>
			typeof window === "undefined"
				? "desktop"
				: resolveStorefrontMode(),
	)
	const siteKey = getSiteStorageKey(storefrontMode)
	const [siteRevision, setSiteRevision] = useState(0)

	useEffect(() => {
		const refresh = () => setSiteRevision((revision) => revision + 1)

		window.addEventListener(PAGES_UPDATED_EVENT, refresh)
		return () => window.removeEventListener(PAGES_UPDATED_EVENT, refresh)
	}, [])

	useEffect(() => {
		const syncMode = () => setStorefrontMode(resolveStorefrontMode())

		syncMode()

		const desktop = readSiteData("desktop")
		const bp =
			(desktop.root?.props as { breakpointMobileMax?: number } | undefined)
				?.breakpointMobileMax ?? 767
		const mq = window.matchMedia(`(max-width: ${bp}px)`)
		mq.addEventListener("change", syncMode)
		window.addEventListener("popstate", syncMode)

		return () => {
			mq.removeEventListener("change", syncMode)
			window.removeEventListener("popstate", syncMode)
		}
	}, [siteRevision])

	const hasLocalOverride = hasPersistedSiteOverride(storefrontMode)
	// siteRevision bumps when ThemeJsonTester writes to localStorage.
	void siteRevision

	const platform: DesignPlatform =
		storefrontMode === "mobile" ? "mobile" : "web"

	const publishedQuery = usePublishedSiteData(tenantId, platform, {
		enabled: !hasLocalOverride,
	})

	const site = hasLocalOverride
		? readStorefrontSiteData()
		: publishedQuery.site

	const status = useMemo<StorefrontStatus>(() => {
		if (hasLocalOverride) {
			return site ? "ready" : "not-found-tenant"
		}

		if (publishedQuery.isLoading) return "loading"
		if (publishedQuery.isError || !site) return "not-found-tenant"
		return "ready"
	}, [
		hasLocalOverride,
		site,
		publishedQuery.isLoading,
		publishedQuery.isError,
	])

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
		document.title = matchedPage?.title ?? matchedPage?.name ?? ""
	}, [matchedPage])

	return {
		data,
		resolvedData,
		isLoading: status === "loading" || isResolving,
		status,
		pageFound: Boolean(matchedPage),
		matchedPage,
		siteKey,
		storefrontMode,
		readStorefrontSiteData,
	}
}
