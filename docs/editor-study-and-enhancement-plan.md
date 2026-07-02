# SOOQ Editor — Detailed Study, Bottleneck Analysis & Enhancement Plan

> Scope: `packages/editor-packages/*` and the way it is consumed from
> `apps/web/app/store/[storeSlug]/(dashboard)/design-studio/**`.
>
> Author: internal review, 2026-07-02.
>
> This document is meant to be read top-to-bottom by an engineer new to the
> code. It is deliberately long — the editor is the single most complex piece
> of the product and half the work of fixing it is understanding it.

---

## 0. TL;DR — What is actually happening

Your "editor" is a **fork of Puck 0.21.1** (`packages/editor-packages/core`)
that has been *extensively* customised:

- ~40 custom blocks live under `packages/editor-packages/core/config/blocks/*`.
- The block registry (which decides what appears in the palette) exists in
  **three parallel files** (`config/index.tsx`, `config/server.tsx`,
  `config/rsc.tsx`) that are ~95 % duplicated.
- The editor is mounted from `apps/web/…/design-studio/[…puckPath]/client.tsx`
  and persists state to **localStorage** (not to the database yet) via
  `config/lib/site-data.ts`.
- Roughly ten first-party plugins wrap Puck: `shopify-editor`, `pages`,
  `themes`, `settings`, `canvas-interactions`, `html-block-palette`,
  `json-viewer`, plus the built-in `blocks` / `outline`.
