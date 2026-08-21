import { nextValueContextForPath } from "../BindPathField";

describe("nextValueContextForPath", () => {
  it("clears the binding when the typed path is empty or whitespace", () => {
    expect(nextValueContextForPath(null, "")).toBeNull();
    expect(nextValueContextForPath({ path: "product.title" }, "   ")).toBeNull();
  });

  it("sets a fresh path when there was no prior value", () => {
    expect(nextValueContextForPath(null, "product.title")).toEqual({
      path: "product.title",
    });
    expect(nextValueContextForPath(undefined, " images[0].url ")).toEqual({
      path: "images[0].url",
    });
  });

  it("preserves other ValueContext fields when only the path changes", () => {
    expect(
      nextValueContextForPath(
        { path: "pricing.basePrice", format: "money", fallbackToStatic: false },
        "pricing.displayPrice"
      )
    ).toEqual({
      path: "pricing.displayPrice",
      format: "money",
      fallbackToStatic: false,
    });
  });
});
