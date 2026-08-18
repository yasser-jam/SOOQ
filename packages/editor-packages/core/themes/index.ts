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
  "builtin-meridian-almarai": () => import("./theme-meridian-almarai.json"),
  "builtin-rawaq-furniture": () => import("./theme-rawaq-furniture.json"),
  "builtin-nova-electronics": () => import("./theme-nova-electronics.json"),
};

export const builtinThemeCatalog: BuiltinThemeSummary[] = [
  {
    templateKey: "builtin-sooq-modern",
    templateName: "سوق مودرن",
    description:
      "قالب نظيف بخط IBM Plex وألوان تركواز — هيرو مقسوم، إحصائيات، بطاقات، معرض صور، فئات، منتجات مربوطة، وتواصل، مع صفحات كاملة ثنائية اللغة.",
    previewImageUrl:
      "https://placehold.co/400x250/0f766e/ffffff?text=%D8%B3%D9%88%D9%82+%D9%85%D9%88%D8%AF%D8%B1%D9%86",
  },
  {
    templateKey: "builtin-meridian-almarai",
    templateName: "ميريديان",
    description:
      "قالب بنفسجي ملوّن بخط المراعي — هيرو بصورة، مزايا، صفحة منتجات بالبحث والفئات، تفاصيل منتج، سلة، وتسجيل دخول.",
    previewImageUrl:
      "https://placehold.co/400x250/7c3aed/ffffff?text=%D9%85%D9%8A%D8%B1%D9%8A%D8%AF%D9%8A%D8%A7%D9%86",
  },
  {
    templateKey: "builtin-rawaq-furniture",
    templateName: "روّاق للأثاث",
    description:
      "قالب أثاث دافئ بخط المسيري وألوان الزيتوني والكتان والبنّي الداكن — واجهة بصورة، فئات بالشبكة، معرض غرف بالسلايدر، خامات، آراء، وبطاقة منتج مسطّحة بالسعر وزر مضغوط.",
    previewImageUrl:
      "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=400&h=250&q=70",
  },
  {
    templateKey: "builtin-nova-electronics",
    templateName: "نوفا للإلكترونيات",
    description:
      "قالب إلكترونيات داكن وعصري بخط IBM Plex Sans Arabic وألوان نيلية على خلفية داكنة — هيرو بصورة، شريط ثقة، فئات، عروض لفترة محدودة، منتجات مختارة، مزايا، معرض صور، وآراء عملاء.",
    previewImageUrl:
      "https://placehold.co/400x250/0b0f1a/4f6df5?text=%D9%86%D9%88%D9%81%D8%A7",
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