- Rendering happens inside an **iframe** (via Puck's `AutoFrame` + custom
  `ThemeInjector`), and every render walks + mirrors host `<style>` tags into
  it (Puck's `CopyHostStyles`).

The dev-server-closing symptom you're seeing is almost certainly a combination
of five root causes:

1. **`Buffer.from(...)` used in a client module** (`config/index.tsx:196`) —
   forces webpack to inject the ~40 KB Node `Buffer` polyfill and blows up
   HMR memory.
2. **`metadata` and `iframe` objects are re-created on every render** of
   `client.tsx` — this triggers `PuckProvider`'s big
   `setState(generateAppStore(...))` effect on every keystroke, which cascades
   into a full store rebuild and re-walk of every node.
3. **`resolveAndCommitData` runs on every mount** and recursively resolves
   every component in every zone, with an **unbounded module-level cache**
   (`resolve-component-data.ts`) that keeps growing as pages/HMR reload.
4. **`normalizeEditorData` deep-clones the entire site tree** every time
   `savePageData` / `readSiteData` / `getSiteSnapshot` is called — and
   `getSiteSnapshot` is a dep of the JSON-viewer `useMemo`, so it fires on
   every keystroke in edit mode.
5. **All ~40 blocks (including Tiptap, embla, radix-popover, deep-diff,
   object-hash, uuid, react-hotkeys-hook…) are eagerly imported** in the
   single `config/index.tsx` barrel — plus `transpilePackages` in Next
   forces re-compilation of the whole tree on every save.

The rest of this document explains the architecture, then goes through every
class of bottleneck / legacy debt with concrete file:line references, and
finishes with a **phased, low-risk enhancement plan** you can execute.

---

## 1. High-level architecture

### 1.1 Package layout

```
packages/editor-packages/
├── core/                                # forked Puck 0.21.1 + all customisation
│   ├── bundle/                          # tsup entry points (index, rsc, no-external, internal)
│   ├── components/                      # Puck's UI components — largely upstream
│   │   ├── Puck/index.tsx               # <Puck> shell, PuckProvider — 370 lines
│   │   ├── DragDropContext/index.tsx    # 641 lines — dnd-kit integration
│   │   ├── DropZone/                    # 671 lines — drop targets
│   │   ├── DraggableComponent/          # 844 lines — draggable wrapper
│   │   ├── Drawer/                      # 1 036 lines — palette drawer
│   │   ├── AutoFrame/                   # 395 lines — iframe + style mirroring
│   │   └── … 30+ other UI subcomponents
│   ├── config/                          # ***YOUR*** editor content lives here
│   │   ├── blocks/                      # 40+ block definitions (Section, Group, ProductCard, …)
│   │   ├── plugins/                     # 7 sub-plugins (shopify-editor, settings, themes, …)
│   │   ├── binding/                     # useBoundData / useBoundValue for product data
│   │   ├── cart/                        # store-cart localStorage adapter
│   │   ├── content/                     # color / typography / button-actions fields
│   │   ├── fields/                      # BilingualText / LinkField / ColorField / …
│   │   ├── data/                        # in-memory demo products & testimonials
│   │   ├── lib/                         # normalize-editor-data, site-data, migrate…
│   │   ├── presets/                     # section / hero / cart / products-grid presets
│   │   ├── components/                  # Header / Footer / SiteDrawer / Section layout defs
│   │   ├── index.tsx                    # ***main*** config export (used by web)
│   │   ├── server.tsx                   # near-duplicate of index.tsx (unused)
│   │   ├── rsc.tsx                      # RSC-safe stub version (used by RSC render)
│   │   ├── root.tsx                     # Root component + FullThemeProps
│   │   ├── initial-data.ts              # bootstraps every page's default content
│   │   ├── theme.ts                     # 718 lines — theme registry + CSS var builder
│   │   ├── theme-presets.ts             # 512 lines — Atelier preset + gallery
│   │   ├── page-registry.ts             # PAGES + PAGES_UPDATED_EVENT
│   │   └── types.ts                     # Components / UserConfig / UserData
│   ├── plugins/                         # Puck's built-in plugins (blocks, outline, fields)
│   ├── reducer/                         # Puck's reducer + action creators
│   ├── store/                           # Zustand store + slices (fields, history, nodes, permissions)
│   ├── lib/                             # 50+ small utilities (dnd, data, hooks)
│   └── types/                           # Config / Data / Fields / API type surfaces
├── plugin-heading-analyzer/             # small a11y plugin (WCAG heading outline)
├── plugin-emotion-cache/                # emotion SSR helper
└── tsup-config, tsconfig, eslint-config-custom
```

Duplicate copies of the folder also live under `packages/plugin-heading-analyzer`
etc. at the workspace root — that duplication is deliberate (create-puck-app
scaffolding) but is one more thing to keep in sync.

### 1.2 Runtime flow (edit mode)

```
Next.js route
 └─ /store/:slug/design-studio/[...puckPath]/page.tsx    (RSC)
     └─ <Client isEdit path=...>                          (client component)
         ├─ useDemoData()                                 → reads localStorage → composePuckData
         ├─ ThemeInjector inside overrides.iframe         → writes <style id="puck-theme-vars">
         ├─ overrides.puck wraps HtmlBlockPaletteSync +
         │                     JsonViewerDialog + hint pill
         ├─ overrides.headerActions                       → close / preview buttons
         └─ <Puck config={config} data={data} …>
             └─ PropsProvider
                 └─ PuckProvider                         (creates Zustand appStore)
                     └─ Layout                          (canvas + left/right sidebars)
                         ├─ Sidebar plugins            (shopify outline, pages, themes, settings)
                         ├─ Canvas → AutoFrame        (iframe render)
                         │   └─ CopyHostStyles        (mirrors <style>/<link> into iframe)
                         │       └─ Preview           → walks Puck data → renders blocks
                         └─ CanvasInteractions        (right-click menu + hotkeys)
```

State that matters:

- **`appStore` (Zustand)** — everything: `state.data`, `state.ui`, `history`,
  `nodes`, `permissions`, `fields`, `componentState`. Selectors from `useAppStore`.
- **Puck data (`state.data`)** — `{ root, content, zones }`.
- **`state.indexes`** — `{ nodes: {id → {data,parentId,zone}}, zones: {zoneId → {contentIds}} }`,
  built by `lib/data/walk-app-state.ts` after each dispatch.
- **`site-data.ts` `SiteData`** — the outer container `{ root, zones, pages[] }`
  stored in localStorage under key `puck-demo:<componentKey>:site`.

### 1.3 Runtime flow (preview / published)

`Client` returns `<Render config={config} data={resolvedData} metadata={metadata} />`
which uses Puck's `ServerRender`. In RSC contexts it uses `config/rsc.tsx`
(which stubs out interactive blocks — see §3.2).

### 1.4 Persistence

Everything currently persists to **localStorage** under one key:

```
puck-demo:<componentKey>:site   →  JSON.stringify(SiteData)
```

`site-data.ts` also knows how to migrate a legacy per-page storage key
(`puck-demo:<componentKey>:<path>`) into that single blob. There is *no*
database write path yet; `onPublish` just calls `savePageData(...)`.

---

## 2. Concrete bugs (fix these first)

### 2.1 🐛 `Buffer.from` runs in the client bundle

**File:** `packages/editor-packages/core/config/index.tsx:196-198`

```ts
export const componentKey = Buffer.from(
  `${Object.keys(conf.components).join("-")}-${JSON.stringify(initialData)}`
).toString("base64");
```

Problems:

1. `Buffer` is a Node.js API. Any client bundle that imports `config/index.tsx`
   (which is every editor page) needs webpack/turbopack to inject the
   ~40 KB `buffer` polyfill. Turbopack in particular is unhappy about this and
   is a strong candidate for the dev-server crashes.
2. `JSON.stringify(initialData)` runs at **module load time**, on both server
   and client. `initialData` includes every demo page + every theme demo
   entry — the resulting string is typically 40–80 KB and it is computed on
   every cold import.
3. The base64 output is used as a *localStorage key prefix*
   (`puck-demo:<componentKey>:site`). LocalStorage keys are strings limited
   by browser, and browsers hash the whole key on lookup — you are throwing
   a 50 KB key at each read.

**Fix:** replace with a stable, tiny hash computed at build time (or a
constant string version number).

```ts
// Simple, deterministic, works in browser + node
export const componentKey = "v1"; // bump when block registry changes
```

If you actually want a hash for cache-busting, use `object-hash` (already a
dependency) or a small murmur3, and hash **only the block-type list** — not
`initialData`.

### 2.2 🐛 Duplicate import of `GroupProps`

**File:** `packages/editor-packages/core/config/types.ts:13,24`

```ts
import type { GroupProps } from "./blocks/Group";  // line 13
// …
import { GroupProps } from "./blocks/Group";       // line 24
```

Second import is a value import (not `import type`). TypeScript accepts it in
`ignoreBuildErrors` mode, but this is a real duplicate-declaration hazard
that will bite once you remove `ignoreBuildErrors`. Delete line 24 and use
line 13 only.

### 2.3 🐛 `metadata` and `iframe` props are unstable → whole store re-inits on every render

**Files:**

- `apps/web/…/design-studio/[…puckPath]/client.tsx:190-192,590-593`
- `packages/editor-packages/core/components/Puck/index.tsx:297-309`

`Client` does:

```tsx
const metadata = { example: "Hello, world" }          // ← new object every render
…
<Puck
  metadata={metadata}
  iframe={{
    enabled: params.get("disableIframe") === "true" ? false : true, // ← new object every render
  }}
/>
```

Inside `PuckProvider`:

```ts
useEffect(() => {
  const state = appStore.getState().state;
  appStore.setState({
    ...generateAppStore(state),   // rebuilds config, plugins, overrides, viewports, iframe, metadata
  });
}, [config, plugins, loadedOverrides, viewports, iframe, onAction, metadata]);
```

Because `metadata` and `iframe` are fresh references every render, this
effect fires on **every keystroke in the editor**. Each fire calls
`appStore.setState({ ...generateAppStore(state) })` which:

- rebuilds `loadedOverrides` (walked via `useLoadedOverrides`),
- rebuilds `loadedFieldTransforms`,
- notifies every selector that ran on `state.config`, `state.plugins`,
  `state.overrides`, `state.iframe`, `state.metadata`,
- which re-renders every plugin panel, the outline, the canvas AutoFrame,
  the DropZones, the DraggableComponents — hundreds of components.

Same issue with `overrides` in the same file (lines 340-554): its deps
include `isShortcutDialogOpen`, `isJsonDialogOpen`, `showHintPill`,
`modKeyLabel` — so opening the shortcuts dialog also silently resets the
whole store.

**Fix (client side):**

```ts
const metadata = useMemo(() => ({ example: "Hello, world" }), []);
const iframeConfig = useMemo(
  () => ({ enabled: params.get("disableIframe") !== "true" }),
  [/* stable */]
);
```

and stop pushing UI-only state (`showHintPill`, `isJsonDialogOpen`, …) into
`overrides.puck`. Render those dialogs *outside* the `<Puck>` tree instead
(they only need `getSiteSnapshot`, which is already a callback).

**Fix (Puck side):** the effect in `PuckProvider` should shallow-compare
values before calling `setState`; even better, split into narrow effects
(one per field). This is a small local patch — you already own the fork.

### 2.4 🐛 `resolveAndCommitData` walks the whole tree on every mount, cache never GCs

**Files:**

- `packages/editor-packages/core/components/Puck/index.tsx:338-342`
- `packages/editor-packages/core/store/index.ts:299-341`
- `packages/editor-packages/core/lib/resolve-component-data.ts:14-16`

```ts
// resolve-component-data.ts
export const cache: {
  lastChange: Record<string, any>;    // module-level, never cleared
} = { lastChange: {} };
```

`resolveAndCommitData` walks every node in the current page and calls
`resolveComponentData` on it. The cache grows unbounded across:

- page switches inside one session,
- HMR reloads (module singleton survives because HMR replaces the *importer*),
- multiple `<Puck>` instances if you ever render more than one.

In dev, this is a slow memory leak that compounds with the previous bug
(store rebuild on every render → every rebuild triggers a fresh
`resolveAndCommitData`? Not directly, but every rebuild triggers rebuild of
downstream selectors that call `resolveComponentData`). Combined with the
`Buffer` polyfill + `transpilePackages` compilation load, dev Node quickly
runs out of heap.

**Fix:**

- Move the cache onto the store (`appStore.cache = new Map()`) so it gets
  GC'd when the store is torn down.
- Add a `clear()` path on unmount.
- Consider `WeakMap<ComponentData, …>` keyed on the item, not on `id`.

### 2.5 🐛 `normalizeEditorData` deep-clones the whole page on every read

**File:** `packages/editor-packages/core/config/lib/normalize-editor-data.ts`

`normalizeEditorData` does:

- `mergeDefaults(defaults, incoming)` which calls a recursive `cloneDeep`
  for every property that only exists in defaults,
- `stripVisualOnlyKeys(mergedProps)` which recursively rebuilds every object
  to drop keys starting with `__`,
- `normalizeNestedComponents(...)` which recursively walks slots and does the
  same three-step dance for each nested component,
- and it runs **inside** `normalizeSiteData` (site-data.ts:373-417) which
  itself iterates every page and calls `normalizeEditorData` again on each.

Cost: for a site with 8 pages × 30 blocks each × 5 nested layers, this is
several thousand deep-clones on **every** `readSiteData` / `writeSiteData` /
`getSiteSnapshot` call.

The JSON viewer wires it directly into a `useMemo` that fires on every
keystroke of edited content (client.tsx:92-96):

```ts
const jsonString = useMemo(() => {
  if (!open) return ""
  return JSON.stringify(normalizeSiteData(getSiteSnapshot()), null, 2)
}, [open, getSiteSnapshot, puckData])
```

The `open` check is inside the memo but the memo itself still recomputes
`getSiteSnapshot` because `puckData` invalidates it. When the dialog is
closed, the memo still fires — it just returns `""` after redoing the
`readSiteData(...)` inside `getSiteSnapshot` if `siteDataRef.current` is
null.

**Fix:**

1. Do not include `puckData` in the memo deps unless `open` is true (use a
   guarded state pattern instead of a memo).
2. Make `normalizeEditorData` idempotent-aware: bail out early if the input
   already carries the current migration flag (`shellComponentsMigrationVersion`).
3. Replace `cloneDeep` with `structuredClone` (native, ~10× faster).
4. Avoid double-normalising inside `normalizeSiteData` — it wraps
   `normalizeEditorData` around each page then calls the outer one again.

### 2.6 🐛 CartSection `resolveData` fights the merchant

**File:** `packages/editor-packages/core/config/blocks/CartSection/index.tsx:62-71`

```ts
resolveData: ({ props }) => {
  const current = props.metadata;
  if (
    current?.dataSource === DEFAULT_METADATA.dataSource &&
    current?.storageKey === DEFAULT_METADATA.storageKey
  ) {
    return {};
  }
  return { props: { metadata: DEFAULT_METADATA } };
},
```

If a merchant later stores anything other than the default (imagine a
`storageKey: "store-cart-eu"` for a regional cart), this resolver silently
resets it back to the default on *every* dispatch — because
`resolveComponentData` compares old vs new item and this returns a new
`metadata` object every time it doesn't match.

Also: because `metadata` returned here is a **shared constant reference**,
`resolveComponentData`'s cache think will think it changed (via `getChanged`
diffing) → dispatches a `replace` → re-renders → resolves again → same
constant → cache invalidation loop is only prevented by `deepEqual` in
`didChange`.

