# Checkpoint — `/checkout` as an editor page

**Date:** 2026-08-17 · **Branch:** `dropdown`

Replaces the hard-coded checkout dialog with a `/checkout` page built from editor
blocks, in the same shape as `/orders`. The merchant can restyle it; the customer
picks a saved address and a payment method, applies a discount code, sees the
totals, and confirms the order.

---

## What changed

### 1. The dialog is gone

`CheckoutDrawer` (a static, unthemeable React dialog) is deleted along with its two
helpers, in **both** copies:

- `apps/web/modules/storefront/components/checkout/{CheckoutDrawer,save-address-panel,checkout-map-picker}.tsx`
- `apps/store/components/checkout/{...same three...}.tsx`

`makeOrder` no longer opens it. It now validates the cart and navigates to
`/checkout` — which is what the converter team's doc asked for in §6.1. The actual
order is placed by the new `placeOrder` action, on the checkout page only.

### 2. New `checkout` slice on StoreContext

`packages/editor-packages/core/config/store-context.tsx` gains `CheckoutState` +
`CheckoutActions` (`selectAddress`, `selectPaymentMethod`, `setDiscountCodeDraft`,
`validateDiscount`, `placeOrder`, `refreshCheckout`), plus `paymentMethods` /
`discount` / `placeOrder` keys on the loading + error maps. Editor defaults are
no-ops, so blocks still render safely on the canvas.

### 3. New content actions

| Kind | Value | Does |
|---|---|---|
| `selectAction` | `checkout_address` | picks a saved address |
| `selectAction` | `checkout_payment_method` | picks a payment provider |
| `inputAction` | `discount_code` | writes the discount draft |
| `buttonAction` | `validateDiscount` | applies the code |
| `buttonAction` | `placeOrder` | confirms the order |
| `buttonAction` | `makeOrder` | **changed** — now "متابعة إلى الدفع", goes to `/checkout` |

`ContentSelect` learned to build its `<option>` list from the store instead of only
from static `ENUM_MAPS`. It renders sample rows on the editor canvas, and **hides
itself entirely when a bound list is empty** so the page never shows a dead control.

### 4. `checkout.*` binding scope

`SECTION_KIND_CHECKOUT` + `CheckoutBoundShell` (in `blocks/Section/`) publish:

```
checkout.hasAddress / addressSummary / recipientName / recipientPhone
checkout.paymentMethodName / hasPaymentMethod
checkout.hasDiscount / discountCode
checkout.subtotal / shippingCost / discountAmount / payableTotal / currencyCode
checkout.canPlaceOrder / isPlaced
errors.discount / errors.placeOrder
session.isLoggedIn
```

Money renders via the existing `format: "money"` + `currencyPath` convention rather
than pre-formatted `*Formatted` strings, matching the orders preset.

### 5. The preset + the Rawaq page

- `config/presets/checkout.ts` — `createCheckoutPageContent()`
- `config/presets/checkout-rawaq.ts` — Rawaq skin + Arabic/English strings
- `config/presets/rawaq-theme-walk.ts` — **new**, the styling walker extracted from
  `orders-rawaq.ts` so both pages share one copy (see "Refactor" below)
- `themes/inject-rawaq-checkout.spec.ts` — the injector, already run
- `/checkout` registered in `page-registry.ts` + `initial-data.ts`

### 6. API layer

`checkout-api.ts` gains three calls against the endpoints you gave me:

| Function | Endpoint |
|---|---|
| `listPaymentMethods` | `GET /public/payments/methods` |
| `validateDiscountCode` | `GET /public/checkout/validate-discount?code&subtotal&shippingCost` |
| `placeCheckoutOrder` | `POST /public/checkout` |

Saved addresses come from `customer.addresses`, which the provider already loads
from `GET /customer/addresses` — no new call needed.

The checkout body is exactly the five-key shape you specified; only
`shippingAddress` varies, built from the address the customer picked:

