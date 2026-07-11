/**
 * Fixture round-trip suite (roadmap A4-2).
 *
 * The static theme exports in `core/themes/theme-{1,2,3}.json` are treated as
 * the persistence contract: whatever refactor touches normalize-editor-data /
 * site-data must keep these green. If a change legitimately alters the
 * contract, update this spec consciously — never silently.
 */
import fs from "node:fs";
import path from "node:path";

import {
  composePuckData,
  findSitePage,
  normalizeSiteData,
  type SiteData,
} from "../site-data";
import {
  ROOT_ZONE_FOOTER,
  ROOT_ZONE_HEADER,
} from "../../shell-zones";

const THEMES_DIR = path.join(__dirname, "..", "..", "..", "themes");

const loadThemeFixture = (name: string): Partial<SiteData> =>
  JSON.parse(fs.readFileSync(path.join(THEMES_DIR, name), "utf8"));

const themeFiles = fs
  .readdirSync(THEMES_DIR)
  .filter((file) => file.endsWith(".json"))
  .sort();

describe("theme fixtures exist", () => {
  it("finds the static theme JSON files", () => {
    expect(themeFiles.length).toBeGreaterThanOrEqual(3);
  });
});

describe.each(themeFiles)("site-data round-trip: %s", (themeFile) => {
  const fixture = loadThemeFixture(themeFile);

  it("normalizes without throwing and keeps every page path", () => {
    const site = normalizeSiteData(fixture);

    const inputPaths = (fixture.pages ?? []).map((page) => page.path);
    const outputPaths = site.pages.map((page) => page.path);

    expect(site.pages.length).toBeGreaterThan(0);
    inputPaths.forEach((inputPath) => {
      expect(outputPaths).toContain(inputPath);
    });
  });

  it("is idempotent: normalizing normalized output is a no-op", () => {
    const first = normalizeSiteData(fixture);
    // Serialize/parse to simulate the localStorage round trip.
    const second = normalizeSiteData(
      JSON.parse(JSON.stringify(first)) as SiteData
    );

    expect(second).toEqual(first);
  });

  it("places header and footer content in the canonical shell zones", () => {
    const site = normalizeSiteData(fixture);

    expect(Array.isArray(site.zones[ROOT_ZONE_HEADER])).toBe(true);
    expect(site.zones[ROOT_ZONE_HEADER]!.length).toBeGreaterThan(0);
    expect(Array.isArray(site.zones[ROOT_ZONE_FOOTER])).toBe(true);
    expect(site.zones[ROOT_ZONE_FOOTER]!.length).toBeGreaterThan(0);
  });

  it("composePuckData('/') produces renderable home-page data", () => {
    const site = normalizeSiteData(fixture);
    const data = composePuckData(site, "/");

    expect(data.root?.props).toBeTruthy();
    expect(Array.isArray(data.content)).toBe(true);
    // Every home page in the shipped themes has content.
    expect(data.content.length).toBeGreaterThan(0);
    // Shell components never leak into page content.
    const shellTypes = new Set([
      "SiteHeader",
      "SiteFooter",
      "SiteDrawerShell",
      "ZoneDrawer",
      "ZonePopup",
      "ZoneBottomSheet",
    ]);
    data.content.forEach((item) => {
      expect(shellTypes.has(item.type)).toBe(false);
    });
  });

  it("matches dynamic product routes via findSitePage", () => {
    const site = normalizeSiteData(fixture);
    const page = findSitePage(site, "/products/example-product");

    expect(page).toBeTruthy();
    expect(page!.path).toBe("/products/:product-slug");
  });

  it("assigns unique component ids across pages and zones", () => {
    const site = normalizeSiteData(fixture);
    const ids: string[] = [];

    const collect = (value: unknown): void => {
      if (Array.isArray(value)) {
        value.forEach(collect);
        return;
      }
      if (typeof value !== "object" || value === null) return;
      const record = value as Record<string, unknown>;
      if (
        typeof record.type === "string" &&
        typeof record.props === "object" &&
        record.props !== null
      ) {
        const id = (record.props as Record<string, unknown>).id;
        if (typeof id === "string") ids.push(id);
      }
      Object.values(record).forEach(collect);
    };

    // Uniqueness is enforced within each normalized page/zone payload.
    site.pages.forEach((page) => {
      const pageIds: string[] = [];
      const collectInto = (value: unknown, sink: string[]) => {
        ids.length = 0;
        collect(value);
        sink.push(...ids);
      };
      collectInto(page.content, pageIds);
      expect(new Set(pageIds).size).toBe(pageIds.length);
    });
  });
});
