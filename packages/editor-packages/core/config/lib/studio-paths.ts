import { readSelectedTheme } from "./selected-theme";

/** Maps a theme name (e.g. `Theme 1`) to a design-studio URL segment. */
export function themeNameToStudioSegment(themeName: string): string {
  return themeName.trim().toLowerCase().replace(/\s+/g, "-");
}

export function buildStudioEditHref(
  studioBase: string,
  themeName: string
): string {
  return `${studioBase}/${themeNameToStudioSegment(themeName)}/edit`;
}

export function buildStudioPreviewHref(
  studioBase: string,
  themeName: string
): string {
  return `${studioBase}/${themeNameToStudioSegment(themeName)}/preview`;
}

export function getStudioBaseFromPathname(pathname: string): string | null {
  const match = pathname.match(/^(\/store\/[^/]+\/design-studio)(?:\/|$)/);
  return match?.[1] ?? null;
}

/** Parses `/store/:slug/design-studio/:themeName/edit` into studio base + theme segment. */
export function parseStudioPathname(pathname: string): {
  studioBase: string;
  themeSegment: string;
} | null {
  const studioBase = getStudioBaseFromPathname(pathname);
  if (!studioBase) return null;

  const suffix = pathname.slice(studioBase.length).replace(/^\//, "");
  const themeSegment = suffix.replace(/\/(edit|preview)$/, "");

  if (!themeSegment) return null;

  return { studioBase, themeSegment };
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
  themeSegment: string
): string {
  return `${studioBase}/${themeSegment}/edit`;
}

export function buildStudioPreviewHrefFromSegment(
  studioBase: string,
  themeSegment: string
): string {
  return `${studioBase}/${themeSegment}/preview`;
}
