/**
 * `removeSitePage` is the only destructive page operation in site-data, and the
 * pages panel wires it straight to a delete button — so the "built-in pages are
 * never removable" guard needs to stay green.
 */
import {
  addSitePage,
  buildInitialSiteData,
  removeSitePage,
  type SiteData,
} from "../site-data";

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
