import { redirect } from "next/navigation"

type Params = Promise<{ "product-id": string }>

/**
 * Redirect shim — the SEO editor moved inline into the product editor as a tab
 * (per FRONTEND_PAGES_AND_ENDPOINTS.md / PRD-013).
 *
 * TODO: remove this shim after 2026-06-09 once any external bookmarks expire.
 *
 * Old standalone SEO page archived in git history (last revision before
 * Phase 2 inline-editor restructure).
 */
export default async function SeoPageRedirect({ params }: { params: Params }) {
  const { "product-id": productId } = await params
  redirect(`/products/${productId}?tab=seo`)
}
