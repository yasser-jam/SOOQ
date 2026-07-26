"use client"

import React, { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"

import {
	BoundDataProvider,
	type BoundDataContextValue,
} from "@/core/config/binding"
import {
	BOUND_QUERY_POLICY,
	boundQueryKeys,
	getEditorDataAdapter,
} from "@/core/config/data-adapter"

/**
 * Provides the product identified by a URL slug as bound data for every
 * descendant block. The dynamic `/products/:product-slug` page contains
 * blocks with `product: null` — they inherit from this provider instead of
 * carrying a hard-coded product id.
 */
export function UrlBoundProductProvider({
	slug,
	language = "ar",
	children,
}: {
	slug: string
	language?: "ar" | "en"
	children: React.ReactNode
}) {
	const adapter = getEditorDataAdapter()
	const metadata = useMemo(
		() => adapter.buildPublicProductResourceMetadata(slug),
		[adapter, slug],
	)

	const { data, isLoading, isError } = useQuery({
		queryKey: boundQueryKeys.productDetail(slug, metadata.apiUrl),
		queryFn: () => adapter.fetchProductDetailPayload(metadata.apiUrl),
		enabled: Boolean(slug),
		...BOUND_QUERY_POLICY,
	})

	const [selectedVariantId, setSelectedVariantId] = React.useState<
		string | null
	>(null)

	React.useEffect(() => {
		setSelectedVariantId(null)
	}, [slug])

	const value = useMemo<BoundDataContextValue>(
		() => ({
			data: (data ?? null) as Record<string, unknown> | null,
			isLoading,
			isError,
			metadata,
			language,
			selectedVariantId,
			setSelectedVariantId,
		}),
		[data, isLoading, isError, metadata, language, selectedVariantId],
	)

	return <BoundDataProvider value={value}>{children}</BoundDataProvider>
}
