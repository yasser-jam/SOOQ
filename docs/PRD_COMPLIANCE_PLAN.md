# SOOQ-Front PRD Compliance — Step-by-Step Execution Plan

> **Status:** Plan approved on 2026-05-09. **NOT YET EXECUTED.**
> **How to use:** Each phase below is a sequence of atomic, checkable steps. Work top-down. Tick the boxes `- [ ]` → `- [x]` as you complete each step. Update the Progress Dashboard below as you finish each phase.
> **Source documents:** [FRONTEND_PAGES_AND_ENDPOINTS.md](../../SOOQ-Back/docs/FRONTEND_PAGES_AND_ENDPOINTS.md) (PRD spec) + [Postman collection](../../SOOQ-Back/postman/ShopEngine.postman_collection.json) (endpoint catalog).

---

## 📊 Progress Dashboard

**Legend:** `- [ ]` = pending • `- [x]` = done • ⬜ = phase not started • 🟡 = phase in progress • ✅ = phase complete

| Phase | Branch | Status | Steps done | Notes |
|---|---|:---:|:---:|---|
| **Phase 1** — Critical bug fixes | `KV-Products` | ✅ | 24 / 24 | Pushed 2026-05-10 (commit 8871889) |
| **Phase 2** — Inline editor restructure | `KV-Products` | ✅ | 13 / 13 | Done 2026-05-10 |
| **Phase 3A** — Variant Matrix | `KV-Products` | ✅ | 11 / 11 | Done 2026-05-10 |
| **Phase 3B** — Attribute Definitions | `KV-Products` | ✅ | 13 / 13 | Done 2026-05-10 |
| **Phase 3C** — Inventory ops | `KV-Products` | ⬜ | 0 / 14 | Per user: all phases on KV-Products |
| **Phase 4A** — Collections sub-resources | `KV-Products` | ⬜ | 0 / 10 | Per user: all phases on KV-Products |
| **Phase 4B** — Bulk import | `KV-Products` | ⬜ | 0 / 16 | Per user: all phases on KV-Products |
| **Phase 4C** — Small endpoints | `KV-Products` | ⬜ | 0 / 3 | Per user: all phases on KV-Products |
| **Phase 5** — UX/NFR polish | `KV-Products` | ⬜ | 0 / 17 | After Phase 4 (final) |
| **Phase 6** — Storefront B1-B5 | TBD | ⬜ | 0 / 1 | Decision required first |
| **Final verification** | — | ⬜ | 0 / 5 | After all phases |

**Total:** 61 / 127 steps complete (48%)

> **How to update:** Each time you finish a step, change `- [ ]` to `- [x]` in that step. When a whole phase is done, update its row above: change ⬜ → ✅ and update the steps counter (e.g., `24 / 24`). Move to 🟡 mid-phase.

---

## Context

This plan brings [SOOQ-Front](../) into full PRD module compliance. Audit (2026-05-09) found **45% compliance**: 4 production bugs, 10+ missing admin pages, 27 of 49 endpoints unwired, entire storefront tier (B1-B5) absent.

The work is split into 5 implementation phases (Phase 6 is a deferred decision). Each phase is self-contained, runs on its own branch, and ends in a mergeable PR.

---

## Audit summary (what is wrong)