```json
{
  "items": [{ "variantId": "…", "quantity": 2 }],
  "shippingAddress": {
    "latitude": 33.5138,
    "longitude": 36.2765,
    "recipientName": "Ahmad Ali",
    "phone": "+963944000001",
    "addressLabel": "Al-Hamra Street, Building 5, Damascus"
  },
  "paymentMethod": "COD",
  "checkoutToken": "<uuid>",
  "guestEmail": "guest@example.com"
}
```

`latitude`/`longitude` come straight off the selected address; `addressLabel` is
`governorate، city، streetAddress` joined; `recipientName`/`phone` come from the
address, falling back to the session cookies. `paymentMethod` is the code from
the payment select — which is `"COD"` today, since that's the only method
`/public/payments/methods` returns.

---

## How to test

```bash
cd packages/editor-packages/core
pnpm exec jest config/__tests__/theme-rawaq-checkout.spec.tsx
```

13 tests, all passing. The meaningful ones drive the real page through Puck's
`<Render>` off the shipped theme JSON:

- signed-out → only the sign-in gate, no selects
- signed-in with one address + COD → **two populated selects**, the discount input,
  both buttons, and all four money rows in SYP
- after `placeOrder` → success panel, everything else gone

In the browser: `/checkout` on the Rawaq theme, signed in as a customer with at
least one saved address.

---

## Things you should know

**1. Shipping cost is always 0.** Nothing in the API surface quotes a shipping
price to the storefront. `validate-discount` *takes* `shippingCost` as an input, so
the client has to know it, and today it can't. The row renders as 0 rather than
inventing a number. This needs a backend endpoint.

**2. The discount is display-only.** ⚠️ The checkout payload you specified has no
`discountCode` field, so a validated code lowers the **displayed** total but is
never sent to `/public/checkout` — the backend will charge full price. Either
`POST /public/checkout` needs to accept the code, or the discount UI is
misleading. Worth confirming before this goes near a real customer.

**3. No shipping-provider select** — dropped per your instruction.

**4. `apps/store/components/StoreProvider.tsx` is now a one-line re-export.**
It was a hand-maintained twin of the `apps/web` copy and had drifted badly: it
never gained the orders slice, so it no longer satisfied `StoreContextValue`, and
it imported `@/lib/customer-account-api`, which in that app resolves to
`apps/web/lib/` where no such file exists. It had not compiled since orders landed.
Because `@/modules/*` already aliases to `apps/web/modules/*`, the web copy resolves
cleanly from `apps/store`, so there is now one implementation instead of two. If
you'd rather move the real file into `apps/store` (per the "storefront belongs in
the store app" direction), that's a straightforward follow-up.

**5. A gotcha worth remembering.** `dataCondition` on a *Section* cannot read
`checkout.*`, because `CheckoutBoundShell` publishes that scope *inside* the
section — the condition is evaluated before the scope exists and silently never
matches. My first cut had exactly this bug; the placed/unplaced swap did nothing.
The signed-in half is therefore one section with a Group per step, and there's a
regression test (`keeps every checkout.* gate inside the scope, never on a Section`)
so it can't come back.

---

## Refactor included

`themeWalk` was private to `orders-rawaq.ts`. It's now
`presets/rawaq-theme-walk.ts`, shared by the orders and checkout skins. Verified
as a pure refactor: re-running the orders injector regenerates
`theme-rawaq-furniture.json` **byte-identically**.

---

## Test status

| | Baseline | After |
|---|---|---|
| core jest | 6 suites / 8 tests failing, 422 passing | same 6 / 8 failing, **434 passing** |
| `apps/web` tsc | 318 errors | 319 |

No new failures. The single new tsc error is the `/checkout` entry in
`initial-data.ts` inheriting the identical pre-existing
`ComponentDataOptionalId[]` vs `Content<Components>` mismatch that `/cart`,
`/orders` and `/settings` already have. The 6 failing suites
(`bilingual-migration`, `mobile-sync`, `site-data-fixtures`, `storefront-mode`,
`section-catalog`, `Puck/index`) fail identically on a clean tree.
