import {
  normalizeSiteData,
  readSiteData,
  writeSiteData,
  type SiteData,
} from "../site-data";
import {
  resetMobileSiteFromDesktop,
  syncMobilePageFromDesktop,
  syncMobileThemeFromDesktop,
} from "../mobile-sync";

const desktopFixture: SiteData = normalizeSiteData({
  root: {
    props: {
      direction: "rtl",
      language: "ar",
      primary: "#111111",
      fontFamily: "Cairo",
    },
  },
  zones: { header: [] },
  pages: [
    {
      path: "/",
      slug: "/",
      name: "Home",
      link: "/",
      content: [
        {
          type: "ContentHeading",
          props: { id: "h1", text: "Desktop title" },
        },
      ],
    },
    {
      path: "/about",
      slug: "/about",
      name: "About",
      link: "/about",
      content: [
        {
          type: "ContentHeading",
          props: { id: "h2", text: "Desktop about" },
        },
      ],
    },
  ],
});

const mobileFixture: SiteData = normalizeSiteData({
  root: { props: { direction: "rtl", language: "ar", primary: "#222222" } },
  zones: { footer: [] },
  pages: [
    {
      path: "/",
      slug: "/",
      name: "Home",
      link: "/",
      content: [
        {
          type: "ContentHeading",
          props: { id: "h1", text: "Mobile title" },
        },
      ],
    },
    {
      path: "/about",
      slug: "/about",
      name: "About",
      link: "/about",
      content: [
        {
          type: "ContentHeading",
          props: { id: "h2", text: "Mobile about" },
        },
      ],
    },
  ],
});

describe("mobile sync helpers (M4)", () => {
  let mobileZonesBeforeSync: SiteData["zones"];

  beforeEach(() => {
    window.localStorage.clear();
    writeSiteData(desktopFixture, "desktop");
    writeSiteData(mobileFixture, "mobile");
    mobileZonesBeforeSync = readSiteData("mobile").zones;
  });

  it("syncMobilePageFromDesktop copies only the requested page content", () => {
    syncMobilePageFromDesktop("/about");

    const mobile = readSiteData("mobile");

    expect(mobile.pages[0]?.content?.[0]?.props?.text).toBe("Mobile title");
    expect(mobile.pages[1]?.content?.[0]?.props?.text).toBe("Desktop about");
    expect(mobile.zones).toEqual(mobileZonesBeforeSync);
  });

  it("syncMobileThemeFromDesktop copies root props without touching pages", () => {
    syncMobileThemeFromDesktop();

    const mobile = readSiteData("mobile");

    expect(mobile.root?.props?.primary).toBe("#111111");
    expect(mobile.root?.props?.fontFamily).toBe("Cairo");
    expect(mobile.pages[0]?.content?.[0]?.props?.text).toBe("Mobile title");
    expect(mobile.pages[1]?.content?.[0]?.props?.text).toBe("Mobile about");
    expect(mobile.zones).toEqual(mobileZonesBeforeSync);
  });

  it("resetMobileSiteFromDesktop replaces the entire mobile site", () => {
    resetMobileSiteFromDesktop();

    const mobile = readSiteData("mobile");
    const desktop = readSiteData("desktop");

    expect(mobile.root?.props?.primary).toBe("#111111");
    expect(mobile.pages[0]?.content?.[0]?.props?.text).toBe("Desktop title");
    expect(mobile.pages[1]?.content?.[0]?.props?.text).toBe("Desktop about");
    expect(mobile.pages).toEqual(desktop.pages);
  });
});
