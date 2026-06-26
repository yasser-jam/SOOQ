/** Maps an editor page path (e.g. `/cart`) to a design-studio URL segment. */
export function pagePathToStudioSegment(pagePath: string): string {
	const normalized = pagePath === "" ? "/" : pagePath
	if (normalized === "/") return "home"
	return normalized.replace(/^\//, "")
}

export function buildStudioPreviewHref(
	studioBase: string,
	pagePath: string,
): string {
	return `${studioBase}/${pagePathToStudioSegment(pagePath)}/preview`
}

export function buildStudioEditHref(studioBase: string, pagePath: string): string {
	return `${studioBase}/${pagePathToStudioSegment(pagePath)}/edit`
}
