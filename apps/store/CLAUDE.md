# apps/store — Published Storefront Renderer

Next.js app (port 3001) that renders a store's site from the editor's **Site JSON** using the
same Puck block registry as the editor, in render-only mode. This is "the published website"
counterpart to the Design Studio in `apps/web`.

## Flow

```
app/[[...slug]]/page.tsx            # catch-all route
  └─ components/storefront-renderer.tsx
       ├─ lib/use-store-pathname.ts       # current path within the store
       ├─ lib/use-storefront-data.ts      # usePublishedSiteData (backend) → findSitePage
       │                                  # → composePuckData → resolveAllData
       ├─ lib/use-published-site-data.ts  # GET /public/design/config → SiteData
       ├─ components/StoreProvider.tsx    # cart/store context + react-query
       ├─ components/preview-theme-provider.tsx  # applies root theme props (FullThemeProps)
       └─ <Render config={@/core/config} data={resolvedData} metadata={{ themeId }} />
```

- `lib/store-config.ts` — `STORE_FIXED_THEME_ID`, `STORE_HOME_PATH`, env-based store identity.
- `components/checkout/` — checkout drawer + `checkout-api.ts` (public API calls).

## Pages outside the renderer

Static route segments beat the storefront catch-all, so some pages are plain Next.js routes
that never touch Puck. Today that is the customer order history:

```
app/store/[tenantId]/orders/page.tsx             # list  → components/orders/orders-view.tsx
app/store/[tenantId]/orders/[orderId]/page.tsx   # detail → components/orders/order-detail-view.tsx
```

backed by `lib/customer-orders-api.ts` (`/customer/orders**` — Bearer-authenticated, no
`X-Tenant-Id`). They still sit under `app/store/[tenantId]/layout.tsx`, so they get tenant
validation + `StoreTenantProvider`, but **not** `StoreProvider` or the theme provider — hence
the cookie-based session check and the `.Orders*` styles in `app/globals.css`.
See `docs/customer-orders-flow.md`.

## Data source

The renderer is backend-only: `useStorefrontData` always fetches Site JSON from the backend
via `usePublishedSiteData` → `GET /public/design/config?platform=` (`web`/`mobile`, with a
mobile→web fallback if no mobile config exists yet). It never reads `localStorage` — that
storage is exclusively the Design Studio editor's working-session buffer
(`@/core/config/lib/site-data.ts`, `page-draft.ts`), and the renderer must not treat it as a
data source. `?mode=mobile|desktop` overrides the viewport-based platform pick; otherwise a
767px breakpoint decides. Known gap: no SSR/ISR yet (client-fetched on mount).

## Aliases / coupling

- `@/core` → `packages/editor-packages/core` (blocks, `Render`, site-data).
- `@/modules/*`, `@/lib/*`, `@/config/*` → **`apps/web`**'s folders (tsconfig aliases).
  This app intentionally reuses web's modules/lib — check both apps before moving files there.

## Conventions

- Render-only: never import editor UI (`<Puck>`, plugins) here — only `Render`,
  `resolveAllData`, and `config`.
- Arabic-first UI, RTL; loading/empty states in Arabic.
- Public (customer) endpoints only — no admin `/admin/*` calls from this app.
- Network calls must go through `api()` / `publicApi()` (aliased from `apps/web`)
  so `NEXT_PUBLIC_USE_MOCK_API=true` can serve customer OTP + checkout + catalog
  from the shared seeder. Do not use raw `fetch`/`axios` for those paths.
