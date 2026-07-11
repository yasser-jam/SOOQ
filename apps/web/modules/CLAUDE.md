# apps/web/modules — Domain Module Pattern

Business logic is grouped domain-first: `<domain>/<subdomain>/` (e.g. `product/category`,
`order/invoice`, `shipping/shipment`). Every module repeats the same file set. **Copy an
existing simple module (e.g. `product/tag` or `product/category`) when creating a new one.**

## Canonical module layout

```
modules/<domain>/<name>/
  types.ts        # API request/response interfaces (or z.infer from schema.ts)
  schema.ts       # zod schemas — the single source of truth for types + validation
  actions.ts      # API methods using `api` from @/lib/api (+ normalize* helpers,
                  # + dev-mode localStorage fallbacks guarded by devAuthEnabled)
  queryKeys.ts    # TanStack Query key factory:
                  #   export const fooKeys = { all: ["foos"] as const,
                  #     detail: (id) => [...fooKeys.all, id] as const }
  init.ts         # initFoo(entity?) → form default values (create + edit share one initializer)
  components/
    table.tsx     # list table (TanStack Table) used by the thin list route
    view.tsx      # page-level composition when the route needs more than a table
    ...           # cards, dialogs, editor tabs — module-owned UI
  hooks/          # module-specific hooks (e.g. use-product-draft.ts)
  helpers.ts / utils.ts / model.ts  # pure logic when needed
```

## Module groups

- `auth/` — auth, session, totp, phone-change, audit-log, customer-auth, platform, store
- `product/` — product, category, collection, tag, attribute, variant, import, seed
- `order/` — order, invoice, invoice-layout, discount-code
- `customer/` — customer, customer-note
- `payment/` — provider, refund
- `shipping/` — shipment, provider, cod
- `inventory/`, `media/` (upload), `store/` (settings, staff), `design-studio/`

## Rules (from docs/order-admin-ai-rules.md + docs/refactoring-notes-detail-pages.md)

- `useQuery`/`useMutation` are called **inside the page/detail component**, using the module's
  `actions.ts` functions and `queryKeys.ts` keys — not wrapped in extra abstraction layers.
- On mutation success: `queryClient.invalidateQueries({ queryKey: fooKeys.all })`, toast via
  sonner (Arabic message), then `router.push(...)` back to the list.
- API paths: admin endpoints are prefixed `/admin/...`; responses come wrapped in
  `ApiResponse<T>` / `PagedApiResponse<T>` (unwrap `.data`, paging in `meta`).
- Backend DTOs often differ from form shapes — keep `normalize*` mappers in `actions.ts`
  (e.g. `normalizeGetProduct` maps `variantMatrix.options[]` → form `options`).
- Media updates use `mediaAssetIds: string[] | null` semantics:
  `null` = unchanged, `[]` = clear, `[ids]` = exact list; new files are multipart `files` parts.
- Keep list routes thin (`<FooTable />`); detail/create pages orchestrate the form but reuse
  `init.ts` + `schema.ts` + module components.
