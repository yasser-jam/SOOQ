let storeBasePath: string | null = null

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
		return trimmed
	}

	const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`
	return `${storeBasePath}${path}`
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
