/**
 * Registry-consistency suite (roadmap B-1).
 *
 * The block registry in `config/index.tsx` is the single source of truth
 * (the parallel server.tsx/rsc.tsx copies were dead code, removed in Phase B).
 * This spec keeps every consumer of block-type strings honest against it:
 * palette categories, section/zone presets, initial page data, and the static
 * theme fixtures.
 */
import fs from "node:fs";
import path from "node:path";

import { conf } from "../index";
import { initialData } from "../initial-data";
import {
  SECTION_PRESETS,
  ZONE_HEADER_PRESETS,
} from "../presets";
import { ZONE_FOOTER_PRESETS } from "../presets/footer";
import { ZONE_DRAWER_PRESETS } from "../presets/drawer";
import { ZONE_POPUP_PRESETS } from "../presets/popup";
import { ZONE_BOTTOM_SHEET_PRESETS } from "../presets/bottom-sheet";

const registeredTypes = new Set(Object.keys(conf.components));

/** Recursively collect every `{ type, props }` component node in a tree. */
const collectTypes = (value: unknown, sink: Set<string>): void => {
  if (Array.isArray(value)) {
    value.forEach((item) => collectTypes(item, sink));
    return;
  }
  if (typeof value !== "object" || value === null) return;

  const record = value as Record<string, unknown>;
  if (
    typeof record.type === "string" &&
    typeof record.props === "object" &&
    record.props !== null
  ) {
    sink.add(record.type);
  }
  Object.values(record).forEach((item) => collectTypes(item, sink));
};

const expectAllRegistered = (label: string, tree: unknown) => {
  const used = new Set<string>();
  collectTypes(tree, used);
  // `appBar` is the Flutter/export spelling on `page.appBar` — not a Puck palette type
  // (the editor block is registered as `AppBar`).
  const exportOnlyTypes = new Set(["appBar"]);
  const unknown = [...used].filter(
    (type) => !registeredTypes.has(type) && !exportOnlyTypes.has(type)
  );
  expect({ source: label, unknownTypes: unknown }).toEqual({
    source: label,
    unknownTypes: [],
  });
};

describe("palette categories", () => {
  it("only list registered component types", () => {
    const listed = Object.values(conf.categories ?? {}).flatMap(
      (category) => category.components ?? []
    );
    const unknown = listed.filter((type) => !registeredTypes.has(type as string));
    expect(unknown).toEqual([]);
  });

  it("every registered component has a render function", () => {
    Object.entries(conf.components).forEach(([type, definition]) => {
      expect({ type, hasRender: typeof definition.render === "function" }).toEqual(
        { type, hasRender: true }
      );
    });
  });
});

describe("section presets reference registered blocks", () => {
  SECTION_PRESETS.forEach((preset) => {
    it(`preset "${preset.id}"`, () => {
      expectAllRegistered(preset.id, preset.componentData);
    });
  });
});

describe("zone presets reference registered blocks", () => {
  [
    ...ZONE_HEADER_PRESETS,
    ...ZONE_FOOTER_PRESETS,
    ...ZONE_DRAWER_PRESETS,
    ...ZONE_POPUP_PRESETS,
    ...ZONE_BOTTOM_SHEET_PRESETS,
  ].forEach((preset) => {
    it(`zone preset "${preset.id}"`, () => {
      expectAllRegistered(preset.id, preset.componentData);
    });
  });
});

describe("initial page data references registered blocks", () => {
  Object.entries(initialData).forEach(([pagePath, pageData]) => {
    it(`page "${pagePath}"`, () => {
      expectAllRegistered(pagePath, pageData);
    });
  });
});

describe("theme fixtures reference registered blocks", () => {
  const themesDir = path.join(__dirname, "..", "..", "themes");
  fs.readdirSync(themesDir)
    .filter((file) => file.endsWith(".json"))
    .forEach((file) => {
      it(file, () => {
        const fixture = JSON.parse(
          fs.readFileSync(path.join(themesDir, file), "utf8")
        );
        expectAllRegistered(file, fixture);
      });
    });
});
