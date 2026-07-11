# apps/web — Admin Dashboard + Platform + Editor Host

Next.js 16 App Router app. Three audiences, split at the URL/layout/middleware level
(see `docs/routing-refactor-plan.md`):

| Audience | URL prefix | Location in `app/` |
|---|---|---|
| Merchant (store admin) | `/store/[storeSlug]/...` | `app/store/[storeSlug]/(dashboard)/...` |
| Customer (storefront) | `/shop/[storeSlug]/...` | `app/shop/[storeSlug]/...` — placeholder; the real storefront is `apps/store` |
| Platform owner | `/platform/...` | `app/(platform)/platform/...` |
| Merchant auth | `/request-otp`, `/verify-otp` | `app/(auth)/...` (OTP-based) |
| Onboarding | `/onboarding/create-store` | `app/onboarding/...` |

`app/(dashboard)/products/...` is a legacy remnant of the pre-slug routing — new dashboard
routes always go under `app/store/[storeSlug]/(dashboard)/`.

## Dashboard sections (routes ↔ modules)

`account`, `audit-logs`, `customers`, `design-studio`, `discount-codes`, `finance`
(COD reconciliation), `inventory`, `invoice-layouts`, `invoices`, `logistics`
(shipping providers/shipments), `orders`, `payment-providers`, `products`
(+ attributes/categories/collections/tags/import), `refunds`, `settings`, `staff`.

Routes are **thin**: a `page.tsx` should mostly compose components from the matching
domain module in `modules/` (see `modules/CLAUDE.md`). Route-private helpers go in a
`_components/` folder next to the route.

## Design Studio (the builder flow)

- `app/store/[storeSlug]/(dashboard)/design-studio/page.tsx` — template gallery / theme cards.
- `.../design-studio/[...puckPath]/client.tsx` — mounts the Puck editor (`<Puck>` from `@/core`)
  with plugins (pages, zones, themes, settings, shopify-editor, canvas-interactions, …).
- `.../design-studio/[templateName]/{edit,preview}` — template edit/preview routes.
- Editor state = Site JSON handled by `@/core/config/lib/site-data.ts` (localStorage today).
- Helpers: `lib/design-studio-paths.ts`, `lib/resolve-puck-path.ts`,
  `modules/design-studio/` (store theme selection/presets).

## Cross-cutting infrastructure (`lib/`)

- `lib/api.ts` — the axios instance every module action uses. Adds Bearer token from cookies,
  auto-refresh on 401 with a single-flight `refreshPromise`, error normalization via
  `lib/api-error.ts`. Never create ad-hoc axios clients.
- `lib/types.ts` — `ApiResponse<T>` / paged envelope types; `lib/pagination.ts` for `meta`-based paging.
- `lib/auth/` + `app/api/auth/{session,refresh,logout}` — Next route handlers proxying
  session/refresh; `middleware.ts` guards routing; `config/cookies-config.ts` names cookies.
- `lib/tenant-context.ts` — tenant (store) context; requests carry `X-Tenant-ID`.
- Dev mode: `devAuthEnabled` (`modules/auth/auth/init.ts`) lets modules fall back to
  localStorage-backed fake data (`sooq-dev-*` keys) when no backend is available.

## Conventions

- Forms: react-hook-form + zodResolver + the shared `Field` adapter in `components/system/`.
- UI primitives only from `@workspace/ui/components/*`; app-level shared chrome in
  `components/` (sidebar, providers, theme, toaster).
- All user-facing text Arabic; RTL layout is the default (`app/layout.tsx`).
- Bilingual model fields: `titleAr`/`titleEn`, `descriptionAr`/`descriptionEn`, etc.
- TanStack Query keys/actions per module; invalidate via the module's `queryKeys.ts`.
- `next.config.mjs` uses `transpilePackages` for the editor packages — editor edits trigger
  web recompiles (known perf cost; see `docs/editor-study-and-enhancement-plan.md`).
