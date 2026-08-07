import { redirect } from "next/navigation"

type Params = Promise<{ "product-id": string }>

/**
 * Redirect shim — the SEO editor moved inline into the product editor as a tab
 * (per FRONTEND_PAGES_AND_ENDPOINTS.md / PRD-013).
 */
export default async function SeoPageRedirect({ params }: { params: Params }) {
  const { "product-id": productId } = await params
  redirect(`/products/${productId}?tab=seo`)
}
