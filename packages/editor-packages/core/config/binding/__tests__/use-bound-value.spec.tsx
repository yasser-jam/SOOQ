import { renderHook } from "@testing-library/react";
import React from "react";
import { BoundDataProvider } from "../BoundDataContext";
import type { BoundDataContextValue } from "../types";
import { useBoundValue } from "../use-bound-value";

const makeWrapper = (value: Partial<BoundDataContextValue>) => {
  const full: BoundDataContextValue = {
    data: null,
    isLoading: false,
    isError: false,
    metadata: null,
    language: "ar",
    selectedVariantId: null,
    setSelectedVariantId: () => {},
    ...value,
  };

  return ({ children }: { children: React.ReactNode }) => (
    <BoundDataProvider value={full}>{children}</BoundDataProvider>
  );
};

const data = {
  product: { titleAr: "عنوان عربي", titleEn: "English title", empty: "" },
};

describe("useBoundValue fallback order", () => {
  it("returns the bound value when the path resolves", () => {
    const { result } = renderHook(
      () => useBoundValue("static", { path: "product.title" }),
      { wrapper: makeWrapper({ data }) }
    );

    expect(result.current).toBe("عنوان عربي");
  });

  it("respects the context language for shorthand paths", () => {
    const { result } = renderHook(
      () => useBoundValue("static", { path: "product.title" }),
      { wrapper: makeWrapper({ data, language: "en" }) }
    );

    expect(result.current).toBe("English title");
  });

  it("returns the static value when there is no valueContext", () => {
    const { result } = renderHook(() => useBoundValue("static", null), {
      wrapper: makeWrapper({ data }),
    });

    expect(result.current).toBe("static");
  });

  it("returns the static value when no bound data is available", () => {
    const { result } = renderHook(
      () => useBoundValue("static", { path: "product.title" }),
      { wrapper: makeWrapper({ data: null }) }
    );

    expect(result.current).toBe("static");
  });

  it("falls back to static when the path resolves empty (default)", () => {
    const { result } = renderHook(
      () => useBoundValue("static", { path: "product.empty" }),
      { wrapper: makeWrapper({ data }) }
    );

    expect(result.current).toBe("static");
  });

  it("returns empty string when fallbackToStatic is false and path is empty", () => {
    const { result } = renderHook(
      () =>
        useBoundValue("static", {
          path: "product.empty",
          fallbackToStatic: false,
        }),
      { wrapper: makeWrapper({ data }) }
    );

    expect(result.current).toBe("");
  });
});
