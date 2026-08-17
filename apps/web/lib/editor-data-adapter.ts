"use client"

/**
 * The axios-backed implementation of the editor core's `EditorDataAdapter`
 * (C2-4 dependency inversion): core defines the interface, this module plugs
 * the real data-store functions in. Imported for its side effect from
 * `apps/web/components/Providers.tsx` (all web surfaces) and from
 * `apps/store/components/storefront-renderer.tsx` (published storefront —
 * apps/store aliases `@/lib` into apps/web).
 */
import {
  registerEditorDataAdapter,
  SAMPLE_CATEGORIES,
  SAMPLE_COLLECTION_PRODUCTS,
  buildSampleProductPayload,
  filterAndPaginateSampleProducts,
  type EditorDataAdapter,
  type ProductsPageQuery,
} from "@/core/config/data-adapter"
import {
  buildProductsGridResourceMetadata,
  fetchCollectionProductsFromUrl,
  getCollectionProductsApiUrl,
} from "@/modules/product/collection/data-store"
import {
  fetchCategoriesFromUrl,
  getCategoriesApiUrl,
} from "@/modules/product/category/public-data-store"
import {
  buildPublicProductResourceMetadata,
  fetchProductDetailPayloadFromUrl,
} from "@/modules/product/product/data-store"
import {
  fetchProductsPageFromUrl,
  getProductsPageApiUrl,
} from "@/modules/product/product/public-data-store"

const apiEditorDataAdapter: EditorDataAdapter = {
  getCollectionProductsApiUrl,
  fetchCollectionProducts: fetchCollectionProductsFromUrl,
  buildProductsGridResourceMetadata,
  fetchProductDetailPayload: fetchProductDetailPayloadFromUrl,
  buildPublicProductResourceMetadata,
  getSampleCollectionProducts: () => SAMPLE_COLLECTION_PRODUCTS,
  getSampleProductPayload: buildSampleProductPayload,
  getCategoriesApiUrl,
  fetchCategories: fetchCategoriesFromUrl,
  getSampleCategories: () => SAMPLE_CATEGORIES,
  getProductsPageApiUrl,
  fetchProductsPage: fetchProductsPageFromUrl,
  getSampleProductsPage: (query: ProductsPageQuery) =>
    filterAndPaginateSampleProducts(query),
}

registerEditorDataAdapter(apiEditorDataAdapter)

export { apiEditorDataAdapter }
