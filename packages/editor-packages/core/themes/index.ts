import type { SiteData } from "../config/lib/site-data";
import theme1Data from "./theme-1.json";
import theme2Data from "./theme-2.json";
import theme3Data from "./theme-3.json";
import themeWahaData from "./theme-waha.json";

export type ThemeCatalogItem = {
  id: number;
  name: string;
  description: string;
  image: string;
  siteData: SiteData;
};

const themeDataByFile = {
  "theme-1.json": theme1Data as SiteData,
  "theme-2.json": theme2Data as SiteData,
  "theme-3.json": theme3Data as SiteData,
  "theme-waha.json": themeWahaData as SiteData,
} as const;

const catalogEntries = [
  {
    id: 1,
    name: "Theme 1",
    description: "Theme 1 description",
    image: "https://via.placeholder.com/150",
    theme: "theme-1.json",
  },
  {
    id: 2,
    name: "Theme 2",
    description: "Theme 2 description",
    image: "https://via.placeholder.com/150",
    theme: "theme-2.json",
  },
  {
    id: 3,
    name: "Theme 3",
    description: "Theme 3 description",
    image: "https://via.placeholder.com/150",
    theme: "theme-3.json",
  },
  {
    id: 4,
    name: "واحة",
    description: "ثيم عربي متجاوب — لوحة ألوان دافئة، خطوط Nunito و Poppins، رأس متجاوب بزر قائمة جوال ودرج تنقل جانبي.",
    image: "https://placehold.co/400x250/1b6b8a/f5f3ef?text=%D9%88%D8%A7%D8%AD%D8%A9",
    theme: "theme-waha.json",
  },
] as const;

export const themeCatalog: ThemeCatalogItem[] = catalogEntries.map((entry) => ({
  id: entry.id,
  name: entry.name,
  description: entry.description,
  image: entry.image,
  siteData: themeDataByFile[entry.theme],
}));

export function getThemeById(id: number): ThemeCatalogItem | undefined {
  return themeCatalog.find((theme) => theme.id === id);
}

export default themeCatalog;