**Fix:** either (a) drop the resolver entirely and put the default in
`defaultProps`, or (b) only overwrite when `metadata == null`.

### 2.7 🐛 `CanvasContextMenu` polls the iframe every 500 ms forever

**File:** `packages/editor-packages/core/config/plugins/canvas-interactions/CanvasContextMenu.tsx:487`

```ts
const pollId = window.setInterval(tryBindIframe, 500);
```

The stated reason is that srcdoc iframes swap `contentDocument` on reload.
That happens rarely; running `setInterval` for the lifetime of the editor
means 2 timer fires/second forever, each calling `document.getElementById`
and reading `iframe.contentDocument`. Cheap individually, but every fire
wakes up the main thread and prevents the dev tools from seeing the tab as
idle.

**Fix:** use a single `MutationObserver` on the iframe's parent watching for
attribute/child changes on `#preview-frame`, or listen for the
`load` event on the iframe (already done) and stop the poll.

### 2.8 🐛 `writeSiteData` re-normalises on write, then dispatches `PAGES_UPDATED_EVENT` — but nothing listens correctly

**File:** `packages/editor-packages/core/config/lib/site-data.ts:438-444`

```ts
export function writeSiteData(site: SiteData) {
  if (!isBrowser) return;
  const normalized = normalizeSiteData(site);
  window.localStorage.setItem(getSiteStorageKey(), JSON.stringify(normalized));
  window.dispatchEvent(new CustomEvent(PAGES_UPDATED_EVENT));
}
```

