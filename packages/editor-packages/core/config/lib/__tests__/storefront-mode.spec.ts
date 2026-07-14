import {
  getSiteStorageKey,
  hasMobileSiteData,
  readSiteData,
  readStorefrontSiteData,
  resolveStorefrontMode,
  writeSiteData,
  normalizeSiteData,
  type SiteData,
} from "../site-data";

const desktopFixture: SiteData = normalizeSiteData({
  root: { props: { breakpointMobileMax: 600 } },
  zones: {},
  pages: [
    {
      path: "/",
      slug: "/",
      name: "Home",
      link: "/",
      content: [],
    },
  ],
});

const mobileFixture: SiteData = normalizeSiteData({
  root: { props: { breakpointMobileMax: 600 } },
  zones: {},
  pages: [
    {
      path: "/",
      slug: "/",
      name: "Home",
      link: "/",
      content: [
        {
          type: "ContentHeading",
          props: { id: "m1", text: "Mobile only" },
        },
      ],
    },
  ],
});

describe("resolveStorefrontMode (M3)", () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    window.localStorage.clear();
    writeSiteData(desktopFixture, "desktop");
    writeSiteData(mobileFixture, "mobile");
    window.history.replaceState({}, "", "/");
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it("returns desktop when no mobile site exists", () => {
    window.localStorage.removeItem(getSiteStorageKey("mobile"));
    expect(resolveStorefrontMode()).toBe("desktop");
  });

  it("returns mobile for ?mode=mobile when mobile site exists", () => {
    window.history.replaceState({}, "", "/?mode=mobile");
    expect(resolveStorefrontMode()).toBe("mobile");
  });

  it("returns desktop for ?mode=mobile when mobile site is missing", () => {
    window.localStorage.removeItem(getSiteStorageKey("mobile"));
    window.history.replaceState({}, "", "/?mode=mobile");
    expect(resolveStorefrontMode()).toBe("desktop");
  });

  it("returns mobile when viewport is within breakpointMobileMax", () => {
    window.matchMedia = jest.fn().mockImplementation((query: string) => ({
      matches: query.includes("max-width"),
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    })) as typeof window.matchMedia;

    expect(resolveStorefrontMode()).toBe("mobile");
  });

  it("readStorefrontSiteData serves mobile JSON on narrow viewport", () => {
    window.matchMedia = jest.fn().mockImplementation((query: string) => ({
      matches: query.includes("max-width"),
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    })) as typeof window.matchMedia;

    const site = readStorefrontSiteData();
    expect(site.pages[0]?.content?.[0]?.props?.text).toBe("Mobile only");
  });

  it("hasMobileSiteData reflects storage presence", () => {
    expect(hasMobileSiteData()).toBe(true);
    window.localStorage.removeItem(getSiteStorageKey("mobile"));
    expect(hasMobileSiteData()).toBe(false);
  });
});
