import type { Metadata } from "next"

export const metadata: Metadata = {
	title: "الإعدادات",
}

/**
 * Customer account settings for the published storefront.
 *
 * A static segment, so it shadows the storefront catch-all (`[[...slug]]`) and
 * never goes through the Puck renderer. Public URL is
 * `/store/<tenantId>/settings` — `middleware.ts` rewrites that to this route
 * whenever the segment is a tenant UUID.
 */
export default function PublishedStoreSettingsPage() {
	return (
		<main className="SettingsPage">
			<h1 className="SettingsPage-title">الإعدادات</h1>
		</main>
	)
}
