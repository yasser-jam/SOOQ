# Orders on mobile — the web → mobile conversion contract

How the `customer-order*` Section presets authored in the Design Studio become a working
orders screen in the Flutter app, and which parts still cannot work.

Companion to [`orders-returns-dynamic-plan.md`](orders-returns-dynamic-plan.md) (the web
authoring side) and [`customer-orders-flow.md`](customer-orders-flow.md) (the storefront
routes). This file covers only the middle layer: `apps/web/lib/transformer.ts`.

> **Status:** orders list, order detail, order items, timeline, status display and invoice
> download convert and dispatch. Pagination and returns do not — see §6.

---

## 1. Why this document exists

For a while the converter had **no orders vocabulary at all**. `readSectionPreset()` was
only ever consulted by `transformProductsTemplateSection()`, which returns `null` for
anything that is not `products-grid` / `products-page`. Every `customer-order*` Section
therefore fell through to a plain static column, the page declared no request, and
`EngineRequestMapper.collectRequests()` found nothing to dispatch — so `OrderCubit` was
never even registered for the screen.

The failure was silent in both directions:

- `applyValueContext()` early-returned unless a binding scope was active, and the
  "no mobile field mapping" warning lived *inside* that guard. A page full of `order.*`
  bindings produced zero warnings.
- `transformChip()` unconditionally returned `null`, so the status badges disappeared too.

The visible result was an orders page of empty strings with a dead pager. Both silent
paths now warn; see §5.

---

## 2. The engine contract (do not drift from this)

The mobile side classifies requests by **URL substring**, not by a declared type
(`request_mapper.dart`):

| Predicate | Matches | Dispatches |
|---|---|---|
| `_isCustomerOrdersListRequest` | contains `/customer/orders`, no id segment, no `/cancel` or `/invoice` | `OrderCubit.loadOrders(key, page, size, status)` |
| `_isCustomerOrderDetailRequest` | contains `/customer/orders/<id>` | `OrderCubit.loadOrderDetail(requestKey, orderId)` |
| `_isShipmentTrackRequest` | contains `/public/shipping/track/` | `OrderCubit.loadShipmentTrack(...)` |

So these two URLs are load-bearing. Changing them still renders the page — it just never
fetches:

```
/api/v1/customer/orders?page=0&size=20      → the list
/api/v1/customer/orders/:orderId            → the detail
```

Two more gates, both easy to trip:

- **Route gate.** `variant_screen.dart`'s `_isOrderRoute` only mounts the `OrderCubit` host
  on `/orders`, `/orders/track`, and `^/orders/[^/]+$`. An orders list on any other route
  collects its request and never dispatches it. The converter now warns instead.
- **Request nodes are not just lists.** `_buildMappedRequest` reads `props.data` off *any*
  node type, which is why the detail page's non-repeating Sections can share one fetch
  declared on a plain `container`.

---

## 3. What each preset emits

### `customer-orders` → `listView` + `repeat`

Requires the one-template-card contract: `content` is exactly one `Group` (or `cardTemplate`
holds it, if the editor cleared `content`). Only valid on `/orders`.

```jsonc
{
  "type": "listView",
  "props": {
    "enableInnerScroll": false,
    "emptyMessage": "لا توجد طلبات",
    "data": {
      "source": "collection",
      "id": "customer-orders",
      "requestKey": "customer-orders",
      "requestUrl": "/api/v1/customer/orders?page=0&size=20",
      "page": 0, "size": 20
    }
  },
  "itemBuilder": {
    "type": "repeat",
    "source": "dataContext.requests.customer-orders.data",
    "item": { /* the card, tap → /orders/:orderId */ }
  }
}
```

The row tap is added automatically when the template has none. `:orderId` needs no explicit
binding: the engine's `_lookupRouteValue` special-cases `orderId` and reads it off the
repeat item.

### `customer-order-detail` → children bound in place

Not a repeat. Its children are ordinary blocks reading scalar fields off one order, so they
convert normally but inside the `orderDetail` binding scope, resolving to absolute paths:

```
dataContext.requests.customer-order-detail.data.totalFormatted
```

### `customer-order-items` / `customer-order-timeline` → `listView` over a sub-path

These do **not** declare their own fetch — `items` and `timeline` arrive inside the same
`CustomerOrder`. The repeat source is a path into the shared response:

```
dataContext.requests.customer-order-detail.data.items
dataContext.requests.customer-order-detail.data.timeline
```

### Who declares the detail request

The first Section on `/orders/:orderId` that needs the order carries it, guarded by
`_orderDetailRequestEmitted` (reset per page). Detail Sections and the items/timeline
repeats are all eligible, so ordering in the editor does not matter.

---

## 4. Field maps

Bindings are **not** pass-through. The engine enriches both payloads before they reach
`dataContext`, and the converter points the web paths at the enriched fields.

### Orders list row — `OrderSummary.toJson()` + enrichment