`useDemoData` (apps/web/lib/use-demo-data.ts) reads the site once via
`useState` initializer and never listens for `PAGES_UPDATED_EVENT`. So if
another tab / another plugin / the shopify-editor outline writes site data,
the currently-mounted editor doesn't refresh.

**Fix:** subscribe to `PAGES_UPDATED_EVENT` in `useDemoData` and re-compose
`data`, or move to a shared Zustand store for the site data.

### 2.9 🐛 `params = new URL(window.location.href).searchParams` on every render

**File:** `apps/web/…/design-studio/[…puckPath]/client.tsx:562-564`

Runs `new URL(...)` per render (only in the browser branch). Cheap by
itself, but combined with the object-identity issue above it's another
gratuitous new object flowing into `<Puck iframe={{ enabled: ... }}>` and
retriggering the store reset described in §2.3.

**Fix:** parse once with `useMemo(() => new URL(window.location.href), [])`.

---

## 3. Architectural / structural bottlenecks

### 3.1 Three block-registry files that are 90 % identical

**Files:**

- `config/index.tsx` (200 lines, used by `<Puck>` and by `useDemoData`)
- `config/server.tsx` (172 lines, **not imported anywhere** — dead code)
- `config/rsc.tsx` (176 lines, imported by `<Render>` on RSC boundaries)

`server.tsx` and `index.tsx` list the same 40 components with the same
categories; the only differences are that `server.tsx` uses `Hero/server`
and `Template/server` instead of the client variants. `rsc.tsx` also stubs
out `SiteHeader`, `SiteDrawerShell`, `SiteFooter`, `Button`, `ContentButton`,
`NavMenu`, `SideDrawer` with empty `render: () => <div/>`s and casts the
whole config to `any`.

Consequences:

- **Real duplication** — every time you add a block, you have to remember
  three files.
- **Silent broken RSC render** — any page containing a stubbed block will
  render an empty div in RSC, no warning.
- **Server.tsx will drift** — nothing imports it, so no one notices when it
  bit-rots. It's dead weight for tsup/webpack.

**Fix:** collapse into one config with per-block `render`/`renderServer`
methods, or produce all three at build time from a single source (see §5.4).

### 3.2 Legacy blocks are still registered

`config/index.tsx` registers 17 legacy blocks under `categories.legacy`
(`visible: false`) — Heading, Text, RichText, Button, Card, Grid, Flex,
Hero, Logos, Stats, Template, NavMenu, ContentIcon, ContentHtml,
ProductImage, ProductInfo, SideDrawer.

These are imported eagerly, which means:

- their file weight is in the bundle even though no merchant can pick them,
- their dependencies (Tiptap for `RichText`, Embla for `Hero`, product data
  stores, colour fields, etc.) are also pulled in,
- `Template/client.tsx` even does `const { conf: config } = await import("../../index")`
  which creates a **circular dynamic import** at run-time (index.tsx → Template →
  index.tsx). This works today but is a footgun.

The stated reason for keeping them is "old `store_config.json` still loads."
That's a valid but *rare* requirement. Options in decreasing order of
correctness:

1. **Migrate on write.** Run a one-shot conversion on `normalizeSiteData`
   that rewrites legacy types to their modern equivalents, then remove the
   legacy blocks entirely.
2. **Lazy-load legacy blocks.** Register them via `React.lazy` /
   `next/dynamic` so their code only ships when a store actually contains
   one.
3. **Move them to a separate entry point** (`@puckeditor/core/legacy`) that
   the app opts into.

### 3.3 Block palette is fully eager, no code-splitting

`config/index.tsx` imports every block synchronously:

```
import { Button } from "./blocks/Button";
import { Card } from "./blocks/Card";
…
import { SiteFooter } from "./blocks/SiteFooter";
```

Everything the merchant *might* drop is loaded up front:

