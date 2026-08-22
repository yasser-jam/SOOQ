/**
 * `removeSitePage` is the only destructive page operation in site-data, and the
 * pages panel wires it straight to a delete button — so the "built-in pages are
 * never removable" guard needs to stay green.
 */
import {
  addSitePage,
  buildInitialSiteData,
  normalizeSiteData,
  removeSitePage,
  type SiteData,
} from "../site-data";
import { setActiveEditorMode } from "../editor-mode";

const withCustomPage = (path: string, name = "صفحة مخصصة"): SiteData =>
  addSitePage(buildInitialSiteData(), {
    path,
    name,
    link: path,
    isCustom: true,
  });

describe("removeSitePage", () => {
  it("removes a merchant-created page", () => {
    const site = withCustomPage("/about-us");
    expect(site.pages.map((page) => page.path)).toContain("/about-us");

    const next = removeSitePage(site, "/about-us");

    expect(next.pages.map((page) => page.path)).not.toContain("/about-us");
    expect(next.pages.length).toBe(site.pages.length - 1);
  });

  it("normalizes the path before matching", () => {
    const site = withCustomPage("/about-us");

    // Trailing slash + missing leading slash both normalize to "/about-us".
    expect(
      removeSitePage(site, "/about-us/").pages.map((page) => page.path)
    ).not.toContain("/about-us");
    expect(
      removeSitePage(site, "about-us").pages.map((page) => page.path)
    ).not.toContain("/about-us");
  });

  it("refuses to remove built-in pages", () => {
    const site = buildInitialSiteData();

    for (const builtinPath of ["/", "/cart", "/products/:product-slug"]) {
      const next = removeSitePage(site, builtinPath);
      expect(next).toBe(site);
      expect(next.pages.map((page) => page.path)).toContain(builtinPath);
    }
  });

  it("returns the same reference for an unknown path", () => {
    const site = buildInitialSiteData();
    expect(removeSitePage(site, "/nope")).toBe(site);
  });

  it("leaves the other pages untouched", () => {
    const site = addSitePage(withCustomPage("/about-us"), {
      path: "/contact",
      name: "اتصل بنا",
      link: "/contact",
      isCustom: true,
    });

    const next = removeSitePage(site, "/about-us");
    const paths = next.pages.map((page) => page.path);

    expect(paths).toContain("/contact");
    expect(paths).toContain("/");
  });
});

describe("the mandatory splash page (mobile mode only)", () => {
  afterEach(() => setActiveEditorMode("desktop"));

  it("is always present once normalized in mobile mode, even starting from a page list with none", () => {
    setActiveEditorMode("mobile");
    const site = normalizeSiteData({ root: { props: {} }, pages: [{ path: "/", name: "Home", link: "/" }] });

    const splash = site.pages.find((page) => page.path === "/splash");
    expect(splash).toBeDefined();
    expect(splash?.isCustom).toBe(false);
    expect(splash?.fullScreen).toBe(true);
    expect(splash?.content).toEqual([
      expect.objectContaining({ type: "SplashHero" }),
    ]);
  });

  it("is absent in desktop mode", () => {
    const site = normalizeSiteData({ root: { props: {} }, pages: [{ path: "/", name: "Home", link: "/" }] }, "desktop");
    expect(site.pages.find((page) => page.path === "/splash")).toBeUndefined();
  });

  it("cannot be removed", () => {
    setActiveEditorMode("mobile");
    const site = normalizeSiteData({ root: { props: {} }, pages: [{ path: "/", name: "Home", link: "/" }] });

    const next = removeSitePage(site, "/splash");
    expect(next.pages.some((page) => page.path === "/splash")).toBe(true);
  });

  it("keeps only the authored image and colours; every other prop is reset to the fixed default", () => {
    setActiveEditorMode("mobile");
    const tampered = normalizeSiteData({
      root: { props: {} },
      pages: [
        { path: "/", name: "Home", link: "/" },
        {
          path: "/splash",
          name: "شاشة البداية",
          link: "/splash",
          fullScreen: true,
          content: [
            {
              type: "SplashHero",
              props: {
                image: "https://cdn.example.com/uploads/custom.png",
                background: "#000000",
                decorColor: "#111111",
                accentColor: "#222222",
                headlineColor: "#333333",
                buttonColor: "#444444",
                buttonTextColor: "#555555",
                // Attempted tampering with locked props:
                headline: "hacked headline",
                buttonLabel: "hacked button",
                icons: [{ name: "star", color: "#fff" }],
                tap: { type: "navigate", route: "/hacked", navigation_type: "push" },
              },
            },
          ],
        },
      ],
    });

    const splashProps = (tampered.pages.find((p) => p.path === "/splash")?.content?.[0] as any)?.props;

    // Editable fields survive.
    expect(splashProps.image).toBe("https://cdn.example.com/uploads/custom.png");
    expect(splashProps.background).toBe("#000000");
    expect(splashProps.buttonTextColor).toBe("#555555");

    // Locked fields are reset to the fixed default regardless of the authored payload.
    expect(splashProps.headline).toBe("تسوق.. اختر, واستلم");
    expect(splashProps.buttonLabel).toBe("ابدأ الآن");
    expect(splashProps.tap).toEqual({ type: "navigate", route: "/home", navigation_type: "clear_stack" });
    expect(splashProps.icons).toHaveLength(6);
    expect(splashProps.icons[0]).toEqual({ name: "shopping_cart", color: "#12244A" });
  });
});
