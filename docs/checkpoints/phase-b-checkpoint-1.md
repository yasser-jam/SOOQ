# Checkpoint B-1 — Registry consolidation (Phase B)

> **Status: ready for your testing.** Follows [checkpoint A-2](./phase-a-checkpoint-2.md)
> (tested ✓). Phase B closed: 4 items done, 4 re-scoped to the backlog **with evidence**
> (see below — you should sanity-check the re-scope decisions, they're judgment calls).

## What changed

### The "triplicated registry" is now a single registry
Investigation result that changes the study doc's picture: `config/server.tsx` **and**
`config/rsc.tsx` were imported by **nothing** — not the apps, not the bundle entries. The
triplication problem was really one live file plus two dead copies silently drifting.

- Deleted `config/server.tsx`, `config/rsc.tsx`, and the orphaned block-level
  `Hero/server.tsx` + `Template/server.tsx`.
- `config/index.tsx` is now the **only** block registry. When you add a block, there is
  exactly one place to register it.

### New guard: registry-consistency spec (B-1)
`config/__tests__/registry-consistency.spec.ts` — 34 assertions that fail the suite if:
- a palette category lists an unregistered type,
- any section/zone preset references an unregistered block,
- any `initialData` page or `themes/*.json` fixture contains an unknown type,
- a registered block is missing a render function.

This is the tripwire that makes single-registry safe going forward (and it's exactly the
test that will catch mistakes during the future legacy-block migrations).

### Circular imports removed (B-7)
- `componentKey` now lives in `config/component-key.ts` (index re-exports it, site-data
  imports it directly) — `Template → config/index → Template` static cycle gone.
- The Template demo block builds its examples from direct sibling block imports and takes
  the live config from `usePuck` instead of `await import("../../index")` — dynamic cycle gone.

### Dead code trimmed (B-5, scoped)
- Removed the commented-out shell-rail import + style blocks from `config/root.tsx`.
- **Deliberately kept:** `shell-zones.ts` and the shell-rail migration branches in
  `normalize-editor-data.ts`. They looked like dead code in the study doc, but the outline
  panel references the constants and the migration actively converts old saved sites'
  rail-zone drawers into the drawer zone. Deleting them would break old localStorage data.

## Re-scoped to backlog — sanity-check these calls

| Item | Why not now |
|---|---|
| **B-3 legacy-block migration/lazy-loading** | Your shipped themes *actively use* 7 legacy types (Heading ×13, Text ×13, NavMenu ×12, Card ×9, ProductImage ×8, Hero ×7, ProductsGrid ×5 across theme-1/2/3.json). Migrating means rewriting the theme JSONs in the same change — a full task of its own. And the "lazy-load Tiptap" idea is void: Tiptap is imported by the core inline-editing pipeline (`store/index.ts`, field-transforms), not just the legacy RichText block. |
| **B-4 RowGroup↔Group merge** | RowGroup is load-bearing today: used by fixtures, header zone presets, and the zone-preset spec. Merging it right before Phase D builds the new add-section UX on those presets is the wrong order. New code should prefer `Group`. |
| **B-6 theme-gallery out of initialData** | Whether fresh sites ship demo/theme-gallery pages is a product decision that the Phase E wizard likely makes moot. Decide there. |
| **B-8 `ignoreBuildErrors` off** | The flag hides 223 errors (via web) / 717 (core's own strict tsconfig) — all upstream-fork strictness debt across 60+ files. Fixing against Puck 0.21 and then rebasing to 0.22+ is double work; bundled with the rebase backlog item. Current net: package DTS build passes + 183 jest tests. |

My recommendation is these four wait — the remaining days buy more value in Phase C
(binding/DnD) and D/E (UX + wizard). Veto if you disagree.

## Verified

- Jest: **32 suites / 183 tests green** (149 previous + 34 new registry assertions).
- Package build (`pnpm build` in core): passes.
- Dev smoke: editor route 200, zero errors in dev log.

## How to test (short — nothing user-visible should change)

1. `pnpm --filter web dev` → open the editor: palette shows the same categories/blocks,
   pages render identically.
2. Themes panel → apply a theme → still renders (legacy blocks intact).
3. `pnpm test` → 32 suites green.

## Next: Phase C — interaction quality
DnD profiling after the Phase A fixes, the RTL selection-outline bug, per-block error
boundaries + draft autosave, and the binding-layer work (one fetch per grid, stable
`resolveData` metadata, `DataAdapter` inversion so core stops importing apps/web).
