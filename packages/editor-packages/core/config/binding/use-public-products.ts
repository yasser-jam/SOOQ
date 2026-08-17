"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BOUND_QUERY_POLICY,
  boundQueryKeys,
  getEditorDataAdapter,
  useSampleDataInEditor,
  type CollectionProductRef,
  type ProductPickerRef,
  type ProductsPageQuery,
} from "../data-adapter";

/**
 * Default page size for storefront product listings.
 *
 * Listing products is always the public paginated browse endpoint —
 * `GET /public/products?page=0&size=20`. The renderer must never reach for
 * `/admin/products/{id}` (an authenticated, per-product card endpoint): it is
 * N requests for what one listing already returns, and `apps/store` has no
 * admin credentials at all (see apps/store/CLAUDE.md — public endpoints only).
 */
export const PUBLIC_PRODUCTS_PAGE_SIZE = 20;

export type PublicProductsListOptions = {
  page?: number;
  size?: number;
  categorySlug?: string | null;
  /** Edit canvas renders the sample catalogue — no network (C2-5). */
  isEditing?: boolean;
  /** Skip the query entirely (e.g. the caller already has its data). */
  enabled?: boolean;
};

export type PublicProductsListState = {
  products: CollectionProductRef[];
  isLoading: boolean;
  isError: boolean;
  sampleMode: boolean;
};

/**
 * One public listing request per (page, size, category), shared by every block
 * on the screen through the react-query cache. The list payload already
 * carries title, price, image, stock and discount, so cards bind straight from
 * it — no per-product detail round-trip.
 */
export function usePublicProductsList({
  page = 0,
  size = PUBLIC_PRODUCTS_PAGE_SIZE,
  categorySlug = null,
  isEditing = false,
  enabled = true,
}: PublicProductsListOptions = {}): PublicProductsListState {
  const adapter = getEditorDataAdapter();
  const sampleMode = isEditing && useSampleDataInEditor();

  const query = useMemo<ProductsPageQuery>(
    () => ({ page, size, categorySlug }),
    [page, size, categorySlug]
  );
  const apiUrl = adapter.getProductsPageApiUrl(query);

  const { data, isLoading, isError } = useQuery({
    queryKey: boundQueryKeys.productsPage(query),
    queryFn: () => adapter.fetchProductsPage(apiUrl),
    enabled: enabled && !sampleMode,
    ...BOUND_QUERY_POLICY,
  });

  const products = useMemo(() => {
    if (!enabled) return [];
    if (sampleMode) return adapter.getSampleProductsPage(query).items;
    return data?.items ?? [];
  }, [adapter, data, enabled, query, sampleMode]);

  return {
    products,
    isLoading: enabled && !sampleMode && isLoading,
    isError: enabled && !sampleMode && isError,
    sampleMode,
  };
}

/**
 * The product source for a listing block: the picked collection when there is
 * one, otherwise the whole public catalogue. Both paths return the same
 * `CollectionProductRef` shape, so cards bind identically either way.
 */
export function useListingProducts({
  collectionSlug,
  isEditing = false,
  size = PUBLIC_PRODUCTS_PAGE_SIZE,
}: {
  collectionSlug?: string | null;
  isEditing?: boolean;
  size?: number;
}): PublicProductsListState {
  const adapter = getEditorDataAdapter();
  const sampleMode = isEditing && useSampleDataInEditor();
  const slug = collectionSlug?.trim() || "";
  const collectionApiUrl = slug ? adapter.getCollectionProductsApiUrl(slug) : "";

  const collectionQuery = useQuery({
    queryKey: boundQueryKeys.collectionProducts(collectionApiUrl),
    queryFn: () => adapter.fetchCollectionProducts(collectionApiUrl),
    enabled: Boolean(collectionApiUrl) && !sampleMode,
    ...BOUND_QUERY_POLICY,
  });

  const catalogue = usePublicProductsList({
    isEditing,
    size,
    enabled: !slug,
  });

  const collectionProducts = useMemo(() => {
    if (!slug) return [];
    if (sampleMode) return adapter.getSampleCollectionProducts();
    return collectionQuery.data ?? [];
  }, [adapter, collectionQuery.data, sampleMode, slug]);

  if (!slug) return catalogue;

  return {
    products: collectionProducts,
    isLoading: !sampleMode && collectionQuery.isLoading,
    isError: !sampleMode && collectionQuery.isError,
    sampleMode,
  };
}

export type ResolvedPublicProduct = {
  /** `/public/products/{slug}` detail URL, or null while unresolvable. */
  apiUrl: string | null;
  /** The listing row, when the id had to be resolved through the listing. */
  listItem: CollectionProductRef | null;
  isResolving: boolean;
};

/**
 * Public detail URL for a product picked in the editor.
 *
 * Refs saved before the picker started storing slugs only carry `{ id }`.
 * Instead of falling back to the admin card endpoint, we recover the slug from
 * the public listing — one shared request that most of the page needs anyway.
 * A ref whose id isn't on that page resolves to `null`, and the block renders
 * its authored placeholder rather than issuing an admin call it can't make.
 */
export function useResolvedPublicProduct(
  product: ProductPickerRef | null | undefined,
  {
    isEditing = false,
    enabled = true,
  }: { isEditing?: boolean; enabled?: boolean } = {}
): ResolvedPublicProduct {
  const adapter = getEditorDataAdapter();
  const productId = product?.id?.trim() ?? "";
  const pickedSlug = product?.slug?.trim() ?? "";
  const needsLookup = enabled && Boolean(productId) && !pickedSlug;

  const { products, isLoading } = usePublicProductsList({
    isEditing,
    enabled: needsLookup,
  });

  return useMemo(() => {
    const listItem = needsLookup
      ? (products.find((item) => item.id === productId) ?? null)
      : null;
    const slug = pickedSlug || listItem?.slug?.trim() || "";

    return {
      apiUrl:
        enabled && productId && slug
          ? adapter.buildPublicProductResourceMetadata(slug, productId).apiUrl
          : null,
      listItem,
      isResolving: needsLookup && isLoading,
    };
  }, [
    adapter,
    enabled,
    isLoading,
    needsLookup,
    pickedSlug,
    productId,
    products,
  ]);
}
