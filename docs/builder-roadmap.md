# SOOQ Builder — 5-Day Cleanup & Enhancement Roadmap

> **Status:** ✅ Plan confirmed 2026-07-11 — execution started same day. Supersedes the phasing in
> [editor-study-and-enhancement-plan.md](./editor-study-and-enhancement-plan.md) (the *analysis*
> there is still valid and referenced as "§" below; this doc re-sequences the work for the
> 5-day deadline and folds in aspects added after that study: `zones` plugin, `presets/`,
> `binding/`, static `themes/*.json`).
>
> **Decisions locked in:**
> - Persistence stays **localStorage + static theme JSON** (`packages/editor-packages/core/themes/theme-{1,2,3}.json`). Backend template management is **deferred**.
> - **Cleanup before new features.** No new builder capability lands on top of the current mess.
> - Tests are written **before** each refactor they protect, not after.
>
> **How to use:** tick `- [ ]` → `- [x]`, update the dashboard per phase.

---

## 📊 Progress Dashboard

| Phase | Day | Theme | Status | Steps done |
|---|---|---|:---:|:---:|
| **A** — Stabilize + safety net | Day 1 | RAM/crash fixes, dead code purge, test harness | ✅ | 12 / 12 — [checkpoint A-1](./checkpoints/phase-a-checkpoint-1.md) tested ✓, [checkpoint A-2](./checkpoints/phase-a-checkpoint-2.md) awaiting user test |
| **B** — Consolidation | Day 2 | Single registry, legacy blocks, redundancy | ✅ | 4 done + 4 re-scoped to backlog with evidence — [checkpoint B-1](./checkpoints/phase-b-checkpoint-1.md) awaiting user test |
| **C** — Interaction quality | Day 3 | DnD, selection outline, binding perf | ⬜ | 0 / 9 |
| **D** — Builder UX overhaul | Day 4 | Add-section flow, properties sidebar, settings | ⬜ | 0 / 8 |
| **E** — Store-creation wizard | Day 5 | Logo → palette → template genesis + verification | ⬜ | 0 / 9 |

**Deferred (post-deadline):** backend Site JSON persistence/publish, template gallery from
backend, mobile-app JSON builder instance, Puck ≥0.22 rebase.

---

# PHASE A — Day 1 — Stabilize + safety net

**Goal:** dev server stops eating RAM/crashing; a regression net exists before we refactor.

## A1. Baseline metrics (30 min, do FIRST — §7)
- [x] **A1-1** Record: cold `pnpm --filter web dev` time to first editor paint; heap snapshot
  after 5 min of editing; keystroke→canvas latency; editor route chunk size.
  Save numbers in `docs/editor-perf.md`. *(Done 2026-07-11: 28 s route compile, 2.2–2.6 GB
  RSS, machine has only 7.6 GB total — browser-side latency metrics deferred to checkpoint
  test, needs a logged-in session.)*

## A2. Crash/RAM fixes (updated to current code state)
- [x] **A2-1** `config/index.tsx:223` — replace `componentKey = Buffer.from(...)` with a
  constant (`"v1"`). ⚠️ This changes the localStorage key — added a one-shot migration in
  `site-data.ts` that adopts any legacy `puck-demo:*:site` payload. §2.1
- [x] **A2-2** `client.tsx` — `metadata`/`fieldTransforms` are module constants,
  `iframe` memoized; dialog/hint state moved into new `EditorFloatingTools` (rendered
  inside `overrides.puck`) so UI toggles no longer recreate `overrides`;
  `handleOpenPreview` stabilized via ref; `savePageData` wrapped in `useCallback`. §2.3
- [x] **A2-3** `normalize-editor-data.ts` — `structuredClone` for deep clones. Instead of
  the (unsafe) early-exit, added a raw-string cache to `readSiteData` — repeat reads of
  unchanged localStorage no longer re-parse/re-normalize at all — and removed the
  discarded per-page zone re-normalization inside `normalizeSiteData`. §2.5
- [x] **A2-4** JSON viewer subscribes to Puck data only while open. §2.5
- [x] **A2-5** resolve-data cache cleared on Puck unmount (covers page switches via
  `key={path}` and HMR). §2.4
- [x] **A2-6** `CanvasContextMenu` — 500 ms `setInterval` replaced with MutationObserver
  + existing iframe `load` listener. §2.7
- [x] **A2-7** `ThemeInjector` — static sheet written once per document; theme values
  applied via per-variable `style.setProperty`. §3.8
