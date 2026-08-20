# Creating a new Design Studio theme

A "theme" is a static JSON fixture under `packages/editor-packages/core/themes/theme-*.json`
(`theme-rawaq-furniture.json`, `theme-meridian-almarai.json`, `theme-sooq-modern.json`,
`theme-nova-electronics.json`). Each file is a `SiteData` object — root theme tokens, header/
footer/drawer/popup zones, and a `pages[]` array of Puck block trees — that both the Design
Studio editor and `apps/store`'s `<Render>` consume directly. This doc explains how the existing
four themes are actually built, since more themes are coming and the fastest way to make a bad
one is to copy another theme's page JSON verbatim (see "The #1 mistake" below — it's not
hypothetical, it's exactly what happened to `theme-nova-electronics.json` before it was fixed).

For per-block prop reference, use `packages/editor-packages/core/config/blocks/BLOCKS.md` (page
content blocks) and `ZONES.md` (header/footer/drawer/popup). This doc is about how a whole
*theme* is composed, not what an individual block's props mean.

## 1. The SiteData shape

Read `packages/editor-packages/core/config/lib/site-data.ts` for the authoritative contract.
Short version:

```ts
type SiteData = {
  root: { props: FullThemeProps };  // color/font/spacing/radius tokens — see below
  zones: {
    "root:zone-header": ComponentData[];
    "root:zone-footer": ComponentData[];
    "root:zone-drawer": ComponentData[];
    "root:zone-popup": ComponentData[];      // one entry per named popup (zoneKey)
    "root:zone-bottom-sheet": ComponentData[];
  };
  pages: SitePage[];   // { path, slug, name, title, content: ComponentData[], dynamic?, ... }
};
```

A block node anywhere in `content` (or a nested `content`/`cardTemplate`/`slot` slot) is always
`{ type: "<RegisteredBlockName>", props: {...} }`. Give every node's `props.id` a stable,
descriptive value (`Group-cat-laptops`, not `x`) — the existing themes rely on this for later
find/patch scripts, and so should yours.

### Root theme tokens

`root.props` (~94 keys) is where the theme's whole visual identity lives: `primary`, `surface`,
`success`, `warning`, `error`, `dark`, `text`, `neutral` (hex colors), `bodyFont`/`fontOption1`/
`fontOption2` (font family keys), plus a spacing/radius/font-size/font-weight scale. Blocks read
these via **theme tokens** (`"theme-primary"`, `"theme-md"`, `"option1"`) rather than literal
hex/px wherever possible — that's what lets one edit to `root.props.primary` re-skin every block
that references `theme-primary`. Pick your palette here first; everything downstream should
follow from it.

## 2. Two ways a page's content gets built

### a) Hand-authored pages (home, about, product-detail, most one-off pages)

Home pages, hero sections, FAQ, testimonials — anything genuinely bespoke per theme — are just
written directly into the theme JSON. There's no shared "home page preset" and there doesn't need
to be one; every theme's home page looks different on purpose. When hand-authoring:

- **Never leave a `ContentHeading`/`ContentParagraph`'s `text` as `{"ar": "", "en": ""}`** unless
  it carries a `valueContext` (i.e. it's bound to live data, like a product title). An empty,
  unbound text node is just dead space in the rendered page — this was the single biggest bug in
  nova-electronics before its fix (37 such nodes across the home page).
- **Use `ContentIcon`** (`config/blocks/ContentIcon`) for trust-bar/feature-list icons — it takes
  any `lucide-react` icon name, and `colorMode: "theme"` + `colorTheme: "primary"` (or whichever
  token contrasts with your section's background) keeps it re-skinnable. A theme with zero
  `ContentIcon` usage anywhere is a theme that forgot to add icons to its value-prop sections —
  check with `grep -c '"ContentIcon"' themes/theme-<name>.json`.
- **Multi-column layouts** use `Section.columns` (an integer — Puck renders it as CSS Grid
  `repeat(columns, minmax(0, 1fr))`, so columns are always equal width). This is how the existing
  4-up home "Categories" section works, and how the nova products page's category sidebar was
  built (`Section.columns: 2`, first cell a `CategoryTree` card, second cell the product grid +
  pagination). There's no column-span/flex-basis field on `Group`, so if you need an unequal
  sidebar you'd need a new field — an equal 2-column split with a narrower `CategoryTree` (smaller
  `fontSize`/`indentStep`) reads fine in practice and needs no new code.
- **"Island card" recipe**: any `Group` becomes a floating card by giving it a `backgroundColor`
  distinct from its parent `Section`'s (a "surface" tone, one step lighter/darker than the page
  background), `borderRadius: "theme-md"` (or `"theme-lg"` for a more pronounced card), and
  generous `padding`. Add `boxShadow: "sm"/"md"` **only on light themes** — on a dark theme, the
  shadow presets are plain black (`rgba(0,0,0,...)`) and are invisible against a dark background,
  so dark themes should rely on background-color contrast alone (see nova's `#141a2e` cards on a
  `#0b0f1a` page — no shadow, still reads clearly as a card).

