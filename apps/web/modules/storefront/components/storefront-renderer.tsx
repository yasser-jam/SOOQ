"use client"

import { useMemo } from "react"
import { notFound } from "next/navigation"
import { Render } from "@/core"
import config from "@/core/config"
import type { FullThemeProps } from "@/core/config/theme"

// Side effect: registers the axios-backed editor data adapter (shared from
// apps/web via the @/lib alias) so bound blocks fetch live data (C2-4).
import "@/lib/editor-data-adapter"

import { PreviewThemeProvider } from "@/modules/storefront/components/preview-theme-provider"
import { StoreLoading } from "@/modules/storefront/components/store-loading"
import { StoreNotFound } from "@/modules/storefront/components/store-not-found"
import { StoreProvider } from "@/modules/storefront/components/StoreProvider"
import { UrlBoundProductProvider } from "@/modules/storefront/components/UrlBoundProductProvider"
import { UrlBoundOrderProvider } from "@/modules/storefront/components/UrlBoundOrderProvider"
import { STORE_FIXED_THEME_ID } from "@/modules/storefront/lib/store-config"
import { useStoreTenant } from "@/modules/storefront/lib/store-tenant-context"
import { useStorePathname } from "@/modules/storefront/lib/use-store-pathname"
import {
	useStorefrontData,
	type StorefrontDataSource,
} from "@/modules/storefront/lib/use-storefront-data"
import type { TemplateRef } from "@/modules/storefront/lib/use-template-site-data"

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

export function StorefrontRenderer({
	source = "published",
	templateRef = null,
}: {
	source?: StorefrontDataSource
	templateRef?: TemplateRef | null
}) {
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
			source,
			templateRef,
		})

	const dynamicSegments = useMemo(() => {
		if (!matchedPage?.dynamic) return {}
		return extractDynamicSegments(matchedPage.path, path)
	}, [matchedPage, path])

	const productSlug = dynamicSegments["product-slug"] ?? null
	const orderId = dynamicSegments["order-id"] ?? null

	const rootProps = useMemo(() => {
		const root = resolvedData?.root
		if (!root) return undefined
		return ("props" in root ? root.props : root) as Partial<FullThemeProps>
	}, [resolvedData])

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
		<StoreProvider>
			<PreviewThemeProvider rootProps={rootProps}>
				{productSlug ? (
					<UrlBoundProductProvider slug={productSlug}>
						{rendered}
					</UrlBoundProductProvider>
				) : orderId ? (
					<UrlBoundOrderProvider orderId={orderId}>
						{rendered}
					</UrlBoundOrderProvider>
				) : (
					rendered
				)}
			</PreviewThemeProvider>
		</StoreProvider>
	)
}
