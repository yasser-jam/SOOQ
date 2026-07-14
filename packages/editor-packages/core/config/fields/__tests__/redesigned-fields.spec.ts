import {
  buildSwatches,
  describeColorValue,
  colorLuminance,
} from "../ThemeColorField";
import {
  resolveSpacingScale,
  matchSpacingLevel,
} from "../SpacingField";
import {
  parseOverlayValue,
  formatOverlayValue,
  hexToRgb,
} from "../OverlayField";
import { clampColumns } from "../ColumnsField";
import {
  resolveFieldGroup,
  groupFieldNames,
  FIELD_GROUP_ORDER,
  FIELD_GROUP_LABELS,
  FIELD_GROUP_COLORS,
} from "../../../components/Puck/components/Fields/field-groups";
import { DEFAULT_COLORS, DEFAULT_SPACING_SCALE } from "../../theme";

describe("ThemeColorField helpers", () => {
  it("builds theme swatches from root props with defaults as fallback", () => {
    const swatches = buildSwatches({ primary: "#ff0000" }, "hex", false);
    const primary = swatches.find((s) => s.name === "أساسي")!;
    expect(primary.hex).toBe("#ff0000");
    expect(primary.store).toBe("#ff0000");

    const surface = swatches.find((s) => s.name === "سطح")!;
    expect(surface.hex).toBe(DEFAULT_COLORS.surface);

    // white always present; transparent only when allowed in hex mode
    expect(swatches.some((s) => s.store === "#ffffff")).toBe(true);
    expect(swatches.some((s) => s.store === "transparent")).toBe(false);
  });

  it("stores theme refs in theme-ref mode and includes transparent when allowed", () => {
    const refs = buildSwatches(undefined, "theme-ref", false);
    expect(refs.find((s) => s.name === "أساسي")!.store).toBe("theme-primary");

    const withTransparent = buildSwatches(undefined, "hex", true);
    expect(withTransparent.some((s) => s.store === "transparent")).toBe(true);
  });

  it("describes current values by palette name, custom hex, or default", () => {
    const swatches = buildSwatches(undefined, "hex", true);

    expect(describeColorValue("", swatches).name).toBe("افتراضي");
    expect(describeColorValue(DEFAULT_COLORS.primary, swatches).name).toBe(
      "أساسي"
    );
    expect(describeColorValue("transparent", swatches).name).toBe("شفاف");

    const custom = describeColorValue("#123456", swatches);
    expect(custom.name).toBe("مخصص");
    expect(custom.isCustom).toBe(true);

    const refs = buildSwatches(undefined, "theme-ref", false);
    expect(describeColorValue("theme-dark", refs).name).toBe("داكن");
  });

  it("computes luminance for contrast decisions", () => {
    expect(colorLuminance("#ffffff")).toBeCloseTo(1, 2);
    expect(colorLuminance("#000000")).toBeCloseTo(0, 2);
    expect(colorLuminance("#fff")).toBeCloseTo(1, 2);
  });
});

describe("SpacingField helpers", () => {
  it("resolves the scale from root props with stock fallbacks", () => {
    const scale = resolveSpacingScale(
      { spacingVerticalMedium: "40px", spacingVerticalWide: "not-a-px" },
      "vertical"
    );
    expect(scale.none).toBe("0px");
    expect(scale.narrow).toBe(DEFAULT_SPACING_SCALE.spacingVerticalNarrow);
    expect(scale.medium).toBe("40px");
    // invalid stored value falls back to the default
    expect(scale.wide).toBe(DEFAULT_SPACING_SCALE.spacingVerticalWide);
  });

  it("matches stored px values back to named levels", () => {
    const scale = resolveSpacingScale(undefined, "vertical");
    expect(matchSpacingLevel("0px", scale)).toBe("none");
    expect(matchSpacingLevel("", scale)).toBe("none");
    expect(matchSpacingLevel(scale.wide, scale)).toBe("wide");
    expect(matchSpacingLevel("17px", scale)).toBeNull();
  });

  it("keeps Section defaults on-scale (80px = واسعة, 24px side = متوسطة)", () => {
    const vertical = resolveSpacingScale(undefined, "vertical");
    const side = resolveSpacingScale(undefined, "side");
    expect(matchSpacingLevel("80px", vertical)).toBe("wide");
    expect(matchSpacingLevel("24px", side)).toBe("medium");
  });
});

