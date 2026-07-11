# Checkpoint A-2 — Dead-weight purge (Phase A complete)

> **Status: ready for your testing.** Follows [checkpoint A-1](./phase-a-checkpoint-1.md)
> (tested ✓). This completes Phase A (12/12).

## What was deleted

**Workspace husks** — none of these had a `package.json`; they contained only gitignored
`dist`/`node_modules` leftovers from the original Puck repo import (the live copies are in
`packages/editor-packages/`):

- root `app/` (empty stray directory)
- `packages/core`, `packages/create-puck-app`, `packages/field-contentful`
- top-level `packages/plugin-emotion-cache`, `packages/plugin-heading-analyzer`
- `packages/tsup-config`, `packages/tsconfig`, `packages/eslint-config-custom`
- `apps/demo`, `apps/editor`

**Legacy routes in `apps/web`:**

- `app/(dashboard)/` — the pre-slug dashboard group; it contained only empty directories
  (files were already migrated to `app/store/[storeSlug]/(dashboard)/`)
- `app/shop/[storeSlug]/(storefront)/` — the "قيد التطوير" placeholder storefront (2 files),
  redundant with `apps/store`. The **customer-auth pages were kept**
  (`/shop/[slug]/request-otp`, `/shop/[slug]/verify-otp`) — they're the real OTP flow.

The workspace is now exactly: `apps/{web,store}` +
`packages/{editor-packages,ui,eslint-config,typescript-config}`.

## Verified

- No source references to any deleted path (grepped links, imports, workspace deps —
  `storefront-url.ts` defaults to `/store`, untouched by the `/shop` placeholder removal).
- `pnpm install` clean (including the core package `prepare` build).
- Full jest suite: 31 suites / 149 tests green.
- Dev smoke: `/`, `/store/demo/design-studio/edit`, `/shop/demo/request-otp` all 200,
  no errors in the dev log.
- CLAUDE.md files updated to match the new layout.

## How to test (short)

1. `pnpm install && pnpm --filter web dev` — app boots.
2. Editor still opens and edits (same as checkpoint A-1).
3. If you have any bookmark/link to `/shop/<slug>` (placeholder storefront), it now 404s —
   expected; the storefront is `apps/store` (port 3001).
4. Optional: `pnpm --filter store dev` — storefront still renders your published site.

## Next (Phase B — Day 2, consolidation)

Single manifest-driven block registry (collapse `index/server/rsc`), legacy-block
migration/lazy-loading, RowGroup-vs-Group resolution, shell-zone dead code removal,
`ignoreBuildErrors` off (223 pre-existing TS errors to triage). Registry-consistency spec
lands first (B-1), before any of it.
