# apps/store — Published Storefront Renderer

Next.js app (port 3001) that renders a store's site from the editor's **Site JSON** using the
same Puck block registry as the editor, in render-only mode. This is "the published website"
counterpart to the Design Studio in `apps/web`.

## Flow

```
app/[[...slug]]/page.tsx            # catch-all route
  └─ components/storefront-renderer.tsx
       ├─ lib/use-store-pathname.ts     # current path within the store
       ├─ lib/use-storefront-data.ts    # readSiteData (localStorage) → findSitePage
       │                                # → composePuckData → resolveAllData
       ├─ components/StoreProvider.tsx  # cart/store context + react-query
       ├─ components/preview-theme-provider.tsx  # applies root theme props (FullThemeProps)
       └─ <Render config={@/core/config} data={resolvedData} metadata={{ themeId }} />
```

- `lib/store-config.ts` — `STORE_FIXED_THEME_ID`, `STORE_HOME_PATH`, env-based store identity.
- `components/checkout/` — checkout drawer + `checkout-api.ts` (public API calls).
- `components/theme-json-tester.tsx` — dev utility to paste/test Site JSON.

## Critical current limitation

Site JSON is read from **localStorage** (`readSiteData` from
`@/core/config/lib/site-data.ts`) — i.e. the store only shows content on the same browser
that edited it. Real multi-tenant publishing (fetch Site JSON from the backend by store
slug/domain, SSR/ISR) is a known gap and a roadmap item. When adding backend fetching, keep
`useStorefrontData` as the single seam.

## Aliases / coupling

- `@/core` → `packages/editor-packages/core` (blocks, `Render`, site-data).
- `@/modules/*`, `@/lib/*`, `@/config/*` → **`apps/web`**'s folders (tsconfig aliases).
  This app intentionally reuses web's modules/lib — check both apps before moving files there.

## Conventions

- Render-only: never import editor UI (`<Puck>`, plugins) here — only `Render`,
  `resolveAllData`, and `config`.
- Arabic-first UI, RTL; loading/empty states in Arabic.
- Public (customer) endpoints only — no admin `/admin/*` calls from this app.
