import React from "react";
import { render, screen } from "@testing-library/react";
import { Render } from "@/core";
import conf from "../../index";
import { setActiveEditorMode } from "../editor-mode";
import { addSitePage, composePuckData, normalizeSiteData } from "../site-data";
import { createSplashPageContent } from "../../presets/splash-page";
import { ROOT_ZONE_FOOTER, ROOT_ZONE_HEADER } from "../../shell-zones";

// `normalizeSiteData` seeds the shell zones with the default header/footer
// presets, which tag their `<section>` with `data-section-preset`.
const SHELL_SELECTOR =
  '[data-section-preset="zone-header"], [data-section-preset="zone-footer"]';

const buildSite = () =>
  addSitePage(
    normalizeSiteData({
      root: { props: {} },
      zones: { [ROOT_ZONE_HEADER]: [], [ROOT_ZONE_FOOTER]: [] },
      pages: [{ path: "/", slug: "/", name: "Home", link: "/", content: [] }],
    } as any),
    {
      path: "/splash",
      name: "شاشة البداية",
      link: "/splash",
      isCustom: true,
      fullScreen: true,
    },
    createSplashPageContent() as any
  );

describe("splash page renders chrome-less", () => {
  beforeEach(() => {
    setActiveEditorMode("mobile");
  });

  afterEach(() => {
    setActiveEditorMode("desktop");
  });

  it("renders the image, headline and CTA without header/footer zones", () => {
    const site = buildSite();

    const { container } = render(
      <Render config={conf as any} data={composePuckData(site, "/splash") as any} />
    );

    expect(screen.getByText("تسوق.. اختر, واستلم")).toBeTruthy();
    expect(screen.getByText("ابدأ الآن")).toBeTruthy();

    expect(container.querySelectorAll(SHELL_SELECTOR)).toHaveLength(0);
  });

  // The mobile shell is AppBar + Sidebar drawer; the header/footer bands are
  // desktop-only, so they stay out of every mobile page — full-screen or not.
  it("drops the shell zones on a normal page too in mobile mode", () => {
    const site = buildSite();

    const { container } = render(
      <Render config={conf as any} data={composePuckData(site, "/") as any} />
    );

    expect(container.querySelectorAll(SHELL_SELECTOR)).toHaveLength(0);
  });

  it("still renders the shell zones on a normal desktop page", () => {
    const site = buildSite();
    setActiveEditorMode("desktop");

    const { container } = render(
      <Render config={conf as any} data={composePuckData(site, "/") as any} />
    );

    expect(container.querySelectorAll(SHELL_SELECTOR).length).toBeGreaterThan(0);
  });
});
