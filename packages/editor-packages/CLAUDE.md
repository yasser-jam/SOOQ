# packages/editor-packages — The Visual Editor (forked Puck 0.21.1)

`core/` is a **vendored fork of Puck** (`@puckeditor/core`) with heavy customization.
Consumed via the `@/core` path alias from both `apps/web` (edit mode, Design Studio) and
`apps/store` (render mode). **Read `docs/editor-study-and-enhancement-plan.md` before any
non-trivial change here** — it maps the architecture and known bottlenecks file-by-line.

## Where things live in `core/`

- `components/` — mostly **upstream Puck UI** (Puck shell, DragDropContext, DropZone,
  DraggableComponent, Drawer, AutoFrame iframe + style mirroring). Avoid editing unless the
  change is genuinely editor-framework level; upstream diffs get harder every touch.
- `config/` — **all SOOQ-specific code**:
  - `config/blocks/*` — ~55 block definitions (Section, Grid, Hero, ProductCard, ProductsGrid,
    CartSection, CheckoutForm, SiteHeader/Footer, Zone* overlays…). See `blocks/BLOCKS.md`
    and `blocks/ZONES.md`. Each block = folder with the Puck `ComponentConfig`.
  - `config/index.tsx` — the **single** block registry (the palette). The old
    `server.tsx`/`rsc.tsx` duplicates were dead code, deleted 2026-07-12 (Phase B);
    `config/__tests__/registry-consistency.spec.ts` guards presets/palette/fixtures
    against unregistered types.
  - `config/plugins/*` — first-party plugins: `pages` (page manager), `zones` (shell zones:
    drawers/popups/bottom-sheets), `themes` (theme presets/marketplace), `settings`
    (root/theme fields + ThemeInjector), `shopify-editor` (Shopify-style outline UI),
    `canvas-interactions`, `html-block-palette`, `json-viewer`.
  - `config/binding/` — `useBoundData` / `useBoundValue`: binds block props to live product
    data at render time. Fully spec-covered; imports **nothing from apps/web** (guarded
    by a test).
  - `config/data-adapter/` — `EditorDataAdapter` interface + core-owned data types +
    sample catalog. Apps register the axios-backed implementation
    (`apps/web/lib/editor-data-adapter.ts`) at startup; without one, the sample adapter
    serves demo data. The **edit canvas always renders instant sample data**
    (no network); preview/storefront fetch live.
  - `config/lib/site-data.ts` — **the Site JSON contract** (most important file):
    `SiteData = { root (theme/shell), zones, pages: SitePage[] }`; each `SitePage` has a route
    pattern (`/products/:product-slug`), slug, and Puck `content`. Read/write via
    `readSiteData` / `applyPuckSave` / `normalizeSiteData` / `composePuckData` / `findSitePage`.
    Persistence today is **localStorage** (`puck-demo:<componentKey>:site`) — no backend yet.
  - `config/page-registry.ts`, `config/pages.ts` — built-in page definitions + registry events
    (`PAGES_UPDATED_EVENT`).
  - `config/theme.ts`, `config/presets` — `FullThemeProps` theme model + presets.

## How the pieces connect

```
apps/web design-studio [...puckPath]/client.tsx
  └─ <Puck config plugins=[pages, zones, themes, settings, shopify-editor, …]>
       └─ onPublish/save → applyPuckSave → site-data (localStorage)
apps/store [[...slug]]/page.tsx
  └─ useStorefrontData → readSiteData + findSitePage + composePuckData
       └─ resolveAllData → <Render config data>   (same block registry, render-only)
```

The mobile-app builder (planned) should be a **second Site JSON instance** with its own
config/registry, reusing this same SiteData/pages machinery.

## Known perf traps (verified in docs/editor-study-and-enhancement-plan.md)

- `Buffer.from` in `config/index.tsx` pulls the Node polyfill into the client bundle.
- Recreating `metadata`/`iframe` props on each render of the editor client remounts the
  whole Puck store — keep them referentially stable (useMemo/const).
- `normalizeEditorData` deep-clones the entire site tree; don't call it in hot paths.
- `resolve-component-data.ts` has an unbounded module-level cache.
- All blocks are eagerly imported by the `config/index.tsx` barrel; combined with
  `transpilePackages` in web's next config, any edit recompiles everything.

## Conventions

- New block: create `config/blocks/<Name>/`, register in **config/index.tsx** (single registry),
  add to the palette category in `config/options.ts`/plugin palettes, document in `BLOCKS.md`.
- Blocks must render safely in three contexts: editor iframe, client `<Render>`, RSC.
- Anything user-visible: Arabic labels, RTL-safe styles.
- Other packages here: `plugin-heading-analyzer`, `plugin-emotion-cache` (aliased/imported by
  web), plus local `tsconfig`/`tsup-config`/`eslint-config-custom` used by the fork's build.
