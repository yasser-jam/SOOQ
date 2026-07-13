/**
 * Guards C2-3: bound blocks' resolveData must be idempotent — feeding its own
 * output back in must return `{}` (no change), otherwise every editor dispatch
 * cascades a re-resolve/re-render across all bound blocks on the page.
 */
import { resolveMetadataProp } from "../../lib/resolve-metadata-prop";
import { conf } from "../../index";

type ResolveDataFn = (
  data: { props: Record<string, unknown> },
  params: { changed: Record<string, boolean>; trigger: string }
) => Record<string, unknown> | Promise<Record<string, unknown>>;

const getResolveData = (type: string): ResolveDataFn => {
  const component = conf.components[type as keyof typeof conf.components] as {
    resolveData?: ResolveDataFn;
  };
  if (!component?.resolveData) {
    throw new Error(`${type} has no resolveData`);
  }
  return component.resolveData;
};

const resolveTwice = async (
  type: string,
  props: Record<string, unknown>
): Promise<Record<string, unknown>> => {
  const resolveData = getResolveData(type);
  const params = { changed: {}, trigger: "replace" };

  const first = (await resolveData({ props }, params)) as {
    props?: Record<string, unknown>;
  };
  const merged = { ...props, ...(first.props ?? {}) };

  return resolveData({ props: merged }, params);
};

describe("resolveMetadataProp", () => {
  const meta = { type: "product", apiUrl: "https://x/api", id: "p-1" };

  it("emits metadata when current is empty", () => {
    expect(resolveMetadataProp(null, meta)).toEqual({
      props: { metadata: meta },
    });
    expect(resolveMetadataProp(undefined, meta)).toEqual({
      props: { metadata: meta },
    });
  });

  it("returns {} when metadata is shallow-equal (different reference)", () => {
    expect(resolveMetadataProp({ ...meta }, { ...meta })).toEqual({});
  });

  it("emits when any field differs or key sets differ", () => {
    expect(
      resolveMetadataProp({ ...meta }, { ...meta, id: "p-2" })
    ).toEqual({ props: { metadata: { ...meta, id: "p-2" } } });
    expect(
      resolveMetadataProp({ type: "product" }, meta)
    ).toEqual({ props: { metadata: meta } });
  });

  it("clears once when next is null, then stays quiet", () => {
    expect(resolveMetadataProp({ ...meta }, null)).toEqual({
      props: { metadata: null },
    });
    expect(resolveMetadataProp(null, null)).toEqual({});
    expect(resolveMetadataProp(undefined, null)).toEqual({});
  });
});

describe("bound blocks resolveData idempotence", () => {
  it("Group: second resolve returns {} (with product)", async () => {
    expect(
      await resolveTwice("Group", {
        product: { id: "p-1", slug: "product-1", titleAr: "منتج" },
        metadata: null,
      })
    ).toEqual({});
  });

  it("Group: second resolve returns {} (no product)", async () => {
    expect(
      await resolveTwice("Group", { product: null, metadata: null })
    ).toEqual({});
  });

  it("ProductsGrid: second resolve returns {} (with collection)", async () => {
    expect(
      await resolveTwice("ProductsGrid", {
        collection: {
          id: "c-1",
          name: "مجموعة",
          slug: "featured",
          productCount: 8,
        },
        metadata: null,
      })
    ).toEqual({});
  });

  it("ProductsGrid: second resolve returns {} (no collection)", async () => {
    expect(
      await resolveTwice("ProductsGrid", { collection: null, metadata: null })
    ).toEqual({});
  });

  it("CartSection: second resolve returns {}", async () => {
    expect(await resolveTwice("CartSection", { metadata: null })).toEqual({});
  });

  it("ProductCard (Group alias): second resolve returns {}", async () => {
    expect(
      await resolveTwice("ProductCard", {
        product: { id: "p-2", slug: "product-2" },
        metadata: null,
      })
    ).toEqual({});
  });
});
