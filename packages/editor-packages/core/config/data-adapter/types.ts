/**
 * Core-owned data contracts for the binding layer (C2-4 dependency inversion).
 *
 * These used to live in `apps/web/modules/product/{product,collection}/data-store`
 * and were imported INTO the editor core — inverting the intended dependency
 * direction and blocking reuse (e.g. the future mobile builder). The shapes are
 * verbatim copies, so TypeScript's structural typing keeps the two sides
 * interchangeable while apps migrate their imports.
 */

export type ProductPickerRef = {
  id: string;
  titleAr?: string;
  titleEn?: string;
  slug?: string;
};

export type ProductResourceMetadata = {
  type: "product";
  method: "get";
  apiUrl: string;
  id: string;
};

export type CollectionPickerRef = {
  id: string;
  name: string;
  slug: string;
  productCount?: number;
};

export type ProductsGridResourceMetadata = {
  type: "collection";
  method: "get";
  collectionId: string;
  collectionSlug: string;
  productCount: number;
  apiUrl: string;
};

export type CollectionProductRef = {
  id: string;
  titleAr?: string;
  titleEn?: string;
  slug?: string;
  displayPrice?: string;
  basePrice?: number;
  compareAtPrice?: number;
  currencyCode?: string;
  status?: string;
  primaryImageUrl?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  tags?: Array<{ id: string; name?: string }>;
  /** Undefined when the source doesn't report stock — treated as in stock. */
  inStock?: boolean;
};

export type ProductCardVariant = {
  variantId?: string;
  attributes: Record<string, string>;
  price: number;
  compareAtPrice: number;
  stockQty: number | null;
  lowStockThreshold?: number | null;
  isActive?: boolean;
};

export type ProductCardData = {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  slug: string;
  basePrice: number;
  compareAtPrice: number;
  currencyCode: string;
  status: string;
  allowOversell: boolean;
  categories: Array<{ id: string; name?: string }>;
  tags: Array<{ id: string; name?: string }>;
  mediaUrls: string[];
  options: unknown[];
  variants: ProductCardVariant[];
};

/** Raw API payload used by editor valueContext path resolution. */
export type ProductDetailPayload = Record<string, unknown>;

export type CategoryRef = {
  id: string;
  slug: string;
  nameAr: string;
  nameEn?: string;
  productCount?: number;
  /** Nested subcategories (unlimited depth) — empty/absent for leaf categories. */
  children?: CategoryRef[];
};

export type ProductsPageQuery = {
  categorySlug?: string | null;
  search?: string;
  /** Inclusive lower bound on price (`minPrice` on the search endpoint). */
  minPrice?: number | null;
  /** Inclusive upper bound on price (`maxPrice` on the search endpoint). */
  maxPrice?: number | null;
  /** Hide out-of-stock products (`inStockOnly` on the search endpoint). */
  inStockOnly?: boolean;
  /** 0-based page index sent to `/public/products` (UI may show page + 1). */
  page: number;
  size: number;
};

/** True when the query needs `/public/products/search` rather than plain browse. */
export function hasProductsPageFilters(query: ProductsPageQuery): boolean {
  return Boolean(
    query.search?.trim() ||
      query.minPrice != null ||
      query.maxPrice != null ||
      query.inStockOnly
  );
}

export type ProductsPageResult = {
  items: CollectionProductRef[];
  totalItems: number;
  totalPages: number;
};
