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

const readHeadingText = (site: SiteData, pageIndex = 0): string => {
  const text = site.pages[pageIndex]?.content?.[0]?.props?.text;
  if (typeof text === "string") return text;
  if (text && typeof text === "object" && "ar" in (text as object)) {
    return String((text as { ar?: string }).ar ?? "");
  }
  return "";
};

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

    expect(readHeadingText(mobile)).toBe("Desktop title");
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

    expect(readHeadingText(desktop)).toBe("Desktop title");
    expect(readHeadingText(mobile)).toBe("Mobile title");
  });

  it("seedMobileSiteFromDesktop writes a deep copy", () => {
    writeSiteData(desktopFixture, "desktop");

    const seeded = seedMobileSiteFromDesktop();
    const first = seeded.pages[0]!.content![0]!;
    first.props = { ...first.props, text: "Mutated" };

    const desktop = readSiteData("desktop");
    expect(readHeadingText(desktop)).toBe("Desktop title");
  });

  it("readSiteData without mode follows setActiveEditorMode", () => {
    writeSiteData(desktopFixture, "desktop");
    readSiteData("mobile");

    setActiveEditorMode("mobile");
    const viaActive = readSiteData();
    expect(readHeadingText(viaActive)).toBe("Desktop title");

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
    expect(readHeadingText(mobileStill)).toBe("Desktop title");
  });
});

