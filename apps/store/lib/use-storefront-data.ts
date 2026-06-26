"use client"

import { useEffect, useState } from "react"

import { resolveAllData, type Metadata } from "@/core"
import config from "@/core/config"
import { PAGES_UPDATED_EVENT } from "@/core/config/page-registry"
import {
	composePuckData,
	getSiteStorageKey,
	readSiteData,
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
	const siteKey = getSiteStorageKey()

	const [data, setData] = useState<Partial<UserData>>(() => {
		const site = readSiteData()
		return composePuckData(site, path)
	})

	useEffect(() => {
		const refresh = () => {
			const site = readSiteData()
			setData(composePuckData(site, path))
		}

		window.addEventListener(PAGES_UPDATED_EVENT, refresh)
		return () => window.removeEventListener(PAGES_UPDATED_EVENT, refresh)
	}, [path])

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
		const site = readSiteData()
		const page = site.pages.find(
			(entry) =>
				entry.link === path ||
				entry.slug === path ||
				entry.path === path ||
				entry.examplePath === path,
		)
		document.title = page?.title ?? page?.name ?? ""
	}, [path])

	return {
		data,
		resolvedData,
		isLoading: isResolving,
		siteKey,
		readSiteData,
	}
}