- [x] **A2-8** `happy-dom` removed (was entirely unused); web dev script capped at
  `--max-old-space-size=3072` — **not** the doc's 8192, the machine has 7.6 GB total. §3.3

## A3. Dead weight purge (big dev-graph win)
- [x] **A3-1** Deleted (2026-07-12): root `app/`, `packages/core`,
  `packages/create-puck-app`, `packages/field-contentful`, top-level
  `packages/plugin-emotion-cache` + `packages/plugin-heading-analyzer`,
  `packages/tsup-config`, `packages/tsconfig`, `packages/eslint-config-custom`,
  `apps/demo`, `apps/editor` (all were package.json-less husks of gitignored
  dist/node_modules), the empty legacy `apps/web/app/(dashboard)/` group, and the
  `/shop/[storeSlug]/(storefront)` placeholder (customer-auth pages kept). Verified: no
  references, `pnpm install` + full jest green, home/editor/shop-auth routes all 200.

## A4. Test harness (before any Phase B refactor)
- [x] **A4-1** Harness was actually broken (ts-node missing → the TS jest config never
  parsed; no spec had ever run). Replaced with `jest.config.mjs` + pnpm-aware transform
  patterns + jsdom polyfills. **The full upstream Puck suite (30 suites) now runs** —
  129/130 passed on revival; 1 stale snapshot updated. Root `pnpm test` → `turbo test`.
- [x] **A4-2** Fixture round-trip suite added
  (`config/lib/__tests__/site-data-fixtures.spec.ts`): theme-1/2/3.json → normalize →
  idempotence, page-path preservation, shell-zone placement, composePuckData renderability,
  dynamic-route matching, id uniqueness. 19 assertions, all green.

**Exit criteria Day 1:** editor opens and types without store re-init per keystroke; dev RSS
stable over 10 min; fixture suite green.

---

# PHASE B — Day 2 — Consolidation (redundancy & tech debt)

**Goal:** one source of truth for blocks; legacy weight gone or quarantined.

- [x] **B-1** Registry-consistency spec added (`config/__tests__/registry-consistency.spec.ts`):
  palette categories, all section/zone presets, initialData pages, and theme fixtures must
  only reference registered block types; every registered block must have a render.
  34 assertions, green.
- [x] **B-2** Investigation showed `server.tsx` **and** `rsc.tsx` were both imported by
  nothing — the "triplicated registry" was one live file + two dead copies. Deleted both
  (plus orphaned `Hero/server.tsx`, `Template/server.tsx`). `config/index.tsx` is now the
  single registry, guarded by B-1. §3.1
- [~] **B-3** *Re-scoped with evidence:* the theme fixtures **actively use 7 legacy types**
  (Heading, Text, NavMenu, Card, ProductImage, Hero, ProductsGrid) — deleting/migrating them
  means rewriting the shipped themes; and Tiptap is imported by the core inline-editing
  pipeline (`store/index.ts`, field-transforms), so lazy-loading the legacy RichText block
  frees ~nothing. Migrations moved to the deferred backlog; no lazy-loading theater.
- [~] **B-4** *Deferred:* RowGroup is used by fixtures (3×), header zone presets, and the
  zone-preset spec. Merging into Group right before Phase D builds on those presets is the
  wrong week — backlog, with a note that new work should prefer `Group`.
- [x] **B-5** *Scoped:* removed the commented-out shell-rail import + style blocks from
  `root.tsx`. Kept `shell-zones.ts` and the normalize migration branches **deliberately** —
  they are live code: the outline panel references the constants and the migration protects
  old saved sites (rail zones → drawer zone). §3.7
- [~] **B-6** *Deferred:* whether the theme-gallery demo pages ship in fresh sites is a
  product decision tied to the Phase E wizard (which likely replaces that flow); the gallery
  pages are also present in the theme fixtures. Revisit in Phase E.
- [x] **B-7** Circular imports out of `Template/client.tsx` removed: `componentKey` moved to
  its own `config/component-key.ts` module (site-data imports it from there too), demo
  templates use direct sibling block imports, and the save-template flow gets `config` from
  `usePuck` instead of re-importing the registry. §4-10
- [~] **B-8** *Deferred with data:* `ignoreBuildErrors` hides **223 errors** via web's
  typecheck and **717** under the core package's own strict tsconfig — all inside the
  Puck fork, spread over 60+ files (upstream strictness debt). Fixing that is bundled with
  the Puck-rebase backlog item. Current type safety net: the package `tsup` DTS build
  (passing) + 183 jest tests.

