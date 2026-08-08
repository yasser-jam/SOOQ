# Orders → Site-JSON transformation plan

**Goal:** replace the hard-coded storefront order routes under
`apps/web/app/published-store/[tenantId]/orders` with Site-JSON pages composed
of **existing atom blocks**, driven by `StoreProvider` — the same way
`/settings` already works — so merchants can restyle and reorder them in the
Design Studio.

**Reference implementation to copy:** the account/settings page —
`config/presets/account.ts` → `createSettingsPageContent()`, `Section` kinds
`customer-account` / `customer-addresses`, `store-context.customer`, and
`CustomerAddressesTemplateRepeater`. Read those four before starting.

> Status: **planning complete, nothing implemented.** Phase 0 was prototyped
> once and reverted; everything it proved is written down in §3 and §8 so it can
> be rebuilt without rediscovery.

---

## 0. Hard constraint — no domain-coupled blocks

**Do not create an `OrderCard`, `OrderItem`, `OrderTimeline`, `OrdersList` or
`ReturnCard` block.** Every order screen is a **preset**: a tree of the generic
atoms we already ship, wired to data through `valueContext`.

Allowed building material:

| Need | Atom |
|---|---|
| labels, values, totals, dates | `ContentHeading`, `ContentParagraph` (+ `valueContext`) |
| status / payment / condition badges | `Chip` (+ `valueContext` + `enumMap` — G2) |
| navigation to detail | `ContentLink` (+ `link.dynamicSegment`) |
| invoice / cancel / submit | `ContentButton` (+ `buttonAction`, `zoneKey`) |
| cancel reason, return quantity | `ContentInput` (+ `inputAction`) |
| return-item selection | `ContentSwitch` (+ `switchAction`) |
| return-item condition | `ContentSelect` — **new generic atom** (G6) |
| layout | `Section`, `Group`, `RowGroup`, `Flex`, `Grid`, `ContentDivider` |

`Section.sectionKind` is **not a new block** — it is a data-source selector on
the existing generic `Section`, exactly like `customer-addresses` today. It
chooses *which list the section repeats over*; the template inside it is a tree
of the atoms above.

New *generic* atoms (`ContentSelect`) and new *capabilities on existing atoms*
(`Chip.valueContext`, `ContentInput.min`) are in scope — they are not
order-coupled. A block that mentions "order" in its name or props is not.

**Consequence:** the formatting and conditional-visibility gaps below (G1, G2,
G3) stop being nice-to-haves. With no bespoke block allowed to format a total or
map a status enum, that logic *must* live in the atoms' JSON props. Phase 0 is
non-negotiable groundwork.

### Decided scope

| Decision | Answer |
|---|---|
| Returns list/detail pages | **Deferred** — see §7. The *create-return* flow on the order detail page is in scope. |
| Error surfaces | **Section-level**, not global toasts — see §3.1. |
| Which app | **`apps/web` published-store only.** `apps/store` keeps its twin copies untouched; migrated in a later pass. |

---

## 1. What exists today (the transfer inventory)

### 1.1 Routes to delete (apps/web only)

| File | Replaced by |
|---|---|
| `apps/web/app/published-store/[tenantId]/orders/page.tsx` | Site page `/orders` |
| `apps/web/app/published-store/[tenantId]/orders/[orderId]/page.tsx` | Site page `/orders/:order-id` |

These are *static segments that shadow the catch-all* `[[...slug]]`. Deleting
them is what routes the URLs into the Puck renderer. **No middleware change is
needed** — `rewritePublishedStorefront` in `apps/web/middleware.ts` already
rewrites `/store/<uuid>/**` → `/published-store/<uuid>/**` wholesale.

Leave the `returns/` route files alone (deferred, §7).

### 1.2 Components to dissolve into presets

`apps/web/modules/storefront/components/orders/**`:

| Component | Behaviour that must survive |
|---|---|
| `orders-view.tsx` (134 ln) | auth gate (3 states: `null` → loading, `false` → sign-in panel, `true` → list), paged query (size 20), order card, pager prev/next + "صفحة X من Y", empty state + "تصفّح المتجر" CTA, error panel |
| `order-detail-view.tsx` (220 ln) | back link, header (number + date + 2 badges), payment summary (subtotal, **conditional** discount/tax, shipping, strong total, payment-method label), **conditional** shipping-address section w/ OpenStreetMap link, **conditional** customer notes, **conditional** timeline w/ action + actor label maps |
| `order-actions.tsx` (143 ln) | "تحميل الفاتورة" mutation; "إلغاء الطلب" modal (reason textarea, Esc + overlay close, pending + error states) shown only when `isOrderCancellable` |
| `order-items-section.tsx` (222 ln) | items list (title, sku, `qty × unitPrice`, total); when `isOrderReturnable`: per-item checkbox, quantity input clamped to `1..item.quantity`, condition `<select>` (4 options), submit → `createCustomerReturn` with **fixed** reason `"DEFECTIVE"`, success message + link to `/returns`, error |
| `order-status-badge.tsx` (27 ln) | `ORDER_STATUS_META` / `PAYMENT_STATUS_META` → label + badge variant |
| `orders-states.tsx` (36 ln) | shared loading / empty / error / sign-in-required panels |
| `orders-error.ts` (28 ln) | 401/403 → "انتهت صلاحية الجلسة. سجّل الدخول مرة أخرى."; unwraps both `Error` and the plain `handleApiError` object shape |

### 1.3 API layer that stays

`apps/web/modules/storefront/lib/customer-orders-api.ts` — `listCustomerOrders`,
`getCustomerOrder`, `downloadOrderInvoice`, `cancelCustomerOrder`,
`isOrderCancellable`, `customerOrderKeys`, `hasCustomerSession`.

`apps/web/modules/storefront/lib/customer-returns-api.ts` —
`createCustomerReturn`, `isOrderReturnable`, `RETURN_ITEM_CONDITIONS` + labels.

These files **do not move**. They stay in `apps/web` and become the
implementation `StoreProvider` calls, exactly like `customer-account-api.ts`
does for the settings page.

**Exception:** formatting helpers and enum label maps must be **duplicated into
core** — atoms need them at render time and `config/` may not import `apps/web`
(see landmine L3).

---

## 2. Target composition

```
Site page "/orders"
  Section(sectionKind:"customer-orders")          ← repeats template per order
    Group                                          ← the card, pure atoms
      RowGroup[ ContentParagraph{vc:"order.orderNumber"},
                Chip{vc:"order.orderStatus",   enumMap:"orderStatus"},
                Chip{vc:"order.paymentStatus", enumMap:"paymentStatus"} ]
      RowGroup[ ContentParagraph"تاريخ الطلب",
                ContentParagraph{vc:"order.placedAt", format:"datetime"} ]
      RowGroup[ ContentParagraph"الإجمالي",
                ContentParagraph{vc:"order.total", format:"money"} ]
      ContentLink{ link:{ kind:"page", pageId:"/orders/:order-id",
                          dynamicSegment:{ param:"order-id",
                                           valueContext:"order.orderId" }}}
  Section(sectionKind:"customer-orders-pager")
    RowGroup[ ContentButton{buttonAction:"ordersPrevPage"},
              ContentParagraph{vc:"orders.pageLabel"},
              ContentButton{buttonAction:"ordersNextPage"} ]

Site page "/orders/:order-id"
  StorefrontRenderer wraps in <UrlBoundOrderProvider> → BoundData { order }
  Section("customer-order-detail")     ← binding-only section (like customer-account)
  Section("customer-order-items")      ← repeats over order.items
  Section("customer-order-timeline")   ← repeats over order.timeline
  Zone popup "cancel-order"            ← replaces the hand-rolled modal
```

---

## 3. Infra gaps — build these first

The settings page never needed any of this. **This is the real work**; the
presets are mechanical once it lands.

