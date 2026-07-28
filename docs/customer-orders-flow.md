# Customer Orders — flow & API guide

The order-history pages let a signed-in storefront customer see the orders they
placed, open one, download its invoice, and cancel it while it is still
cancellable.

These pages deliberately live **outside the Puck renderer**: they are real
Next.js routes with their own components and CSS, not blocks composed in the
Design Studio. A merchant cannot edit or delete them from the editor, and they
render identically for every tenant.

**They exist in both storefronts.** SOOQ renders a published store from two
places, and the feature is mirrored into each — the same way `checkout/`,
`StoreProvider` and the rest of the storefront module already are:

| App | Public URL | Route files |
|---|---|---|
| `apps/store` (port 3001) | `/store/<tenantId>/orders` | `app/store/[tenantId]/orders/**` |
| `apps/web` (port 3000) | `/store/<tenantId>/orders` | `app/published-store/[tenantId]/orders/**` |

In `apps/web` the public URL is **rewritten** by `middleware.ts`: any
`/store/<segment>/…` whose segment matches `TENANT_UUID_REGEX` is rewritten to
`/published-store/<tenantId>/…`, which is what keeps the customer storefront
from colliding with the merchant dashboard at `/store/[storeSlug]`. So both
apps serve the *same* customer-visible URL, and `buildStoreBasePath()` returns
`/store/<tenantId>` in both.

---

## 1. Routes

| Route (internal) | What it renders |
|---|---|
| `…/orders` | Order list — one card per order |
| `…/orders/[orderId]` | Single order — items, totals, address, timeline, actions |

### Why they don't hit the renderer

The storefront is served by an optional catch-all (`[[...slug]]/page.tsx`),
which looks the path up in the Site JSON and renders it with `<Render>`. In
Next.js a **static segment beats a catch-all**, so `orders/` wins the match and
the renderer is never reached — even if the merchant happens to have created a
page named `/orders` in the editor.

Both routes still sit under the tenant layout
(`app/store/[tenantId]/layout.tsx` / `app/published-store/[tenantId]/layout.tsx`),
so they inherit:

- the tenant UUID validation (`isValidTenantId` → `notFound()` on a bad id),
- `StoreTenantProvider`, which is where `useStoreTenant()` gets `basePath`
  (`/store/<tenantId>`) for building links,
- react-query (`Providers` / `StorefrontProviders`).

They do **not** get `StoreProvider` (cart/auth context) or
`PreviewThemeProvider` — those are mounted inside `StorefrontRenderer`. That is
why the order pages read the session from the cookie directly and ship their own
styles.

---

## 2. Files

The two trees are at identical relative depth, so every file below is a
**byte-identical twin** apart from the route shells and the header comment on
`customer-orders-api.ts`. Every import is either an `@/lib` / `@/config` alias
(both apps resolve those to `apps/web`) or a relative path — nothing is
app-specific.

```
apps/store/                          apps/web/modules/storefront/
├─ app/store/[tenantId]/orders/      ├─ (routes live in app/published-store/[tenantId]/orders/)
│   ├─ page.tsx                      #   list route (server component shell)
│   └─ [orderId]/page.tsx            #   detail route, awaits params
├─ components/orders/                ├─ components/orders/
│   ├─ orders-view.tsx               #   list: query + cards + pager
│   ├─ order-detail-view.tsx         #   detail: items, summary, address, timeline
│   ├─ order-actions.tsx             #   invoice download + cancel dialog
│   ├─ order-status-badge.tsx        #   status / payment badges
│   ├─ orders-states.tsx             #   loading / empty / error / sign-in panels
│   └─ orders-error.ts               #   unwraps api() rejections into Arabic text
├─ lib/                              ├─ lib/
│   ├─ customer-orders-api.ts        #   types, query keys, formatters, API calls
│   └─ use-customer-session.ts       #   `boolean | null` (null = pre-hydration)
└─ app/globals.css                   └─ styles/storefront.css
     └─ `.Orders*` / `.Order*` styles appended at the end of both (identical files)
```

**Editing one means editing the other.** This duplication is the pre-existing
storefront-module pattern, not a choice made for this feature — see the
"Known limitations" section.

---

## 3. User flow

```
Storefront (login block) ──► OTP verified ──► cookies written:
                                              sooq-access-token, sooq-tenant-id,
                                              sooq-user-name, sooq-user-phone
                │
                ▼
    /store/<tenantId>/orders
      ├─ no access-token cookie → "سجّل الدخول لعرض طلباتك" + link back to the store
      ├─ GET /customer/orders?page&size
      ├─ empty page               → "لا توجد طلبات بعد" + link to the store
      └─ cards (order number, status, payment status, date, item count, total)
                │  click a card
                ▼
    /store/<tenantId>/orders/<orderId>
      ├─ GET /customer/orders/{orderId}
      ├─ [تحميل الفاتورة]  → GET  /customer/orders/{orderId}/invoice   (file download)
      └─ [إلغاء الطلب]     → POST /customer/orders/{orderId}/cancel    (reason optional)
                                   └─ on success: invalidate every `customer-orders`
                                      query so list + detail refetch with the new status
```

