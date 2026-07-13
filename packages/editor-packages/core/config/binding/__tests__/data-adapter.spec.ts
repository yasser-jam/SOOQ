import * as fs from "fs";
import * as path from "path";
import {
  BOUND_QUERY_POLICY,
  boundQueryKeys,
  buildSampleProductPayload,
  getEditorDataAdapter,
  pickSampleCollectionProduct,
  registerEditorDataAdapter,
  SAMPLE_COLLECTION_PRODUCTS,
  sampleEditorDataAdapter,
  useSampleDataInEditor,
  type EditorDataAdapter,
} from "../../data-adapter";

afterEach(() => {
  // Tests may register fakes — restore the default.
  registerEditorDataAdapter(sampleEditorDataAdapter);
});

describe("sample adapter (default)", () => {
  it("is returned when nothing is registered and serves sample data", async () => {
    const adapter = getEditorDataAdapter();

    expect(adapter).toBe(sampleEditorDataAdapter);
    expect(adapter.getSampleCollectionProducts()).toHaveLength(4);
    await expect(
      adapter.fetchCollectionProducts("sample://any")
    ).resolves.toBe(SAMPLE_COLLECTION_PRODUCTS);
  });

  it("builds metadata shaped like the real one (sample:// urls)", () => {
    const meta = sampleEditorDataAdapter.buildProductsGridResourceMetadata({
      id: "c-1",
      name: "مجموعة",
      slug: "featured",
      productCount: 7,
    });

    expect(meta).toEqual({
      type: "collection",
      method: "get",
      collectionId: "c-1",
      collectionSlug: "featured",
      productCount: 7,
      apiUrl: "sample://collections/featured/products",
    });
  });
});

describe("registration", () => {
  it("a registered adapter wins; sample mode honors liveDataInEditor", () => {
    const fake = {
      ...sampleEditorDataAdapter,
      liveDataInEditor: true,
    } satisfies EditorDataAdapter;

    expect(useSampleDataInEditor()).toBe(true);

    registerEditorDataAdapter(fake);

    expect(getEditorDataAdapter()).toBe(fake);
    expect(useSampleDataInEditor()).toBe(false);
  });
});

describe("sample data", () => {
  it("pickSampleCollectionProduct is deterministic and in-catalog", () => {
    const first = pickSampleCollectionProduct("real-product-uuid-123");
    const again = pickSampleCollectionProduct("real-product-uuid-123");

    expect(again).toBe(first);
    expect(SAMPLE_COLLECTION_PRODUCTS).toContain(first);
  });

  it("buildSampleProductPayload keeps the picked product's identity", () => {
    const payload = buildSampleProductPayload({
      id: "real-1",
      titleAr: "منتجي الحقيقي",
      slug: "my-product",
    });
    const product = payload.product as Record<string, unknown>;

    expect(product.productId).toBe("real-1");
    expect(product.titleAr).toBe("منتجي الحقيقي");
    expect(product.slug).toBe("my-product");
    // Sample fills the rest — pricing + images present for valueContext paths.
    expect(payload.pricing).toBeTruthy();
    expect(Array.isArray(payload.images)).toBe(true);
  });

  it("sample products satisfy the images[0].url binding path", () => {
    for (const product of SAMPLE_COLLECTION_PRODUCTS) {
      expect(product.primaryImageUrl).toMatch(/^data:image\/svg\+xml/);
      expect(product.basePrice).toBeGreaterThan(0);
    }
  });
});

describe("query contract", () => {
  it("keys match the pre-inversion picker keys (cache compatibility)", () => {
    expect(boundQueryKeys.collectionProducts("u")).toEqual([
      "collection",
      "picker",
      "products",
      "u",
    ]);
    expect(boundQueryKeys.productDetail("id", "u")).toEqual([
      "product",
      "picker",
      "id",
      "u",
    ]);
  });

  it("policy caps refetching (staleTime/gcTime set, no focus refetch)", () => {
    expect(BOUND_QUERY_POLICY.staleTime).toBeGreaterThan(0);
    expect(BOUND_QUERY_POLICY.gcTime).toBeGreaterThanOrEqual(
      BOUND_QUERY_POLICY.staleTime
    );
    expect(BOUND_QUERY_POLICY.refetchOnWindowFocus).toBe(false);
  });
});

describe("architecture guard (C2-4)", () => {
  it("binding/ and data-adapter/ import nothing from apps/web (@/modules)", () => {
    const dirs = [
      path.resolve(__dirname, ".."),
      path.resolve(__dirname, "../../data-adapter"),
    ];

    const offenders: string[] = [];

    for (const dir of dirs) {
      for (const file of fs.readdirSync(dir)) {
        const full = path.join(dir, file);
        if (!fs.statSync(full).isFile()) continue;
        if (!/\.(ts|tsx)$/.test(file)) continue;

        const source = fs.readFileSync(full, "utf8");
        if (source.includes("@/modules")) {
          offenders.push(path.relative(process.cwd(), full));
        }
      }
    }

    expect(offenders).toEqual([]);
  });
});