| # | Gap | Why orders forces it |
|---|---|---|
| **G1** | **No value formatting.** `resolveValueContextAsString` `String()`s numbers and returns raw ISO dates. (Pre-existing: `/settings` renders `profile.totalSpendSyp` unformatted.) | Every order shows money and dates, and no bespoke block may format them |
| **G2** | **No enum→label mapping in atoms.** `Chip` has `listValueContext` (tag lists) but no single-scalar binding. | Order + payment status badges, timeline action/actor labels, return-item conditions |
| **G3** | **`showCondition` is auth-only** (`always/loggedIn/loggedOut`). | Discount/tax rows, address block, notes, timeline, cancel button, return UI are all conditional on *data* |
| **G4** | **One bespoke repeater per list.** `CustomerAddressesTemplateRepeater` is 339 lines for a single list. | Orders need three more sources; four more copies is exactly the domain-coupling we're avoiding |
| **G5** | **No list pagination in store-context.** | Orders list pager |
| **G6** | **No select atom.** Only `ContentInput` + `ContentSwitch` carry actions. | Return-item condition picker |
| **G7** | **`ContentInput` has no min/max**, and the return quantity's max is per-item (`item.quantity`). | Clamped return quantity |
| **G8** | **Return draft lives in component state.** | The multi-item return builder must be JSON-driven |
| **G9** | **Only `product-slug` is extracted from dynamic routes.** `StorefrontRenderer.extractDynamicSegments` output is hard-wired to `UrlBoundProductProvider`. | `/orders/:order-id` |
| **G10** | **~29 rules of hand-written CSS** in `modules/storefront/styles/storefront.css` (`OrdersPage`, `OrderCard`, `OrdersButton`, `OrderSection`, `OrderDetail`…). | Atoms carry theme-token styling instead |

### 3.1 Error surfacing (decided: section-level)