### 🐛 Production bugs (Phase 1)
- [modules/product/product/actions.ts:106](../apps/web/modules/product/product/actions.ts#L106) — `deleteProduct` calls `DELETE /products/{id}` (missing `/admin`) → 404
- [components/system/image-uploader.tsx:42](../apps/web/components/system/image-uploader.tsx#L42) — calls non-existent `POST admin/products/{id}/images`
- [lib/pagination.ts](../apps/web/lib/pagination.ts) — expects Spring `Page<T>`; backend returns `PagedApiResponse<T>` with `meta` object
- [components/Providers.tsx:32](../apps/web/components/Providers.tsx#L32) — `new QueryClient()` per render → cache lost

### 📐 Schema drift (Phase 1)
- Schema uses `mediaUrls: string[]`; spec mandates `mediaAssetIds: string[] | null` with `null=unchanged / []=clear / [ids]=exact list`, plus `files` parts PREPENDED on upload
- Multipart sends only `product` JSON; never appends `files` parts

### 📄 Missing admin pages
| # | Page | Spec |
|---|---|---|
| A3 | VariantMatrixPage | PRD-002, PRD-018 |
| A6 | AttributeDefinitionsPage | EAV |
| A7 | InventoryAdjustModal, InventoryBulkAdjustPage, VariantHistoryDrawer, LowStockPage | PRD-005, PRD-011 |
| A9 | ImportUploadPage, ImportPreviewPage, ImportBatchListPage, ImportBatchDetailPage | PRD-012 |

### 🏗️ Editor structure (Phase 2)
SEO and Inventory live in separate routes; spec says inline tabs. User decision: **stick to spec — merge inline.**

### 🔌 Missing endpoints (27 of 49)
Variants (3), Attributes (5), Inventory bulk/threshold/low-stock (3), Collections sub-resources (8), Imports (4), Tags by-product (1), Categories children (1), Public storefront (9 — Phase 6).

### 🎨 NFR/UX gaps (Phase 5)
- Generic empty state (NFR-UX-001)
- No auto-save (NFR-UX-006)
- No EN switcher

### ✅ Working correctly
Base URL, Bearer token, X-Tenant-ID, error envelope, RTL+Almarai, Sonner toasts, routing convention.

---

# PHASE 1 — Critical bug fixes
**Branch:** `KV-Products` (current) • **Effort:** 1.5 days • **Goal:** ship 4 bug fixes blocking prod

## 🔧 Pre-flight
- [ ] **1.0.1** Verify on branch `KV-Products`: `git -C SOOQ-Front branch --show-current`
- [ ] **1.0.2** Working tree clean: `git -C SOOQ-Front status`
- [ ] **1.0.3** Backend running locally on `http://localhost:8081/api/v1` (or update `NEXT_PUBLIC_API_URL`)

## Step 1.1 — Fix `deleteProduct` URL bug
- [ ] **1.1.1** Open [modules/product/product/actions.ts:106](../apps/web/modules/product/product/actions.ts#L106)
- [ ] **1.1.2** Change URL from `/products/${id}` → `/admin/products/${id}`
- [ ] **1.1.3** **Verify:** open a product in the dashboard, click delete, check Network tab shows `DELETE /api/v1/admin/products/{id}` with 200/204

## Step 1.2 — Fix QueryClient memoization
- [ ] **1.2.1** Open [components/Providers.tsx:32](../apps/web/components/Providers.tsx#L32)
- [ ] **1.2.2** Wrap `new QueryClient()` in `React.useState(() => new QueryClient())[0]` so it survives re-renders
- [ ] **1.2.3** **Verify:** open React DevTools → Components → Providers → confirm `QueryClient` instance is the same across renders (use stableId or compare references)

## Step 1.3 — Fix pagination shape
- [ ] **1.3.1** Open [lib/types.ts:15-24](../apps/web/lib/types.ts#L15-L24)
- [ ] **1.3.2** Add `PagedApiResponse<T>` type:
  ```ts
  export type PaginationMeta = { page: number; size: number; total: number; totalPages: number; hasNext: boolean; hasPrev: boolean };
  export type PagedApiResponse<T> = { success: boolean; data: T[]; meta: PaginationMeta; message: string | null; timestamp: number };
  ```
- [ ] **1.3.3** Open [lib/pagination.ts](../apps/web/lib/pagination.ts)
- [ ] **1.3.4** Rewrite `normalizePage` to read from backend `meta` object (not Spring's flat fields)
- [ ] **1.3.5** Run `tsc --noEmit` to find all callers; fix call sites that break
- [ ] **1.3.6** **Verify:** open products list, advance to page 2, confirm pager uses `meta.totalPages` and `meta.hasNext`

## Step 1.4 — Refactor product schema for `mediaAssetIds`
- [ ] **1.4.1** Open [modules/product/product/types.ts](../apps/web/modules/product/product/types.ts)
- [ ] **1.4.2** Replace `mediaUrls: string[]` with:
  ```ts
  mediaAssetIds: string[] | null;  // null = leave unchanged, [] = remove all, [ids] = exact list
  ```
- [ ] **1.4.3** Add transient form-only field `mediaFiles: File[]` (NOT serialized into `product` JSON)
- [ ] **1.4.4** Open [modules/product/product/schema.ts](../apps/web/modules/product/product/schema.ts) and update zod schema accordingly
- [ ] **1.4.5** Update consumers: search for `mediaUrls` across `apps/web/` and migrate

## Step 1.5 — Fix multipart upload (append `files` parts)
- [ ] **1.5.1** Open [modules/product/product/actions.ts:82-103](../apps/web/modules/product/product/actions.ts#L82-L103)
- [ ] **1.5.2** Before serializing `product` JSON, extract `mediaFiles` and EXCLUDE from JSON blob
- [ ] **1.5.3** Append each `File` to FormData as `files` (repeatable key, NOT `files[]`)
- [ ] **1.5.4** Confirm `Content-Type` header is NOT manually set (axios sets multipart boundary automatically — see [lib/api.ts:157](../apps/web/lib/api.ts#L157))
- [ ] **1.5.5** **Verify:** create a new product with 2 images → Network tab shows ONE multipart request with 1 `product` text part + 2 `files` parts

## Step 1.6 — Remove dead image uploader endpoint
- [ ] **1.6.1** Open [components/system/image-uploader.tsx:42](../apps/web/components/system/image-uploader.tsx#L42)
- [ ] **1.6.2** Delete the `api(...admin/products/${productId}/images)` POST call entirely
- [ ] **1.6.3** Convert component contract: it should only buffer `File[]` locally and emit them via `onChange(files: File[])`. NO upload.
- [ ] **1.6.4** Update prop type: change `onChange?: (files: string[]) => void` → `onChange?: (files: File[]) => void`
- [ ] **1.6.5** Search for callers of `<ImageUploader>` and migrate

## Step 1.7 — Wire editor's image change handler
- [ ] **1.7.1** Open [app/(dashboard)/products/[product-id]/page.tsx:109-117](../apps/web/app/(dashboard)/products/[product-id]/page.tsx#L109-L117)
- [ ] **1.7.2** Split `handleImageChange` into two flows:
  - Existing images (server-known IDs) → `setValue("mediaAssetIds", [...remainingIds])`
  - New uploads (`File[]`) → `setValue("mediaFiles", [...newFiles])`
- [ ] **1.7.3** **Verify (full e2e):** edit a product → remove 1 existing image, add 2 new files → save → Network tab shows multipart with `product` JSON containing `mediaAssetIds: [keptId]` + 2 `files` parts → server response has updated images in correct order

## ✅ Phase 1 closing
- [ ] **1.X.1** Run `npm run lint` — clean
- [ ] **1.X.2** Run `npm run build` — clean
- [ ] **1.X.3** All 7 steps above verified manually
- [ ] **1.X.4** Commit with message `fix(prd): critical compliance bug fixes (delete URL, multipart, pagination, query client)`
- [ ] **1.X.5** Open PR for `KV-Products` → `master` for review (DO NOT merge or push without explicit approval)

---

# PHASE 2 — Inline editor restructure
**Branch:** `KV-Editor-Inline` (off `master` after Phase 1 merges) • **Effort:** 3 days

## 🔧 Pre-flight
- [ ] **2.0.1** Phase 1 merged to `master`
- [ ] **2.0.2** Pull latest `master`, create branch: `git checkout -b KV-Editor-Inline master`
- [ ] **2.0.3** Confirm shadcn `Tabs` component exists at `packages/ui/src/components/tabs.tsx`

## Step 2.1 — Set up tab skeleton
- [ ] **2.1.1** Open [app/(dashboard)/products/[product-id]/page.tsx](../apps/web/app/(dashboard)/products/[product-id]/page.tsx)
- [ ] **2.1.2** Wrap form body with shadcn `<Tabs defaultValue="basics">` + `<TabsList>` + 7 `<TabsTrigger>` entries
- [ ] **2.1.3** Read `?tab=...` from search params for deep linking
- [ ] **2.1.4** Wrap entire form in `<FormProvider {...form}>` (from `react-hook-form`) so children can use `useFormContext()`

## Step 2.2 — Extract tab components
- [ ] **2.2.1** Create folder `apps/web/modules/product/product/components/editor-tabs/`
- [ ] **2.2.2** Create `basics-tab.tsx` — move existing card+grid (lines 151-285) verbatim. Use `useFormContext()`, NOT new `useForm`.
- [ ] **2.2.3** Create `categorization-tab.tsx` — move category + tag side rail content
- [ ] **2.2.4** Create `media-tab.tsx` — move image uploader (uses Phase 1 multipart pattern)
- [ ] **2.2.5** Create `variants-tab.tsx` — placeholder div "Variants matrix — Phase 3"
- [ ] **2.2.6** Create `inventory-tab.tsx` — placeholder div "Inventory ops — Phase 3"
- [ ] **2.2.7** Create `seo-tab.tsx` — copy SEO fields from old [seo/page.tsx](../apps/web/app/(dashboard)/products/[product-id]/seo/page.tsx)
- [ ] **2.2.8** Create `attributes-tab.tsx` — placeholder div "Custom attributes — Phase 3"

## Step 2.3 — Migrate SEO route
- [ ] **2.3.1** Open [app/(dashboard)/products/[product-id]/seo/page.tsx](../apps/web/app/(dashboard)/products/[product-id]/seo/page.tsx)
- [ ] **2.3.2** Replace entire content with `redirect()` shim → `../?tab=seo`
- [ ] **2.3.3** Add `// TODO: remove this redirect shim after 2026-06-09 (1 release window)` comment
- [ ] **2.3.4** **Verify:** any old bookmark to `/products/{id}/seo` lands on the SEO tab

## Step 2.4 — Keep inventory route as deep link
- [ ] **2.4.1** Open [app/(dashboard)/products/[product-id]/inventory/page.tsx](../apps/web/app/(dashboard)/products/[product-id]/inventory/page.tsx)
- [ ] **2.4.2** Refactor it to import and render `inventory-tab.tsx` (single source of truth)
- [ ] **2.4.3** Replace any internal `<Link>` with tab-switching navigation

## ✅ Phase 2 closing
- [ ] **2.X.1** Tab switch preserves dirty form state (test: edit basics, switch to SEO, switch back — text still there)
- [ ] **2.X.2** Single PUT on save submits all tab fields atomically
- [ ] **2.X.3** Deep link `/products/{id}?tab=seo` opens SEO tab directly
- [ ] **2.X.4** `npm run build` clean
- [ ] **2.X.5** Commit + PR

---

# PHASE 3 — Missing core admin pages (PARALLELIZABLE)
**Effort:** 6 days total. Three sub-branches can run in parallel.

## 3A — Variant Matrix
**Branch:** `KV-Variants`

### 🔧 Pre-flight
- [ ] **3A.0.1** Branch off `master` (or after Phase 2 merge): `git checkout -b KV-Variants master`

### Step 3A.1 — Create variant module
- [ ] **3A.1.1** Create `apps/web/modules/product/variant/` folder
- [ ] **3A.1.2** Create `actions.ts` with: `getVariants(productId)`, `bulkUpdateVariants(productId, payload)`, `updateVariant(productId, variantId, payload)`
- [ ] **3A.1.3** Pattern reference: [modules/product/category/actions.ts](../apps/web/modules/product/category/actions.ts)
- [ ] **3A.1.4** Endpoints (from spec):
  - `GET /admin/products/{id}/variants`
  - `PUT /admin/products/{id}/variants` (bulk save matrix)
  - `PUT /admin/products/{id}/variants/{variantId}` (single update)
- [ ] **3A.1.5** Create `types.ts` mirroring backend `VariantMatrixRequestDto` + response shape

### Step 3A.2 — Build matrix UI
- [ ] **3A.2.1** Create `components/variant-matrix.tsx`
- [ ] **3A.2.2** Cartesian product of `options[].values` (max 3 axes)
- [ ] **3A.2.3** Editable cells: SKU / price / stock / cost / barcode / weight
- [ ] **3A.2.4** Add row for adding new option value
- [ ] **3A.2.5** Use `react-hook-form` field arrays for matrix state
- [ ] **3A.2.6** If row count >200, use virtualization (`@tanstack/react-virtual` if already in deps, else flag for KarmoVsky approval)

### Step 3A.3 — Wire into Phase 2 tab
- [ ] **3A.3.1** Replace placeholder in `variants-tab.tsx` with `<VariantMatrix />`
- [ ] **3A.3.2** Connect "Save matrix" button to `bulkUpdateVariants(productId, ...)`

### ✅ Phase 3A closing
- [ ] **3A.X.1** Create options Size(S,M,L) × Color(Red,Blue) → 6 rows generated
- [ ] **3A.X.2** Edit a cell, save → server returns updated variants
- [ ] **3A.X.3** Commit + PR

## 3B — Attribute Definitions (EAV)
**Branch:** `KV-Attributes`

### 🔧 Pre-flight
- [ ] **3B.0.1** `git checkout -b KV-Attributes master`

### Step 3B.1 — Create attribute module
- [ ] **3B.1.1** Create `apps/web/modules/product/attribute/` folder
- [ ] **3B.1.2** Create `actions.ts` with 5 endpoints: list (with optional `?categoryId=`), get one, create, update (full options replacement), delete
- [ ] **3B.1.3** Endpoints:
  - `GET /admin/product-attributes`
  - `GET /admin/product-attributes/{id}`
  - `POST /admin/product-attributes`
  - `PUT /admin/product-attributes/{id}`
  - `DELETE /admin/product-attributes/{id}`
- [ ] **3B.1.4** Pattern reference: [modules/product/tag/actions.ts](../apps/web/modules/product/tag/actions.ts)

### Step 3B.2 — List page
- [ ] **3B.2.1** Create `app/(dashboard)/products/attributes/page.tsx`
- [ ] **3B.2.2** Reuse [components/system/table.tsx](../apps/web/components/system/table.tsx) DataTable pattern
- [ ] **3B.2.3** Filter dropdown: by `categoryId` (optional)
- [ ] **3B.2.4** Inline create button → opens dialog form

### Step 3B.3 — Edit page (with options sub-editor)
- [ ] **3B.3.1** Create `app/(dashboard)/products/attributes/[attribute-id]/page.tsx`
- [ ] **3B.3.2** Form fields: nameAr, nameEn, attributeKey, dataType (TEXT/NUMBER/BOOLEAN/SELECT/MULTI_SELECT), categoryId (optional), isRequired, isFilterable, isVisibleOnStorefront
- [ ] **3B.3.3** When dataType is SELECT/MULTI_SELECT: render options sub-editor (add/edit/remove option rows)
- [ ] **3B.3.4** On submit: send full options list — backend replaces all

### Step 3B.4 — Wire into product editor
- [ ] **3B.4.1** Replace placeholder in `attributes-tab.tsx` (Phase 2)
- [ ] **3B.4.2** Fetch attribute definitions for the product's category (`GET /admin/product-attributes?categoryId=...`)
- [ ] **3B.4.3** Render appropriate input per `dataType` (text input / number / checkbox / select / multi-select)
- [ ] **3B.4.4** Bind values to `attributes[]` field of `ProductUpsertRequestDto`

### ✅ Phase 3B closing
- [ ] **3B.X.1** Create a SELECT attribute with 3 options
- [ ] **3B.X.2** Assign a value via the product editor → save → Network tab shows `attributes` array in payload
- [ ] **3B.X.3** Commit + PR

## 3C — Inventory ops
**Branch:** `KV-Inventory-Ops`

### 🔧 Pre-flight
- [ ] **3C.0.1** `git checkout -b KV-Inventory-Ops master`

### Step 3C.1 — Adjust modal (single-variant)
- [ ] **3C.1.1** Create `apps/web/modules/inventory/components/adjust-modal.tsx`
- [ ] **3C.1.2** Props: `variantId`, `currentStock`, `onClose`, `onSuccess`
- [ ] **3C.1.3** Form: `quantityDelta` (number, +/-), `reasonCode` (select: MANUAL_ADJUSTMENT/IMPORT/RETURN_APPROVED)
- [ ] **3C.1.4** Submit → `POST /admin/inventory/adjust`
- [ ] **3C.1.5** Open from variant matrix row context menu

### Step 3C.2 — Bulk adjust page
- [ ] **3C.2.1** Create `app/(dashboard)/inventory/bulk-adjust/page.tsx`
- [ ] **3C.2.2** CSV-style table input: variantId | delta | reason
- [ ] **3C.2.3** Add row / remove row buttons
- [ ] **3C.2.4** Submit → `POST /admin/inventory/adjust/bulk`

### Step 3C.3 — Movement history drawer
- [ ] **3C.3.1** Create `apps/web/modules/inventory/components/variant-history-drawer.tsx`
- [ ] **3C.3.2** Use shadcn `Sheet` component for side drawer
- [ ] **3C.3.3** Fetch via `GET /admin/inventory/variants/{id}/movements?page=&size=`
- [ ] **3C.3.4** Render paginated list: timestamp / actor / delta / balance after / reason

### Step 3C.4 — Low-stock page
- [ ] **3C.4.1** Create `app/(dashboard)/inventory/low-stock/page.tsx`
- [ ] **3C.4.2** Top filter: select product → calls `GET /admin/inventory/products/{id}/low-stock`
- [ ] **3C.4.3** Render with [components/system/table.tsx](../apps/web/components/system/table.tsx)

### Step 3C.5 — Threshold inline editor
- [ ] **3C.5.1** In `inventory-tab.tsx` (Phase 2): for each variant row, allow editing `lowStockThreshold`
- [ ] **3C.5.2** On change → `PUT /admin/inventory/variants/{id}/threshold?threshold=...`

### ✅ Phase 3C closing
- [ ] **3C.X.1** Each new endpoint exercised once in browser devtools
- [ ] **3C.X.2** Toast fires on success/failure
- [ ] **3C.X.3** Commit + PR

---

# PHASE 4 — Advanced features (PARALLELIZABLE)
**Effort:** 4 days total

## 4A — Collections sub-resources
**Branch:** `KV-Collections-Rules`

### 🔧 Pre-flight
- [ ] **4A.0.1** `git checkout -b KV-Collections-Rules master`

### Step 4A.1 — Extend collection actions
- [ ] **4A.1.1** Open [modules/product/collection/actions.ts](../apps/web/modules/product/collection/actions.ts)
- [ ] **4A.1.2** Add: `listProducts(collectionId, page, size)`
- [ ] **4A.1.3** Add: `addProduct(collectionId, productId, sortOrder)`
- [ ] **4A.1.4** Add: `removeProduct(collectionId, productId)`
- [ ] **4A.1.5** Add: `reorderProducts(collectionId, productIds[])`
- [ ] **4A.1.6** Add: `createRule(collectionId, rule)`, `updateRule(collectionId, ruleId, rule)`, `deleteRule(collectionId, ruleId)`
- [ ] **4A.1.7** Add: `evaluateRules(collectionId)`, `previewRules(collectionId)`

### Step 4A.2 — Restructure collection editor with tabs
- [ ] **4A.2.1** Open [app/(dashboard)/products/collections/[collection-id]/page.tsx](../apps/web/app/(dashboard)/products/collections/[collection-id]/page.tsx)
- [ ] **4A.2.2** Add 3 tabs: **منتجات يدوية | قواعد | معاينة**
- [ ] **4A.2.3** "منتجات يدوية" tab: visible only for `MANUAL` collections — drag-to-reorder list with add/remove
- [ ] **4A.2.4** "قواعد" tab: visible only for `AUTOMATED` collections — rule builder (fieldKey, operator, value, logicGroup)
- [ ] **4A.2.5** "معاينة" tab: shows products matched by rules; includes "Trigger evaluation" button

### ✅ Phase 4A closing
- [ ] **4A.X.1** Manual flow: create MANUAL collection, add 3 products, reorder → save
- [ ] **4A.X.2** Automated flow: create AUTOMATED collection, add rule `tag = sale`, click evaluate → preview shows matched products
- [ ] **4A.X.3** Commit + PR

## 4B — Bulk import
**Branch:** `KV-Bulk-Import`

### 🔧 Pre-flight
- [ ] **4B.0.1** `git checkout -b KV-Bulk-Import master`

### Step 4B.1 — Create import module
- [ ] **4B.1.1** Create `apps/web/modules/product/import/` folder
- [ ] **4B.1.2** Create `actions.ts`:
  - `uploadImport(file, dryRun)` → `POST /admin/imports/products?dryRun=`
  - `previewImport(file)` → `POST /admin/imports/products/preview`
  - `getBatch(batchId)` → `GET /admin/imports/products/{batchId}`
  - `listBatches(page, size)` → `GET /admin/imports/products`

### Step 4B.2 — Upload page
- [ ] **4B.2.1** Create `app/(dashboard)/products/import/page.tsx`
- [ ] **4B.2.2** Drag-drop CSV/XLSX (use existing dropzone or HTML5 fallback)
- [ ] **4B.2.3** Toggle: "Dry Run (preview only)"
- [ ] **4B.2.4** On submit → call `uploadImport`; on success redirect to preview page

### Step 4B.3 — Preview page
- [ ] **4B.3.1** Create `app/(dashboard)/products/import/preview/[batch-id]/page.tsx`
- [ ] **4B.3.2** Show column auto-detect mapping
- [ ] **4B.3.3** Per-row validation errors table
- [ ] **4B.3.4** "Confirm Import" button (only if not dry-run)

### Step 4B.4 — Batch list page
- [ ] **4B.4.1** Create `app/(dashboard)/products/import/batches/page.tsx`
- [ ] **4B.4.2** DataTable with columns: batchId / uploadedAt / rowCount / status / errorsCount
- [ ] **4B.4.3** Click row → navigates to detail page

### Step 4B.5 — Batch detail page
- [ ] **4B.5.1** Create `app/(dashboard)/products/import/batches/[batch-id]/page.tsx`
- [ ] **4B.5.2** Header: status, rowCount, successCount, errorCount
- [ ] **4B.5.3** Per-row error log table

### ✅ Phase 4B closing
- [ ] **4B.X.1** Upload a sample CSV with 5 products → batch shows in list
- [ ] **4B.X.2** Open batch detail → see row-level results
- [ ] **4B.X.3** Commit + PR

## 4C — Small endpoints (do these alongside 4A or 4B)
- [ ] **4C.1** Add `getProductTags(productId)` to [modules/product/tag/actions.ts](../apps/web/modules/product/tag/actions.ts) → `GET /admin/tags/products/{productId}`
- [ ] **4C.2** Add `getCategoryChildren(id)` to [modules/product/category/actions.ts](../apps/web/modules/product/category/actions.ts) → `GET /admin/categories/{id}/children`
- [ ] **4C.3** Use these in their respective UIs (tag display in product detail, category drill-down)

---

# PHASE 5 — UX/NFR compliance
**Branch:** `KV-UX-Polish` • **Effort:** 2 days

## 🔧 Pre-flight
- [ ] **5.0.1** `git checkout -b KV-UX-Polish master`

## Step 5.1 — Contextual empty states (NFR-UX-001)
- [ ] **5.1.1** Create `apps/web/components/system/empty-state.tsx`
- [ ] **5.1.2** Props: `icon` (ReactNode), `title` (string), `description` (string), `cta?: { label: string; onClick: () => void }`
- [ ] **5.1.3** Open [components/system/table.tsx:222](../apps/web/components/system/table.tsx#L222)
- [ ] **5.1.4** Add `emptyState?: ReactNode` prop; default falls back to current `"No results."` literal
- [ ] **5.1.5** Update each list page to pass contextual empty state:
  - Products list: "لا توجد منتجات" + "إضافة منتج" CTA
  - Categories list: "لا توجد فئات" + "إنشاء فئة" CTA
  - Tags list: "لا توجد وسوم" + "إضافة وسم" CTA
  - Collections list: "لا توجد مجموعات" + "إنشاء مجموعة" CTA
  - Inventory low-stock: "كل المنتجات مخزونها كافٍ ✓"
  - Import batches: "لا توجد عمليات استيراد" + "ابدأ استيراد" CTA

## Step 5.2 — Auto-save product editor (NFR-UX-006)
- [ ] **5.2.1** Create `apps/web/modules/product/product/hooks/use-product-draft.ts`
- [ ] **5.2.2** Hook: `setInterval(30_000)` saves `form.getValues()` to `localStorage["product-draft:" + (productId ?? "new")]`
- [ ] **5.2.3** Cleanup `clearInterval` on unmount + on successful save
- [ ] **5.2.4** On editor mount: check for existing draft. If found → Sonner toast "استعادة المسودة؟" with two actions: "استعادة" (calls `form.reset(draft)`) / "تجاهل" (clears localStorage)
- [ ] **5.2.5** On successful PUT/POST: clear the draft
- [ ] **5.2.6** Wire hook into [app/(dashboard)/products/[product-id]/page.tsx](../apps/web/app/(dashboard)/products/[product-id]/page.tsx)

## Step 5.3 — EN switcher (optional/deferred)
- [ ] **5.3.1** Decision check: confirm with KarmoVsky whether to ship in this phase or defer
- [ ] **5.3.2** If shipping: extract `dir` value from [components/Providers.tsx:38](../apps/web/components/Providers.tsx#L38) into a context (`DirectionContext`)
- [ ] **5.3.3** Add language toggle in header (Arabic flag / EN flag dropdown) → flips `dir` context value
- [ ] **5.3.4** **Verify:** click toggle → entire layout flips RTL ↔ LTR

## ✅ Phase 5 closing
- [ ] **5.X.1** Open empty list page → contextual illustration + CTA visible
- [ ] **5.X.2** Edit a product, refresh page within 30s → restore prompt appears
- [ ] **5.X.3** (If 5.3 shipped) toggle language → layout flips
- [ ] **5.X.4** Commit + PR

---

# PHASE 6 — Storefront B1-B5 (DECISION NEEDED — NOT YET SCHEDULED)

The customer-facing tier (CatalogPage, SearchResultsPage, ProductDetailPage, CategoryNavMenu, CategoryProductsPage, CollectionsIndexPage, CollectionDetailPage) is missing.

## Decision required first
- [ ] **6.0.1** Choose Option A or Option B (see below)

### Option A — Skip (separate Flutter project handles store)
- **Pros:** clean separation, native mobile UX, single backend consumer per surface
- **Cons:** poor SEO (Flutter web has weak SSR), duplicate auth/cart logic if web store is later wanted
- **Cost:** zero in this repo

### Option B — Add as `app/(store)/...` routes in same Next.js app
- **Pros:** shares axios/QueryClient/types/auth, Next.js SSR for SEO (critical for storefront), fast to ship reusing existing patterns
- **Cons:** bundles admin+store, larger build, RTL/dir scoping needs care
- **Cost:** ~6-8 days

**Recommendation:** Defer until Phase 5 ships. Choose Option A unless web SSR/SEO is required.

If Option B is chosen, the steps would mirror Phase 1-5 structure (new `(store)` group, public actions module, `X-Tenant-ID` already wired in [lib/api.ts](../apps/web/lib/api.ts)).

---

## Branching strategy summary

| Phase | Branch | Effort | Blocking |
|---|---|---|---|
| 1 | `KV-Products` (current) | 1.5 days | None — ship first |
| 2 | `KV-Editor-Inline` | 3 days | Phase 1 |
| 3A | `KV-Variants` | 2 days | Phase 2 (or master after Phase 1) |
| 3B | `KV-Attributes` | 2 days | Phase 2 (parallel with 3A) |
| 3C | `KV-Inventory-Ops` | 2 days | Phase 2 (parallel with 3A/3B) |
| 4A | `KV-Collections-Rules` | 2 days | Phase 2 |
| 4B | `KV-Bulk-Import` | 2 days | Phase 1 (parallel with 4A) |
| 5 | `KV-UX-Polish` | 2 days | Phase 4 |
| 6 | TBD | 0 or 6-8 days | Decision |

**Total effort:** ~3-4 weeks. Phases 3A/3B/3C and 4A/4B can run in parallel by different developers.

---

## Final verification (after all phases complete)

- [ ] **F.1 Endpoint coverage:** every URL in [postman PRD section](../../SOOQ-Back/postman/ShopEngine.postman_collection.json) appears at least once in `apps/web/modules/**/actions.ts`
- [ ] **F.2 Page coverage:** every page name in [FRONTEND_PAGES_AND_ENDPOINTS.md](../../SOOQ-Back/docs/FRONTEND_PAGES_AND_ENDPOINTS.md) PARTS A & B exists in `apps/web/app/**/page.tsx` or `apps/web/modules/**/components/**`
- [ ] **F.3 Spec drift:** confirm `?include=` is sent as repeatable params (not comma-joined), `mediaAssetIds: null` semantics work, multipart shape correct
- [ ] **F.4 Build:** `npm run build` clean, `npm run lint` clean, no TypeScript errors
- [ ] **F.5 Re-run audit:** repeat the 2026-05-09 audit and confirm 100% compliance

---

## Critical files referenced

- [apps/web/modules/product/product/actions.ts](../apps/web/modules/product/product/actions.ts)
- [apps/web/modules/product/product/types.ts](../apps/web/modules/product/product/types.ts)
- [apps/web/modules/product/product/schema.ts](../apps/web/modules/product/product/schema.ts)
- [apps/web/app/(dashboard)/products/[product-id]/page.tsx](../apps/web/app/(dashboard)/products/[product-id]/page.tsx)
- [apps/web/app/(dashboard)/products/[product-id]/seo/page.tsx](../apps/web/app/(dashboard)/products/[product-id]/seo/page.tsx)
- [apps/web/app/(dashboard)/products/[product-id]/inventory/page.tsx](../apps/web/app/(dashboard)/products/[product-id]/inventory/page.tsx)
- [apps/web/components/system/image-uploader.tsx](../apps/web/components/system/image-uploader.tsx)
- [apps/web/components/system/table.tsx](../apps/web/components/system/table.tsx)
- [apps/web/components/Providers.tsx](../apps/web/components/Providers.tsx)
- [apps/web/lib/api.ts](../apps/web/lib/api.ts)
- [apps/web/lib/pagination.ts](../apps/web/lib/pagination.ts)
- [apps/web/lib/types.ts](../apps/web/lib/types.ts)

---

## Reusable patterns (DON'T invent — copy these)

| Need | Existing pattern | Reuse for |
|---|---|---|
| API actions module | `apps/web/modules/product/category/actions.ts` | New `attribute/`, `variant/`, `import/` |
| List page with table + pagination | `apps/web/modules/product/tag/components/table.tsx` | Low-stock list, attribute list, import batches |
| Edit page (list + dynamic route) | `apps/web/modules/product/category/[category-id]/page.tsx` | Attribute edit, variant detail |
| Multipart FormData | `apps/web/modules/product/product/actions.ts:82-103` (after Phase 1) | Bulk import upload |
| Form with zod | Existing product editor `useForm + zodResolver` | All new editor forms |
| Toast on mutation | Auto via [lib/api.ts:106](../apps/web/lib/api.ts#L106) for errors; explicit `toast.success(...)` for success | Every new mutation |

---

**Recommendation: start with Phase 1 on `KV-Products`. Step 1.0.1 → 1.X.5 should take 1-2 working days. Each subsequent phase needs its own branch from `master` after each merge — DO NOT bundle them.**
