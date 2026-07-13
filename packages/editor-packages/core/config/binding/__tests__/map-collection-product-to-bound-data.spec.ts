import {
  getBoundProductId,
  mapCollectionProductToBoundData,
} from "../map-collection-product-to-bound-data";

describe("mapCollectionProductToBoundData", () => {
  it("mirrors the product-detail payload shape (product/pricing/images)", () => {
    const bound = mapCollectionProductToBoundData({
      id: "p-9",
      titleAr: "حذاء",
      titleEn: "Shoe",
      descriptionAr: "وصف",
      descriptionEn: "desc",
      slug: "shoe",
      displayPrice: "30,000 SYP",
      basePrice: 30000,
      compareAtPrice: 35000,
      currencyCode: "SYP",
      status: "ACTIVE",
      primaryImageUrl: "https://cdn.test/shoe.jpg",
    });

    expect(bound.product).toMatchObject({
      productId: "p-9",
      titleAr: "حذاء",
      titleEn: "Shoe",
      slug: "shoe",
      status: "ACTIVE",
    });
    expect(bound.pricing).toEqual({
      basePrice: 30000,
      compareAtPrice: 35000,
      currencyCode: "SYP",
      displayPrice: "30,000 SYP",
    });
    expect(bound.images).toEqual([{ url: "https://cdn.test/shoe.jpg" }]);
  });

  it("builds displayPrice from basePrice + currency when missing (SYP default)", () => {
    const bound = mapCollectionProductToBoundData({
      id: "p-1",
      basePrice: 1200,
    });

    expect(
      (bound.pricing as { displayPrice: string }).displayPrice
    ).toBe("1200 SYP");
  });

  it("falls back to id for slug and empty strings for missing text", () => {
    const bound = mapCollectionProductToBoundData({ id: "p-2" });
    const product = bound.product as Record<string, unknown>;

    expect(product.slug).toBe("p-2");
    expect(product.titleAr).toBe("");
    expect(bound.images).toEqual([]);
  });
});

describe("getBoundProductId", () => {
  it("reads product.productId, falls back to product.id", () => {
    expect(getBoundProductId({ product: { productId: "a" } })).toBe("a");
    expect(getBoundProductId({ product: { id: "b" } })).toBe("b");
  });

  it("returns null for empty/missing data", () => {
    expect(getBoundProductId(null)).toBeNull();
    expect(getBoundProductId({})).toBeNull();
    expect(getBoundProductId({ product: { productId: "  " } })).toBeNull();
  });
});