describe("mobile appBar + sidebar (compose/save)", () => {
  beforeEach(() => {
    window.localStorage.clear();
    setActiveEditorMode("mobile");
  });

  it("persists page.appBar and site.sidebar from puck content on save", () => {
    const {
      applyPuckSave,
      composePuckData,
    } = require("../site-data") as typeof import("../site-data");

    const site = normalizeSiteData({
      root: { props: {} },
      zones: {},
      pages: [
        {
          path: "/",
          slug: "/",
          name: "Home",
          link: "/",
          content: [],
          appBar: {},
        },
      ],
      sidebar: {},
    });

    const saved = applyPuckSave(site, "/", {
      root: { props: { title: "Home" } },
      content: [
        {
          type: "AppBar",
          props: {
            id: "home-appbar",
            title: "SOOQ",
            elevation: 0,
            height: 56,
            showMenu: true,
            menuIcon: "menu",
            showNotifications: true,
            showCartIcon: false,
            foregroundColor: "#0F172A",
            backgroundColor: "#FFFFFF",
          },
        },
        {
          type: "Sidebar",
          props: {
            id: "Sidebar-site",
            title: { ar: "القائمة", en: "Menu" },
            showTitle: true,
            dock: "right",
            dockOffsetTop: "56px",
            width: "medium",
            stickyTop: "",
            borderStyle: "none",
            backgroundColor: "surface",
            showOnMobile: "always",
            items: [],
          },
        },
        {
          type: "ContentHeading",
          props: { id: "h1", text: "Hello" },
        },
      ],
      zones: {},
    } as any);

    expect(saved.pages[0]?.appBar).toMatchObject({
      type: "appBar",
      props: {
        title: "SOOQ",
        showMenu: true,
        menuAction: { type: "openDrawer" },
        trailingIcon: "notifications",
      },
      style: { background: "#FFFFFF" },
    });
    expect(saved.sidebar).toMatchObject({ type: "Sidebar" });
    expect(saved.pages[0]?.content?.some((c) => c.type === "AppBar")).toBe(
      false
    );
    expect(saved.pages[0]?.content?.[0]?.type).toBe("ContentHeading");

    const composed = composePuckData(saved, "/");
    expect(composed.content?.[0]?.type).toBe("AppBar");
    expect(composed.content?.[1]?.type).toBe("Sidebar");
  });

  it("keeps a full-screen page free of app bar, sidebar and site chrome", () => {
    const {
      addSitePage,
      applyPuckSave,
      composePuckData,
    } = require("../site-data") as typeof import("../site-data");

    const withSidebar = normalizeSiteData({
      root: { props: {} },
      zones: {},
      pages: [{ path: "/", slug: "/", name: "Home", link: "/", content: [] }],
      sidebar: {
        type: "Sidebar",
        props: { id: "Sidebar-site", items: [] },
      },
    });

    const site = addSitePage(
      withSidebar,
      {
        path: "/splash",
        name: "شاشة البداية",
        link: "/splash",
        isCustom: true,
        fullScreen: true,
      },
      [{ type: "Section", props: { id: "Section-splash", content: [] } }] as any
    );

    const splash = site.pages.find((page) => page.path === "/splash");
    expect(splash?.fullScreen).toBe(true);
    expect(splash?.appBar).toEqual({});

    // Neither shell block is composed in, and Root is told to drop the
    // header/footer zones.
    const composed = composePuckData(site, "/splash");
    expect(composed.content?.some((item) => item.type === "AppBar")).toBe(false);
    expect(composed.content?.some((item) => item.type === "Sidebar")).toBe(
      false
    );
    expect(composed.root?.props?.pageFullScreen).toBe(true);

    // Saving a page that never showed the sidebar must not clear it, and a
    // stray AppBar dropped onto the page is discarded rather than persisted.
    const saved = applyPuckSave(site, "/splash", {
      root: { props: { title: "شاشة البداية" } },
      content: [
        { type: "AppBar", props: { id: "stray-appbar", title: "SOOQ" } },
        { type: "Section", props: { id: "Section-splash", content: [] } },
      ],
      zones: {},
    } as any);

    expect(saved.sidebar).toMatchObject({ type: "Sidebar" });
    expect(saved.pages.find((page) => page.path === "/splash")?.appBar).toEqual(
      {}
    );
    expect(
      saved.pages.find((page) => page.path === "/splash")?.fullScreen
    ).toBe(true);
    // The page-scoped flag never leaks into the site-wide theme root.
    expect(saved.root?.props?.pageFullScreen).toBeUndefined();
  });

  it("still composes the app bar on a normal mobile page", () => {
    const { composePuckData } =
      require("../site-data") as typeof import("../site-data");

    const site = normalizeSiteData({
      root: { props: {} },
      zones: {},
      pages: [
        {
          path: "/",
          slug: "/",
          name: "Home",
          link: "/",
          content: [],
          appBar: { type: "appBar", props: { title: "SOOQ" } },
        },
      ],
    });

    const composed = composePuckData(site, "/");
    expect(composed.content?.[0]?.type).toBe("AppBar");
    expect(composed.root?.props?.pageFullScreen).toBe(false);
  });

  it("migrates ZoneDrawer to sidebar on mobile seed", () => {
    const {
      migrateMobileDrawerToSidebar,
      writeSiteData,
      seedMobileSiteFromDesktop,
      getSiteStorageKey,
    } = require("../site-data") as typeof import("../site-data");

    setActiveEditorMode("desktop");
    writeSiteData(
      normalizeSiteData({
        root: { props: {} },
        zones: {
          "root:zone-drawer": [
            {
              type: "ZoneDrawer",
              props: {
                id: "ZoneDrawer-site",
                side: "right",
                slot: [
                  {
                    type: "ContentHeading",
                    props: { id: "h", text: "Menu" },
                  },
                ],
              },
            },
          ],
        },
        pages: [
          {
            path: "/",
            slug: "/",
            name: "Home",
            link: "/",
            content: [],
          },
        ],
      }),
      "desktop"
    );

    window.localStorage.removeItem(getSiteStorageKey("mobile"));
    const mobile = seedMobileSiteFromDesktop();

    expect(mobile.sidebar).toMatchObject({ type: "Sidebar" });
    expect(mobile.zones?.["root:zone-drawer"]).toBeUndefined();
    expect(
      migrateMobileDrawerToSidebar(mobile).sidebar?.type === "Sidebar" ||
        Object.keys(mobile.sidebar ?? {}).length === 0
    ).toBe(true);
  });
});