**Exit criteria Day 2:** one registry; `pnpm build` green with TS errors on; fixture +
registry suites green; editor bundle measurably smaller.

---

# PHASE C — Day 3 — Interaction quality (DnD, outline, binding)

**Goal:** drag-and-drop is smooth and crash-free; selection outline hugs the element; bound
blocks fetch once and render fast.

## C1. Drag & drop + selection
- [ ] **C1-1** Re-test DnD lag *after* Phase A (most jank came from the store re-init +
  style mirroring). Profile what remains (`DragDropContext`, `DraggableComponent`,
  `DropZone`).
- [ ] **C1-2** Selection-outline misalignment: audit for **RTL**. The app is `dir="rtl"` and
  upstream Puck assumes LTR — check `getBoundingClientRect` / `left:` positioning in
  `DraggableComponent` overlay and the shopify-editor outline; use logical properties or
  mirror offsets when `dir==="rtl"`.
- [ ] **C1-3** DnD crash repro: add an error boundary around each block render inside the
  canvas (one bad block must not kill the editor) + a top-level canvas boundary with
  "reload canvas" action.
- [ ] **C1-4** Draft autosave: debounce-write current page to localStorage during editing so
  a crash never loses work (publish stays explicit).

## C2. Data binding (ProductCard / ProductsGrid / contextValue)
- [ ] **C2-1** *(test first)* Unit specs for `binding/`: `map-collection-product-to-bound-data`,
  `map-payload-to-card-data`, `resolve-value-context`, `use-bound-value` fallback order.
- [ ] **C2-2** ProductsGrid: guarantee **one** fetch per grid (via
  `CollectionProductsBoundProvider` + react-query, already close) — verify no per-card
  `resolveData` fetches remain; add `staleTime`/`gcTime` policy; skeleton cards while loading.
- [ ] **C2-3** Stabilize `resolveData` metadata references across `Group`, `ProductCard`,
  `ProductsGrid`, `CartSection` (shared `metadataResolver` helper) so dispatches stop
  cascading re-resolves. §2.6, §4-11
- [ ] **C2-4** **Invert the dependency**: `binding/product-actions.ts` and
  `CollectionProductsBoundProvider` import from `apps/web` (`@/modules/...`). Define a
  `DataAdapter` interface in core, injected via Puck `metadata`/config from each app —
  prerequisite for the mobile builder reusing the binding layer.
- [ ] **C2-5** Editor-mode behavior: bound blocks render sample/demo data instantly in the
  canvas and only hit the real API in preview/store (flag via metadata), so editing stays fast.

**Exit criteria Day 3:** DnD smooth on a 30-block page; outline correct in RTL; a grid of 12
products = 1 network request; crash in one block leaves the editor alive.

---

# PHASE D — Day 4 — Builder UX overhaul

**Goal:** adding a section is delightful, not an empty-slot puzzle; the properties sidebar is
organized; settings plugin is first-class.

- [ ] **D-1** **Add-section flow**: replace "insert empty Section → hunt for blocks" with the
  section catalog inserting **prefilled presets** (`config/presets/*` + shopify-editor
  `AddSectionModal`/`section-catalog`): visual preview cards, categories (hero, products,
  content, footer…), one click = fully populated section.
- [ ] **D-2** Empty-slot affordance: any empty slot/zone renders a friendly placeholder with
  a "+ إضافة عنصر" CTA opening the palette scoped to that slot (no more dead gray boxes).
- [ ] **D-3** **Properties sidebar redesign**: group fields into collapsible sections with
  tabs — *المحتوى / التصميم / متقدم* (Content/Style/Advanced); consistent field widths;
  color/typography fields get previews; sticky block title + breadcrumb at top.
- [ ] **D-4** Field-level polish: reuse `fields/` primitives (BilingualText, ColorField,
  LinkField) everywhere; kill one-off inline field styles in blocks.
- [ ] **D-5** **Settings plugin** (priority): reorganize `SettingsPanel` around the theme
  model (colors / typography / layout / buttons / badges per `theme.ts` sections); live
  preview via the (now cheap) per-variable ThemeInjector; "reset to theme preset" action.
- [ ] **D-6** Outline (shopify-editor panel): selection sync canvas↔outline both directions,
  hover highlight, drag-reorder within outline kept working after C1 changes.
- [ ] **D-7** Split `CanvasContextMenu.tsx` (798 lines) into the 4 hooks + portal component —
  makes D-work reviewable. §4-4