**There is no login route in `apps/store`.** The OTP flow is a block on the
storefront itself, so the unauthenticated state can only offer a link back to
the store home — it cannot deep-link to a sign-in page.

---

## 4. API reference

Base URL is `NEXT_PUBLIC_API_URL` (must end in `/api/v1`), so the paths below
are what you pass to `api()`.

All four endpoints are **customer-authenticated**: they need
`Authorization: Bearer <sooq-access-token cookie>`. They do **not** take an
`X-Tenant-Id` header — the tenant is resolved from the token. That is why they
go through `api()` (which attaches the Bearer automatically) and **not**
`publicApi()`, which would send `X-Tenant-Id` and get a 401 from the backend's
`TenantFilter`.

### 4.1 List — `GET /customer/orders?page=0&size=20`

```ts
import { listCustomerOrders } from "@/lib/customer-orders-api" // apps/store/lib

const page = await listCustomerOrders({ page: 0, size: 20 })
// → NormalizedPage<CustomerOrderListItem>
//   { items, totalItems, totalPages, pageIndex, pageSize, hasNext, hasPrev }
```

Response envelope (`ApiResponse<Page<CustomerOrderListItem>>`):

```jsonc
{
  "success": true,
  "data": {
    "content": [
      {
        "orderId": "c72b7884-b401-4618-8f6e-ff5d5f3922a8",
        "tenantId": "60638d50-cb6a-4bb4-8cba-c153244a3dc3",
        "customerId": "3955192a-1c4a-451d-aecf-34f5c1c27d14",
        "orderNumber": "ORD-1785180282035",
        "orderStatus": "PENDING",
        "paymentStatus": "UNPAID",
        "paymentMethod": "COD",
        "subtotal": 360.0, "discountAmount": 0.0, "taxAmount": 0.0, "total": 360.0,
        "itemCount": 1,
        "placedAt": "2026-07-27T19:24:42.035325"
      }
    ],
    "number": 0, "size": 20, "totalElements": 1, "totalPages": 1,
    "first": true, "last": true, "empty": false
  },
  "timestamp": 1785180295161
}
```

It is a **Spring `Page`**, not the `{ data, meta }` envelope some other SOOQ
endpoints use — `normalizePage()` (`apps/web/lib/pagination.ts`) handles both,
so always go through it instead of reading `content` by hand.

Note the list row carries **no `currencyCode`**; `formatOrderMoney()` falls back
to `SYP` (`DEFAULT_ORDER_CURRENCY`). The detail payload does carry it.

### 4.2 Detail — `GET /customer/orders/{orderId}`

```ts
const order = await getCustomerOrder(orderId) // → CustomerOrder (throws if data is missing)
```

Adds, on top of the list fields: `currencyCode`, `shippingCost`,
`shippingAddress`, `notesCustomer`, `items[]`, `timeline[]`.

```jsonc
{
  "success": true,
  "data": {
    "orderId": "c72b7884-…", "orderNumber": "ORD-1785180282035",
    "orderStatus": "PENDING", "paymentStatus": "UNPAID", "paymentMethod": "COD",
    "currencyCode": "SYP",
    "subtotal": 360.0, "discountAmount": 0.0, "taxAmount": 0.0,
    "shippingCost": 0.0, "total": 360.0,
    "shippingAddress": {
      "latitude": 33.5138, "longitude": 36.2765,
      "recipientName": "test", "phone": "+963941452063",
      "addressLabel": "Al-Hamra Street, Building 5, Damascus"
    },
    "notesCustomer": null,
    "placedAt": "2026-07-27T19:24:42.035325",
    "items": [
      {
        "orderItemId": "b66357b0-…", "variantId": "27b237fc-…",
        "productTitle": "هاتف SOOQ لايت", "variantTitle": "SOOQ-SMARTPHONE-LITE",
        "sku": "SOOQ-SMARTPHONE-LITE",
        "quantity": 2, "unitPrice": 180.0, "discountAmount": 0.0, "totalPrice": 360.0
      }
    ],
    "timeline": [
      {
        "timelineId": "bece94ff-…", "action": "ORDER_CREATED",
        "actor": "CUSTOMER", "details": null,
        "createdAt": "2026-07-27T19:24:42.036177"
      }
    ]
  }
}
```

`timeline[].action` is translated by `ORDER_TIMELINE_ACTION_LABELS` and
`actor` by `ORDER_TIMELINE_ACTOR_LABELS`; an unknown value falls through to the
raw string rather than being dropped.

### 4.3 Invoice — `GET /customer/orders/{orderId}/invoice`

```ts
await downloadOrderInvoice(order.orderId, order.orderNumber)
```

Returns the **file itself**, not JSON, so it is requested with
`responseType: "blob"` and handed to the browser via an object URL + a synthetic
`<a download>` click.

