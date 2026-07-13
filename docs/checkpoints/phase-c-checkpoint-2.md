# Checkpoint C-2 — Binding layer: adapter inversion + instant canvas data (Phase C, part 2)

> **Status: ready for your testing.** Follows [checkpoint C-1](./phase-c-checkpoint-1.md)
> (tested ✓). This closes Phase C (9/9).

## What changed

### 1. The edit canvas no longer waits on the network (C2-5) — the visible change

Bound blocks (product cards, product grids) now render an **instant sample catalog**
in the edit canvas: 4 Arabic sample products (عطر شرقي فاخر، حقيبة جلدية يدوية،
ساعة كلاسيكية، حذاء رياضي خفيف) with inline-SVG images and SYP prices — zero network
calls while editing. **Preview and the published storefront still fetch live data**
(verified: the preview route fires `/api/v1/public/collections/<slug>/products`).

- A product the merchant picked keeps its identity (title/slug) in the canvas — sample
  pricing/images fill the rest.
- Cards saved with real product ids get deterministic sample assignments, so a saved
  grid shows varied cards instead of blanks.
- Escape hatch: set `liveDataInEditor: true` on the adapter to restore live canvas data.

### 2. Dependency inversion — `EditorDataAdapter` (C2-4)

The binding layer used to import fetchers/types **from apps/web** (`@/modules/...`) —
backwards, and the blocker for reusing the binding layer in the future mobile builder.
Now:

- **`core/config/data-adapter/`** — core-owned types (`ProductCardData`,
  `CollectionProductRef`, metadata shapes…), the `EditorDataAdapter` interface,
  `register/getEditorDataAdapter`, the sample-data fallback adapter, shared query keys
  (kept literal-identical to the old picker keys — cache compatible) and
  `BOUND_QUERY_POLICY`.
- **`apps/web/lib/editor-data-adapter.ts`** — the axios-backed implementation,
  registered as a side effect by web's `Providers.tsx` and apps/store's
  `storefront-renderer.tsx`.
- An **architecture-guard test** fails the suite if anything in `binding/` or
  `data-adapter/` ever imports `@/modules` again.
- Documented residual coupling (out of scope, editor-only or legacy-hidden): the
  product/collection **picker fields** in Group/ProductsGrid, and the legacy
  ProductImage/ProductInfo/CategoryListMenu blocks (ProductImage still self-fetches in
  canvas — it's palette-hidden; migrate or bound-ify in the legacy-migration backlog item).

### 3. Fetch discipline + skeletons (C2-2)

- Confirmed **both** grid architectures do one fetch per grid (the Section preset's
  `CollectionProductsBoundProvider` and the legacy ProductsGrid block); per-card detail
  fetches stay disabled via `skipProductDetailFetch`.
- Shared `BOUND_QUERY_POLICY`: staleTime 60s, gcTime 5min, no refetch-on-focus, 1 retry.
- Loading state is now **shimmer skeleton cards** (one grid row) instead of a text line.

### 4. resolveData is provably idempotent (C2-3)

`resolveMetadataProp` (shared helper) in Group / ProductsGrid / CartSection; a spec
feeds each block's resolveData its own output and asserts `{}` comes back — the
re-resolve cascade guard the study doc asked for (§2.6/§4-11).

### 5. Tests (C2-1, test-first)

33 binding specs written against the pre-refactor behavior, then the refactor landed on
green: `resolve-value-context` (dot/bracket paths, ar/en shorthands, string coercion),
`resolve-bound-images` (source order, dedupe), both mappers (variant matrix fallbacks,
discount/stock-status branches), `use-bound-value` fallback order.

Bug found & fixed along the way: `resolveMediaUrl` corrupted `data:`/`blob:` URLs by
prefixing them with the media host.

## Verified

- Jest: **41 suites / 245 tests green** (7 new suites / 52 new tests since C-1).
- Core `pnpm build` (tsup CJS+ESM+DTS): passes. Touched files typecheck clean under
  apps/web's stricter tsconfig.
- Live browser session: canvas grid renders 4 sample cards (titles, prices, SVG images)
  with **0 collection requests**; preview leaks no sample data and fires the live
  request when a tenant is present; zero new console/server errors.

## Note for your test data

To exercise the grid I bound the home page's ProductsGrid block to a test collection
("مجموعة تجريبية" / slug `featured`) in your browser's site JSON. Keep it for testing
or clear it via the block's collection field.

## How to test

1. `pnpm --filter web dev` → editor → home page: the products grid shows the 4 sample
   products instantly (no spinner). DevTools Network tab: no `/collections/` or
   `/admin/products/` calls from the canvas (one `prod-004` call may appear — that's the
   legacy hidden ProductImage block, pre-existing).
2. Select a product-bound Group (بطاقة منتج) → its card renders sample data instantly.
3. معاينة (preview): the grid goes through the live fetch (empty/error without a real
   backend collection — expected in dev; sample titles must NOT appear).
4. `pnpm test` → 41 suites green.

## Next: Phase D — builder UX overhaul
Add-section flow with prefilled preset cards, empty-slot CTAs, properties-sidebar
redesign (المحتوى/التصميم/متقدم), settings-plugin reorganization, outline sync.
