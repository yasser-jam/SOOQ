import type { SiteData } from "../config/lib/site-data";

/**
 * Card metadata for the themes we still ship in the client bundle.
 *
 * These exist only because the DSN backend's seeded templates carry empty
 * `templateJson`. They are applied through `PUT /admin/design/draft` and are
 * meant to be retired once the backend seeds real payloads — at which point
 * this whole module can be deleted without touching the gallery UI.
 *
 * Payloads are loaded on demand: statically importing them pulled ~1.1MB of
 * JSON into every page that rendered the gallery.
 *
 * `legacy/theme-waha.json` is excluded: its pages use the pre-`SitePage` shape
 * (`route` instead of `path`), which normalizes to `path: undefined`. Migrate
 * it before listing it here.
 */
export type BuiltinThemeSummary = {
  templateKey: string;
  templateName: string;
  description: string;
  previewImageUrl: string | null;
};

const builtinThemeLoaders: Record<string, () => Promise<unknown>> = {
  "builtin-sooq-modern": () => import("./theme-sooq-modern.json"),
};

export const builtinThemeCatalog: BuiltinThemeSummary[] = [
  {
    templateKey: "builtin-sooq-modern",
    templateName: "سوق مودرن",
    description:
      "قالب متعدد الصفحات بتصميم عصري — صفحة رئيسية، منتجات، تفاصيل منتج، سلة، وتسجيل دخول.",
    previewImageUrl:
      "https://placehold.co/400x250/1f2937/f9fafb?text=%D8%B3%D9%88%D9%82",
  },
];

export function isBuiltinThemeKey(templateKey: string): boolean {
  return Object.prototype.hasOwnProperty.call(
    builtinThemeLoaders,
    templateKey
  );
}

export function getBuiltinTheme(
  templateKey: string
): BuiltinThemeSummary | undefined {
  return builtinThemeCatalog.find(
    (theme) => theme.templateKey === templateKey
  );
}

export async function loadBuiltinThemeSiteData(
  templateKey: string
): Promise<SiteData | null> {
  const loader = builtinThemeLoaders[templateKey];
  if (!loader) return null;

  const mod = (await loader()) as { default?: SiteData } & SiteData;
  return (mod.default ?? mod) as SiteData;
}

export default builtinThemeCatalog;
