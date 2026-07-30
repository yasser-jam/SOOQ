# Products Page Feature

Searchable product listing for the published storefront — filterable by category, price range and availability, and paginated.

## State ownership

All filter state lives in one shared `productsPage` slice on `StoreContext`, implemented once in [`apps/web/modules/storefront/lib/use-products-page-state.ts`](../apps/web/modules/storefront/lib/use-products-page-state.ts) and wired through both `StoreProvider`s (`apps/web/modules/storefront/components/StoreProvider.tsx` and `apps/store/components/StoreProvider.tsx` — the latter imports the same hook via the `@/modules/*` alias).

| Field | Purpose |
|---|---|
| `categories` | Loaded once via `GET /public/categories` |
| `selectedCategorySlug` | Active category filter (`null` = all) |
| `search` | Immediate input value |
| `minPrice` / `maxPrice` | Inclusive price bounds (`null` = unbounded) |
| `inStockOnly` | Hide out-of-stock products |
| `page` / `pageSize` / `totalPages` | Pagination |
| `products` | Current page of products |

Actions: `setCategory`, `setSearch`, `setMinPrice`, `setMaxPrice`, `setInStockOnly`, `setPage`, `resetProductsPage`.

Changing any filter resets `page` to 1. Typed filters (search + prices) are debounced 250 ms before reaching the API and the URL; category, stock and pagination apply immediately.

**v1 limitation:** one global slice per storefront — two Products Page sections on the same page share state. Section-scoping is a documented follow-up.

## Block coordination

| Block | Role |
|---|---|
| `ContentInput` (`inputAction: "search_products"`) | Writes `actions.searchProducts` (debounced); bound in `StoreProvider` |
| `ContentInput` (`inputAction: "filter_min_price"` / `"filter_max_price"`) | Writes `setMinPrice` / `setMaxPrice`; empty field clears the bound |
| `ContentSwitch` (`switchAction: "filter_in_stock_only"`) | Reads/writes `inStockOnly` |
| `ButtonGroup` (`bindingMode: "categories"`) | Reads categories, writes `setCategory` |
| `ButtonGroup` (`bindingMode: "pagination"`) | Reads `totalPages`/`page`, writes `setPage` |
| `Section` (`metadata.preset: "products-page"`) | `ProductsPageTemplateRepeater` renders `productsPage.products` |

Editor blocks stay stateless; the edit canvas uses sample data via `EditorDataAdapter.getSampleCategories()` / `getSampleProductsPage()`.

## Data layer

Public endpoints (mock + real via `publicApi`):

- `GET /public/categories` → `CategoryRef[]`
- `GET /public/products?categorySlug=&page=&size=` → plain browse, used when no search/price/stock filter is active
- `GET /public/products/search?q=&minPrice=&maxPrice=&inStockOnly=&page=&size=` → used as soon as any of those filters is set (`q` is sent even when empty, for filter-only requests)

`getProductsPageApiPath()` picks between the two; `hasProductsPageFilters()` in `@/core/config/data-adapter/types` is the predicate.

Data stores: [`apps/web/modules/product/category/public-data-store.ts`](../apps/web/modules/product/category/public-data-store.ts), [`apps/web/modules/product/product/public-data-store.ts`](../apps/web/modules/product/product/public-data-store.ts).

## URL sync

Storefront URL reflects filters: `?category=<slug>&search=<q>&minPrice=<n>&maxPrice=<n>&inStock=true&page=<n>`. Hydrated on mount; updated via `router.replace(..., { scroll: false })` with debounced search writes.

## Preset

Use **صفحة المنتجات** in Design Studio → Pages panel, or drop the **صفحة المنتجات** section preset from the catalog. Factory: `createProductsPagePreset()` in [`packages/editor-packages/core/config/presets/products-page.ts`](../packages/editor-packages/core/config/presets/products-page.ts); the search box and the price/stock filter row come from `createProductsSearchInput()` / `createProductsFilterBar()` in [`products-grid.ts`](../packages/editor-packages/core/config/presets/products-grid.ts).

Every filter control is an ordinary editable block — the binding (`inputAction` / `switchAction` / `bindingMode`), not the position, is what wires it to the store. The `theme-meridian-almarai` static theme carries the same set on its `/products` page.
