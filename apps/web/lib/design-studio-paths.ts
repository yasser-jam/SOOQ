import { readSelectedTheme } from "@/core/config/lib/selected-theme";

/** Maps a theme name (e.g. `Theme 1`) to a design-studio URL segment. */
export function themeNameToStudioSegment(themeName: string): string {
	return themeName.trim().toLowerCase().replace(/\s+/g, "-");
}

export function buildStudioPreviewHref(
	studioBase: string,
	themeName: string,
): string {
	return `${studioBase}/${themeNameToStudioSegment(themeName)}/preview`;
}

export function buildStudioEditHref(
	studioBase: string,
	themeName: string,
): string {
	return `${studioBase}/${themeNameToStudioSegment(themeName)}/edit`;
}

export function resolveStudioThemeEditHref(studioBase: string): string {
	const theme = readSelectedTheme();
	const themeName = theme?.name ?? "Theme 1";
	return buildStudioEditHref(studioBase, themeName);
}

export function resolveStudioThemePreviewHref(studioBase: string): string {
	const theme = readSelectedTheme();
	const themeName = theme?.name ?? "Theme 1";
	return buildStudioPreviewHref(studioBase, themeName);
}

export function buildStudioEditHrefFromSegment(
	studioBase: string,
	themeSegment: string,
): string {
	return `${studioBase}/${themeSegment}/edit`;
}

export function buildStudioPreviewHrefFromSegment(
	studioBase: string,
	themeSegment: string,
): string {
	return `${studioBase}/${themeSegment}/preview`;
}
