/**
 * Products-page filters (search + price range + availability).
 *
 * Covers the core-owned half of the feature: the query contract, the sample
 * adapter the edit canvas renders from, and the preset that ships the bound
 * blocks. The storefront half (endpoint selection, `/public/products/search`
 * param names) lives in apps/web — see `docs/products-page-feature.md`.
 */
import {
  filterAndPaginateSampleProducts,
  hasProductsPageFilters,
  sampleEditorDataAdapter,
  SAMPLE_COLLECTION_PRODUCTS,
  type ProductsPageQuery,
} from "../data-adapter";
import { createProductsPagePreset } from "../presets/products-page";

const baseQuery: ProductsPageQuery = { page: 0, size: 20 };

/** Sample catalog: 85k, 145k, 230k (out of stock), 120k — all ACTIVE. */
const priceOf = (id: string) =>
  SAMPLE_COLLECTION_PRODUCTS.find((p) => p.id === id)?.basePrice;

describe("hasProductsPageFilters", () => {
  it("is false for an unfiltered or category-only query", () => {
    expect(hasProductsPageFilters(baseQuery)).toBe(false);
    expect(
      hasProductsPageFilters({ ...baseQuery, categorySlug: "watches" })
    ).toBe(false);
    // Whitespace-only search must not trigger the search endpoint.
    expect(hasProductsPageFilters({ ...baseQuery, search: "   " })).toBe(false);
  });

  it("is true once any search / price / stock filter is set", () => {
    expect(hasProductsPageFilters({ ...baseQuery, search: "عطر" })).toBe(true);
    expect(hasProductsPageFilters({ ...baseQuery, minPrice: 0 })).toBe(true);
    expect(hasProductsPageFilters({ ...baseQuery, maxPrice: 500 })).toBe(true);
    expect(hasProductsPageFilters({ ...baseQuery, inStockOnly: true })).toBe(
      true
    );
  });

  it("treats an explicit null bound as no filter", () => {
    expect(
      hasProductsPageFilters({ ...baseQuery, minPrice: null, maxPrice: null })
    ).toBe(false);
  });
});

describe("filterAndPaginateSampleProducts", () => {
  const ids = (query: ProductsPageQuery) =>
    filterAndPaginateSampleProducts(query).items.map((p) => p.id);

  it("applies an inclusive minimum price", () => {
    const result = ids({ ...baseQuery, minPrice: 120000 });
    expect(result).not.toContain("sample-product-1"); // 85,000
    expect(result).toContain("sample-product-4"); // 120,000 — inclusive
    result.forEach((id) => expect(priceOf(id)).toBeGreaterThanOrEqual(120000));
  });

  it("applies an inclusive maximum price", () => {
    const result = ids({ ...baseQuery, maxPrice: 120000 });
    expect(result).toContain("sample-product-4"); // 120,000 — inclusive
    expect(result).not.toContain("sample-product-3"); // 230,000
    result.forEach((id) => expect(priceOf(id)).toBeLessThanOrEqual(120000));
  });

  it("combines both bounds into a range", () => {
    expect(ids({ ...baseQuery, minPrice: 100000, maxPrice: 150000 })).toEqual([
      "sample-product-2", // 145,000
      "sample-product-4", // 120,000
    ]);
  });

  it("drops out-of-stock products when inStockOnly is set", () => {
    expect(ids(baseQuery)).toContain("sample-product-3");
    expect(ids({ ...baseQuery, inStockOnly: true })).not.toContain(
      "sample-product-3"
    );
  });

  it("intersects stock, price and search filters", () => {
    expect(
      ids({ ...baseQuery, minPrice: 200000, inStockOnly: true })
    ).toEqual([]);
    expect(ids({ ...baseQuery, search: "حقيبة", minPrice: 100000 })).toEqual([
      "sample-product-2",
    ]);
  });

  it("recomputes totals from the filtered set", () => {
    const result = filterAndPaginateSampleProducts({
      page: 0,
      size: 2,
      minPrice: 100000,
    });
    expect(result.totalItems).toBe(3);
    expect(result.totalPages).toBe(2);
    expect(result.items).toHaveLength(2);
  });
});

describe("sample adapter URL round-trip", () => {
  // The canvas serializes the query into a URL and parses it straight back,
  // so a dropped param silently disables a filter.
  const roundTrip = (query: ProductsPageQuery) =>
    sampleEditorDataAdapter.fetchProductsPage(
      sampleEditorDataAdapter.getProductsPageApiUrl(query)
    );

  it("preserves price bounds and the stock flag", async () => {
    const query: ProductsPageQuery = {
      ...baseQuery,
      minPrice: 100000,
      maxPrice: 150000,
      inStockOnly: true,
    };
    const viaUrl = await roundTrip(query);
    expect(viaUrl.items.map((p) => p.id)).toEqual(
      filterAndPaginateSampleProducts(query).items.map((p) => p.id)
    );
    expect(viaUrl.items.map((p) => p.id)).toEqual([
      "sample-product-2",
      "sample-product-4",
    ]);
  });

  it("omits unset filters from the URL", () => {
    const url = sampleEditorDataAdapter.getProductsPageApiUrl(baseQuery);
    expect(url).not.toContain("minPrice");
    expect(url).not.toContain("maxPrice");
    expect(url).not.toContain("inStockOnly");
  });
});

describe("products page preset", () => {
  const collect = (value: unknown, sink: Array<Record<string, any>>): void => {
    if (Array.isArray(value)) {
      value.forEach((item) => collect(item, sink));
      return;
    }
    if (typeof value !== "object" || value === null) return;
    const record = value as Record<string, any>;
    if (typeof record.type === "string" && record.props) sink.push(record);
    Object.values(record).forEach((item) => collect(item, sink));
  };

  const nodes = () => {
    const sink: Array<Record<string, any>> = [];
    collect(createProductsPagePreset(), sink);
    return sink;
  };

  it("ships one block per products-page filter, each bound to the store", () => {
    const bindings = nodes()
      .map((node) => node.props.inputAction || node.props.switchAction)
      .filter(Boolean);

    expect(bindings).toEqual(
      expect.arrayContaining([
        "search_products",
        "filter_min_price",
        "filter_max_price",
        "filter_in_stock_only",
      ])
    );
  });

  it("renders the price filters as numeric inputs", () => {
    const priceInputs = nodes().filter((node) =>
      String(node.props.inputAction).startsWith("filter_")
    );

    expect(priceInputs).toHaveLength(2);
    priceInputs.forEach((input) => {
      expect(input.type).toBe("ContentInput");
      expect(input.props.inputType).toBe("number");
    });
  });

  it("keeps the category and pagination button groups", () => {
    const modes = nodes()
      .map((node) => node.props.bindingMode)
      .filter(Boolean);
    expect(modes).toEqual(
      expect.arrayContaining(["categories", "pagination"])
    );
  });
});