- [ ] **D-8** *(tests)* Specs for preset insertion (D-1/D-2): applying each catalog preset
  produces valid normalized data (extends B-1 suite).

**Exit criteria Day 4:** a non-technical user can build a homepage from presets alone; sidebar
sections collapse/expand; settings edits reflect live.

---

# PHASE E — Day 5 — Store-creation wizard + verification

**Goal:** creating a store starts from a guided dialog that generates the initial template
settings; everything re-verified.

## E1. Wizard ("Template Genesis") — dialog on store create / design-studio first run
- [ ] **E1-1** Step 1 — Logo upload: client-side color extraction (canvas downsample +
  k-means/median-cut — no heavy dependency).
- [ ] **E1-2** Step 2 — Palette suggestions: generate 3–4 palettes from extracted colors,
  **contrast-checked** (WCAG AA for text-on-primary/surface); user picks or tweaks.
- [ ] **E1-3** Step 3 — Style choices: radius (sharp/soft/round), spacing density, font
  weight feel — mapped onto existing `FullThemeProps` scale/button vars in `theme.ts`.
- [ ] **E1-4** Step 4 — Font suggestions: pairs from the existing font registry
  (`theme.ts` fonts), Arabic-first pairings, live preview.
- [ ] **E1-5** Step 5 — Header & footer: pick from `presets/header-layouts.ts` /
  `presets/footer.ts` with mini-previews rendered using the chosen palette.
- [ ] **E1-6** Step 6 — Hero + product-card look: `presets/hero.ts` +
  `presets/products-grid.ts` card variants, previewed with the palette.
- [ ] **E1-7** Output: compose `FullThemeProps` + initial `SiteData` (home page from chosen
  presets) → save as a **named custom theme preset** (appears in ThemesPanel) → seed
  `site-data` localStorage → open the editor on the result. Keep the output shape
  renderer-agnostic (pure JSON) so the future mobile builder consumes the same wizard result.
- [ ] **E1-8** *(tests)* Palette generation determinism + contrast assertions; wizard output
  passes the fixture round-trip suite.

## E2. Final verification
- [ ] **E2-1** Re-run A1 metrics → record in `docs/editor-perf.md`; full manual pass:
  create store via wizard → edit → add sections → bind products grid → preview → open in
  `apps/store`; `pnpm build && pnpm typecheck && pnpm --filter @puckeditor/core test` green;
  update this dashboard + CLAUDE.md files if structure changed.

**Exit criteria Day 5:** demo-able end-to-end story: *logo in → branded store template out →
edit visually → see it live on the store app.*

---

## Test map (what protects what)

| Suite | Protects | Phase |
|---|---|---|
| Fixture round-trip (`themes/*.json` + saved-site fixtures → normalize → idempotent) | site-data/normalize refactors, migrations, wizard output | A4, B, E |
| Registry consistency (presets/fixtures reference real blocks; all contexts render) | registry collapse, legacy removal | B |
| Binding unit specs (mappers, value context, fallbacks) | binding optimization, adapter inversion | C |
| Preset insertion specs (catalog → valid data) | add-section UX | D |
| Palette/contrast specs | wizard | E |
| Existing `apply-zone-preset.spec.ts` | zones plugin | keep green |

## Deferred backlog (explicitly out of the 5 days)
1. Backend Site JSON persistence + versioned publish (§ Phase 5 of the study doc).
2. Template gallery served from backend.
3. **Mobile builder**: second registry + second SiteData document reusing pages/zones/binding
   (unblocked by C2-4 adapter inversion + E1-7 renderer-agnostic wizard output).
4. Puck ≥ 0.22 rebase or proper fork ownership (`@sooq/editor-core` rename, prebuilt package,
   drop `transpilePackages`). § Phase 4. **Bundle here:** the ~700 strictness TS errors
   (B-8) — fixing them against 0.21 then rebasing is double work.
5. E2E smoke (Playwright): open editor → add section → drag → save → render in store.
6. Legacy-block migrations (B-3): Heading→ContentHeading, Text→ContentParagraph,
   Card/Hero/NavMenu/ProductImage/ProductsGrid → modern equivalents — requires rewriting
   `themes/theme-{1,2,3}.json` in the same change; the fixture + registry suites are the
   safety net when this happens.
7. RowGroup↔Group merge (B-4) — after Phase D, since header presets build on RowGroup today.
8. Theme-gallery pages out of `initial-data.ts` (B-6) — decide alongside the Phase E wizard.
