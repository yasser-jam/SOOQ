import { createElement } from "react";
import {
  isBilingualValue,
  normalizeBilingual,
  pickLang,
} from "../bilingual";

describe("bilingual helpers", () => {
  describe("isBilingualValue", () => {
    it("accepts { ar, en } objects", () => {
      expect(isBilingualValue({ ar: "مرحبا", en: "Hello" })).toBe(true);
      expect(isBilingualValue({ ar: "فقط" })).toBe(true);
      expect(isBilingualValue({ en: "only" })).toBe(true);
    });

    it("rejects strings, null, arrays", () => {
      expect(isBilingualValue("hello")).toBe(false);
      expect(isBilingualValue(null)).toBe(false);
      expect(isBilingualValue([{ ar: "x", en: "y" }])).toBe(false);
    });

    it("rejects React elements from contentEditable transforms", () => {
      const el = createElement("span", null, "Hello");
      expect(isBilingualValue(el)).toBe(false);
    });
  });

  describe("normalizeBilingual", () => {
    it("coerces legacy strings into ar-only bilingual objects", () => {
      expect(normalizeBilingual("عنوان")).toEqual({ ar: "عنوان", en: "" });
    });

    it("fills missing sides with empty strings", () => {
      expect(normalizeBilingual({ ar: "عنوان" } as any)).toEqual({
        ar: "عنوان",
        en: "",
      });
    });
  });

  describe("pickLang", () => {
    it("picks the requested language with fallback", () => {
      const value = { ar: "مرحبا", en: "Hello" };
      expect(pickLang(value, "ar")).toBe("مرحبا");
      expect(pickLang(value, "en")).toBe("Hello");
      expect(pickLang({ ar: "مرحبا", en: "" }, "en")).toBe("مرحبا");
      expect(pickLang({ ar: "", en: "Hello" }, "ar")).toBe("Hello");
    });

    it("returns plain strings unchanged", () => {
      expect(pickLang("plain", "en")).toBe("plain");
    });

    it("passes through React elements so the editor canvas can render them", () => {
      const el = createElement("span", { "data-testid": "inline" }, "Hello");
      expect(pickLang(el, "ar")).toBe(el);
      expect(pickLang(el, "en")).toBe(el);
    });
  });
});