### b) Shared-preset pages, skinned per theme (orders, checkout — extend this pattern to more pages over time)

Some pages are identical in *structure* across every theme (the orders list, the order-detail
page) because they're driven by the same backend data and the same actions
(`actions.orders.*`/`productsPage.*`) — only the visual skin should differ. For these,
**don't hand-copy another theme's page JSON.** Instead:

1. A **theme-agnostic builder** in `config/presets/orders.ts` (`createOrdersPageContent`,
   `createOrderDetailPageContent`, `createCancelOrderZonePopup`) produces the block tree once,
   with all data bindings/actions/`sectionKind`s but only placeholder styling.
2. A **per-theme `themeWalk`** (`config/presets/rawaq-theme-walk.ts` /
   `nova-theme-walk.ts`, one file per theme that needs one) recursively rewrites only the
   *visual* props — `Section.backgroundColor`, the order-card `Group`'s `backgroundColor`/
   `borderRadius`/`boxShadow`, typography tokens, RTL alignment — leaving every binding/action
   prop (`valueContext`, `sectionKind`, `buttonAction`, `link`, ...) untouched. It also swaps
   Arabic source strings for their bilingual `{ar, en}` form via a small per-theme `BILINGUAL`
   map (see `orders-rawaq.ts`/`orders-meridian.ts`/`orders-nova.ts` — yes, each theme duplicates
   the same translation map; that's the accepted convention here, not an oversight — see
   "Don't over-abstract" below).
3. A **per-theme page-builder file** (`orders-<theme>.ts`) composes 1+2 into
   `create<Theme>OrdersSitePage()` / `create<Theme>OrderDetailSitePage()` /
   `create<Theme>CancelOrderZonePopup()`.
4. A **one-shot injection script** (next section) writes the result into the theme's JSON file.

If you're building a *new* theme and it needs `/orders`, don't write that page by hand — write
`<theme>-theme-walk.ts` + `orders-<theme>.ts` following the exact shape of an existing pair, then
inject. `/products`, `/products/:product-slug` and `/settings` don't have this shared-preset layer
yet (they're still hand-authored per theme) — building one for them, so a future theme gets those
pages "for free" with a themeWalk instead of a copy-paste, is a good next investment.

## 3. Writing the JSON back: the injection-script pattern

Theme JSON files are hand-sized (10k+ lines) — you don't hand-edit them for a structural change.
Instead, write a **one-shot script** at `themes/inject-<theme>-<what>.spec.ts` that:

```ts
import fs from "node:fs";
import path from "node:path";
// import your preset/walker builders

const themePath = path.join(__dirname, "theme-<theme>.json");

it("injects/restyles <what> in theme-<theme>.json", () => {
  const theme = JSON.parse(fs.readFileSync(themePath, "utf8"));
  // ...mutate `theme` in place (or replace specific pages)...
  fs.writeFileSync(themePath, `${JSON.stringify(theme, null, <N>)}\n`, "utf8");
});
```

Run it once with `pnpm exec jest themes/inject-<theme>-<what>.spec.ts --testNamePattern=<name>`.

**Gotchas, learned the hard way:**

- **Match the file's existing indent width** (`null, 1` for rawaq, `null, 2` for nova/meridian —
  check with `head -2 theme-<name>.json` first) so your diff is only the intended content change,
  not a whole-file reformat.
