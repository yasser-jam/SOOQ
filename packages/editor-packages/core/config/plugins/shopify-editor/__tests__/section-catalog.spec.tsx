/**
 * D-8: every Add Section catalog preset must insert cleanly — fully formed,
 * serializable, made only of registered blocks, and stable through the Site
 * JSON normalize pipeline. Extends the B-1 registry-consistency suite to the
 * shopify-editor catalog (the primary add-section flow since D-1).
 */
import {
  sectionCatalog,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  assertSerializable,
} from "../section-catalog";
import { conf } from "../../../index";
import {
  normalizeSiteData,
  composePuckData,
  type SiteData,
} from "../../../lib/site-data";

const registeredTypes = new Set(Object.keys(conf.components));

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

// The products-grid preset takes a collection param from the configure step.
const buildParams: Record<string, Record<string, unknown>> = {
  "products-grid": {
    collection: {
      id: "c-1",
      name: "مجموعة تجريبية",
      slug: "featured",
      productCount: 4,
    },
    collectionName: "مجموعة تجريبية",
  },
};

const buildPreset = (preset: (typeof sectionCatalog)[number]) =>
  preset.build(buildParams[preset.id]);

describe("section catalog (D-1/D-8)", () => {
  it("has presets with unique, stable ids", () => {
    const ids = sectionCatalog.map((preset) => preset.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBeGreaterThanOrEqual(14);
  });

  it("every category used is labeled and ordered", () => {
    for (const preset of sectionCatalog) {
      expect(CATEGORY_LABELS[preset.category]).toBeTruthy();
      expect(CATEGORY_ORDER).toContain(preset.category);
    }
  });

  it("labels and descriptions are Arabic (merchant-facing)", () => {
    const arabic = /[؀-ۿ]/;
    for (const preset of sectionCatalog) {
      expect({ id: preset.id, label: preset.label }).toEqual(
        expect.objectContaining({ label: expect.stringMatching(arabic) })
      );
      expect({ id: preset.id, description: preset.description }).toEqual(
        expect.objectContaining({
          description: expect.stringMatching(arabic),
        })
      );
    }
  });

  describe.each(sectionCatalog.map((preset) => [preset.id, preset] as const))(
    "preset %s",
    (_id, preset) => {
      it("builds a JSON-serializable payload", () => {
        expect(() => assertSerializable(preset)).not.toThrow();
      });

      it("wraps itself in a Section (root DropZone contract)", () => {
        expect(buildPreset(preset).type).toBe("Section");
      });

      it("references only registered block types", () => {
        const used = new Set<string>();
        collectTypes(buildPreset(preset), used);

        const unknown = [...used].filter((type) => !registeredTypes.has(type));
        expect(unknown).toEqual([]);
      });

      it("survives the Site JSON normalize pipeline idempotently", () => {
        const site: SiteData = normalizeSiteData({
          pages: [
            {
              path: "/",
              name: "Home",
              content: [buildPreset(preset)],
            },
          ],
        } as unknown as Partial<SiteData>);

        const again = normalizeSiteData(
          JSON.parse(JSON.stringify(site)) as SiteData
        );
        expect(again.pages[0]?.content).toEqual(site.pages[0]?.content);

        const composed = composePuckData(site, "/");
        const types = new Set<string>();
        collectTypes(composed.content, types);
        expect(types.has("Section")).toBe(true);
      });
    }
  );
});
