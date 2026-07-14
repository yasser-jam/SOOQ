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

import { STORE_HOME_PATH } from "./store-config"

export function useStorefrontData({
	path = STORE_HOME_PATH,
	metadata = {},
}: {
	path?: string
	metadata?: Metadata
} = {}) {
	const [storefrontMode, setStorefrontMode] = useState(() =>
		typeof window === "undefined" ? "desktop" : resolveStorefrontMode()
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

	const site = useMemo(
		() => readStorefrontSiteData(),
		[siteRevision, storefrontMode]
	)
	const matchedPage = useMemo<SitePage | undefined>(
		() => findSitePage(site, path),
		[site, path],
	)

	const data = useMemo<Partial<UserData>>(
		() => composePuckData(site, path),
		[site, path],
	)

	const [resolvedData, setResolvedData] = useState<Partial<UserData>>(data)
	const [isResolving, setIsResolving] = useState(true)

	useEffect(() => {
		let cancelled = false

		setIsResolving(true)
		resolveAllData<Components, RootProps>(data, config, metadata).then(
			(next) => {
				if (!cancelled) {
					setResolvedData(next)
					setIsResolving(false)
				}
			},
		)

		return () => {
			cancelled = true
		}
	}, [data, metadata])

	useEffect(() => {
		document.title = matchedPage?.title ?? matchedPage?.name ?? ""
	}, [matchedPage])

	return {
		data,
		resolvedData,
		isLoading: isResolving,
		pageFound: Boolean(matchedPage),
		matchedPage,
		siteKey,
		storefrontMode,
		readStorefrontSiteData,
	}
}