- **These scripts are not test-suite-isolated** — `pnpm exec jest` with no path filter (i.e.
  `pnpm test`) runs every `*.spec.ts` file in the repo, including every `inject-*.spec.ts`, every
  time. That means your script **must be idempotent**: running it twice in a row must produce
  byte-identical output. Two concrete failure modes hit during nova's fix:
  - `content.unshift(newNode)` inside a loop that also does `content[fixedIndex] = ...` — the
    first run is correct, but on the second run the unshift has already shifted every fixed index
    by one, so the second run overwrites the wrong node. Guard array mutations
    (`if (content[0]?.type !== "ContentIcon") content.unshift(...)`) so a repeat run is a no-op.
  - Restructuring a page (e.g. wrapping existing sibling nodes into a new wrapper `Section`) by
    removing-then-pushing children — the second run can't find those children anymore because
    they're now nested one level deeper. Guard the whole restructuring with
    `if (!findById(content, "<new-wrapper-id>")) { ... }`.
  - Verify idempotency yourself before moving on: run the script, `md5sum` the theme file, run it
    again, `md5sum` again — they must match.
- **Don't run `pnpm exec jest themes/`** (or the bare full suite) as a way to "test" your new
  script if other themes' injection scripts also live in that directory — every `inject-*.spec.ts`
  in `themes/` re-runs and re-writes its target file on every invocation, and if two scripts that
  touch the same file run in a different relative order than however it was last generated, you
  can get a large, purely-cosmetic reordering diff in a theme you didn't mean to touch. Run your
  own script by its exact file path, and if you need to double check you haven't perturbed another
  theme, `git status`/`git diff --stat` the other theme files before committing.

## 4. Verifying a theme without a browser

The editor/storefront preview isn't reliably reachable from an automated environment on every
branch. Verify theme JSON changes through Jest instead — render pages through Puck's real
`<Render>` pipeline, off the actual on-disk fixture:

- **`config/__tests__/registry-consistency.spec.ts`** runs automatically against every file in
  `themes/*.json` and fails if any block `type` isn't registered — this alone catches most typos.
- **Page-render smoke test**: `normalizeSiteData(theme)` → `composePuckData(site, pagePath)` →
  `<Render config={conf} data={...} />`, wrapped in a `QueryClientProvider` (pages that read the
  customer session need it). See `config/__tests__/theme-rawaq-orders.spec.tsx` and
  `theme-nova-electronics.spec.tsx` for the full pattern, including a `behaviourSignature()` helper
  that diffs two themes' pages structurally while ignoring styling — useful for asserting a new
  theme's shared-preset page (e.g. orders) stayed behaviourally identical to another theme's while
  looking different.
- **Empty-text guard**: walk every page's content and assert no `ContentHeading`/
  `ContentParagraph` has literal-empty bilingual text *and* no `valueContext` — this is the
  automated version of "don't ship blank sections."
- **Own-palette guard**: assert the theme's own hex tokens are present in a page and another
  theme's are absent — this is what would have caught nova shipping rawaq's `#f7f2ea` on
  `/orders` before a human ever had to notice.
- For blocks with real interaction (like `CategoryTree`), test them in isolation with a
  `StoreContext.Provider` supplying sample state — see `config/__tests__/category-tree.spec.tsx`.

## 5. Don't over-abstract

This codebase already tolerates some duplication on purpose: the orders `BILINGUAL` translation
map is copy-pasted verbatim across `orders-rawaq.ts`, `orders-meridian.ts` and `orders-nova.ts`
rather than factored into a shared module. Follow that precedent for a new theme rather than
"fixing" it — a shared translation module would need every existing theme file edited to adopt it,
which is a much bigger, riskier change than the value it buys for translated strings that rarely
change. Reach for a shared helper (like the themeWalk pattern itself) only when the thing you'd
share is *structural* (block trees, the walking logic), not when it's per-theme content.

## Pre-flight checklist for a new theme

1. Pick `root.props` tokens first (colors, fonts) — everything else should reference them via
   theme tokens, not literal values.
2. Hand-author bespoke pages (home, about, ...) directly — no empty text nodes, use `ContentIcon`
   for icon-shaped content, island-card any `Group` you want to visually separate.
3. For shared pages (orders today; more as the preset layer grows), write
   `<theme>-theme-walk.ts` + `<page>-<theme>.ts` + an injection script — don't copy another
   theme's already-skinned JSON.
4. Run `registry-consistency.spec.ts`, a page-render smoke test, an empty-text guard, and an
   own-palette-vs-other-themes guard before calling any page done.
5. Confirm your injection script is idempotent (`md5sum` before/after a second run) before it's
   safe to leave in the repo.