describe("OverlayField helpers", () => {
  it("parses rgba, rgb, and hex values", () => {
    expect(parseOverlayValue("rgba(0, 0, 0, 0.45)")).toEqual({
      rgb: { r: 0, g: 0, b: 0 },
      alpha: 0.45,
    });
    expect(parseOverlayValue("rgb(10, 20, 30)")).toEqual({
      rgb: { r: 10, g: 20, b: 30 },
      alpha: 1,
    });
    expect(parseOverlayValue("#ffffff")).toEqual({
      rgb: { r: 255, g: 255, b: 255 },
      alpha: 1,
    });
    expect(parseOverlayValue("")).toBeNull();
    expect(parseOverlayValue(undefined)).toBeNull();
  });

  it("formats back to the persisted rgba() shape and clears at zero", () => {
    expect(formatOverlayValue({ r: 0, g: 0, b: 0 }, 0.45)).toBe(
      "rgba(0, 0, 0, 0.45)"
    );
    expect(formatOverlayValue({ r: 0, g: 0, b: 0 }, 0)).toBe("");
  });

  it("round-trips stored values", () => {
    const parsed = parseOverlayValue("rgba(53, 99, 233, 0.6)")!;
    expect(formatOverlayValue(parsed.rgb, parsed.alpha)).toBe(
      "rgba(53, 99, 233, 0.6)"
    );
  });

  it("converts hex to rgb including short form", () => {
    expect(hexToRgb("#fff")).toEqual({ r: 255, g: 255, b: 255 });
    expect(hexToRgb("nope")).toBeNull();
  });
});

describe("ColumnsField helpers", () => {
  it("clamps stored values into the 1..max range", () => {
    expect(clampColumns(undefined, 6)).toBe(1);
    expect(clampColumns("3", 6)).toBe(3);
    expect(clampColumns(99, 6)).toBe(6);
    expect(clampColumns("abc", 6)).toBe(1);
  });
});

describe("six-group field classification", () => {
  it("orders and labels all six groups", () => {
    expect(FIELD_GROUP_ORDER).toEqual([
      "content",
      "layout",
      "background",
      "typography",
      "border",
      "advanced",
    ]);
    for (const group of FIELD_GROUP_ORDER) {
      expect(FIELD_GROUP_LABELS[group]).toMatch(/[؀-ۿ]/);
      expect(FIELD_GROUP_COLORS[group].color).toMatch(/^#/);
    }
  });

  it("classifies by field name", () => {
    expect(resolveFieldGroup("paddingTop")).toBe("layout");
    expect(resolveFieldGroup("columns")).toBe("layout");
    expect(resolveFieldGroup("backgroundColor")).toBe("background");
    expect(resolveFieldGroup("backgroundOverlayColor")).toBe("background");
    expect(resolveFieldGroup("color")).toBe("typography");
    expect(resolveFieldGroup("theme")).toBe("typography");
    expect(resolveFieldGroup("layoutBorder")).toBe("border");
    expect(resolveFieldGroup("borderRadius")).toBe("border");
    expect(resolveFieldGroup("anchorId")).toBe("advanced");
    expect(resolveFieldGroup("title")).toBe("content");
  });

  it("lets metadata.group override, with the legacy style alias", () => {
    expect(
      resolveFieldGroup("whatever", { metadata: { group: "border" } })
    ).toBe("border");
    expect(
      resolveFieldGroup("whatever", { metadata: { group: "style" } })
    ).toBe("background");
  });

  it("groups a field map and skips slots", () => {
    const grouped = groupFieldNames({
      name: { type: "text" } as never,
      paddingTop: { type: "custom" } as never,
      content: { type: "slot" } as never,
      layoutBorder: { type: "custom" } as never,
    });
    expect(grouped.content).toEqual(["name"]);
    expect(grouped.layout).toEqual(["paddingTop"]);
    expect(grouped.border).toEqual(["layoutBorder"]);
    expect(Object.values(grouped).flat()).not.toContain("content");
  });
});
