"use client"

import { Suspense, useLayoutEffect, useMemo } from "react"
import { useSearchParams } from "next/navigation"

import { setStoreBaseQuery } from "@/core/config/lib/store-base-path"
import RequireRole from "@/modules/auth/auth/components/RequireRole"
import { StorefrontRenderer } from "@/modules/storefront/components/storefront-renderer"
import type { StorefrontDataSource } from "@/modules/storefront/lib/use-storefront-data"
import type { TemplateRef } from "@/modules/storefront/lib/use-template-site-data"

import {
	DraftPreviewAppbar,
	DRAFT_PREVIEW_APPBAR_HEIGHT_PX,
} from "../_components/draft-preview-appbar"

function DesignPreviewContent() {
	const searchParams = useSearchParams()
	const templateId = searchParams.get("templateId")
	const templateKey = searchParams.get("templateKey")
	const templateName = searchParams.get("templateName")

	const templateRef = useMemo<TemplateRef | null>(() => {
		if (templateId) return { templateId }
		if (templateKey) return { templateKey }
		return null
	}, [templateId, templateKey])

	const source: StorefrontDataSource = templateRef ? "template" : "draft"

	// Carries `templateKey`/`templateId` onto every in-site nav link the
	// rendered template generates, so clicking through to a second page keeps
	// previewing the template instead of silently falling back to the
	// tenant's real draft (which would also wrongly re-show the publish
	// button on that page).
	const templateQuery = templateRef ? searchParams.toString() : null
	useLayoutEffect(() => {
		setStoreBaseQuery(templateQuery)
		return () => setStoreBaseQuery(null)
	}, [templateQuery])

	return (
		<RequireRole roles={["OWNER", "MANAGER", "STAFF"]}>
			<DraftPreviewAppbar
				isTemplateMode={templateRef != null}
				templateName={templateName}
			/>
			<div style={{ paddingTop: DRAFT_PREVIEW_APPBAR_HEIGHT_PX }}>
				<StorefrontRenderer source={source} templateRef={templateRef} />
			</div>
		</RequireRole>
	)
}

export default function DesignPreviewPage() {
	return (
		<Suspense fallback={null}>
			<DesignPreviewContent />
		</Suspense>
	)
}