Matches how `customer.isError` already drives the addresses empty state. Each
list data source renders its own error/empty/loading slot (see
`CustomerAddressesTemplateRepeater`'s `EMPTY_STATE_STYLE` block for the shape).
Detail-page mutation errors (invoice, cancel, return submit) surface as a
`ContentParagraph` gated by a `dataCondition` on the relevant `errors.*` path.
**No global toasts.**

Port the 401/403 → "انتهت صلاحية الجلسة" mapping from `orders-error.ts` into the
provider so every error string reaching a block is already user-facing.

### 3.2 Already available — do not rebuild

- **Zone popups** for the cancel dialog — `ContentButton` already has `zoneKey`
  + `zoneAction: "open" | "close" | "toggle"`, dispatched via
  `config/lib/zone-events.ts`. See `presets/zone-shell.ts:165` for a working
  example.
- **Dynamic links** — `fields/LinkField/index.tsx:65` already resolves
  `dynamicSegment: { param, valueContext }` against bound data and prefixes the
  store base path.
- **Auth gating** — `showCondition: loggedIn/loggedOut` covers the sign-in panel.
- **Item-scoped actions** — `ContentButton/index.tsx:445-475` (`deleteAddress`,
  `setDefaultAddress`) shows how a button inside a repeated template reads its
  own entity id off `BoundData`. Copy that pattern for `orderItemId`.
- **Money formatting** — `config/lib/format.ts` already exports `formatPrice`
  with the SYP-first default. **Reuse it; do not port `formatOrderMoney`.**

---

## 4. Implementation notes per gap

Concrete enough to write directly. Signatures below were prototyped and tested.

### G1 — `valueContext.format`

`config/binding/types.ts`:

```ts
export type ValueContextFormat = "money" | "date" | "datetime" | "number";

export type ValueContext = {
  path: string;
  fallbackToStatic?: boolean;
  format?: ValueContextFormat;
  /** Path to the ISO currency code for `format:"money"`, e.g. `order.currencyCode`. */
  currencyPath?: string;
};
```

`config/lib/format.ts` — add alongside the existing `formatPrice`:
`formatNumber(value, locale="ar-SY")`, `formatDate(value)`,
`formatDateTime(value)`. Dates use `toLocaleDateString("en-GB", …)` /
`toLocaleString("en-GB", …)` — Latin digits and `dd/mm/yyyy`, matching what the
order screens render today. Return `null` on an unparseable date.

`config/binding/resolve-value-context.ts` — extend `ResolveOptions` with
`format` + `currency`, and apply the formatter **before** the existing
string/number branches:

```ts
if (options.format) {
  const formatted = applyValueFormat(value, options.format, options.currency);
  if (formatted) return formatted;   // else fall through to raw
}
```

`applyValueFormat` must accept **numeric strings** as well as numbers (the API
returns both) and must return `undefined` — not `""` — when it cannot format, so
the caller degrades to the raw value instead of rendering nothing.

`config/binding/use-bound-value.ts` — resolve `currencyPath` and pass both
through. **Put `format` in `ResolveOptions`, not inside the resolver reading it
off the `ValueContext`** — see landmine L2.

Export `ValueContextFormat` from `config/binding/index.ts`.

### G2 — `Chip` single-value binding + enum maps

New `config/content/enum-labels.ts`. Duplicate (do not import — L3) from
`apps/web/lib/domain-enums.ts`, mapping the admin `badgeVariant` onto the
storefront chip palette:

```ts
export type EnumBadgeVariant =
  | "primary" | "secondary" | "neutral" | "success" | "warning" | "danger";
export type EnumEntry = { label: string; variant: EnumBadgeVariant };
```

| Map key | Entries |
|---|---|
| `orderStatus` | PENDING قيد الانتظار/neutral · CONFIRMED مؤكد/primary · PROCESSING قيد المعالجة/primary · SHIPPED تم الشحن/primary · DELIVERED تم التسليم/success · COMPLETED مكتمل/success · CANCELLED ملغي/danger · RETURNED مرتجع/danger · REFUNDED تم الاسترداد/danger · FAILED فشل/danger |
| `paymentStatus` | UNPAID غير مدفوع/neutral · PENDING قيد المعالجة/warning · PAID مدفوع/success · FAILED فشل الدفع/danger · REFUNDED تم الاسترداد/danger |
| `paymentMethod` | COD الدفع عند الاستلام · PAYMERA Paymera (بطاقة Visa/MasterCard) — both neutral |
| `timelineAction` | the 13 keys of `ORDER_TIMELINE_ACTION_LABELS` in `customer-orders-api.ts` |
| `timelineActor` | CUSTOMER العميل · MERCHANT/ADMIN المتجر · SYSTEM النظام — all neutral |
| `returnItemCondition` | OPENED مفتوح/neutral · UNOPENED غير مفتوح/success · USED مستعمل/warning · DAMAGED تالف/danger |

Expose `ENUM_MAPS`, `EnumMapKey`, `ENUM_MAP_OPTIONS`, `isEnumMapKey`, and:

```ts
export function lookupEnumEntry(mapKey: unknown, value: string): EnumEntry | undefined
```

`lookupEnumEntry` **must use an own-property check** — `value` comes off the API
payload, so a status of `"toString"` would otherwise resolve to
`Object.prototype.toString` (L5). Unknown keys return `undefined` so the caller
renders the raw value; a status the backend adds later should look wrong, not
vanish.

`blocks/Chip/index.tsx` — add `valueContext?: ValueContext | null` and
`enumMap?: EnumMapKey | null`. In `render`, compute the single value in its own
`useMemo` **before** the existing `items` memo (both must always run — rules of
hooks), and branch on it first:

```tsx
if (single) {
  const style = resolveChipStyle(
    single.variant && props.chipVariantMode !== "custom"
      ? { ...props, chipVariant: single.variant }
      : props                     // merchant chose custom colours — keep them
  );
  return <span style={style}>{single.label}</span>;
}
if (!items) return null;          // existing list behaviour, unchanged
```

`EnumBadgeVariant` is declared locally in `content/enum-labels.ts` (identical
union to `ChipVariant`) so `content/` never imports a block.

### G3 — `dataCondition`

`config/lib/show-condition.ts` — add alongside the existing auth helpers:

```ts
export type DataConditionOp = "truthy" | "falsy" | "eq" | "neq" | "in";
export type DataCondition = {
  path: string;
  op?: DataConditionOp;                 // defaults to "truthy"
  value?: DataConditionValue | DataConditionValue[];
};
export function normalizeDataCondition(value: unknown): DataCondition | null
export function evaluateDataCondition(c: DataCondition, resolved: unknown): boolean
```

Semantics that matter:
- `truthy` treats `null`, `undefined`, `false`, `0`, `""`, whitespace-only,
  `[]` and `{}` as absent. (`order.discountAmount === 0` must hide the row.)
- `eq`/`neq`/`in` compare **stringified** so `"3"` from the API matches `3`.
- `in` with a non-array `value` matches nothing rather than throwing.

`config/components/ShowConditionGate.tsx` — accept `dataCondition` and delegate
to a **child** component that reads `useBoundData()`:

```tsx
export function ShowConditionGate({ condition, dataCondition, isEditing, children }) {
  const auth = useStoreAuth();
  if (!shouldShowForCondition(condition, auth.isLoggedIn, isEditing)) return null;

  const normalized = normalizeDataCondition(dataCondition);
  if (!normalized) return <>{children}</>;      // no bound-data subscription

  return <DataConditionGate condition={normalized} isEditing={isEditing}>{children}</DataConditionGate>;
}
```

The split is deliberate (L4): the gate's existing comment explains it subscribes
to auth *only* so that typing into a draft does not re-render every gated block.
Putting `useBoundData()` in the parent would silently undo that for every block
on every page. `DataConditionGate` also returns children unconditionally when
`isEditing`, matching the auth gate.

`config/lib/with-show-condition.tsx` — forward `dataCondition={props.dataCondition}`.
Because this HOC wraps **every** registered block, `dataCondition` becomes
available everywhere with no per-block wiring. Do **not** add it to
`defaultProps` and do **not** add a Puck field for it (L1).

### G4 — generic list repeater

Replace `blocks/Section/CustomerAddressesTemplateRepeater.tsx` with a
`StoreListRepeater` taking a `dataSource` key. The registry entry returns:

```ts
{ list: unknown[], isLoading: boolean, isError: boolean,
  sample: unknown[],            // used when isEditing && useSampleDataInEditor()
  keyOf: (entry) => string,     // React key + clone-template id suffix
  boundKey: string }            // e.g. "order" → BoundData { order }
```

Sources to register: `addresses` (migrate first, behaviour-preserving),
`orders`, `order.items`, `order.timeline`.

Preserve these two non-obvious behaviours from the current implementation:
- **Cell 0 uses the live editable slot**, remaining cells clone from the
  `cardTemplate` snapshot (`assignComponentIds` + `SlotRenderPure`). This is why
  the storefront still renders the first row when `cardTemplate` is stale.
- The `!liveTemplate && !isEditing` branch renders an explicit "re-save this
  section from the design studio" message rather than empty cells.

Register the new kinds in `blocks/Section/section-preset-kinds.ts` and add them
to the `sectionKind` union + dispatch chain in `blocks/Section/index.tsx`
(~lines 160-165 and 666-677).

### G5–G8 — provider surface

```ts
// config/store-context.tsx — additions
export type OrdersState = {
  items: CustomerOrderSummary[]
  page: number; pageSize: number; totalPages: number
  hasNext: boolean; hasPrev: boolean
  pageLabel: string            // "صفحة 1 من 3" — preformatted, one valueContext
  isLoading: boolean; isError: boolean
}
export type OrderDetailState = {   // filled by UrlBoundOrderProvider
  order: CustomerOrderDetail | null
  isCancellable: boolean           // derived in the provider — see note below
  isReturnable: boolean
  cancelReason: string
}
export type ReturnDraftState = {
  orderId: string | null
  reason: string                   // fixed "DEFECTIVE" today
  items: Record<string, { quantity: number; condition: ReturnItemCondition }>
  submitted: boolean
}
```

`StoreLoadingState` / `StoreErrorState` gain `invoice`, `cancelOrder`,
`submitReturn` keys.

New action enums:
- `content/button-actions.ts` += `ordersNextPage`, `ordersPrevPage`,
  `downloadInvoice`, `cancelOrder`, `submitReturn` (+ Arabic labels in all three
  places in that file: `BUTTON_ACTIONS`, `BUTTON_ACTION_OPTIONS`, and the map
  inside `buttonActionLabel`)
- `content/input-actions.ts` += `cancel_reason`, `return_item_quantity`
- `content/switch-actions.ts` += `return_item_selected`
- `content/select-actions.ts` (new) = `return_item_condition`

Add a no-op default for **every** new action to `defaultValue` in
`store-context.tsx` — that is what keeps the editor canvas rendering safely.

> **Derived booleans live in the provider, not in `dataCondition`.**
> `isOrderCancellable` / `isOrderReturnable` are set-membership checks over order
> statuses. Computing them in `StoreProvider` and exposing them as booleans keeps
> the JSON condition language to simple path checks instead of growing a rules
> engine.

### G9 — dynamic route → provider

`modules/storefront/components/storefront-renderer.tsx` currently hard-wires
`extractDynamicSegments(...)["product-slug"]` to `UrlBoundProductProvider`.
Generalise to a pattern→provider map: `product-slug` → product,
`order-id` → new `UrlBoundOrderProvider`.

Model `UrlBoundOrderProvider` on `UrlBoundProductProvider.tsx` (76 ln): a
`useQuery` on `getCustomerOrder(orderId)` feeding a `BoundDataProvider` with
`{ order }`.

Register pages in `config/page-registry.ts` `PAGES`:

```ts
{ path: "/orders",           label: "Orders",       iconName: "Package" }
{ path: "/orders/:order-id", label: "Order Details", iconName: "Package",
  dynamic: true, examplePath: "/orders/example-order" }
```

and seed their content in `config/initial-data.ts` keyed by the **example**
path (`"/orders/example-order"`), following the `/products/example-product`
entry there.

---

## 5. Phased implementation

Each phase ends at a **testable checkpoint** with a short changes note.

### Phase 0 — Foundations (no user-visible change)
G1 formatters + `valueContext.format` · G2 `Chip` binding + `enum-labels.ts` ·
G3 `dataCondition`. Specs: extend
`config/binding/__tests__/resolve-value-context.spec.ts`, add
`config/lib/__tests__/show-condition.spec.ts` and
`config/content/__tests__/enum-labels.spec.ts`.
✅ **Checkpoint:** `/settings` renders `profile.totalSpendSyp` as currency; test
baseline unchanged (§8).

### Phase 1 — Generic repeater (refactor, no new pages)
G4 `StoreListRepeater` + data-source registry; migrate `customer-addresses` onto
it; delete `CustomerAddressesTemplateRepeater`.
✅ **Checkpoint:** `/settings` addresses list behaves identically in editor and
storefront, including the stale-template message.

### Phase 2 — Orders list page
G5 `orders` slice + `StoreProvider` implementation wrapping `listCustomerOrders`
· `customer-orders` + `customer-orders-pager` data sources · pager button
actions · `presets/orders.ts` → `createOrdersPageContent()` (atoms only) · seed
`/orders` in `initial-data.ts` · register in `PAGES` · delete
`orders/page.tsx` and `orders-view.tsx`.
✅ **Checkpoint:** `/store/<tenantId>/orders` renders from JSON, paginates,
gates on auth, and is editable in the Design Studio.

### Phase 3 — Order detail page (read-only)
G9 provider routing + `UrlBoundOrderProvider` · data sources
`customer-order-detail`, `customer-order-items`, `customer-order-timeline` ·
preset covering header, summary rows (`dataCondition` on discount/tax), address
block + OSM link, notes, timeline · register `/orders/:order-id`.
✅ **Checkpoint:** order detail renders every field the old page did.

### Phase 4 — Order actions
`downloadInvoice` + `cancelOrder`; cancel dialog as a **popup zone**
(`cancel_reason` input action, confirm button, `dataCondition` on
`isCancellable`) · delete `order-actions.tsx`.
✅ **Checkpoint:** invoice downloads; cancel round-trips and invalidates the list.

### Phase 5 — Return request builder
G6 `ContentSelect` · G7 input min/max · G8 `returnDraft` slice + actions · return
UI inside the `customer-order-items` template gated on `isReturnable` · delete
`order-items-section.tsx`.
✅ **Checkpoint:** a multi-item return submits with correct quantities and
conditions.

### Phase 6 — Cleanup
G10 CSS removal · delete `orders-states.tsx`, `order-status-badge.tsx`,
`order-detail-view.tsx`, `orders-error.ts` · update `blocks/BLOCKS.md`,
`presets/SPEC.md`, `apps/web/CLAUDE.md` · `pnpm lint`; registry-consistency spec
green.

---

## 6. Deferred

**Returns list + detail pages.** `returns-view.tsx` and `return-detail-view.tsx`
are "قيد الإنشاء" placeholders and `CustomerReturnListItem` is
`Record<string, unknown>` — the backend DTO was never pinned, so there are no
`valueContext` paths to write against. The four `returns/**` route files stay
as-is. The *create-return* flow (Phase 5) does not depend on this.

**`apps/store` migration.** Its twin copies of the orders components and
`StoreProvider` stay untouched. Because atoms and presets live in `core`, that
migration is later a matter of adding the same provider slices and deleting the
twin routes — no second set of blocks.

---

## 7. Landmines (verified — do not rediscover)

**L1 — `valueContext` has no field UI anywhere.** It is not in any block's
`fields:`, only in props set by presets. So `format`, `currencyPath`, `enumMap`
and `dataCondition` need **no** Puck field and no `defaultProps` entry. Puck
preserves unknown props through edits.

**L2 — `resolveValueContextAsString` has exactly two non-test callers:**
`binding/use-bound-value.ts` and `fields/LinkField/index.tsx`. LinkField uses it
to substitute an **id** into an href — it must never format. Keep `format` in
`ResolveOptions` (passed by `useBoundValue`) rather than having the resolver
read it off a `ValueContext` it does not receive.

**L3 — `config/` must not import from `apps/web`.** Guarded by
`config/binding/__tests__/data-adapter.spec.ts`. Enum label maps and formatters
are therefore duplicated into core, not imported from `lib/domain-enums.ts`.
Note the duplication in a comment at the top of `enum-labels.ts`.

**L4 — `ShowConditionGate` subscribes to auth only, on purpose.** Its own
comment says so. Adding `useBoundData()` to the top-level gate would subscribe
every gated block on every page to bound data. Use the child-component split in
§4/G3.

**L5 — `lookupEnumEntry` needs an own-property guard.** The lookup key is API
data; without `Object.prototype.hasOwnProperty.call` a status of `"toString"`
resolves to a function.

**L6 — `blocks/Chip` already returns `null`** from `render` when there is no
list, which produces a pre-existing `Element | null` type error. Do not treat it
as a regression introduced by the new binding.

**L7 — `apps/web/app/(dashboard)/design-studio/` still exists**, despite
`apps/web/CLAUDE.md` claiming the pre-slug `(dashboard)` group was removed on
2026-07-12. It has its own type errors. Ignore it; do not "fix" it in this work.

**L8 — `Section` sectionKind dispatch is a nested ternary chain** at
`blocks/Section/index.tsx:666-677`, separate from the `sectionKind` prop union
at lines 160-165 and the render branches at 598-626. All three need editing when
adding a kind.

---

## 8. Baselines — know these before judging your own diff

The repo does **not** typecheck or test clean. Measure against these, do not
chase them.

- **`pnpm exec tsc --noEmit` in `apps/web`: fails, ~110 files with errors**
  (module-resolution noise on `@/core`, `@workspace/ui`, plus real drift in
  `design-studio` and `site-data`). Not a usable gate. To check your own work,
  grep the output for the files you touched and compare against a stashed run.
- **`pnpm exec jest config/` in `packages/editor-packages/core`:**
  **6 failed suites, 10 failed tests, 211 passed, 221 total.** The failures are
  pre-existing bilingual-string normalization drift in
  `config/lib/__tests__/site-data-fixtures.spec.ts` and friends. Phase 0 must
  leave this number unchanged.
- Useful narrow run while iterating:
  `pnpm exec jest config/binding config/lib config/content`.
