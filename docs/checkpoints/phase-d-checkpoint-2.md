# Checkpoint D-2 — Properties sidebar + settings + outline (Phase D, part 2)

> **Status: ready for your testing.** Follows [checkpoint D-1](./phase-d-checkpoint-1.md)
> (tested ✓). Covers D-3, D-4, D-5, D-6 — **Phase D is now complete (8/8)**.

## Properties sidebar redesign (D-3)

Selecting a block no longer dumps a flat wall of fields. The sidebar now has:

- **Sticky header** with the block's title and a clickable **parent breadcrumb** —
  e.g. inside a Section you see `قسم جديد ‹ عنوان`; clicking the parent crumb selects it.
- **Three tabs**: **المحتوى** (what it says) / **التصميم** (how it looks) / **متقدم**
  (rarely touched). The tab bar only appears when a block actually has more than one
  non-empty group — simple blocks stay a plain list.
- Classification is one shared map (`components/Puck/components/Fields/field-groups.ts`):
  a block can pin a field explicitly via `metadata: { group: "style" }`, otherwise the
  field *name* is classified (padding/colors/layout/gap/columns/fontSize… → التصميم;
  id/anchorId/visible/metadata… → متقدم; everything else → المحتوى). **All ~55 blocks
  got the organized sidebar at once** — no per-block wiring.

## Shared alignment field (D-4, scoped)

The alignment icon-toggle (يمين/وسط/يسار) was copy-pasted — inline styles and all — in
**6 blocks** (ContentHeading, ContentParagraph, ContentButton, ButtonGroup, ContentLink,
ContentImage). Now one factory: `config/fields/AlignField/createAlignField()`, tagged
`metadata: { group: "style" }` so it lands in the التصميم tab automatically. The broader
"reuse primitives everywhere" sweep is folded into the deferred field-audit backlog.

## Settings plugin (D-5)

- The **«المظهر»** section (badges shape/style, header/footer layout variants, mobile/
  tablet breakpoints — `LookBlock`) existed but was commented out; it's now a live
  collapsible between الألوان and أنماط الأزرار.
- New **«إعادة التعيين إلى إعدادات الثيم الافتراضية»** button at the panel bottom:
  confirm-gated (Arabic prompt), resets colors + fonts + badges + shell variants +
  breakpoints to stock, **keeps your locale settings** (اتجاه/لغة/عملة), and records
  history so **Ctrl+Z undoes it**.
- Live preview needed no work — the per-variable ThemeInjector from Phase C already
  applies every settings change instantly.

## Outline panel interactions (D-6)

The section list (الأقسام) is now bidirectionally wired to the canvas:

- **Hover a row** → the block gets the hover overlay in the canvas.
- **Select a row** → the canvas scrolls the section into view; selecting on the canvas
  scrolls the outline list to that row.
- **Drag rows to reorder** — HTML5 drag with a blue before/after drop indicator;
  dispatches a real Puck `reorder` (undoable, recorded in history). Arrow keys still
  move sections (Ctrl/⌘+arrows pass through to the global move shortcut).

## Verification

- **Jest: 42 suites / 316 tests / 19 snapshots — all green** (includes the 71-test
  section-catalog suite from D-8). Core `pnpm build` clean; my-files typecheck clean.
- **Live-verified in the editor** (fresh default site): fields tabs + counts (Page root:
  المحتوى 1 / التصميم 12 / متقدم 2), header + breadcrumb select, style grouping incl.
  the new AlignField; المظهر collapsible renders; badge-shape change → reset → default
  restored with the Arabic confirm prompt; outline hover → canvas overlay; drag-reorder
  moved a section end-to-end and the drop indicator classes render.

## ⚠️ Please test by hand

1. **Outline drag-reorder drop position** — the automated pane can't do real pixel
   drags, so please confirm: dragging a row *above* another lands it before, *below*
   lands it after, and the blue indicator matches where it will land.
2. **Fields tabs on your real blocks** — select a few of your actual sections/blocks
   and check nothing important landed in a surprising tab (any field can be pinned via
   `metadata: { group }` if you find one).
3. **Settings reset** — on your real theme: tweak a color + badge shape, hit the reset
   button, confirm, then Ctrl+Z to make sure the undo restores your values.
4. Quick regression pass on D-1 flows (add section, empty-zone CTAs) since the panel
   code was touched again for the reorder/hover work.

## Files touched (this checkpoint)

| Area | Files |
|---|---|
| Fields tabs (D-3) | `core/components/Puck/components/Fields/{field-groups.ts,index.tsx,styles.module.css}` |
| Align field (D-4) | `core/config/fields/AlignField/index.tsx` + the 6 Content* / ButtonGroup blocks |
| Settings (D-5) | `core/config/plugins/settings/SettingsPanel/{index.tsx,LookBlock.tsx}` |
| Outline (D-6) | `core/config/plugins/shopify-editor/ShopifyOutlinePanel/{TemplateSectionList.tsx,index.tsx,styles.module.css}` |

**Next on your "complete": Phase E** — the store-creation wizard (logo upload → palette
extraction → guided theme genesis) + final verification pass.
