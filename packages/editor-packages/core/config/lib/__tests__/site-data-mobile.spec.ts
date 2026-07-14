import {
  getSiteStorageKey,
  readSiteData,
  seedMobileSiteFromDesktop,
  writeSiteData,
  normalizeSiteData,
  type SiteData,
} from "../site-data";
import { setActiveEditorMode } from "../editor-mode";

const desktopFixture: SiteData = normalizeSiteData({
  root: { props: { direction: "rtl", language: "ar", primary: "#111111" } },
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
          props: { id: "h1", text: "Desktop title" },
        },
      ],
    },
  ],
});

describe("mobile site storage (M1)", () => {
  beforeEach(() => {
    window.localStorage.clear();
    setActiveEditorMode("desktop");
  });

  it("uses separate storage keys for desktop and mobile", () => {
    expect(getSiteStorageKey("desktop")).toBe("puck-demo:v1:site");
    expect(getSiteStorageKey("mobile")).toBe("puck-demo:v1:site:mobile");
  });

  it("seeds mobile site from desktop on first read", () => {
    writeSiteData(desktopFixture, "desktop");

    const mobile = readSiteData("mobile");

    expect(mobile.pages[0]?.content?.[0]?.props?.text).toBe("Desktop title");
    expect(window.localStorage.getItem(getSiteStorageKey("mobile"))).not.toBeNull();
  });

  it("keeps desktop and mobile sites independent after seeding", () => {
    writeSiteData(desktopFixture, "desktop");
    const mobileSeed = readSiteData("mobile");

    const mobileOnly = normalizeSiteData({
      ...mobileSeed,
      pages: mobileSeed.pages.map((page) =>
        page.path === "/"
          ? {
              ...page,
              content: [
                {
                  type: "ContentHeading",
                  props: { id: "h1", text: "Mobile title" },
                },
              ],
            }
          : page
      ),
    });

    writeSiteData(mobileOnly, "mobile");

    const desktop = readSiteData("desktop");
    const mobile = readSiteData("mobile");

    expect(desktop.pages[0]?.content?.[0]?.props?.text).toBe("Desktop title");
    expect(mobile.pages[0]?.content?.[0]?.props?.text).toBe("Mobile title");
  });

  it("seedMobileSiteFromDesktop writes a deep copy", () => {
    writeSiteData(desktopFixture, "desktop");

    const seeded = seedMobileSiteFromDesktop();
    seeded.pages[0]!.content![0]!.props!.text = "Mutated";

    const desktop = readSiteData("desktop");
    expect(desktop.pages[0]?.content?.[0]?.props?.text).toBe("Desktop title");
  });

  it("readSiteData without mode follows setActiveEditorMode", () => {
    writeSiteData(desktopFixture, "desktop");
    readSiteData("mobile");

    setActiveEditorMode("mobile");
    const viaActive = readSiteData();
    expect(viaActive.pages[0]?.content?.[0]?.props?.text).toBe("Desktop title");

    setActiveEditorMode("desktop");
    writeSiteData(
      normalizeSiteData({
        ...desktopFixture,
        pages: desktopFixture.pages.map((page) => ({
          ...page,
          content: [
            {
              type: "ContentHeading",
              props: { id: "h1", text: "Desktop updated" },
            },
          ],
        })),
      }),
      "desktop"
    );

    setActiveEditorMode("mobile");
    const mobileStill = readSiteData();
    expect(mobileStill.pages[0]?.content?.[0]?.props?.text).toBe("Desktop title");
  });
});