`api()` only resolves `response.data`, so the `Content-Disposition` header is
not reachable — the filename is rebuilt as
`invoice-<orderNumber>.<ext>`, with the extension derived from the blob's MIME
type (`application/pdf` → `pdf`, falling back to `pdf`). If you ever need the
server-provided filename, that requires a call that returns the full axios
response, not `api()`.

### 4.4 Cancel — `POST /customer/orders/{orderId}/cancel`

```ts
await cancelCustomerOrder(orderId, reason) // reason is optional
```

Body — a single optional property; an empty/whitespace reason is omitted
entirely rather than sent as `""`:

```jsonc
{ "reason": "غيّرت رأيي بشأن المنتج" }   // or {}
```

**When the button shows.** `isOrderCancellable(status)` returns `false` for the
terminal statuses:

```
DELIVERED · COMPLETED · CANCELLED · RETURNED · REFUNDED · FAILED
```

so the action appears for `PENDING`, `CONFIRMED`, `PROCESSING`, `SHIPPED`. This
list is a **UI convenience only** — the backend remains the authority and will
reject an illegal transition; that rejection is surfaced inline in the dialog.
If the backend's rule differs (e.g. `SHIPPED` is not cancellable), edit
`TERMINAL_ORDER_STATUSES` in `apps/store/lib/customer-orders-api.ts`.

On success the mutation invalidates `customerOrderKeys.all`, so both the detail
page and the cached list pages refetch and pick up `CANCELLED`.

---

## 5. Getting there from the storefront

The entry point is the **`OrdersIconButton`** block (`زر طلباتي`), which renders
`withStoreBasePath("/orders")` — so the link resolves to
`/store/<tenantId>/orders` for whichever tenant is being rendered.

- It ships in the header presets that carry a slot group
  (`logo-right-burger-left` in `presets/header-layouts.ts` and the responsive
  pages-menu header in `presets/pages-menu.ts`), seeded next to
  `CART_ICON_BUTTON`.
- Merchants can also drag it in from **عناصر المتجر** in the block picker, into
  `SiteHeader.rightSlot` or any content area.
- `onlyWhenSignedIn` (default `true`) hides it from signed-out visitors, since
  the page would only show them the sign-in prompt. It stays visible in the
  editor regardless of the merchant's own session, so it can be selected and
  styled.

**Existing stores won't get it automatically.** Presets only apply when a header
zone is created or replaced, so a store whose header was already built needs the
block added by hand (or its header preset re-applied).

Not to be confused with the **`OrderHistory`** block, which renders
`sampleOrders` from `config/data/orders.ts` — a design-time mock that is not
wired to any API and is currently commented out of the block picker.

---

## 6. Conventions this feature follows

- **Never raw `fetch`/`axios`** for SOOQ endpoints — everything goes through
  `api()` (aliased from `apps/web/lib/api.ts`) so the Bearer header, the
  401 refresh-and-retry, and `NEXT_PUBLIC_USE_MOCK_API` all keep working.
- **TanStack Query** for server state, with keys centralised in
  `customerOrderKeys` (`all` / `list(page,size)` / `detail(orderId)`).
- **Status labels come from `@/lib/domain-enums`** (`ORDER_STATUS_META`,
  `PAYMENT_STATUS_META`, `PAYMENT_METHOD_LABELS`) — the same source the merchant
  admin uses, so the two never drift. That file is dependency-free, unlike
  `modules/order/order/model.ts`, which drags in zod.
- **Arabic-first, RTL**; loading/empty/error copy is Arabic.
- Styles are plain BEM-ish CSS appended to `app/globals.css`, matching
  `CheckoutDrawer` / `ThemeJsonTester`.

---

## 7. Known limitations

1. **Expired-token bounce.** When a call 401s and the refresh also fails, the
   shared `api()` interceptor runs `redirectToLogin()`, which sends the browser
   to `/request-otp`. That route does not exist in `apps/store`, and
   `middleware.ts` redirects any non-`/store/**` path to `MARKETING_SITE_URL` —
   so an expired session drops the customer on the marketing site instead of the
   storefront. This is pre-existing behaviour shared with checkout/address
   calls, not specific to these pages, but it is most visible here.
2. **No mock-mode coverage.** `apps/web/lib/mock` has no `/customer/orders*`
   handlers, so with `NEXT_PUBLIC_USE_MOCK_API=true` these pages hit the real
   backend (or fail). Add handlers under `lib/mock/handlers` if the demo flow
   needs them.
3. **Session detection is cookie-presence only.** `hasCustomerSession()` checks
   that `sooq-access-token` exists; it does not validate or decode it. An
   expired token renders the list shell first and only then shows the error.

---

## 8. Running it locally

```bash
cd apps/store            # or: pnpm --filter store dev from the repo root
pnpm dev                 # http://localhost:3001
```

Then open, with a real tenant UUID:

```
http://localhost:3001/store/<tenantId>/orders
```

You must be signed in as a customer first (the OTP block on the storefront) —
otherwise the page shows the sign-in prompt. To point the app at a different
backend, set `NEXT_PUBLIC_API_URL` in `apps/store/.env.local`.
