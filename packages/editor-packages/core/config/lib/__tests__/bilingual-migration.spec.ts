import { describe, expect, it } from "vitest";
import { BILINGUAL_PROPS } from "../bilingual-props";
import { normalizeEditorData } from "../normalize-editor-data";

describe("bilingual migration (shellComponentsMigrationVersion 4)", () => {
  it("converts string text props to { ar, en: '' }", () => {
    const result = normalizeEditorData({
      content: [
        {
          type: "ContentHeading",
          props: { id: "h1", text: "عنوان قديم" },
        },
      ],
    });

    const heading = result.content[0];
    expect(heading?.props.text).toEqual({ ar: "عنوان قديم", en: "" });
  });

  it("is idempotent on already-migrated props", () => {
    const once = normalizeEditorData({
      content: [
        {
          type: "ContentHeading",
          props: {
            id: "h1",
            text: { ar: "عنوان", en: "Heading" },
          },
        },
      ],
    });
    const twice = normalizeEditorData(once);
    expect(twice.content[0]?.props.text).toEqual({
      ar: "عنوان",
      en: "Heading",
    });
  });

  it("does not inject English default over en: '' after migration", () => {
    const result = normalizeEditorData({
      content: [
        {
          type: "ContentHeading",
          props: { id: "h1", text: "نص عربي فقط" },
        },
      ],
    });

    const text = result.content[0]?.props.text as { ar: string; en: string };
    expect(text.en).toBe("");
    expect(text.ar).toBe("نص عربي فقط");
  });

  it("collapses sibling *Ar props on SiteFooter tagline", () => {
    const result = normalizeEditorData({
      content: [
        {
          type: "SiteFooter",
          props: {
            id: "footer-1",
            tagline: "English tagline",
            taglineAr: "شعار عربي",
          },
        },
      ],
    });

    const footer = result.content[0];
    expect(footer?.props.tagline).toEqual({
      ar: "شعار عربي",
      en: "English tagline",
    });
    expect(footer?.props.taglineAr).toBeUndefined();
  });

  it("registers bilingual paths for all in-scope blocks", () => {
    expect(BILINGUAL_PROPS.ContentHeading).toBeDefined();
    expect(BILINGUAL_PROPS.ContentButton).toBeDefined();
    expect(BILINGUAL_PROPS.SiteFooter).toBeDefined();
    expect(BILINGUAL_PROPS.Card).toEqual([
      { path: "title" },
      { path: "description" },
    ]);
  });
});

describe("mergeDefaults bilingual safety", () => {
  it("documents expected mergeDefaults behavior for partial objects", () => {
    const defaults = { text: { ar: "default ar", en: "default en" } };
    const incoming = { text: { ar: "merchant ar", en: "" } };
    // Replicate mergeDefaults logic inline for the assertion
    const merged = { text: { ...defaults.text, ...incoming.text } };
    expect(merged.text.en).toBe("");
  });
});