| Web `valueContext.path` | Mobile field |
|---|---|
| `order.orderNumber` | `orderNumber` |
| `order.orderStatus` | **`orderStatusLabel`** (Arabic, enriched) |
| `order.paymentStatus` | `paymentStatus` (raw wire enum) |
| `order.paymentMethod` | `paymentMethod` (raw wire enum) |
| `order.placedAt` | `placedAt` |
| `order.itemCount` | `itemCount` |
| `order.total` | **`totalFormatted`** (`formatSyp`'d) |
| `order.orderId` | `orderId` |

`order.currencyCode` is deliberately **absent**: `OrderSummary` carries no currency, only
the detail's `CustomerOrder` does. A card binding it renders blank, so it warns instead.

### Order detail — `CustomerOrder.toJson()` + enrichment

Same as above plus `currencyCode`, `notesCustomer`, `invoiceNumber`,
`shippingAddress.{recipientName,phone,addressLabel}`, and the money fields mapped to their
`*Formatted` twins: `subtotal`, `discountAmount`, `taxAmount`, `shippingCost`, `total`.

### Rows

| Scope | Web prefix | Fields |
|---|---|---|
| `customer-order-items` | `item.` | `productTitle`, `variantTitle`, `sku`, `quantity`, `unitPrice`, `discountAmount`, `totalPrice`, `variantId`, `orderItemId` |
| `customer-order-timeline` | `timelineEntry.` | `action`, `actor`, `details`, `createdAt` |

### Why `format` and `currencyPath` are dropped

The engine `text` node has **no formatter** — there is no `format`, `currencyPath`, or
`valueFormat` prop anywhere in `lib/engine/`. Money and status are pre-formatted server-side
into `*Formatted` / `orderStatusLabel`, which is why those paths remap rather than translate.
A `format: "datetime"` on `placedAt` has no mobile equivalent at all: the raw ISO string
renders. Add a formatted field to the API response if that matters.

### Status chips

A `Chip` with a scalar `valueContext` (not `listValueContext`) is a **status badge**, and now
converts to a pill-shaped `container` + `text`. Only `enumMap: "orderStatus"` survives the
trip, because `orderStatusLabel` is the one label the engine derives. `paymentStatus`,
`paymentMethod`, `timelineAction` and `timelineActor` render their raw uppercase wire value
and warn — the engine has no enum-label dictionary.

Chips with `listValueContext` (`product.tags`) are still dropped: there is no chip-list
primitive.

---

## 5. Button actions

| Web `buttonAction` | Mobile | Notes |
|---|---|---|
| `downloadInvoice` | `order.openInvoice` | `orderId` from `routeParams`. Hands the PDF to the OS — no in-app viewer, so no `onSuccess` |
| `cancelOrder` | `order.cancelOrder` | `onSuccess` reloads `customer-order-detail`. Both require `/orders/:orderId` |
| `ordersPrevPage` / `ordersNextPage` | ✗ warns | See §6 |
| `submitReturn` | ✗ warns | See §6 |

**A zone key is not an action.** `zoneKey: "cancel-order"` only opens whatever the merchant
put in that zone's slot; an empty slot is a dead button. The converter now names the
`buttonAction` that would actually do the job (`ZONE_KEY_DIRECT_ACTION`).

---

## 6. What still does not work

### Pagination — blocked on the engine

`setPageState` assigns **literal** values only; there is no increment primitive. A pager
cannot compute `page ± 1` from config, and emitting a fixed `setPageState` would give a Next
button that always jumps to page 1. Deliberately left as a warned no-op.

Unblocking it needs one of:
- a delta op on `PageStateStore` (then the pager binds `page` via `queryBindings`), or
- a `loadMore` on `OrderCubit` — today `loadOrders` emits `OrderListSuccess` with a fresh
  page, replacing rather than appending, so infinite scroll is not free either.

The list currently loads the first 20 orders.

### Returns — blocked on the backend

There is **no returns surface in the Flutter app at all**: no `/returns` endpoint, no
`ReturnRequest` model, no cubit method. `PaymentStatus.refunded` / `OrderStatus.refunded`
exist as enum values and nothing else.

The web theme authors the whole flow — per-item `return_item_selected` switches, a reason
`ContentSelect`, a `submitReturn` button — and all of it converts to decoration. Order of
work: backend endpoint → `OrderRepo`/`OrderCubit` method → `action_dispatcher` case →
a `case "submitReturn"` here.

Also unmapped: `ContentSelect` has no mobile block, and `errors.*` paths
(`errors.invoice`, `errors.submitReturn`) have no engine equivalent — the mobile app
surfaces failures through cubit state, not bound error strings.

---

## 7. Verifying a change here

There is no jest suite for `transformer.ts`. To check a change, run the converter over a real
theme and assert against the engine predicates rather than eyeballing JSON:

```bash
node_modules/.bin/esbuild apps/web/lib/transformer.ts \
  --format=esm --outfile=/tmp/transformer.mjs --platform=node
# then call transformWebToMobile(fs.readFileSync(<web site json>, "utf8"), {})
```

Two things worth asserting, both of which caught real bugs while this was written:

1. **Every order request classifies.** Port `_parseOrderId` /
   `_isCustomerOrdersListRequest` / `_isCustomerOrderDetailRequest` and confirm each emitted
   `requestUrl` maps to a real dispatch — a URL that matches nothing renders fine and fetches
   nothing.
2. **Non-orders pages are byte-identical** apart from generated id suffixes. Section-preset
   dispatch and the `Chip` change both sit on paths shared with products and cart.

Read `result.warnings` — it is the converter's own account of what it dropped, and it is not
surfaced anywhere in the Design Studio UI yet.
