import { applyMobileEditorFieldGroups } from "../mobile-field-groups";

describe("applyMobileEditorFieldGroups (M4)", () => {
  const fields = {
    title: { type: "text" as const, label: "Title" },
    is_mobile_only: {
      type: "radio" as const,
      label: "Mobile only",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
    showOnMobile: {
      type: "radio" as const,
      label: "Show on mobile",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
  };

  it("tags mobile-relevant fields when editor mode is mobile", () => {
    const next = applyMobileEditorFieldGroups(fields, { editorMode: "mobile" });

    expect(next.is_mobile_only?.metadata?.group).toBe("content");
    expect(next.showOnMobile?.metadata?.group).toBe("layout");
    expect(next.title?.metadata?.group).toBeUndefined();
  });

  it("returns fields unchanged in desktop mode", () => {
    const next = applyMobileEditorFieldGroups(fields, { editorMode: "desktop" });

    expect(next).toBe(fields);
    expect(next.is_mobile_only?.metadata?.group).toBeUndefined();
  });
});
