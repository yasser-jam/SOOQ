# Checkpoint A-1 — Editor stabilization (Phase A, Day 1)

> **Status: ready for your testing.** Branch `editor-preview`, uncommitted working tree.
> Roadmap steps completed: A1-1, A2-1 … A2-8, A4-1, A4-2 (11 of 12 — the dead-weight purge
> A3-1 is deliberately the *next* checkpoint so we don't mix deletions into this test).

## TL;DR

The dev-server crashes were real code bugs, not your hardware — though your machine's
7.6 GB RAM made them fatal. The five root causes from the study doc are all fixed, the
long-dead test harness now runs the **entire upstream Puck suite (31 suites / 149 tests,
all green)**, and your three `themes/*.json` files are now regression fixtures that lock
the Site JSON contract.

Measured so far (see [editor-perf.md](../editor-perf.md)): editor route compile 28 s → 3.9 s*,
`next-server` RSS 2,210 MB → 1,764 MB, and the Node heap is now capped so a runaway compile
can no longer take down the whole machine. (*warm Turbopack cache — treat as indicative
until you confirm the editing feel.)

## What changed and why

### Crash/RAM fixes (editor core — `packages/editor-packages/core`)

| File | Change |
|---|---|
| `config/index.tsx` | `componentKey` is now the constant `"v1"`. It used to be a ~50 KB base64 string built with Node's `Buffer` at module load — that dragged the Buffer polyfill into every client bundle and made every localStorage read hash a 50 KB key. |
| `config/lib/site-data.ts` | **(1)** One-shot migration adopts your existing saved site from the old giant key — your current localStorage content is preserved. **(2)** `readSiteData` caches by raw localStorage string: unchanged storage → zero re-parse/re-normalize (this used to run thousands of deep clones per keystroke). **(3)** `normalizeSiteData` no longer re-normalizes the site zones once per page for a discarded result. |
| `config/lib/normalize-editor-data.ts` | Deep clones use native `structuredClone` (~10× faster) with the old recursive copy as fallback. |
| `components/Puck/index.tsx` | The module-level resolve-data cache is cleared when the editor unmounts — it used to grow forever across page switches and HMR reloads. |
| `config/plugins/canvas-interactions/CanvasContextMenu.tsx` | The 500 ms forever-polling `setInterval` is replaced by a MutationObserver + the existing iframe `load` listener. |
| `config/plugins/settings/ThemeInjector.tsx` | Static CSS is written once per iframe document; theme values now update via per-variable `style.setProperty` instead of rewriting/re-parsing a 120-line stylesheet on every color tweak. |
| `config/cart/map-cart-line-to-bound-data.ts`, `config/binding/resolve-bound-images.ts` | Fixed `@/core/lib/media` → relative `../../lib/media`. This import (from the recent media commits) had **broken the package's tsup build**; `pnpm install` failed at the `prepare` script. Both now work. |
| `package.json` | Removed `happy-dom` from dependencies (completely unused, ~5 MB). |

### Editor host (`apps/web`)

| File | Change |
|---|---|
| `…/design-studio/[...puckPath]/client.tsx` | The big one. `metadata` + `fieldTransforms` are module constants, `iframe` is memoized — fresh objects per render used to re-initialize the **entire Puck store on every re-render** (§2.3). The hint pill + shortcut/JSON dialogs moved into a new `EditorFloatingTools` component that owns its state inside the Puck tree, so opening them no longer recreates `overrides` (which also reset the store). JSON viewer subscribes to editor data only while open. `handleOpenPreview` reads data via ref. |
| `lib/use-demo-data.ts` | `savePageData` wrapped in `useCallback`; stable default `metadata` (the inline `{}` default re-triggered `resolveAllData` every render in preview/render mode). |
| `package.json` | `dev` script: `NODE_OPTIONS=--max-old-space-size=3072`. Note: the study doc suggested 8192 — **wrong for your machine** (7.6 GB total); 3 GB forces GC instead of ballooning into system OOM, which is what corrupted Turbopack's cache and produced the multi-minute "hang then die" starts. |

### Test harness (was dead — never ran)

- The old `jest.config.ts` required `ts-node`, which was never installed → **no spec in this
  repo had ever executed**. Replaced with `jest.config.mjs` (plain JS) + pnpm-aware
  transform patterns, jsdom polyfills (`test/setup.ts`), and a stub for the ESM-only
  `lucide-react/dynamicIconImports`.
- The full upstream Puck suite was recovered: 30 suites existed untouched; 129/130 passed
  immediately, one stale snapshot updated (it predated your `zonePreviewRoot` addition).
- **New fixture suite** `config/lib/__tests__/site-data-fixtures.spec.ts`: each
  `themes/theme-{1,2,3}.json` must normalize idempotently, keep every page path, place
  header/footer in canonical shell zones, produce renderable home content, match dynamic
  product routes, and have unique component ids. This is the contract every Phase B
  refactor must keep green.
- Wiring: root `pnpm test` → `turbo test` → core's `jest`.

## How to test

1. `pnpm install` (lockfile changed), then `pnpm --filter web dev`.
2. Open your store's **design studio → edit**. Your existing site content should still be
   there (key migration — if anything looks missing, tell me before touching localStorage).
3. Type continuously in a text field of a block: the canvas should follow with noticeably
   less lag than before, and RAM (System Monitor → `next-server`) should stay roughly flat.
4. Open/close the **JSON viewer** and the **"?" shortcuts dialog** while a block is
   selected — the canvas should not flash/re-render behind them.
5. Change **colors/fonts in the settings panel** — the preview should update instantly.
6. Right-click blocks in the canvas (context menu still works after the polling change).
7. Switch pages in the pages panel a few times, then keep editing — no memory creep.
8. Publish, open **preview**, and check the storefront app (`pnpm --filter store dev`,
   port 3001) still renders the site.
9. `pnpm test` — 31 suites / 149 tests should pass.

## Known notes / not done here

- `apps/web` has **223 pre-existing TS errors** (hidden by `ignoreBuildErrors: true`,
  scheduled as B-8). None are in files touched by this checkpoint.
- Browser-side metrics (typing latency, heap) still need your logged-in session — if you
  can, note the "feel" before/after and I'll record it in `editor-perf.md`.
- Next checkpoint (A-2): dead-weight purge — root `app/`, top-level Puck leftover packages,
  `apps/demo`, `apps/editor`, legacy routes. Deliberately separated so this test stays clean.
