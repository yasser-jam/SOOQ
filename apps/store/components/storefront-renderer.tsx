"use client"

// Side effect: registers the axios-backed editor data adapter (shared from
// apps/web via the @/lib alias) so bound blocks fetch live data (C2-4).
import "@/lib/editor-data-adapter"
import { useMemo } from "react"
import { Render } from "@/core"
import config from "@/core/config"
import type { FullThemeProps } from "@/core/config/theme"

import { PreviewThemeProvider } from "./preview-theme-provider"
import { StoreNotFound } from "./store-not-found"
import { StoreProvider } from "./StoreProvider"
import { STORE_FIXED_THEME_ID } from "../lib/store-config"
import { useStorePathname } from "../lib/use-store-pathname"
import { useStorefrontData } from "../lib/use-storefront-data"

export function StorefrontRenderer() {
	const path = useStorePathname()

	const metadata = useMemo(
		() => ({
			themeId: STORE_FIXED_THEME_ID,
		}),
		[],
	)

	const { resolvedData, isLoading, pageFound } = useStorefrontData({
		path,
		metadata,
	})

	const rootProps = useMemo(() => {
		const root = resolvedData?.root
		if (!root) return undefined
		return ("props" in root ? root.props : root) as Partial<FullThemeProps>
	}, [resolvedData])

	if (isLoading) {
		return (
			<div className="StorefrontState">
				<p>جاري تحميل المتجر…</p>
			</div>
		)
	}

	if (!pageFound) {
		return <StoreNotFound />
	}

	return (
		<StoreProvider>
			<PreviewThemeProvider rootProps={rootProps}>
				<Render config={config} data={resolvedData} metadata={metadata} />
			</PreviewThemeProvider>
		</StoreProvider>
	)
}
