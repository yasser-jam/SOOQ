import { componentKey } from "@/core/config";
import {
  normalizeSiteData,
  writeSiteData,
} from "@/core/config/lib/site-data";
import {
  getThemeById,
  themeCatalog,
  type ThemeCatalogItem,
} from "@/core/themes";

export type SelectedThemeMeta = Pick<
  ThemeCatalogItem,
  "id" | "name" | "description" | "image"
>;

export const STORE_THEME_SELECTED_EVENT = "store-theme-selected";

const SELECTED_THEME_KEY = `puck-demo:${componentKey}:selected-theme`;

export function readSelectedTheme(): SelectedThemeMeta | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(SELECTED_THEME_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as SelectedThemeMeta;
  } catch {
    return null;
  }
}

function writeSelectedTheme(meta: SelectedThemeMeta) {
  window.localStorage.setItem(SELECTED_THEME_KEY, JSON.stringify(meta));
}

export function applyStoreTheme(themeId: number): SelectedThemeMeta | null {
  const theme = getThemeById(themeId);
  if (!theme || typeof window === "undefined") return null;

  writeSiteData(normalizeSiteData(theme.siteData));
  const meta: SelectedThemeMeta = {
    id: theme.id,
    name: theme.name,
    description: theme.description,
    image: theme.image,
  };
  writeSelectedTheme(meta);
  window.dispatchEvent(new CustomEvent(STORE_THEME_SELECTED_EVENT, { detail: meta }));
  return meta;
}

export { themeCatalog };
