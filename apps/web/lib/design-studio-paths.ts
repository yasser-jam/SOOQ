import { readSelectedTheme } from "@/core/config/lib/selected-theme";
import type { EditorMode } from "@/core/config/lib/editor-mode";

/** Maps a theme name (e.g. `Theme 1`) to a design-studio URL segment. */
export function themeNameToStudioSegment(themeName: string): string {
	return themeName.trim().toLowerCase().replace(/\s+/g, "-");
}

/** Append or strip `?mode=mobile` on a design-studio href. */
export function withEditorMode(href: string, mode: EditorMode = "desktop"): string {
	const [pathname, search = ""] = href.split("?");
	const params = new URLSearchParams(search);

	if (mode === "mobile") {
		params.set("mode", "mobile");
	} else {
		params.delete("mode");
	}

	const query = params.toString();
	return query ? `${pathname}?${query}` : pathname;
}

export function buildStudioMobileEditHref(
	studioBase: string,
	themeName: string,
): string {
	return withEditorMode(buildStudioEditHref(studioBase, themeName), "mobile");
}

export function buildStudioMobileEditHrefFromSegment(
	studioBase: string,
	themeSegment: string,
): string {
	return withEditorMode(
		buildStudioEditHrefFromSegment(studioBase, themeSegment),
		"mobile",
	);
}

export function resolveStudioThemeMobileEditHref(studioBase: string): string {
	const theme = readSelectedTheme();
	const themeName = theme?.name ?? "Theme 1";
	return buildStudioMobileEditHref(studioBase, themeName);
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