- Tiptap (`@tiptap/core` + 12 extensions + `@tiptap/react`) — ~250 KB min-gz,
- `embla-carousel-autoplay`,
- `@radix-ui/react-popover`,
- `deep-diff`, `object-hash`, `fast-equals`, `flat`,
- `react-hotkeys-hook`, `use-debounce`, `uuid`, `zustand`,
- `@dnd-kit/*` × 7,
- `happy-dom` (this is unusual — it's normally a dev dep but you have it in
  `dependencies` and it's ~5 MB of code).

Combined bundle size for the editor page is very large. In *dev*,
Turbopack/webpack has to graph and transpile all of it on every save, and
`transpilePackages` in `apps/web/next.config.mjs` forces re-transpilation
of every editor-package change, so a one-line edit in a block re-parses ~40
files.

**Fix (biggest win):**

- Use `next/dynamic(() => import("..."), { ssr: false })` for every block
  whose `render` is not needed for SSR.
- Split blocks into "layout / content / commerce / shell / legacy" chunks,
  loaded on demand when the merchant opens the corresponding palette tab.
- Move `happy-dom` to `devDependencies`.
- Remove `@dnd-kit` sub-packages you don't use — dnd-kit v0.1.18 is a
  pre-release; check whether `abstract`, `collision`, `state`, `geometry`,
  `helpers`, `dom`, `react` are all really required. The `no-external.ts`
  bundle entry may already give you a hint.

### 3.4 `initialData` is a heavy runtime constant

**File:** `packages/editor-packages/core/config/initial-data.ts` (403 lines)

- Imports `products` (in-memory catalogue) and iterates it.
- Calls `buildAllThemeDemoInitialEntries()` + `buildThemesGalleryData()` at
  module load time — those functions live in `theme-presets.ts` (512 lines)
  and build a `/themes` gallery page + a `/themes/atelier` demo page each
  time.
- Every one of the resulting page trees is deep-cloned inside
  `normalizeSiteData` on first read.

Two problems:

1. **Demo data leaks into production.** The theme gallery is not something a
   merchant should see; it's a design-studio internal tool. It ships in
   every bundle that imports the config.
2. **Startup cost.** On first paint of the editor, before the user has done
   anything, we parse+normalise ~15 pages of data.

**Fix:** move theme demos to their own entry (`config/theme-gallery.ts`)
that's only imported by the `/themes` studio route; keep `initialData` as
just `{"/":{...}, "/cart":{...}}` for real pages.

### 3.5 The `RowGroup` / `Group` / `Section` overlap

`RowGroup` (`config/blocks/RowGroup/index.tsx`, new — added in the current
diff) is a flex-row wrapper with `gap` / `alignItems` / `justifyContent` /
`wrap` / `padding` / `borderRadius` / `backgroundColor` fields.

`Group` (`config/blocks/Group/index.tsx`) is the same thing plus a
`direction: "row" | "column"` field, a product-binding hook, a background
image, an overlay, and a shadow.

Result: two blocks with 90 % overlapping props and rendering, but different
IDs, different defaults, different fields, and different `withLayout`
wrappers. Merchants and AI agents both get confused.

Also: `RowGroup` is **not registered in `server.tsx` or `rsc.tsx`**, so it
won't render in RSC contexts.

**Fix:** delete `RowGroup` and add a "row template" preset that inserts a
`Group` with `direction: "row"`, or fold `Group` into `RowGroup` and keep
one.

### 3.6 The cart plumbing is duplicated across three files

- `config/cart/store-cart.ts` — 187 lines of localStorage adapter (read /
  write / addOrUpdateLine / setLineQuantity / removeLine / clearCart /
  formatters).
- `config/cart/use-store-cart.ts` — 73 lines, hook + one-time listener
  registration.
- `config/cart/make-order.ts` — 18 lines, event dispatcher.
- `config/presets/cart.ts` — 53 lines, builds a Section wrapper with a
  CartSection block inside.
- `config/plugins/shopify-editor/section-catalog.tsx` — inlines the same
  "shopping-cart" preset via `createCartSectionPreset()`.
- `config/initial-data.ts` — builds `/cart` page inline (not via the preset).
- `config/blocks/CartSection/CartRowGroupUI.tsx` — the row UI. Its name is
  misleading; it has nothing to do with the `RowGroup` block.

Once `useStoreCart()` runs, it calls `refresh()` after every mutation, which
also fires a `STORE_CART_UPDATED_EVENT` that triggers *another* `refresh()`
via the event listener. Not incorrect (React dedupes the setState) but
double-work.

**Fix:**

- Rename `CartRowGroupUI` → `CartLineItem`.
- Centralise cart writes: `bumpQuantity` and `removeCartLine` should not
  call `refresh()` — the event listener already does.
- Move `/cart` initial data to use `createCartSectionPreset` from
  `presets/cart.ts` so we only edit that shape in one place.

### 3.7 Commented-out shell-zone code in `root.tsx`

`config/root.tsx` contains a large commented-out block for a left+right
"shell rail" — `SHELL_LEFT_ZONE`, `SHELL_RIGHT_ZONE`, `shellRailStyle`,
`shellDropStyle`. The zones are still exported from
`config/shell-zones.ts` and used by `normalize-editor-data.ts`
(migration logic for `ROOT_SHELL_LEFT_ZONE` / `ROOT_SHELL_RIGHT_ZONE`). The
UI is disabled but the migration code runs on every save.

**Fix:** either finish the shell rail feature or delete all of:
- `config/shell-zones.ts` (all references),
- the `enforceShellPlacement` shell-zone branches in `normalize-editor-data.ts`,
- the commented HTML in `config/root.tsx`.

### 3.8 `ThemeInjector` rewrites the entire `<style>` tag on every colour tweak

**File:** `config/plugins/settings/ThemeInjector.tsx`

Deps of the `useLayoutEffect`: `bodyFontCss`, `font1Css`, `font2Css`,
`googleFontsUrl`, `derivedColorVarLines`, `badgeVarLines`, **each individual
colour** (`colors.primary`, `colors.surface`, …), `scaleVarLines`,
`responsiveLayoutCss`, `bpMobile`, `bpTablet`, `buttonVariantVarLines`.

Any single tweak → the whole 120-line `styleEl.textContent = \`…\`` runs.
That triggers a full style-sheet re-parse in the iframe.

**Fix:** update just the CSS custom properties on `documentElement.style`
via `setProperty` — no template string, no re-parse:

```ts
doc.documentElement.style.setProperty("--theme-color-primary", colors.primary);
```

You only need the big template string once, at mount, for the immutable
rules (html/body overrides).

### 3.9 `AutoFrame` / `CopyHostStyles` mirrors every host `<style>` and `<link>`

**File:** `packages/editor-packages/core/components/AutoFrame/index.tsx`

Puck's iframe mirror walks `document.querySelectorAll('style, link[rel="stylesheet"]')`
and copies each one into the iframe. In a Next 16 + Tailwind 4 + shadcn app,
that's typically 40+ style tags at first render, each of which triggers
`getStyleSheet` + `getStyles` (which serialises every CSS rule to text).

This is upstream code; the mitigations are:

- Prefer `iframe={{ enabled: false }}` during heavy dev work (there's
  already a `disableIframe=true` query param path in `client.tsx:591`,
  document it).
- Consider running the editor **without the iframe** and using a Shadow
  DOM or scoped classes for style isolation. Puck 0.22+ has improvements
  here; keeping your fork on 0.21.1 misses them.

### 3.10 Turbopack + `transpilePackages`

`apps/web/next.config.mjs`:

```js
transpilePackages: [
  "@workspace/ui",
  "@puckeditor/core",
  "@puckeditor/plugin-heading-analyzer",
  "@puckeditor/plugin-emotion-cache",
],
typescript: { ignoreBuildErrors: true },
```

- `@puckeditor/core` is a fork of Puck (~15 000 LoC) — every save inside
  the package forces Next to re-transpile the whole graph.
- `ignoreBuildErrors: true` hides TS regressions permanently.

**Fix:**

- Add a `turbo`/`pnpm` script that builds `@puckeditor/core` in watch mode
  and drop it from `transpilePackages`. Have `apps/web` import the built
  ESM output. HMR will be dramatically faster.
- Turn `ignoreBuildErrors` off and fix the duplicate `GroupProps` etc.

---

## 4. Code-quality debt (non-blocking, but worth doing)

| # | Location | Issue |
|---|---|---|
| 1 | `config/blocks/ContentButton/index.tsx` (492 lines) | Fields declared, then `resolveFields` re-orders and filters them into a second copy. `FIELD_ORDER` array + `resolveButtonFields` duplicates the fields object. Split UI/behaviour: fields definition, `resolveFields`, `render`, `renderVariant` into separate files. |
| 2 | `config/blocks/SideDrawer/index.tsx` (673 lines) — largest block file | Legacy block registered under `categories.legacy`. Delete or migrate. |
| 3 | `config/blocks/Section/index.tsx` (372 lines) | Two starter-data files (`starter-data.ts`), plus the section itself contains column/mobile-column/gap logic that overlaps with `Group`. Extract layout helpers into `Section/lib.ts`. |
| 4 | `config/plugins/canvas-interactions/CanvasContextMenu.tsx` (798 lines!) | Right-click menu + keyboard shortcuts + clipboard + iframe polling + selection highlighting all in one component. Split into `useCanvasContextMenu`, `useClipboard`, `useKeyboardShortcuts`, `useSelectionHighlight`, `<ContextMenuPortal>`. |
| 5 | `config/lib/normalize-editor-data.ts` (580 lines) | Contains a *migration engine* mixed with pure data normalisation. Split into `normalize.ts` (pure) + `migrations/*.ts` (versioned). |
| 6 | `config/lib/site-data.ts` (556 lines) | Same story — types, storage, migration, dedupe, dynamic-path matching, all in one module. |
| 7 | `config/theme.ts` (718 lines) + `theme-presets.ts` (512 lines) | Font registry + colour keys + badge vars + button variant vars + scale vars + responsive layout CSS. Split into `theme/fonts.ts`, `theme/colors.ts`, `theme/badges.ts`, `theme/buttons.ts`, `theme/scales.ts`, `theme/breakpoints.ts`, `theme/index.ts`. |
| 8 | `config/blocks/BLOCKS.md` (61 KB, 1 865 lines) | Mostly useful, but out of sync in places (mentions "apps/demo/config/blocks/Section/index.tsx" which doesn't exist in this repo). Generate from block schemas. |
| 9 | `config/plugins/shopify-editor/section-catalog.tsx` (611 lines) | Catalogue entries hard-coded with inline gradients + section-of-a-section builder. Move each preset to its own file, iterate via a manifest. |
| 10 | `config/blocks/Template/client.tsx:8` | Dynamic-import-cycle back to `../../index`. Instead, pass `conf` in as a prop or read from Puck's context. |
| 11 | Multiple `resolveData` bodies clone metadata objects on every dispatch (`Group`, `ProductCard`, `ProductsGrid`, `CartSection`). | Introduce a `metadataResolver(id, type)` helper that returns stable references. |
| 12 | `useDemoData` reads localStorage in a `useState` initializer without SSR guard. | Move the initial read into a `useEffect` and start with `null` on SSR to avoid hydration mismatch. |
| 13 | `plugins/blocks/index.tsx` uses `Hammer` icon but the label is "العناصر" (Arabic "elements"). | Not a bug, but centralise plugin metadata. |
| 14 | `page-registry.ts` + `pages.ts` co-exist. | Consolidate into a single `pages/` module. |
| 15 | `presets/*.ts` reference block types by string literal — no compile-time check that the block still exists. | Introduce a `BlockType = keyof Components` type and use it. |
| 16 | Many blocks define an inline `<button>` with duplicated style objects. | Extract a shared `<ThemedButton>` primitive. |
| 17 | `config/index.tsx` computes `componentKey` via `Buffer` (see §2.1). | Already flagged. |
| 18 | Console warnings sprinkled across the code (`section-catalog.tsx`, `AutoFrame`, `Puck/index.tsx`). | Route through a single logger with `NODE_ENV === "development"` gate. |
| 19 | `config/data/products.ts`, `orders.ts`, `checkout.ts`, `testimonials.ts` are hard-coded in the client bundle. | Move behind an in-memory MSW handler or the real store API to avoid shipping mock data to production. |
| 20 | `HtmlBlockPaletteSync` is rendered inside `overrides.puck` but is a no-visible-child component. | Move to a dedicated effect in `client.tsx`. |

---

## 5. Enhancement plan (phased, roughly ordered by risk×impact)

### Phase 0 — Stop the bleeding (est. 1 day, near-zero risk)

Goal: dev server stops crashing.

- [ ] **P0-1** Replace `componentKey` with a constant. Delete
  `Buffer.from(...).toString("base64")`. §2.1
- [ ] **P0-2** Memoise `metadata`, `iframe`, `plugins`, and `overrides` in
  `apps/web/…/design-studio/[…puckPath]/client.tsx`. Move UI dialogs out of
  `overrides.puck`. §2.3
- [ ] **P0-3** Add `structuredClone` fallback / replace `cloneDeep` in
  `normalize-editor-data.ts`. Bail out early when the migration flag is
  current. §2.5
- [ ] **P0-4** Guard the JSON viewer `useMemo` on `open`. §2.5
- [ ] **P0-5** Delete the duplicate `import { GroupProps }` in
  `config/types.ts:24`. §2.2
- [ ] **P0-6** Remove `happy-dom` from `dependencies`; move to devDeps if
  it's still needed for tests. §3.3
- [ ] **P0-7** Add a `NODE_OPTIONS=--max-old-space-size=8192` to the `dev`
  script as a temporary safety net until the memory profile improves.

Expected result: HMR memory drops, dev doesn't OOM, keystrokes stop
re-initialising the whole store.

### Phase 1 — Correctness quick wins (est. 2–3 days)

- [ ] **P1-1** Fix `CartSection.resolveData` to be idempotent. §2.6
- [ ] **P1-2** Replace `setInterval` in `CanvasContextMenu.tsx` with a
  MutationObserver. §2.7
- [ ] **P1-3** Move the `resolveComponentData` cache into the app store /
  scope it by `instanceId`. §2.4
- [ ] **P1-4** In `ThemeInjector`, update CSS custom properties via
  `setProperty` instead of rewriting the whole `<style>`. §3.8
- [ ] **P1-5** Subscribe to `PAGES_UPDATED_EVENT` inside `useDemoData` so
  cross-tab edits refresh. §2.8
- [ ] **P1-6** Turn `ignoreBuildErrors` off. Fix the ~handful of TS errors
  that surface. Add a CI check.
- [ ] **P1-7** In `useDemoData`, remove the localStorage read from the
  `useState` initializer to avoid SSR hydration warnings.

### Phase 2 — Consolidate block registry & drop legacy (est. 3–5 days)

- [ ] **P2-1** Collapse `config/{index,server,rsc}.tsx` into a single
  source. Options:
  - single `config/index.tsx` with `renderClient` and `renderServer` on
    each block, or
  - a generator: `config/blocks/manifest.ts` describes every block, and
    `config/{index,rsc}.tsx` are built from it.
- [ ] **P2-2** For every legacy block (`Heading`, `Text`, `RichText`,
  `Button`, `Card`, `Grid`, `Flex`, `Hero`, `Logos`, `Stats`, `Template`,
  `NavMenu`, `ContentIcon`, `ContentHtml`, `ProductImage`, `ProductInfo`,
  `SideDrawer`):
  - decide "migrate to modern block" or "keep as legacy",
  - write a migration in `config/lib/migrations/vN.ts`,
  - remove the block file if migrated.
- [ ] **P2-3** Delete `config/shell-zones.ts` and all the shell-zone
  migration code in `normalize-editor-data.ts`. §3.7
- [ ] **P2-4** Delete `RowGroup` (or replace `Group` with it). §3.5

### Phase 3 — Code-splitting the editor (est. 5–8 days, highest performance impact)

- [ ] **P3-1** Convert `config/index.tsx` to lazy imports:
  ```ts
  const Hero = dynamic(() => import("./blocks/Hero"), { ssr: false });
  ```
  Group by category so the Tiptap / Embla / Radix bundles only load when the
  merchant opens the relevant palette tab.
- [ ] **P3-2** Move `theme-presets.ts` demo data out of the default bundle;
  load it dynamically only on the `/themes` route.
- [ ] **P3-3** Split `plugins/canvas-interactions/CanvasContextMenu.tsx`
  into 4 files (§4-4).
- [ ] **P3-4** Add a per-block `<Suspense fallback>` so drag-and-drop of a
  new block type doesn't block the canvas while the chunk loads.
- [ ] **P3-5** Verify final bundle sizes with `next build --profile` and
  document expected KB per category in `docs/`.

### Phase 4 — Extract the fork or upgrade Puck (est. 5–10 days)

You have two viable paths:

**A. Own the fork properly.**
- [ ] Rename `@puckeditor/core` → `@sooq/editor-core` inside `packages/editor-packages/core/package.json`.
- [ ] Build the package (`tsup`) in watch mode and remove it from
  `apps/web/next.config.mjs`'s `transpilePackages`.
- [ ] Publish a `CHANGELOG.md` listing every custom patch on top of Puck
  0.21.1 so future upgrades are tractable.

**B. Migrate to Puck ≥0.22.**
- [ ] Rebase your customisations onto vanilla `@puckeditor/core@latest`.
- [ ] Use Puck's plugin API for everything that lives under
  `config/plugins/*` instead of monkey-patching internals.
- [ ] Gain upstream performance work (bundle size, iframe fixes, hooks).

Either way, the tightly-coupled fork is the biggest long-term risk.

### Phase 5 — Persistence & multi-user (est. 5–10 days)

Currently everything lives in **one localStorage key**. This will break as
soon as multiple merchants edit their store from multiple devices.

- [ ] **P5-1** Add a `store_config` table (Prisma). Fields: `storeId`,
  `version` (int), `payload` (jsonb), `updatedBy`, `updatedAt`.
- [ ] **P5-2** Move `readSiteData` / `writeSiteData` behind a hook that
  reads/writes via a server action:
  ```ts
  export async function loadStoreConfig(storeId: string): Promise<SiteData>;
  export async function saveStoreConfig(storeId: string, next: SiteData): Promise<void>;
  ```
- [ ] **P5-3** Add optimistic locking on `version` to prevent lost updates.
- [ ] **P5-4** Keep localStorage as a **draft** cache only (auto-save every
  N seconds; explicit publish uses the server action).
- [ ] **P5-5** Expose a JSON schema (from `types.ts`) so backend can validate
  payloads before persisting.

### Phase 6 — Observability

- [ ] **P6-1** Add render-count logging behind `?debug=puck-perf` for the
  three heaviest components (`PuckProvider`, `Preview`,
  `ShopifyOutlinePanel`).
- [ ] **P6-2** Wire `web-vitals` for the editor route.
- [ ] **P6-3** Add a "block-level render trace" plugin that logs `render()`
  invocations per block during dev.

---

## 6. Suggested first PR (safe, small, immediate impact)

The following changes together fit in a single review-friendly PR and
should stop the crash loop without touching business logic:

1. `packages/editor-packages/core/config/index.tsx`
   - Replace `componentKey` computation with a constant string
     (`"v1"` — bump manually when the registry breaks).
2. `packages/editor-packages/core/config/types.ts`
   - Delete the duplicate `import { GroupProps } from "./blocks/Group";` on
     line 24.
3. `apps/web/app/store/[storeSlug]/(dashboard)/design-studio/[...puckPath]/client.tsx`
   - Wrap `metadata` and `iframe` in `useMemo` with an empty dep array.
   - Pull `params` computation into a `useMemo`.
   - Extract `JsonViewerDialog` and the shortcut dialog rendering **out** of
     `overrides.puck` so their local state doesn't invalidate `overrides`.
4. `packages/editor-packages/core/config/lib/normalize-editor-data.ts`
   - Add an early-exit at the top of `normalizeEditorData`:
     ```ts
     if (
       isPlainObject(input.root) &&
       isPlainObject((input.root as any).props) &&
       ((input.root as any).props[SHELL_MIGRATION_VERSION_KEY] as number) === CURRENT_SHELL_MIGRATION_VERSION
     ) {
       return input as UserData;
     }
     ```
   - Replace the recursive `cloneDeep` with `structuredClone` when available.
5. `packages/editor-packages/core/config/plugins/settings/ThemeInjector.tsx`
   - Replace the giant `styleEl.textContent = \`…\`` block with individual
     `documentElement.style.setProperty` calls for the CSS variables.
6. `packages/editor-packages/core/package.json`
   - Move `happy-dom` from `dependencies` to `devDependencies`.
7. `apps/web/package.json` (`scripts.dev`)
   - Add `NODE_OPTIONS='--max-old-space-size=8192' next dev`.

Estimated effort: 3–4 hours. Estimated impact:

- editor input latency: down 30–60 % (no more full store rebuilds per
  keystroke),
- initial bundle size: down 40–80 KB (no Buffer polyfill),
- dev-server memory footprint: measurably lower and no longer growing on
  HMR reloads,
- crash frequency: expected to fall to zero for the current data set.

---

## 7. Metrics to establish *before* touching anything

So you can prove the improvements, capture these numbers first:

1. **Cold dev start**: `pnpm --filter web dev`, time until "compiled
   successfully" and until first paint of `/store/<slug>/design-studio/edit`.
2. **HMR round-trip**: edit `Group/index.tsx`, save, measure time until the
   canvas reflects the change.
3. **RSS growth**: `node --inspect` on the dev server, take a heap snapshot
   before opening the editor and after 5 minutes of interacting.
4. **Bundle size**: `next build --profile` and record the size of the
   `/store/[storeSlug]/(dashboard)/design-studio/[...puckPath]` chunk.
5. **Editor input latency**: with a section selected, type in a text field
   and measure the delay in the canvas (Chrome DevTools → Performance →
   Interaction).
6. **Store dispatches per keystroke**: log `console.count("dispatch")` in
   `store/index.ts:dispatch` — expect 1 per keystroke, likely see many
   more.

Track these numbers in `docs/editor-perf.md` after each phase.

---

## 8. Appendix — File sizes worth calling out

Largest files in the editor (from a `wc -l`):

```
1036  components/Drawer/index.tsx                       (upstream Puck)
 844  components/DraggableComponent/index.tsx           (upstream Puck)
 798  config/plugins/canvas-interactions/CanvasContextMenu.tsx   (yours)
 718  config/theme.ts                                   (yours)
 673  config/blocks/SideDrawer/index.tsx                (legacy — deprecated block)
 671  components/DropZone/index.tsx                     (upstream Puck)
 641  components/DragDropContext/index.tsx              (upstream Puck)
 611  config/plugins/shopify-editor/section-catalog.tsx (yours)
 580  config/lib/normalize-editor-data.ts               (yours)
 556  config/lib/site-data.ts                           (yours)
 512  config/theme-presets.ts                           (yours)
 503  config/plugins/shopify-editor/ShopifyOutlinePanel/index.tsx  (yours)
 492  config/blocks/ContentButton/index.tsx             (yours)
 472  config/plugins/settings/SettingsPanel/ColorPicker.tsx   (yours)
 395  components/AutoFrame/index.tsx                    (upstream Puck)
 370  components/Puck/index.tsx                         (upstream Puck)
 362  config/blocks/Section/index.tsx                   (yours)
 325  config/blocks/Group/index.tsx                     (yours)
 323  components/AutoField/index.tsx                    (upstream Puck)
 322  config/plugins/shopify-editor/AddSectionModal/index.tsx (yours)
```

Numbers change month to month, but these are all >300-line files that
deserve a splitting pass eventually.

---

## 9. Appendix — Glossary of moving parts

- **AppStore** — the Zustand store created in `store/index.ts`. Contains
  every piece of editor state.
- **AppState** — the slice of the store that is history-tracked
  (`state.data`, `state.ui`, `state.indexes`).
- **Config / UserConfig** — the block registry
  (`components`, `categories`, `root`, `fields`, …).
- **ComponentData** — `{ type, props: { id, … }, readOnly? }`.
- **Slot** — the field type that holds nested `ComponentData[]` (used by
  `Section.content`, `Group.content`, `RowGroup.content`, `Sidebar.items`).
- **Zone** — a named region (e.g. `"root:default-zone"`) that holds a
  `ComponentData[]`. Materialised into `state.indexes.zones`.
- **DropZone** — a React component that maps a zone onto a `<div>` and
  wires it to dnd-kit.
- **`walkAppState`** — traverses every node in an `AppState` and rebuilds
  the `indexes.nodes` / `indexes.zones` maps.
- **`resolveComponentData`** — for each node, calls `config.components[type].resolveData`
  if defined, to lazily populate metadata (product data, images, etc.).
- **`normalizeEditorData`** — applies default props, strips visual-only
  keys (`__*`), migrates legacy shell links, inserts SiteHeader / SiteFooter
  / SiteDrawer stubs when missing.
- **`SiteData`** — the outer container persisted to localStorage:
  `{ root, zones, pages: SitePage[] }`.
- **`componentKey`** — a hash of the block registry + initial data, used
  as a version tag on the localStorage key. **Should be a constant.** §2.1
- **`ThemeInjector`** — writes CSS custom properties into the preview
  iframe's `<head>`.
- **`CanvasInteractions`** — outer wrapper for right-click menu + keyboard
  shortcuts.

---

*End of study.*
