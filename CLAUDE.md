# SOOQ — Shopify-like Multi-tenant E-commerce Platform

Arabic-first (RTL, `lang="ar"`) platform for creating stores, managing products/orders/shipments/offers,
and visually building the storefront with a Puck-based editor. Currency default: SYP.

## Monorepo layout (pnpm + Turborepo)

| Path | What it is |
|---|---|
| `apps/web` | Main Next.js app: merchant admin dashboard, platform-owner pages, auth, onboarding, **Design Studio** (editor host). Port 3000. |
| `apps/store` | Rendered storefront (the "published" site). Renders store pages from the editor's Site JSON via Puck `<Render>`. Port 3001. |
| `packages/editor-packages/core` | **Fork of Puck 0.21.1** (`@puckeditor/core`) heavily customized — all editor blocks, plugins, theme, and Site JSON logic live in `config/`. |
| `packages/editor-packages/plugin-*` | Puck plugins (heading-analyzer, emotion-cache). |
| `packages/ui` | Shared design system (`@workspace/ui`) — shadcn-style components, Tailwind 4 tokens. |
| `packages/{eslint-config,typescript-config}` | Shared tooling configs (`@workspace/*`). |
| `docs/` | Living docs — read before big changes (see below). |

(Historical note: leftover husks from the Puck repo import — top-level `packages/core`,
`create-puck-app`, `field-contentful`, `plugin-*`, `tsup-config`, `tsconfig`,
`eslint-config-custom`, plus `apps/demo`, `apps/editor` and the root `app/` dir — were
purged on 2026-07-12. The only live copies are inside `packages/editor-packages/`.)

## The two main flows

1. **Admin flow** — `apps/web/app/store/[storeSlug]/(dashboard)/**` routes, backed by domain
   modules in `apps/web/modules/**` (see `apps/web/modules/CLAUDE.md` for the module pattern).
2. **Builder flow** — Design Studio at
   `apps/web/app/store/[storeSlug]/(dashboard)/design-studio/**` mounts the Puck editor from
   `@/core` (path alias → `packages/editor-packages/core`). The editor produces a **Site JSON**
   (`SiteData`: root theme + zones + pages[]) persisted via
   `packages/editor-packages/core/config/lib/site-data.ts` (currently **localStorage only** —
   backend persistence is a known gap). `apps/store` reads that same JSON and renders it.

## Commands

```bash
pnpm dev          # turbo dev (all apps) — or: pnpm --filter web dev / --filter store dev
pnpm build        # turbo build
pnpm lint         # eslint via turbo
pnpm typecheck    # tsc --noEmit via turbo
```

Node >= 20, pnpm 9. Backend API is external (Spring-style, `NEXT_PUBLIC_API_URL`), with
Bearer auth + `X-Tenant-ID` and an `ApiResponse`/`PagedApiResponse` envelope.

## Path aliases (important)

- `@/core` and `@/core/*` → `packages/editor-packages/core` (both apps/web and apps/store)
- `@workspace/ui/*` → `packages/ui/src/*`
- In `apps/store`: `@/modules/*`, `@/lib/*`, `@/config/*` alias into **`apps/web`** (cross-app
  coupling — store reuses web's modules/lib; be careful when moving files in web).

## Key docs (read these before touching related areas)

- `docs/editor-study-and-enhancement-plan.md` — deep dive into the editor architecture,
  its perf bottlenecks, and a phased enhancement plan. **Required reading before editor work.**
- `docs/editor-code-roadmap.html` — open in a browser. File-level map of the editor packages
  (layers, Site JSON flow, DnD engine, plugins), a ranked audit of code smells / perf traps /
  dead code with a phased remediation plan, and the root-cause writeup of the drag-and-drop
  freeze (dnd-kit's un-guarded drop promise) fixed in
  `core/lib/dnd/recover-drag-operation.ts`.
- `docs/PRD_COMPLIANCE_PLAN.md` — admin/PRD execution plan with progress dashboard (~95% done).
- `docs/frontend-standards.md` — inferred code conventions for `apps/web` + `packages/ui`.
- `docs/routing-refactor-plan.md` — the three-audience routing split (merchant `/store/[slug]`,
  customer `/shop/[slug]`, platform `/platform`).
- `docs/order-admin-ai-rules.md` — rules for order-module work (also: this is a dev env, no prod data).
- `docs/refactoring-notes-detail-pages.md` — create/edit detail-page pattern.

## Conventions that apply repo-wide

- Arabic-first UI: user-facing strings in Arabic, layout RTL. Bilingual data fields use
  `*Ar` / `*En` suffixes (e.g. `titleAr`, `titleEn`).
- Zod schemas are the type source (`z.infer`); react-hook-form + zodResolver for forms.
- TanStack Query for server state; per-module `queryKeys.ts` + actions.
- Files kebab-case; no default exports for components (named exports preferred).
- Toasts via sonner. Icons via lucide-react.
