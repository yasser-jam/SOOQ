# Products Page Feature

Searchable, category-filtered, paginated product listing for the published storefront.

## State ownership

All filter state lives in one shared `productsPage` slice on `StoreContext`, implemented in [`apps/store/lib/use-products-page-state.ts`](../../../../apps/store/lib/use-products-page-state.ts) and wired through [`apps/store/components/StoreProvider.tsx`](../../../../apps/store/components/StoreProvider.tsx).

| Field | Purpose |
|---|---|
| `categories` | Loaded once via `GET /public/categories` |
| `selectedCategorySlug` | Active category filter (`null` = all) |
| `search` | Immediate input value |
| `page` / `pageSize` / `totalPages` | Pagination |
| `products` | Current page of products |

Actions: `setCategory`, `setSearch`, `setPage`, `resetProductsPage`.

**v1 limitation:** one global slice per storefront — two Products Page sections on the same page share state. Section-scoping is a documented follow-up.

## Block coordination

| Block | Role |
|---|---|
| `ProductSearchInput` | Writes `actions.productsPage.setSearch` (debounced query in provider) |
| `ButtonGroup` (`bindingMode: "categories"`) | Reads categories, writes `setCategory` |
| `ButtonGroup` (`bindingMode: "pagination"`) | Reads `totalPages`/`page`, writes `setPage` |
| `Section` (`metadata.preset: "products-page"`) | `ProductsPageTemplateRepeater` renders `productsPage.products` |

Editor blocks stay stateless; the edit canvas uses sample data via `EditorDataAdapter.getSampleCategories()` / `getSampleProductsPage()`.

## Data layer

Public endpoints (mock + real via `publicApi`):

- `GET /public/categories` → `CategoryRef[]`
- `GET /public/products?categorySlug=&search=&page=&size=` → `PagedApiResponse` → `ProductsPageResult`

Data stores: [`apps/web/modules/product/category/public-data-store.ts`](../../../../apps/web/modules/product/category/public-data-store.ts), [`apps/web/modules/product/product/public-data-store.ts`](../../../../apps/web/modules/product/product/public-data-store.ts).

## URL sync

Storefront URL reflects filters: `?category=<slug>&search=<q>&page=<n>`. Hydrated on mount; updated via `router.replace(..., { scroll: false })` with debounced search writes.

## Preset

Use **صفحة المنتجات** in Design Studio → Pages panel, or drop the **صفحة المنتجات** section preset from the catalog. Factory: `createProductsPagePreset()` in [`packages/editor-packages/core/config/presets/products-page.ts`](../packages/editor-packages/core/config/presets/products-page.ts).
