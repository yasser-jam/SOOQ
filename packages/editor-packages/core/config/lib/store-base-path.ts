let storeBasePath: string | null = null
let storeBaseQuery: string | null = null

export function setStoreBasePath(prefix: string | null) {
	if (!prefix) {
		storeBasePath = null
		return
	}

	const normalized = prefix.replace(/\/+$/, "")
	storeBasePath = normalized || null
}

export function getStoreBasePath(): string | null {
	return storeBasePath
}

/** Query string appended to every internally-generated link (no leading `?`).
 *  Used by the admin design preview to carry `templateKey`/`templateId`
 *  across in-site navigation, so browsing past the first page doesn't
 *  silently fall back to the tenant's draft. */
export function setStoreBaseQuery(query: string | null) {
	storeBaseQuery = query || null
}

export function getStoreBaseQuery(): string | null {
	return storeBaseQuery
}

export function isExternalOrSpecialHref(href: string): boolean {
	const trimmed = href.trim()
	if (!trimmed || trimmed.startsWith("#")) return true
	if (/^https?:\/\//i.test(trimmed)) return true
	if (/^(mailto:|tel:|javascript:)/i.test(trimmed)) return true
	return false
}

export function withStoreBasePath(
	href: string | null | undefined,
): string | null {
	if (href == null) return null

	const trimmed = href.trim()
	if (!trimmed || trimmed === "#") return trimmed || null
	if (isExternalOrSpecialHref(trimmed)) return trimmed
	if (!storeBasePath) return trimmed

	if (trimmed === storeBasePath || trimmed.startsWith(`${storeBasePath}/`)) {
		return appendStoreBaseQuery(trimmed)
	}

	const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`
	return appendStoreBaseQuery(`${storeBasePath}${path}`)
}

function appendStoreBaseQuery(href: string): string {
	if (!storeBaseQuery || href.includes("?")) return href
	return `${href}?${storeBaseQuery}`
}

export function stripStoreBasePath(pathname: string): string {
	if (!storeBasePath) return pathname

	if (pathname === storeBasePath) return "/"

	if (pathname.startsWith(`${storeBasePath}/`)) {
		const rest = pathname.slice(storeBasePath.length)
		return rest || "/"
	}

	return pathname
}
