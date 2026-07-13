# Checkpoint D-1 — Add-section flow + empty-slot CTAs (Phase D, part 1)

> **Status: ready for your testing.** Follows [checkpoint C-2](./phase-c-checkpoint-2.md)
> (tested ✓). Covers D-1, D-2, D-7, D-8; the sidebar/settings work (D-3–D-6) is
> checkpoint D-2.

## The headline finding (D-1)

The add-section experience you asked for **already existed and was switched off**:
`shopifyOutlinePlugin` (section panel + AddSectionModal with 17 prefilled preset cards,
category tabs, and a collection-picker configure step for the products grid) registers
under the name `"outline"` — and the editor client filtered exactly that name out,
falling back to Puck's plain outline and bare empty-Section inserts.

What I did:

- **Re-enabled the panel** (one-line unhide + guard comments so it can't silently
  regress again).
- **Arabized the entire surface**: all 17 catalog labels + descriptions, category tabs
  (افتتاحية/المتجر/العميل/المحتوى/تخطيط), the modal («إضافة قسم»), the section list
  (إخفاء/تكرار/حذف/بحث/«إضافة هنا»), the panel guide, and the **starter content** every
  new section ships with («قسم جديد»، «وصل حديثاً إلى متجرك»، «تسوق الآن»).
- The panel gives you: quick-start presets on an empty page, per-row hide/duplicate/
  delete/keyboard-nav, inline "add here" between rows, search, and the `A` / `Shift+A`
  shortcuts.

## Empty zones now tell you what to do (D-2)

The "dead gray box" empty slots are gone:

| Zone | What you see | Click → |
|---|---|---|
| Empty page (root) | «ابدأ ببناء صفحتك من أقسام جاهزة» + **+ إضافة قسم (A)** | opens the AddSectionModal |
| Empty slot inside a block | «لا توجد عناصر هنا بعد» + **+ إضافة عنصر** | selects the parent block and flips the left sidebar to the blocks palette |
| Shell zones (drawer/popup/bottom-sheet) | the generic block CTA | palette |

(The old hint was an English CSS `::before`; the CTA replaces it and dims out of the
way while dragging.)

## Context menu split (D-7)

`CanvasContextMenu.tsx` went from **803 lines to a ~60-line root** composing:
`lib/use-component-actions` (all reducer mutations), `lib/use-context-menu-target`
(outer + iframe listeners), `lib/use-menu-dismissal` (highlight/outside-click/clamp),
`lib/use-canvas-shortcuts` (keyboard), `ContextMenuPortal` (UI), `lib/clipboard`.
Behavior unchanged; menu labels now Arabic.

## Tests (D-8)

`section-catalog.spec.tsx` — **71 new tests**: every preset build is JSON-serializable,
wraps itself in a Section, references only registered block types, survives the Site
JSON normalize pipeline idempotently, and has Arabic label/description; ids unique.

## Verified

- Jest: **42 suites / 316 tests green** (71 new). Core build passes; the only tsc
  complaints in touched files are pre-existing fork lines (blamed to the original import).
- Live browser E2E: emptied the home page → root CTA rendered → click opened the
  Arabic modal (17 cards, 5 tabs) → picked «قسم هيرو» → populated section landed on
  canvas + panel row (and correctly went into the **draft**, not the published site).
  Nested CTA click flipped the sidebar to the palette. Your site data was backed up and
  restored after the test; zero new console/server errors.

## How to test

1. Open the editor → left sidebar now has the sections panel (أقسام الصفحة) with your
   page's section rows — try hide/duplicate/delete/search and «إضافة هنا» between rows.
2. Press **A** (or the «إضافة قسم» button) → the catalog modal: browse categories, try
   «شبكة المنتجات» (it asks for a collection first), insert a couple of presets.
3. Create/empty a page → the canvas itself shows «+ إضافة قسم (A)»; click it.
4. Add a Group and delete its content → the empty slot shows «+ إضافة عنصر»; click it —
   the palette opens with the Group selected.
5. Right-click any block → the context menu is now Arabic; shortcuts unchanged.
6. `pnpm test` → 42 suites green.

## Next: checkpoint D-2 — sidebar + settings
D-3 properties-sidebar tabs (المحتوى/التصميم/متقدم), D-4 field polish, D-5 settings
plugin reorganization around the theme model, D-6 outline↔canvas selection sync audit.
