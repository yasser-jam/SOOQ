# Editor Code Roadmap

A map of every layer in `packages/editor-packages/core` — what each file does, how the pieces fit together, and how data flows from the merchant's keystroke to the rendered storefront.

---

## 1. Big Picture

```
┌─────────────────────────────────────────────────────────┐
│  apps/web  (Design Studio – edit mode)                  │
│  app/store/[storeSlug]/design-studio/[...puckPath]/     │
│    client.tsx  →  <Puck config plugins=[…]>             │
│                      ↑ produces SiteData                │
│                      ↓ writes to localStorage           │
└─────────────────────────────────────────────────────────┘
               shared block registry
┌─────────────────────────────────────────────────────────┐
│  packages/editor-packages/core  (@puckeditor/core)      │
│  Forked Puck 0.21.1 + all SOOQ customization            │
└─────────────────────────────────────────────────────────┘
               shared block registry
┌─────────────────────────────────────────────────────────┐
│  apps/store  (storefront – render mode)                 │
│  app/[[...slug]]/page.tsx                               │
│    readSiteData → composePuckData → <Render config>     │
└─────────────────────────────────────────────────────────┘
```

The same `config/index.tsx` block registry is consumed by **both** apps. In `apps/web` it powers the drag-and-drop editor; in `apps/store` it drives the static `<Render>`. No block knows which context it is in — but blocks can call `useAppStore` to read editor state (e.g. to show edit-mode badges or skip animations).

---

## 2. Directory Map

```
packages/editor-packages/core/
├── components/          Upstream Puck shell UI (editor chrome)
├── store/               Zustand store (editor state)
├── reducer/             Pure reducers that mutate editor state
├── types/               Core Puck TypeScript types
├── lib/                 Puck utilities (getClassNameFactory, drag math…)
└── config/              ALL SOOQ-specific code ← most of your work lives here
    ├── index.tsx            Block registry (the palette)
    ├── root.tsx             Root config + global theme render
    ├── theme.ts             FullThemeProps, CSS-var builders, breakpoints
    ├── shell-zones.ts       Zone key constants (ZONE_HEADER, ZONE_DRAWER …)
    ├── page-registry.ts     Built-in page definitions + PAGES_UPDATED_EVENT
    ├── pages.ts             Static page list consumed by page-registry
    ├── component-key.ts     "v1" — uniquely identifies this block set
    ├── initial-data.ts      Starting SiteData for a blank new store
    ├── options.ts           Palette category order + block groupings
    ├── blocks/              ~55 block definitions (one folder each)
    ├── components/          SOOQ React components (Layout HOC, ZoneDrawer…)
    ├── plugins/             First-party Puck plugins
    ├── lib/                 SOOQ utilities (site-data, binding, theme helpers)
    ├── presets/             Zone/block preset builders (header layouts etc.)
    ├── binding/             useBoundData — live product data at render time
    ├── data-adapter/        EditorDataAdapter interface + sample catalog
    └── fields/              Custom Puck field components (SectionHeader…)
```

---

## 3. The Editor Shell (`components/`)

These files are **upstream Puck** — avoid editing unless you need framework-level changes.

| File / folder | Role |
|---|---|
| `DragDropContext/` | Wraps `@dnd-kit` sensors, provides drag context to the whole editor |
| `DraggableComponent/` | Renders each block in the canvas with a selection handle + action bar |
| `DropZone/` | A slot where blocks can be dropped; Puck's core composition primitive |
| `AutoFrame/` | The `<iframe>` sandbox the editor canvas runs in; mirrors `<head>` styles from the parent |
| `Drawer/` | The left-side component palette panel |
| `LayerTree/` | The layers/outline panel (right sidebar) |
| `ActionBar/` | Floating toolbar above a selected block (move, duplicate, delete) |
| `InlineTextField/` | Inline editable text field used by the canvas |
| `MemoizeComponent/` | Wraps blocks to avoid re-renders when their props haven't changed |

---

## 4. Editor State (`store/` + `reducer/`)

The editor uses a **single Zustand store** (`useAppStore`).

```
store/
  index.ts       createStoreContext + useAppStore hook
  state.ts       The complete AppState shape
  actions.ts     Imperative helpers (dispatch wrappers)

reducer/
  actions.ts     Action type union
  reduce.ts      Pure function: (state, action) → state
  initialize.ts  Hydrates store from the initial UserData
```

