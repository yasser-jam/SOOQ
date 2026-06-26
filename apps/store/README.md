# SOOQ Storefront (`apps/store`)

Customer-facing storefront renderer. Reads the same Puck `SiteData` JSON from `localStorage` as the merchant design studio and renders the home page with `<Render />`.

Fixed theme id (v1): **`test`** — see [`lib/store-config.ts`](lib/store-config.ts).

## Quick start

```bash
# From monorepo root
pnpm install
cp apps/store/.env.example apps/store/.env.local   # set NEXT_PUBLIC_API_URL

pnpm --filter store dev    # http://localhost:3001
pnpm --filter web dev      # http://localhost:3000 (design studio)
```

## Data flow

1. `readSiteData()` — `localStorage` key `puck-demo:{componentKey}:site`
2. `composePuckData(site, "/")` — home page content + global `root` / `zones`
3. `resolveAllData()` — resolves block `resolveData` hooks
4. `PreviewThemeProvider` — injects theme CSS from `root.props`
5. `<Render config={config} data={resolvedData} />`

API-backed blocks (ProductCard, ProductsGrid) use `NEXT_PUBLIC_API_URL` via shared modules in `apps/web/modules`.

## localStorage caveat

`localStorage` is **per origin** (host + port).

| Setup | Shared with web editor? |
|-------|------------------------|
| web `:3000`, store `:3001` | **No** — store uses seeded `initialData` until you publish via API |
| Same host (reverse proxy) | Yes |

For local dev, edit in design studio on web, then either:

- Use **معاينة** in the editor (same origin as saved data), or
- Run store on the same origin as web, or
- Accept the default seeded home page on `:3001`

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm --filter store dev` | Dev server on port 3001 |
| `pnpm --filter store build` | Production build |
| `pnpm --filter store typecheck` | TypeScript check |

## ProductCard events

In render mode (`isEditing=false`), buttons dispatch window events:

- `add-product` — add to cart
- `add-product-to-favourite` — wishlist

Listen with `window.addEventListener("add-product", …)`.
