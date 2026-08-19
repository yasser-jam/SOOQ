import type {
  CategoryRef,
  CollectionPickerRef,
  CollectionProductRef,
  ProductDetailPayload,
  ProductPickerRef,
  ProductResourceMetadata,
  ProductsGridResourceMetadata,
  ProductsPageQuery,
  ProductsPageResult,
} from "./types";
import {
  SAMPLE_CATEGORIES,
  SAMPLE_COLLECTION_PRODUCTS,
  buildSampleProductPayload,
  filterAndPaginateSampleProducts,
} from "./sample-data";

export * from "./types";
export {
  SAMPLE_CATEGORIES,
  SAMPLE_COLLECTION_PRODUCTS,
  buildSampleProductPayload,
  filterAndPaginateSampleProducts,
  pickSampleCollectionProduct,
} from "./sample-data";

/**
 * The host app's bridge into the binding layer (C2-4 dependency inversion).
 *
 * The editor core defines this interface; each app registers its
 * implementation at startup (apps/web + apps/store register the axios-backed
 * one from `apps/web/lib/editor-data-adapter.ts`). Until/unless an adapter is
 * registered, the sample adapter serves network-free demo data — which is
 * also what the edit canvas uses regardless of adapter (C2-5), so editing
 * never blocks on the network.
 */
export type EditorDataAdapter = {
  /** Public collection-products endpoint for a collection slug. */
  getCollectionProductsApiUrl(collectionSlug: string): string;
  fetchCollectionProducts(apiUrl: string): Promise<CollectionProductRef[]>;
  buildProductsGridResourceMetadata(
    collection: CollectionPickerRef
  ): ProductsGridResourceMetadata;

  /**
   * Product-detail endpoint. Public only (`/public/products/{slug}`) — the
   * renderer has no admin credentials, and listing products goes through
   * `getProductsPageApiUrl` rather than N per-product calls.
   */
  fetchProductDetailPayload(
    apiUrl: string
  ): Promise<ProductDetailPayload | null>;
  buildPublicProductResourceMetadata(
    slug: string,
    id?: string
  ): ProductResourceMetadata;

  /** Instant, network-free data for the edit canvas (C2-5). */
  getSampleCollectionProducts(): CollectionProductRef[];
  getSampleProductPayload(ref?: ProductPickerRef | null): ProductDetailPayload;

  /** Public categories list for the products page. */
  getCategoriesApiUrl(): string;
  fetchCategories(apiUrl: string): Promise<CategoryRef[]>;
  getSampleCategories(): CategoryRef[];

  /** Public paginated product listing for the products page. */
  getProductsPageApiUrl(query: ProductsPageQuery): string;
  fetchProductsPage(apiUrl: string): Promise<ProductsPageResult>;
  getSampleProductsPage(query: ProductsPageQuery): ProductsPageResult;

  /**
   * Escape hatch: set true to make the edit canvas fetch live data instead
   * of samples (preview/storefront always fetch live).
   */
  liveDataInEditor?: boolean;
};

const SAMPLE_URL_PREFIX = "sample://";

export const sampleEditorDataAdapter: EditorDataAdapter = {
  getCollectionProductsApiUrl: (collectionSlug) =>
    `${SAMPLE_URL_PREFIX}collections/${collectionSlug}/products`,
  fetchCollectionProducts: async () => SAMPLE_COLLECTION_PRODUCTS,
  buildProductsGridResourceMetadata: (collection) => ({
    type: "collection",
    method: "get",
    collectionId: collection.id,
    collectionSlug: collection.slug,
    productCount: collection.productCount ?? 0,
    apiUrl: `${SAMPLE_URL_PREFIX}collections/${collection.slug}/products`,
  }),
  fetchProductDetailPayload: async () => buildSampleProductPayload(),
  buildPublicProductResourceMetadata: (slug, id) => ({
    type: "product",
    method: "get",
    apiUrl: `${SAMPLE_URL_PREFIX}public/products/${encodeURIComponent(slug)}`,
    id: id ?? slug,
  }),
  getSampleCollectionProducts: () => SAMPLE_COLLECTION_PRODUCTS,
  getSampleProductPayload: (ref) => buildSampleProductPayload(ref),
  getCategoriesApiUrl: () => `${SAMPLE_URL_PREFIX}categories`,
  fetchCategories: async () => SAMPLE_CATEGORIES,
  getSampleCategories: () => SAMPLE_CATEGORIES,
  getProductsPageApiUrl: (query) =>
    `${SAMPLE_URL_PREFIX}products?${new URLSearchParams({
      page: String(query.page),
      size: String(query.size),
      ...(query.categorySlug ? { categorySlug: query.categorySlug } : {}),
      ...(query.search ? { q: query.search } : {}),
      ...(query.minPrice != null ? { minPrice: String(query.minPrice) } : {}),
      ...(query.maxPrice != null ? { maxPrice: String(query.maxPrice) } : {}),
      ...(query.inStockOnly ? { inStockOnly: "true" } : {}),
    }).toString()}`,
  fetchProductsPage: async (apiUrl) => {
    const queryString = apiUrl.includes("?") ? (apiUrl.split("?")[1] ?? "") : "";
    const params = new URLSearchParams(queryString);
    const numberParam = (key: string): number | null => {
      const raw = params.get(key);
      if (raw == null || raw === "") return null;
      const parsed = Number(raw);
      return Number.isFinite(parsed) ? parsed : null;
    };
    const query: ProductsPageQuery = {
      page: Number(params.get("page") ?? 0),
      size: Number(params.get("size") ?? 12),
      categorySlug: params.get("categorySlug"),
      search: params.get("q") ?? undefined,
      minPrice: numberParam("minPrice"),
      maxPrice: numberParam("maxPrice"),
      inStockOnly: params.get("inStockOnly") === "true",
    };
    return filterAndPaginateSampleProducts(query);
  },
  getSampleProductsPage: (query) => filterAndPaginateSampleProducts(query),
};

let registeredAdapter: EditorDataAdapter | null = null;

export function registerEditorDataAdapter(adapter: EditorDataAdapter): void {
  registeredAdapter = adapter;
}

export function getEditorDataAdapter(): EditorDataAdapter {
  return registeredAdapter ?? sampleEditorDataAdapter;
}

/** True when the edit canvas should use instant sample data (C2-5). */
export function useSampleDataInEditor(): boolean {
  return getEditorDataAdapter().liveDataInEditor !== true;
}

/**
 * Query keys for bound-data fetches. The literals intentionally match the
 * picker keys apps/web used before the inversion, so existing cache entries
 * and invalidations keep working.
 */
export const boundQueryKeys = {
  collectionProducts: (apiUrl: string) =>
    ["collection", "picker", "products", apiUrl] as const,
  productDetail: (id: string, apiUrl = "") =>
    ["product", "picker", id, apiUrl] as const,
  categories: () => ["public", "categories"] as const,
  productsPage: (query: ProductsPageQuery) =>
    ["public", "products-page", query] as const,
};

/** Shared react-query policy for bound-data fetches (C2-2). */
export const BOUND_QUERY_POLICY = {
  staleTime: 60_000,
  gcTime: 300_000,
  refetchOnWindowFocus: false,
  retry: 1,
} as const;
