import {
  clearPageDraft,
  getDraftStorageKey,
  readPageDraft,
  writePageDraft,
} from "../page-draft";
import type { UserData } from "../../types";

const samplePage = {
  root: { props: {} },
  content: [
    {
      type: "ContentHeading",
      props: { id: "ContentHeading-1", text: "مرحبا" },
    },
  ],
  zones: {},
} as unknown as UserData;

describe("page-draft", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("round-trips a draft for a page path", () => {
    writePageDraft("/", samplePage);

    const draft = readPageDraft("/");

    expect(draft).not.toBeNull();
    expect(draft!.data).toEqual(samplePage);
    expect(typeof draft!.savedAt).toBe("number");
  });

  it("keeps drafts isolated per page path", () => {
    writePageDraft("/", samplePage);

    expect(readPageDraft("/products/:product-slug")).toBeNull();
    expect(readPageDraft("/")).not.toBeNull();
  });

  it("returns null when no draft exists", () => {
    expect(readPageDraft("/")).toBeNull();
  });

  it("returns null (instead of throwing) for corrupted payloads", () => {
    window.localStorage.setItem(getDraftStorageKey("/"), "{not json");
    expect(readPageDraft("/")).toBeNull();

    window.localStorage.setItem(getDraftStorageKey("/"), '"just a string"');
    expect(readPageDraft("/")).toBeNull();

    window.localStorage.setItem(
      getDraftStorageKey("/"),
      JSON.stringify({ savedAt: "not-a-number", data: samplePage })
    );
    expect(readPageDraft("/")).toBeNull();
  });

  it("clearPageDraft removes only the targeted page", () => {
    writePageDraft("/", samplePage);
    writePageDraft("/cart", samplePage);

    clearPageDraft("/");

    expect(readPageDraft("/")).toBeNull();
    expect(readPageDraft("/cart")).not.toBeNull();
  });

  it("does not touch the published site key", () => {
    window.localStorage.setItem("puck-demo:v1:site", '{"pages":[]}');
    writePageDraft("/", samplePage);
    clearPageDraft("/");

    expect(window.localStorage.getItem("puck-demo:v1:site")).toBe(
      '{"pages":[]}'
    );
  });
});
