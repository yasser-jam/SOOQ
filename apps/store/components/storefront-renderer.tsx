"use client"

import { useMemo } from "react"
import { Render } from "@/core"
import config from "@/core/config"
import type { FullThemeProps } from "@/core/config/theme"

import { PreviewThemeProvider } from "./preview-theme-provider"
import { STORE_FIXED_THEME_ID, STORE_HOME_PATH } from "../lib/store-config"
import { useStorefrontData } from "../lib/use-storefront-data"

export function StorefrontRenderer() {
	const metadata = useMemo(
		() => ({
			themeId: STORE_FIXED_THEME_ID,
		}),
		[],
	)

	const { resolvedData, isLoading } = useStorefrontData({
		path: STORE_HOME_PATH,
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

	if (!resolvedData?.content?.length) {
		return (
			<div className="StorefrontState">
				<h1>لا توجد صفحة</h1>
				<p>
					لم يتم العثور على محتوى للصفحة الرئيسية. عدّل التصميم في استوديو
					التصميم ثم افتح المتجر من نفس النطاق (origin) لمشاركة localStorage.
				</p>
			</div>
		)
	}

	return (
		<PreviewThemeProvider rootProps={rootProps}>
			<Render config={config} data={resolvedData} metadata={metadata} />
		</PreviewThemeProvider>
	)
}