Key state slices:
- `state.data` — the current `UserData` (Puck's view of the page: `content`, `root`, `zones`)
- `state.ui.previewMode` — `"edit" | "interactive"` (edit = drag mode, interactive = live preview)
- `state.ui.viewports.current` — current canvas viewport width (used by Layout HOC to pick `bucket`)
- `state.ui.selected` — which block is selected (for action bar + sidebar field panel)

---

## 5. The Site JSON Contract (`config/lib/site-data.ts`)

This is the **most important file in the editor**. It owns the SiteData shape and all persistence.

### SiteData shape

```ts
type SiteData = {
  root: UserData["root"];           // Global theme + shell settings (FullThemeProps)
  zones: Record<SiteZoneKey, ComponentData[]>; // zone-header, zone-drawer, etc.
  pages: SitePage[];                // Array of pages, each with its own content[]
};

type SitePage = {
  path: string;     // Route pattern e.g. "/products/:product-slug"
  slug: string;     // Concrete URL slug
  name: string;     // Display name in the pages panel
  content: UserData["content"];  // Puck blocks for this page
};
```

### Key functions

| Function | What it does |
|---|---|
| `readSiteData(mode?)` | Reads + normalizes SiteData from localStorage |
| `writeSiteData(site, mode?)` | Writes SiteData to localStorage |
| `composePuckData(site, editPath)` | Assembles a `UserData` for Puck from site + the active page path — this is what you pass to `<Puck data={…}>` or `<Render data={…}>` |
| `applyPuckSave(site, editPath, userData)` | Inverse of compose — merges Puck's `onPublish` output back into SiteData |
| `findSitePage(site, path)` | Finds a page by path pattern or slug |
| `normalizeSiteData(raw)` | Sanitizes + migrates a raw JSON blob into a valid SiteData |
| `buildInitialSiteData()` | The blank starting state for a new store |
| `addSitePage(site, def)` | Adds a new page to the site |

### Storage keys

- Desktop: `puck-demo:v1:site`
- Mobile: `puck-demo:v1:site:mobile`

Both are read by `apps/store`'s `readSiteData`.

---

## 6. The Block Registry (`config/index.tsx`)

The **single source of truth** for what blocks exist. Imports every block from `config/blocks/` and assembles the `UserConfig` object:

```ts
const config: UserConfig = {
  root: Root,              // from config/root.tsx
  components: {
    Section, Grid, Hero, Heading, Text, ContentButton,
    ZoneDrawer, ZonePopup, ZoneBottomSheet,
    NavMenu, ProductCard, CartSection, CheckoutForm,
    // ... ~55 total
  },
};
```

This config is passed to both `<Puck config={config}>` (editor) and `<Render config={config}>` (storefront). **Never import individual blocks directly from their folders** — always go through this registry.

---

## 7. Block Anatomy (`config/blocks/<Name>/`)

Every block follows the same pattern:

```
blocks/Section/
  index.tsx       The Puck ComponentConfig (fields + render)
  styles.module.css
  types.ts        (optional) exported prop types
```

A minimal block:

```ts
// index.tsx
export const MyBlock: ComponentConfig<MyBlockProps> = {
  label: "بلوكي",
  fields: {
    title: { type: "text", label: "العنوان" },
    layout: layoutField,   // the universal responsive-layout field
  },
  defaultProps: { title: "مرحباً", layout: defaultLayout },
  render: ({ title, layout, puck }) => (
    <Layout layout={layout} puckIsEditing={puck.isEditing}>
      <h2>{title}</h2>
    </Layout>
  ),
};
```

### The `layout` field + `withLayout` HOC

Every block that should support responsive hiding / padding / floating gets:

1. A `layout` field (`fields/layout.ts`) — exposes `hideOnMobile`, `hideOnTablet`, `hideOnDesktop`, `grow`, `positionMode`, `padding` etc. in the block's sidebar panel.
2. Wrapped in `<Layout layout={layout} puckIsEditing={…}>` which:
   - In **editor**: reads the current canvas viewport width from the store → computes `bucket` (`mobile | tablet | desktop`) → sets `data-puck-hide-mobile/tablet/desktop` data attributes AND shows a "مخفي على …" badge
   - In **storefront**: always sets `bucket = "desktop"` (JS side does nothing); CSS injected by `buildResponsiveLayoutCss` does the actual `display: none` via those data attributes

File: `config/components/Layout/Layout.client.tsx`

---

## 8. Root Config (`config/root.tsx`)

The Puck `Root` is the top-level render wrapper that surrounds every page. It:

1. Reads `FullThemeProps` from `root.props` and generates CSS custom properties (`--color-primary`, `--text-md`, etc.)
2. Injects a `<style id="puck-responsive-layout">` tag (via `buildResponsiveLayoutCss`) so the CSS-based responsive hiding works in both editor and storefront
3. Renders `<DropZone zone="zone-header">`, `<DropZone zone="zone-footer">`, `<DropZone zone="zone-drawer">` etc. — these are the site-wide shell rails
4. In the editor, wraps the canvas in `<AutoFrame>` (the iframe) so block styles are isolated
5. Renders the page `<DropZone zone="default">` in the center

File: `config/root.tsx`

---

## 9. Theme System (`config/theme.ts`)

### FullThemeProps

Everything that lives in `root.props` (stored in SiteData.root):

- **Colors**: `ThemeProps` — 8 semantic color slots (`primary`, `secondary`, `text`, `surface`, `muted`, `border`, `error`, `success`). Each is a hex string.
- **Typography**: font family (`fontFamily`), scale sizes (`ScaleThemeProps` — `xs` through `2xl` in `rem`)
- **Breakpoints**: `BreakpointThemeProps` — `breakpointMobileMax` (default 767), `breakpointTabletMax` (default 1023)
- **Badge**: `BadgeThemeProps` — shape + style presets
- **Shell**: `ShellThemeProps` — `shellVariant` (`default | commerce`), header/drawer defaults

### CSS variable generation

```
computeDerivedColorThemeVars(colors)   → { "--color-primary": "#...", ... }
computeScaleThemeVars(scales)          → { "--text-sm": "0.875rem", ... }
computeBadgeThemeVars(badge)           → badge-specific vars
computeButtonVariantThemeVars(colors)  → button hover state vars
```

All of these are merged and set as inline styles on the `<html>` or root div so every block can use `var(--color-primary)` etc.

### Responsive CSS

```ts
buildResponsiveLayoutCss(bp: BreakpointThemeProps): string
```

Generates:
```css
@media (max-width: 767px) {
  [data-puck-hide-mobile="true"]:not([data-puck-layout-editor-visible="true"]) {
    display: none !important;
  }
}
/* … tablet and desktop variants … */
```

This CSS is injected both by Root (inline `<style>`) and by `apps/store/components/preview-theme-provider.tsx` (into `document.head`).

---

## 10. Zone System

### Zone keys (`config/shell-zones.ts`)

```ts
ZONE_HEADER        = "zone-header"
ZONE_FOOTER        = "zone-footer"
ZONE_DRAWER        = "zone-drawer"
ZONE_POPUP         = "zone-popup"
ZONE_BOTTOM_SHEET  = "zone-bottom-sheet"
```

In Puck's zone map format these become `root:zone-header`, `root:zone-drawer`, etc.

### Zone DropZones in Root

Root renders five `<DropZone>` components for these zones. Zone DropZones only accept their matching shell block types (e.g. `zone-drawer` only accepts `ZoneDrawer` and `SiteDrawerShell`).

### Zone overlay blocks (`blocks/ZoneDrawer`, `blocks/ZonePopup`, `blocks/ZoneBottomSheet`)

Each zone overlay block:
1. Has a `key` prop (the zone key, e.g. `"site-drawer"`) that ties it to a trigger button
2. Has an `is_active` bool (must be true for the overlay to respond to events)
3. Has an optional `is_mobile_only` bool (hides the portal wrapper on desktop via `zone-responsive.module.css`)
4. Renders its content via a **Puck `slot` field** (content stored inline in block props)
5. Mounts via `createPortal` to `document.body` — this keeps the overlay above everything else

### Event dispatch (`config/lib/zone-events.ts` or similar)

```ts
dispatchZoneEvent(zoneKey: string, action: "open" | "close" | "toggle")
```

Fires `new CustomEvent("sooq:zone", { detail: { key: zoneKey, action } })` on `document`.

### Zone event listener (`config/components/ZoneOverlay/useZoneOverlay.tsx`)

The `useZoneOverlay` hook (used by every overlay component):
- Listens for `sooq:zone` events on `document`
- Matches on `detail.key === zoneKey`
- Guards: listener is only active when `!editMode && isActive`
- Returns `{ isOpen, open, close, toggle, shouldRender }`
- In edit mode: `isOpen = previewSelected` (selected in editor sidebar → overlay shows)

### Trigger: ContentButton with `destType = "zone"`

```ts
// user clicks the burger button
onZoneClick → if (puck.isEditing || !zoneKey) return;
              dispatchZoneEvent(zoneKey, "toggle")
```

The isEditing guard means burger buttons do nothing inside the editor canvas — you select the drawer in the sidebar instead.

### ZoneDrawer responsive hiding

`config/lib/zone-responsive.module.css` — CSS module with two classes:

```css
/* hideOnDesktop: applied to ZoneDrawer's root div when is_mobile_only=true */
@media (min-width: 1024px) { .hideOnDesktop { display: none !important; } }

/* hideOnMobile: available for overlays that should only show on desktop */
@media (max-width: 767px) { .hideOnMobile { display: none !important; } }
```

---

## 11. Plugins (`config/plugins/`)

Plugins extend the Puck editor UI (panels, toolbar buttons, keyboard shortcuts). They are assembled in `apps/web`'s Design Studio client and passed to `<Puck plugins={[…]}>`.

| Plugin | What it adds to the editor |
|---|---|
| `pages` | Page manager panel — create, rename, delete, navigate pages; fires `PAGES_UPDATED_EVENT` |
| `zones` | Zone manager — lists zone overlays (drawer/popup/bottom-sheet); lets you click into a zone to edit its content; wraps zone rail sections with locked-drag protection |
| `themes` | Theme marketplace — lists theme presets and applies them to `root.props` |
| `settings` | Settings panel — root-level fields (colors, typography, breakpoints, shell toggles); also injects `<ThemeInjector>` which live-applies CSS vars as you edit |
| `shopify-editor` | Shopify-style outline UI — collapsible block outline sidebar replacing the Puck default layer tree |
| `canvas-interactions` | Keyboard shortcuts and canvas gesture handling |
| `html-block-palette` | Adds the raw HTML block to the palette when `enableHtmlRichTextBlock` is enabled in root settings |

---

## 12. Presets (`config/presets/`)

Presets are JSON-like data structures that let you apply a complete block tree with one click.

| File | What it builds |
|---|---|
| `zone-shell.ts` | Low-level builders: `createHeaderNavLinksGroup`, `createBurgerButton`, `createHeaderRowSection`, `createFooterSection`, `createHeaderBrandTitle`, etc. |
| `header-layouts.ts` | `buildHeaderZoneSection(layout)` — assembles a full header `Section` tree for each named layout (`logo-right-burger-left`, `logo-center-actions`, etc.) |
| `footer-layouts.ts` | Footer preset builders |
| `drawer-layouts.ts` | ZoneDrawer preset builders |
| `shell-defaults.ts` | Default link arrays (`PRESET_HEADER_LINKS`, `PRESET_FOOTER_COLUMNS`, etc.) |
| `shared.ts` | Generic builders: `createSection`, `createHeading`, `createParagraph`, `createContentLink`, `createPrimaryButton` |
| `types.ts` | `ZonePreset`, `HeaderPresetLayout` type definitions |

The preset builders are used both by the Zones plugin (when the user picks a layout) and by `buildInitialSiteData()` when seeding a blank store.

---

## 13. Binding System (`config/binding/`)

The binding layer lets blocks show **live data** (products, cart, etc.) without the block itself fetching anything.

### How it works

1. `BoundDataContext` — React context that holds the current `ValueContext` (product, collection, cart…) for a page or collection loop
2. `useBoundValue(prop, propName)` — called inside a block's render: resolves a field value either from static block props or from `ValueContext` if the prop is bound
3. `CollectionProductsBoundProvider` — wraps a products grid, fetches a collection and pushes each product into `ValueContext` for its child `ProductCard`

### Key files

| File | Role |
|---|---|
| `types.ts` | `ValueContext`, `BoundDataContextValue` type definitions |
| `BoundDataContext.tsx` | The React context provider + consumer hooks |
| `use-bound-value.ts` | `useBoundValue` hook — resolves static vs. bound prop |
| `resolve-value-context.ts` | Resolves a `ValueContext` from block props + parent context |
| `map-payload-to-card-data.ts` | Converts API product payload → `ProductCardData` |
| `map-collection-product-to-bound-data.ts` | Converts collection item → `BoundData` for children |
| `resolve-bound-images.ts` | Resolves product image URLs from bound data |
| `product-actions.ts` | Cart + wishlist action helpers usable inside bound blocks |

### Edit canvas vs. storefront

- In the **editor canvas**: `EditorDataAdapter.sampleCatalog()` provides instant sample data — no network calls, so canvas is always fast
- In the **storefront**: `apps/web/lib/editor-data-adapter.ts` (axios-backed) is registered at startup; `resolveAllData` is called server-side for each page to pre-fetch all bound data and inject it into the HTML

---

## 14. Data Adapter (`config/data-adapter/`)

The `EditorDataAdapter` interface defines what the editor needs from the backend:

```ts
interface EditorDataAdapter {
  fetchProduct(id: string): Promise<ProductPayload>;
  fetchCollection(id: string): Promise<CollectionPayload>;
  searchProducts(query: string): Promise<ProductPayload[]>;
  sampleCatalog(): SampleCatalog;
}
```

- `sample-data.ts` — the default implementation (static sample products/collections for the canvas)
- `types.ts` — `ProductPayload`, `CollectionPayload`, `SampleCatalog` types
- `index.ts` — exports + `setEditorDataAdapter(adapter)` registration function

`apps/web/lib/editor-data-adapter.ts` provides the real Axios implementation and calls `setEditorDataAdapter(impl)` at app startup.

---

## 15. Data Flow: Edit → Persist → Render

### Edit (apps/web Design Studio)

```
User drops a block onto the canvas
  → Puck reducer updates state.data.content[]
  → MemoizeComponent re-renders that block
  → User edits a field in the sidebar
  → AutoField fires onChange → reducer updates state.data.content[i].props
  → Layout HOC reads viewport width from store → shows/hides badge
  → User clicks "نشر" (Publish)
  → Puck calls onPublish(userData)
  → applyPuckSave(site, editPath, userData) merges userData back into SiteData
  → writeSiteData(site) writes to localStorage
```

### Navigate pages

```
User clicks a page in the pages panel
  → plugin/pages fires PAGES_UPDATED_EVENT
  → Design Studio reads the new path
  → composePuckData(site, newPath) assembles UserData for that page
  → Puck.setData(newUserData) resets the canvas
```

### Render (apps/store storefront)

```
Browser requests /shop/my-store/products/widget
  → Next.js page.tsx: readSiteData() from localStorage (SSR context: cookie-based)
  → findSitePage(site, "/products/:product-slug") → the products page
  → composePuckData(site, "/products/widget") → UserData { root, content, zones }
  → resolveAllData(config, data) → pre-fetches bound product via EditorDataAdapter
  → <Render config={config} data={resolvedData}>
      → Root renders: injects theme CSS, injects responsive CSS, renders zone DropZones
      → Each block renders via its render() function
      → Layout HOC (bucket="desktop", no store) → reads data-puck-hide-* → CSS does hiding
      → ZoneDrawer renders via Portal → waits for sooq:zone events
```

---

## 16. How apps/web and apps/store Share the Editor

| | apps/web (editor) | apps/store (storefront) |
|---|---|---|
| Config import | `import { config } from "@/core/config"` | same |
| Puck usage | `<Puck config data onPublish>` | `<Render config data>` |
| SiteData | read/write localStorage | read localStorage (or future API) |
| Theme | Root + settings plugin ThemeInjector | `preview-theme-provider.tsx` |
| Responsive CSS | Root inline `<style>` + Layout HOC badges | Root inline `<style>` + PreviewThemeProvider |
| Bound data | Sample data (fast canvas) | Real API via EditorDataAdapter |
| Zone overlays | Shown in editor via `previewSelected` | Driven by `sooq:zone` events |

---

## 17. Key Files Quick Reference

| File | One-liner |
|---|---|
| `config/lib/site-data.ts` | The SiteData contract + localStorage persistence |
| `config/index.tsx` | Block registry (single source for palette + Render) |
| `config/root.tsx` | Root config: theme vars, responsive CSS injection, zone DropZones |
| `config/theme.ts` | FullThemeProps, CSS var generators, breakpoints, buildResponsiveLayoutCss |
| `config/shell-zones.ts` | Zone key string constants |
| `config/components/Layout/Layout.client.tsx` | withLayout HOC: responsive hide, padding, float, editor badges |
| `config/components/ZoneDrawer/index.tsx` | ZoneDrawer overlay React component |
| `config/components/ZoneOverlay/useZoneOverlay.tsx` | Zone event listener + isOpen state |
| `config/blocks/ContentButton/index.tsx` | Trigger block: link / action / zone-open |
| `config/lib/zone-responsive.module.css` | CSS module: hideOnDesktop / hideOnMobile classes |
| `config/binding/index.ts` | Binding system entry: useBoundValue, BoundDataContext |
| `config/data-adapter/index.ts` | EditorDataAdapter interface + registration |
| `config/presets/zone-shell.ts` | Low-level builders for header/drawer content |
| `config/presets/header-layouts.ts` | buildHeaderZoneSection (named header layout variants) |
| `config/plugins/pages/` | Pages panel plugin |
| `config/plugins/zones/` | Zone manager plugin |
| `config/plugins/themes/` | Theme marketplace plugin |
| `config/plugins/settings/` | Root settings + ThemeInjector plugin |
| `apps/store/components/preview-theme-provider.tsx` | Injects theme CSS vars + responsive CSS in storefront |
