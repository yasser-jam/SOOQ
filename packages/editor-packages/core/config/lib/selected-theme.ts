import { componentKey } from "../index";

export type SelectedThemeMeta = {
  id: number;
  name: string;
  description: string;
  image: string;
};

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
