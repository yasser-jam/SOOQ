import React from "react";
import { render, fireEvent } from "@testing-library/react";
import { Render } from "@/core";
import conf from "../../index";
import { setActiveEditorMode } from "../editor-mode";
import { composePuckData, normalizeSiteData } from "../site-data";
import { ROOT_ZONE_FOOTER, ROOT_ZONE_HEADER } from "../../shell-zones";

const SHELL_SELECTOR =
  '[data-section-preset="zone-header"], [data-section-preset="zone-footer"]';

/** Mirrors the shape produced by the mobile editor: page.appBar + site.sidebar. */
const buildMobileSite = () =>
  normalizeSiteData({
    root: { props: { direction: "rtl", language: "ar" } },
    zones: { [ROOT_ZONE_HEADER]: [], [ROOT_ZONE_FOOTER]: [] },
    pages: [
      {
        path: "/",
        slug: "/",
        name: "Home",
        link: "/",
        content: [
          {
            type: "ContentHeading",
            props: { id: "Heading-page", text: { ar: "محتوى الصفحة", en: "Page" } },
          },
        ],
        appBar: {
          id: "home-appbar",
          type: "appBar",
          props: { title: "روّاق", elevation: 0, height: 56, showMenu: true },
        },
      },
    ],
    sidebar: {
      type: "Sidebar",
      props: {
        id: "Sidebar-site",
        title: { ar: "القائمة", en: "Menu" },
        showTitle: true,
        dock: "right",
        dockOffsetTop: "56px",
        width: "medium",
        backgroundColor: "surface",
        showOnMobile: "always",
        items: [
          {
            type: "ContentHeading",
            props: { id: "Heading-drawer", text: { ar: "روّاق", en: "RAWAQ" } },
          },
        ],
      },
    },
  } as any);

const renderMobileHome = () => {
  const data = composePuckData(buildMobileSite(), "/") as any;
  return render(
    <Render
      config={conf as any}
      data={data}
      metadata={{ editorMode: "mobile" } as any}
    />
  );
};

describe("mobile shell renders app chrome only", () => {
  beforeEach(() => {
    setActiveEditorMode("mobile");
  });

  afterEach(() => {
    setActiveEditorMode("desktop");
  });

  it("renders the AppBar and no header/footer zones", () => {
    const { container } = renderMobileHome();

    expect(container.querySelector("[data-sooq-appbar]")).not.toBeNull();
    expect(container.querySelectorAll(SHELL_SELECTOR)).toHaveLength(0);
  });

  it("keeps the sidebar closed until the AppBar menu opens it", () => {
    const { container, baseElement } = renderMobileHome();

    const panel = baseElement.querySelector("[data-sooq-mobile-sidebar-panel]");
    expect(panel).not.toBeNull();
    expect(panel?.getAttribute("aria-hidden")).toBe("true");

    const menuButton = container.querySelector<HTMLButtonElement>(
      '[data-sooq-appbar] button[aria-label="القائمة"]'
    );
    expect(menuButton).not.toBeNull();

    fireEvent.click(menuButton!);
    expect(panel?.getAttribute("aria-hidden")).toBe("false");

    fireEvent.click(
      baseElement.querySelector<HTMLButtonElement>(
        '[data-sooq-mobile-sidebar-panel] button[aria-label="إغلاق"]'
      )!
    );
    expect(panel?.getAttribute("aria-hidden")).toBe("true");
  });

  it("does not pin the sidebar over the page content", () => {
    const { container } = renderMobileHome();

    // The old behaviour rendered `<aside data-dock="right">` inline in the page.
    expect(container.querySelector('aside[data-dock="right"]')).toBeNull();
  });
});
