import {
  resolveValueContext,
  resolveValueContextAsString,
} from "../resolve-value-context";

const payload = {
  product: {
    productId: "p-1",
    titleAr: "قميص قطني",
    titleEn: "Cotton Shirt",
    descriptionAr: "وصف عربي",
    descriptionEn: "English description",
  },
  pricing: {
    basePrice: 25000,
    currencyCode: "SYP",
    displayPrice: "25,000 SYP",
  },
  images: [{ url: "https://cdn.example.com/a.jpg" }, { url: "/media/b.jpg" }],
  variantMatrix: {
    variants: [{ variantId: "v-1", price: 24000 }],
  },
};

describe("resolveValueContext", () => {
  it("resolves simple dot paths", () => {
    expect(resolveValueContext("pricing.displayPrice", payload)).toBe(
      "25,000 SYP"
    );
    expect(resolveValueContext("product.productId", payload)).toBe("p-1");
  });

  it("resolves bracket-index paths", () => {
    expect(
      resolveValueContext("variantMatrix.variants[0].variantId", payload)
    ).toBe("v-1");
  });

  it("maps the product.title shorthand per locale (ar default)", () => {
    expect(resolveValueContext("product.title", payload)).toBe("قميص قطني");
    expect(resolveValueContext("product.title", payload, { locale: "en" })).toBe(
      "Cotton Shirt"
    );
    expect(resolveValueContext("product.description", payload)).toBe(
      "وصف عربي"
    );
    expect(
      resolveValueContext("product.description", payload, { locale: "en" })
    ).toBe("English description");
  });

  it("images[0].url uses the display-ready image resolver", () => {
    expect(resolveValueContext("images[0].url", payload)).toBe(
      "https://cdn.example.com/a.jpg"
    );
  });

  it("returns undefined for missing paths, empty paths and null data", () => {
    expect(resolveValueContext("product.missing.deep", payload)).toBeUndefined();
    expect(resolveValueContext("", payload)).toBeUndefined();
    expect(resolveValueContext("product.title", null)).toBeUndefined();
    expect(resolveValueContext("images[9].url", payload)).toBeUndefined();
  });

  it("does not treat non-integer tokens as array indexes", () => {
    expect(resolveValueContext("images.url", payload)).toBeUndefined();
  });
});

describe("resolveValueContextAsString", () => {
  it("stringifies numbers and booleans", () => {
    expect(resolveValueContextAsString("pricing.basePrice", payload)).toBe(
      "25000"
    );
    expect(
      resolveValueContextAsString("flag", { flag: false })
    ).toBe("false");
  });

  it("returns undefined for empty strings and objects", () => {
    expect(
      resolveValueContextAsString("product.titleAr", {
        product: { titleAr: "   " },
      })
    ).toBeUndefined();
    expect(resolveValueContextAsString("product", payload)).toBeUndefined();
    expect(resolveValueContextAsString("images", payload)).toBeUndefined();
  });
});
