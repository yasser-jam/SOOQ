import type { Metadata } from "next"

export const metadata: Metadata = {
	title: "الإعدادات",
}

/**
 * Customer account settings — a static segment, so it shadows the storefront
 * catch-all (`[[...slug]]`) and never goes through the Puck renderer.
 * Kept empty for now (same pattern as `/orders`).
 */
export default function SettingsPage() {
	return (
		<main className="SettingsPage">
			<h1 className="SettingsPage-title">الإعدادات</h1>
		</main>
	)
}
