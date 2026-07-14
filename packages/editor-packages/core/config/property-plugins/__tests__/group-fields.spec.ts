import type { Field } from "@/core/types";
import type { PropertyPlugin } from "../types";
import { resolvePropertyTabs } from "../group-fields";

describe("property plugin grouping", () => {
  const samplePlugins: PropertyPlugin[] = [
    {
      id: "content",
      group: "content",
      label: "المحتوى",
      icon: (() => null) as never,
      color: { color: "#3563e9", tint: "#e8eefc" },
      fields: {
        label: { type: "text" } as Field,
      },
    },
    {
      id: "layout",
      group: "layout",
      label: "التخطيط",
      icon: (() => null) as never,
      color: { color: "#0284c7", tint: "#eaf5fd" },
      fields: {
        layout: { type: "custom", metadata: { group: "layout" } } as Field,
      },
    },
    {
      id: "border",
      group: "border",
      label: "الحدود",
      icon: (() => null) as never,
      color: { color: "#be185d", tint: "#fdeef4" },
    },
  ];

  it("groups fields by plugin metadata.group", () => {
    const tabs = resolvePropertyTabs(
      {
        label: { type: "text", metadata: { group: "content" } } as Field,
        layout: { type: "custom", metadata: { group: "layout" } } as Field,
        layoutBorder: { type: "custom", metadata: { group: "border" } } as Field,
      },
      samplePlugins
    );

    expect(tabs.map((t) => t.group)).toEqual(["content", "layout", "border"]);
    expect(tabs[0]?.fieldNames).toEqual(["label"]);
    expect(tabs[1]?.fieldNames).toEqual(["layout"]);
    expect(tabs[2]?.fieldNames).toEqual(["layoutBorder"]);
  });

  it("falls back to legacy name-based grouping without plugins", () => {
    const tabs = resolvePropertyTabs({
      paddingTop: { type: "custom" } as Field,
      title: { type: "text" } as Field,
    });

    expect(tabs.some((t) => t.fieldNames.includes("paddingTop"))).toBe(true);
    expect(tabs.some((t) => t.fieldNames.includes("title"))).toBe(true);
  });
});
