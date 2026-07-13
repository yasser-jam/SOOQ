# Checkpoint C-1 — Interaction quality: outline, crash-safety, drafts (Phase C, part 1)

> **Status: ready for your testing.** Follows [checkpoint B-1](./phase-b-checkpoint-1.md).
> Phase C is split in two: this checkpoint covers **C1** (DnD/selection/crash-safety);
> the binding work (**C2**) comes next.

## What changed

### 1. Selection outline fixed for RTL / moving elements (C1-2)

The "outline drifts left/right of the element" bug had two root causes — neither was
the drag-and-drop collision logic (that was already RTL-aware upstream):

- **Ancestor scroll ignored.** The overlay position was accumulated from
  `offsetLeft/offsetTop`, which are *layout* positions. Any scrolled container between
  the block and `<body>` shifted the element visually without changing those offsets —
  and RTL horizontal scrollers *start* scrolled, so the outline was reliably off
  sideways. `getOffsetWithinBody` now subtracts ancestor `scrollLeft/scrollTop`
  (negative RTL scrollLeft included).
- **No re-sync on movement.** The overlay only re-synced when the element itself
  *resized*. If a sibling reflowed or a container scrolled, the element moved without
  resizing and the outline stayed where it was. While an overlay is visible
  (hover/selected), a lightweight per-frame watcher now compares the element's
  document-space position and re-syncs on actual movement — zero cost while nothing
  is hovered or selected.
- Bonus: the floating action bar (duplicate/delete/…) now clamps back into view when
  the block's right edge is outside the frame (the common RTL case); previously only
  left-edge overflow was handled.

Verified in-browser on theme-1: overlay hugs a selected heading to **±0.2px** in RTL;
after shifting the element via ancestor padding, and inside a container scrolled to
`scrollTop:10 / scrollLeft:-15` (RTL negative), deltas stayed ≤0.4px. Before the fix
the same scenarios were off by exactly the shift/scroll amounts (60–120px measured).

### 2. Crashes contained: error boundaries at three levels (C1-3)

New `components/BlockErrorBoundary/` used at:

| Level | Behavior on crash |
|---|---|
| Per block, edit canvas (`DropZoneChild`) | Red dashed fallback card in place of the block: «تعذّر عرض هذا العنصر» + error message + «إعادة المحاولة». Block stays selectable/deletable; for `inline` blocks the fallback keeps the dragRef so dnd around it keeps working. |
| Per block, render mode (`DropZoneRenderItem` + `SlotRender`) | Block silently skipped (`console.error` logged) — one broken block can no longer white-screen the published storefront or preview. |
| Whole canvas (`Preview`) | Fallback with «إعادة تحميل الكانفس» button that re-renders in place — for crashes outside any block (root render, zone plumbing). |

### 3. Draft autosave — a crash never loses work again (C1-4)

New `config/lib/page-draft.ts` + wiring in the design-studio client:

- Every edit is **debounce-written (1s)** to `puck-demo:v1:draft:<path>` — separate
  from the published site key; **publish stays explicit**.
- A **baseline guard** ignores Puck's mount-time `resolveData` churn, so opening the
  editor never creates a phantom draft (verified: 0 draft keys after mount).
- On reopening a page with an unpublished draft: the draft is restored into the editor
  with a notice — «تمت استعادة مسودة غير منشورة (05:46 ص)» — offering
  **متابعة التحرير** / **تجاهل المسودة** (discard reverts to the saved page).
- Publish and preview-save clear the draft (and cancel any in-flight debounce so a
  stale draft can't resurrect). Editing back to the exact saved state also clears it.
- Pending edits are flushed to the draft when switching pages inside the editor.

Verified in-browser end-to-end: edit → draft written (site key untouched) → reload →
notice + restored data → discard → clean; edit → publish → change lands in site JSON,
draft cleared.

### 4. DnD lag audit after Phase A (C1-1)

- The Phase A fixes removed the two biggest sources (store re-init per render, style
  mirroring). The main remaining synchronous cost is **drop finalization** — the
  insert/move dispatch triggers `walkAppState` + `resolveComponentData`, which is heavy
  when bound blocks (ProductsGrid/ProductCard) re-resolve → that is exactly **C2-3**.
- Collision direction in `DragDropContext.onDragOver` already handles `dir="rtl"`
  (upstream `getDeepDir`) — no fix needed there.
- The "sometimes it crashes while dragging" reports are now covered by the per-block
  boundaries (drag insert previews render blocks through the same guarded path).
- True frame-pacing numbers need a visible screen — **please judge DnD smoothness in
  your test below** (my browser pane renders pages hidden; rAF/ResizeObserver don't
  fire there at all).

## Verified

- Jest: **34 suites / 193 tests green** (10 new: `page-draft.spec.ts`,
  `BlockErrorBoundary/__tests__/index.spec.tsx`).
- Core package `pnpm build` (tsup + DTS): passes.
- Live editor session (theme-1/edit, dev store seeded): editor 200, canvas renders 35
  blocks, **zero console errors, zero server errors** through select → edit → reload →
  restore → discard → publish.

## How to test

1. `pnpm --filter web dev` → open the editor on any theme page.
2. **Outline:** select blocks deep in the page (inside groups/rows); scroll while
   selected; resize the sidebar — the outline should now stay glued to the element.
   Try a block inside a horizontal scroller if you have one.
3. **DnD feel:** drag a few blocks around a 30-block page — judge the smoothness
   (this is the one thing I couldn't measure headlessly).
4. **Drafts:** make an edit, wait a second, close the tab *without publishing* →
   reopen the editor → the yellow restore notice should appear; try both buttons.
   Then edit + publish → reload → no notice.
5. `pnpm test` → 34 suites green.

## Next: C2 — binding layer
Unit specs for `binding/` first, then: one fetch per ProductsGrid + skeletons, stable
`resolveData` metadata (stop re-resolve cascades — also the drop-lag fix), the
`DataAdapter` inversion (core stops importing apps/web), and sample-data-in-editor mode.
