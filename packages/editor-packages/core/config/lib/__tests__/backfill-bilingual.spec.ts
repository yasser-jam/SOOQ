import {
  backfillEmptyBilingual,
  needsBilingualBackfill,
} from "../backfill-bilingual";
import type { SiteData } from "../site-data";

const makeSite = (en: string): SiteData =>
  ({
    root: { props: { title: { ar: "ميريديان", en } } },
    zones: {},
    pages: [
      {
        path: "/",
        slug: "/",
        name: { ar: "الرئيسية", en },
        link: "/",
        title: { ar: "الرئيسية", en },
        description: { ar: "وصف", en },
        content: [
          {
            type: "ContentHeading",
            props: {
              id: "Heading-hero-title",
              text: { ar: "أناقة تصل إلى بابك", en },
            },
          },
        ],
      },
    ],
  }) as SiteData;

describe("backfillEmptyBilingual", () => {
  it("detects sites that need an EN backfill", () => {
    expect(needsBilingualBackfill(makeSite(""))).toBe(true);
    expect(needsBilingualBackfill(makeSite("Home"))).toBe(false);
  });

  it("copies EN from the builtin source by matching block ids", () => {
    const draft = makeSite("");
    const builtin = makeSite("Elegance delivered to your door");
    builtin.pages[0]!.name = { ar: "الرئيسية", en: "Home" };
    builtin.pages[0]!.title = { ar: "الرئيسية", en: "Home" };
    builtin.pages[0]!.description = { ar: "وصف", en: "Description" };
    builtin.root!.props!.title = { ar: "ميريديان", en: "Meridian" };

    const { site, filledCount } = backfillEmptyBilingual(draft, builtin);

    expect(filledCount).toBeGreaterThan(0);
    expect(site.pages[0]!.content[0]!.props.text).toEqual({
      ar: "أناقة تصل إلى بابك",
      en: "Elegance delivered to your door",
    });
    expect(site.pages[0]!.name).toEqual({ ar: "الرئيسية", en: "Home" });
  });
});
