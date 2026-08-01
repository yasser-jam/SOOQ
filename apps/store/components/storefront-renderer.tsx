"use client"

import { useMemo } from "react"
import { notFound } from "next/navigation"
import { Render } from "@/core"
import config from "@/core/config"
import type { FullThemeProps } from "@/core/config/theme"

// Side effect: registers the axios-backed editor data adapter (shared from
// apps/web via the @/lib alias) so bound blocks fetch live data (C2-4).
import "@/lib/editor-data-adapter"

import { PreviewThemeProvider } from "./preview-theme-provider"
import { StoreLoading } from "./store-loading"
import { StoreNotFound } from "./store-not-found"
import { StoreProvider } from "./StoreProvider"
import { UrlBoundProductProvider } from "./UrlBoundProductProvider"
import { STORE_FIXED_THEME_ID } from "../lib/store-config"
import { useStoreTenant } from "../lib/store-tenant-context"
import { useStorePathname } from "../lib/use-store-pathname"
import { useStorefrontData } from "../lib/use-storefront-data"

function extractDynamicSegments(
	pattern: string,
	pathname: string,
): Record<string, string> {
	const patternSegs = pattern.split("/").filter(Boolean)
	const pathSegs = pathname.split("/").filter(Boolean)
	if (patternSegs.length !== pathSegs.length) return {}

	const out: Record<string, string> = {}
	for (let i = 0; i < patternSegs.length; i += 1) {
		const p = patternSegs[i]!
		if (p.startsWith(":")) {
			const decoded = decodeURIComponent(pathSegs[i]!)
			out[p.slice(1)] = decoded
		}
	}
	return out
}

export function StorefrontRenderer() {
	const { tenantId } = useStoreTenant()
	const path = useStorePathname()

	const metadata = useMemo(
		() => ({
			themeId: STORE_FIXED_THEME_ID,
		}),
		[],
	)

	const { resolvedData, isLoading, status, pageFound, matchedPage } =
		useStorefrontData({
			path,
			metadata,
			tenantId,
		})

	const productSlug = useMemo(() => {
		if (!matchedPage?.dynamic) return null
		const segments = extractDynamicSegments(matchedPage.path, path)
		return segments["product-slug"] ?? null
	}, [matchedPage, path])

	const rootProps = useMemo(() => {
		const root = resolvedData?.root
		if (!root) return undefined
		return ("props" in root ? root.props : root) as Partial<FullThemeProps> & {
			language?: "ar" | "en"
		}
	}, [resolvedData])

	const initialLanguage = rootProps?.language ?? "ar"

	if (status === "not-found-tenant") {
		notFound()
	}

	if (isLoading) {
		return <StoreLoading />
	}

	if (!pageFound) {
		return <StoreNotFound />
	}

	const rendered = (
		<Render config={config} data={resolvedData} metadata={metadata} />
	)

	return (
		<StoreProvider initialLanguage={initialLanguage}>
			<PreviewThemeProvider rootProps={rootProps}>
				{productSlug ? (
					<UrlBoundProductProvider slug={productSlug}>
						{rendered}
					</UrlBoundProductProvider>
				) : (
					rendered
				)}
			</PreviewThemeProvider>
		</StoreProvider>
	)
}
