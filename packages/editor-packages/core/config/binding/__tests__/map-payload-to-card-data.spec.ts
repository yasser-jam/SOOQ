import {
  buildProductActionDetail,
  mapPayloadToProductCardData,
} from "../map-payload-to-card-data";

const basePayload = {
  product: {
    productId: "p-1",
    titleAr: "منتج",
    titleEn: "Product",
    slug: "product-1",
    status: "ACTIVE",
  },
  pricing: {
    basePrice: 10000,
    compareAtPrice: 12000,
    currencyCode: "SYP",
  },
  images: [{ url: "https://cdn.test/p1.jpg" }],
};

describe("mapPayloadToProductCardData", () => {
  it("returns null without a product id", () => {
    expect(mapPayloadToProductCardData({})).toBeNull();
    expect(mapPayloadToProductCardData({ product: {} })).toBeNull();
  });

  it("maps core fields and media", () => {
    const card = mapPayloadToProductCardData(basePayload)!;

    expect(card.id).toBe("p-1");
    expect(card.titleAr).toBe("منتج");
    expect(card.slug).toBe("product-1");
    expect(card.currencyCode).toBe("SYP");
    expect(card.mediaUrls).toEqual(["https://cdn.test/p1.jpg"]);
  });

  it("prefers variantMatrix.variants, falls back to payload.variants", () => {
    const viaMatrix = mapPayloadToProductCardData({
      ...basePayload,
      variantMatrix: { variants: [{ variantId: "vm-1", price: 9000 }] },
      variants: [{ variantId: "flat-1", price: 8000 }],
    })!;
    expect(viaMatrix.variants[0].variantId).toBe("vm-1");

    const viaFlat = mapPayloadToProductCardData({
      ...basePayload,
      variants: [{ variantId: "flat-1", price: 8000, stockQty: 3 }],
    })!;
    expect(viaFlat.variants[0]).toMatchObject({
      variantId: "flat-1",
      price: 8000,
      stockQty: 3,
    });
  });

  it("synthesizes a default variant when none exist, priced from pricing", () => {
    const card = mapPayloadToProductCardData(basePayload)!;

    expect(card.variants).toHaveLength(1);
    expect(card.variants[0]).toMatchObject({
      variantId: "p-1",
      price: 10000,
      compareAtPrice: 12000,
      stockQty: null,
      isActive: true,
    });
    expect(card.basePrice).toBe(10000);
  });

  it("card price follows the first variant when variants exist", () => {
    const card = mapPayloadToProductCardData({
      ...basePayload,
      variants: [{ variantId: "v-1", price: 7000, compareAtPrice: 9000 }],
    })!;

    expect(card.basePrice).toBe(7000);
    expect(card.compareAtPrice).toBe(9000);
  });
});

describe("buildProductActionDetail", () => {
  it("returns null when the payload has no product id", () => {
    expect(buildProductActionDetail({}, "ar", null)).toBeNull();
  });

  it("computes discount pricing from compareAt > price", () => {
    const detail = buildProductActionDetail(basePayload, "ar", null)!;

    expect(detail.pricing).toEqual({
      price: 10000,
      compareAt: 12000,
      hasDiscount: true,
      discountPercent: 17, // round((12000-10000)/12000 * 100)
    });
    expect(detail.language).toBe("ar");
  });

  it("reports no discount when compareAt <= price", () => {
    const detail = buildProductActionDetail(
      {
        ...basePayload,
        pricing: { basePrice: 10000, compareAtPrice: 0, currencyCode: "SYP" },
      },
      "en",
      null
    )!;

    expect(detail.pricing.hasDiscount).toBe(false);
    expect(detail.pricing.compareAt).toBeNull();
    expect(detail.pricing.discountPercent).toBe(0);
  });

  it("selects the requested variant, else the first", () => {
    const payload = {
      ...basePayload,
      variants: [
        { variantId: "v-1", price: 7000 },
        { variantId: "v-2", price: 6000 },
      ],
    };

    expect(
      buildProductActionDetail(payload, "ar", null, "v-2")!.selectedVariant
        ?.variantId
    ).toBe("v-2");
    expect(
      buildProductActionDetail(payload, "ar", null)!.selectedVariant?.variantId
    ).toBe("v-1");
  });

  it("derives stockStatus: unknown / in / low / out / oversell", () => {
    const withStock = (variant: Record<string, unknown>, extra = {}) =>
      buildProductActionDetail(
        { ...basePayload, ...extra, variants: [{ variantId: "v", ...variant }] },
        "ar",
        null
      )!.stockStatus;

    expect(withStock({ price: 1 })).toBe("unknown"); // stockQty null
    expect(withStock({ price: 1, stockQty: 50 })).toBe("in_stock");
    expect(withStock({ price: 1, stockQty: 2, lowStockThreshold: 5 })).toBe(
      "low_stock"
    );
    expect(withStock({ price: 1, stockQty: 0 })).toBe("out_of_stock");
    expect(
      withStock(
        { price: 1, stockQty: 0 },
        { inventory: { allowOversell: true } }
      )
    ).toBe("in_stock");
  });
});
