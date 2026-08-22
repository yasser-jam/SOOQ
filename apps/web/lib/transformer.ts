// ─── Module-level state ─────────────────────────────────────────────────────
let _idCounter = 0;
let _warnings: string[] = [];

function generateId(prefix: string): string {
  return `${prefix}-${++_idCounter}`;
}
function resetIdCounter() {
  _idCounter = 0;
}
function resetWarnings() {
  _warnings = [];
}
/**
 * Deduplicated: a site-wide zone is re-ingested on every page, so a per-block warning about one
 * would otherwise be reported once per page. The messages name the offending block, not the page,
 * so the repeats carried no extra information.
 */
function addWarning(message: string) {
  if (!_warnings.includes(message)) _warnings.push(message);
}
function takeWarnings(): string[] {
  const w = [..._warnings];
  _warnings = [];
  return w;
}

/**
 * Web block types that reached the converter with no mobile mapping. They are counted and
 * reported, never emitted: `type: "unsupported"` is an engine-internal fallback, and a config
 * containing one fails the parser outright ("Unsupported component type: unsupported"), taking
 * the whole page down with it. Dropping the block keeps the rest of the page renderable, and the
 * tally is what we send the mobile team to get a real mapping.
 */
let _unsupportedBlocks: Map<string, number> = new Map();
function resetUnsupportedBlocks() {
  _unsupportedBlocks = new Map();
}
/** Records a dropped block and returns `null` so call sites can `return noteUnsupportedBlock(t)`. */
function noteUnsupportedBlock(blockType: string): null {
  _unsupportedBlocks.set(blockType, (_unsupportedBlocks.get(blockType) || 0) + 1);
  return null;
}
export type UnsupportedBlockReport = { blockType: string; count: number };
function takeUnsupportedBlocks(): UnsupportedBlockReport[] {
  const list = [..._unsupportedBlocks.entries()]
    .map(([blockType, count]) => ({ blockType, count }))
    .sort((a, b) => b.count - a.count || a.blockType.localeCompare(b.blockType));
  _unsupportedBlocks = new Map();
  return list;
}

/** Maps BLOCKS-MOBILE.md Puck type names to internal converter type names. */
const WEB_TYPE_ALIASES: Record<string, string> = {
  ContentImage: "Image",
  ContentParagraph: "Text",
  ContentHeading: "Heading",
  ContentButton: "Button",
  ContentDivider: "Divider",
  ContentIcon: "Icon",
  ContentHtml: "Html",
  ContentLink: "Link",
  ContentInput: "Input",
  ContentSwitch: "Switch",
  VideoEmbed: "YouTube",
  ProductsGrid: "ProductGrid",
  OrderHistory: "OrderList",
  CartItem: "Group",
  ProductImageCarousel: "ProductGallery",
};

const UNSUPPORTED_LEAF_BLOCKS = new Set([
  "CategoryListMenu",
  "ProductSearchMenu",
]);

/**
 * Web presets, not persisted block types. A preset is an authoring shortcut that
 * expands into ordinary blocks before the JSON is saved, so it must never reach the
 * converter — seeing one means the web side saved an unexpanded tree.
 */
const PRESET_ONLY_TYPES = new Set(["CartList"]);

/**
 * Binding scope for `valueContext` → `valuePath` resolution inside bound Groups.
 * `base` is the dataContext prefix every bound field hangs off:
 *   - `"item"` inside a repeat template (cart line, grid item)
 *   - `"dataContext.requests.<key>.data"` for a standalone product-bound Group
 */
type BindingScope = {
  kind: "product" | "cart" | "orderList" | "orderDetail" | "orderItem" | "orderTimeline";
  base: string;
};
let _bindingScope: BindingScope | null = null;
/**
 * The order-detail request is declared once per page. Every `customer-order-*` Section on
 * `/orders/:orderId` reads the same `CustomerOrder`, so the first one to convert carries the
 * `data` block and the rest bind to it by absolute path.
 */
let _orderDetailRequestEmitted = false;
/** One cart-line template per page — later `cartLineId` Groups are duplicates of the same list. */
let _cartTemplateEmitted = false;
/** Mobile route of the page being converted; `product: null` only means "route-bound" on one of them. */
let _currentRoute = "";
/** The product-detail request is declared once per page — bindings to it are absolute paths. */
let _productDetailRequestEmitted = false;
/**
 * Whether this page has a `ProductVariants` block, decided *before* its subtree is converted.
 * Add-to-cart needs to know, and the button is authored after the picker — reading a flag set
 * during the walk would make the tap depend on block order.
 */
let _variantPickerAvailable = false;
/** One variant `form` per page — nested route-bound Groups would otherwise each wrap their own. */
let _variantFormEmitted = false;
/**
 * Depth inside a **grid** cell template.
 *
 * A cell is ~130px wide at 320px (two columns minus padding and spacing), which is narrower than a
 * single outlined button. Layout decisions that are fine on a full-width row are wrong here, so the
 * width rules below consult this. Deliberately not the same thing as the repeat *binding* scope: a
 * `listView` cart line is also a repeat template but is full-bleed, and its rows are correct.
 */
let _gridCellDepth = 0;

/**
 * Breadcrumb of "page > block > block …" for whatever is currently being converted. Read only when
 * something throws — {@link transformBlock} and {@link transformPage} tag the error with a snapshot
 * of this trail the first time they catch it, so `transformWebToMobile`'s top-level catch can report
 * exactly where the tree stopped instead of a bare `e.message`. Not popped on the way back up: only
 * the deepest (innermost) catch needs it, and by design a page overwrites it wholesale for the next
 * page rather than trying to stay a perfectly balanced stack across `.map()` calls.
 */
let _debugTrail: string[] = [];

/** Short label for a block in {@link _debugTrail}: its type plus whatever names it for a human. */
function describeBlockForTrail(block: Record<string, unknown>): string {
  const type = (block.type as string) || "?";
  const props = (block.props || {}) as Record<string, unknown>;
  const hint =
    (props.name as string) || (props.label as string) || (props.text as string) ||
    (props.title as string) || (typeof props.id === "string" ? (props.id as string) : undefined);
  return hint ? `${type}("${String(hint).slice(0, 40)}")` : type;
}

/** Tags an error with the {@link _debugTrail} snapshot the first time it's caught, then rethrows. */
function tagWithTrail(e: unknown): never {
  if (e instanceof Error && !("sooqTrail" in e)) {
    (e as Error & { sooqTrail?: string[] }).sooqTrail = [..._debugTrail];
  }
  throw e;
}

function withGridCell<T>(fn: () => T): T {
  _gridCellDepth++;
  try {
    return fn();
  } finally {
    _gridCellDepth--;
  }
}
let _warnedContainerRequest = false;
let _warnedAddToCartRedirect = false;
let _pageStickyFooter: Record<string, unknown> | null = null;
let _zoneSlots: Map<string, Record<string, unknown>[]> = new Map();
/** Overlay zone keys that some tap actually opened — the rest are dead weight on this page. */
let _zoneSlotsUsed: Set<string> = new Set();
/** Zone keys that resolve to the page-level appDrawer (ZoneDrawer / SiteDrawerShell / SiteHeader.drawerName). */
let _drawerZoneKeys: Set<string> = new Set();

/**
 * The auth form currently being converted. Set by transformSection when a Section holds both
 * ContentInput fields and a ContentButton whose `buttonAction` is an auth action — the Section's
 * content is then wrapped in a `form` node and the button submits it (see resolveAuthFormTap).
 * Without this, a `login` button is only a navigate stub to the engine's native /auth/login screen.
 */
type AuthForm = { formId: string; fields: string[] };
let _activeAuthForm: AuthForm | null = null;

/** Set when any Section on the current page became an auth form — drives the centered page shell. */
let _pageHasAuthForm = false;

/** Set when some action reads a param out of the `app` envelope (`{ source: "app" }`). */
let _usedAppEnvelopeSource = false;

/** Auth `buttonAction`s that submit the surrounding form rather than navigating. */
const AUTH_FORM_ACTIONS = new Set(["login", "verifyOtp"]);

/** Field ids that are never sent as auth params (confirmations, UI-only toggles). */
const AUTH_PARAM_EXCLUDED_FIELDS = new Set(["passwordConfirm", "confirmPassword", "rememberMe"]);

/** The `FormStateStore` key the engine's `otpInput` writes into, and the field `verifyOtp` reads. */
const OTP_FIELD_ID = "otpCode";

/**
 * The engine's OTP screen. **Not** a natively registered route: the app builds its router from
 * `pages[]`, so this page has to be in the converted JSON like any other (see checkAuthRouteTargets).
 */
const OTP_ROUTE = "/auth/otp-reset";

/**
 * The engine mounts its auth host — OTP spinner, error toasts, rate-limit messages — on this route
 * and on {@link OTP_ROUTE} only. A login screen anywhere else renders as a plain form with no
 * feedback on failure. It is also shell-excluded by definition, so it can never be a bottom tab.
 */
const LOGIN_ROUTE = "/auth/login";

type AuthParamSpec = { source: "form" | "authState" | "app"; field: string };

/**
 * What each auth `buttonAction` actually dispatches.
 *
 * `AuthCubit` exposes **`requestOtp`**, **`verifyOtp`** and **`logout`** — there is no `login`
 * method, and no password anywhere in the flow ([`docs/06-feature-auth.md`], [`docs/04-actions-and-requests.md`]).
 * Auth is `/api/v1/customer/auth/otp/request` + `/verify`, bodies `CustomerOtpRequest` /
 * `CustomerOtpVerifyRequest`. So a web `login` button is step 1 of a two-step flow, not a login:
 *
 *   `/login` --`auth.requestOtp`--> `/auth/otp-reset` --`auth.verifyOtp`--> `/home`
 *
 * `form` params are emitted only when the surrounding form carries the field; `authState` carries
 * the phone from step 1 into step 2 (the OTP screen never re-collects it); `tenantSlug` comes from
 * the `app` envelope so one conversion works for whichever merchant it is built for.
 */
type AuthContract = {
  method: string;
  formId: string;
  params: Record<string, AuthParamSpec>;
  /** Form fields the call cannot work without. */
  requiredFields: string[];
  onSuccess: { type: string; route: string; navigation_type: string };
  /** Whether the button's `submitRedirectUrl` may override `onSuccess`. */
  allowRedirectOverride: boolean;
};

const AUTH_ACTION_CONTRACT: Record<string, AuthContract> = {
  login: {
    method: "requestOtp",
    formId: "otp-request-form",
    params: {
      phone: { source: "form", field: "phone" },
      fullName: { source: "form", field: "fullName" },
      tenantSlug: { source: "app", field: "tenantSlug" },
    },
    requiredFields: ["phone"],
    // The OTP screen is the only valid landing. A `submitRedirectUrl` straight to the store would
    // skip verification and leave the app on an unauthenticated session, so it is not honoured.
    onSuccess: { type: "navigate", route: OTP_ROUTE, navigation_type: "clear_stack" },
    allowRedirectOverride: false,
  },
  verifyOtp: {
    method: "verifyOtp",
    formId: "otp-verify-form",
    params: {
      phone: { source: "authState", field: "phone" },
      otpCode: { source: "form", field: OTP_FIELD_ID },
      tenantSlug: { source: "app", field: "tenantSlug" },
    },
    requiredFields: [OTP_FIELD_ID],
    onSuccess: { type: "navigate", route: "/home", navigation_type: "clear_stack" },
    allowRedirectOverride: true,
  },
};

/**
 * Flags auth forms the cubit cannot read. Nothing is auto-corrected: renaming the merchant's field
 * would leave an "email" label and `validateEmail` on what the cubit reads as a phone number, and
 * dropping a password field silently would hide that the whole credential model is different.
 */
function checkAuthFormFields(action: string, contract: AuthContract, fields: string[]): void {
  for (const required of contract.requiredFields) {
    if (fields.includes(required)) continue;
    const found = fields.find((f) => !AUTH_PARAM_EXCLUDED_FIELDS.has(f));
    addWarning(
      required === OTP_FIELD_ID
        ? `Auth "${action}" form has no "${OTP_FIELD_ID}" field; add a ContentInput with name ` +
            `"${OTP_FIELD_ID}" — it converts to the engine's otpInput and auth.verifyOtp reads the code from it`
        : `Auth "${action}" form has no "${required}" field${found ? ` (found "${found}")` : ""}; ` +
            `the engine's auth cubit is a phone/OTP flow and cannot bind any other credential — ` +
            `use a ContentInput with name "${required}" and inputType "tel"`
    );
  }

  const bound = new Set(
    Object.values(contract.params).filter((p) => p.source === "form").map((p) => p.field)
  );
  for (const field of fields) {
    if (bound.has(field) || AUTH_PARAM_EXCLUDED_FIELDS.has(field)) continue;
    addWarning(
      `Auth "${action}" form field "${field}" is not part of the engine's OTP flow ` +
        `(auth.${contract.method} binds ${[...bound].join(" + ")}); the field still renders but is ` +
        `never submitted — remove it or rename it to a field the cubit binds`
    );
  }
}

/**
 * Collects the ContentInput field ids in a block subtree, stopping at nested Sections
 * (each Section owns its own form scope).
 */
function collectFormFieldIds(blocks: Record<string, unknown>[], acc: string[] = []): string[] {
  for (const block of blocks) {
    const type = normalizeBlockType((block.type as string) || "");
    if (type === "Section") continue;
    const props = (block.props || {}) as Record<string, unknown>;
    if (type === "Input") {
      const raw = (props.name as string) || (props.id as string) || "field";
      // Match transformInput: an aliased OTP field is emitted as `otpCode`, so the auth-form
      // check must see the contract's id, not the merchant's spelling.
      const id = isOtpFieldName(raw) ? OTP_FIELD_ID : raw;
      if (!acc.includes(id)) acc.push(id);
      continue;
    }
    if (type === "Switch") {
      const id = (props.name as string) || (props.id as string) || "switch";
      if (!acc.includes(id)) acc.push(id);
      continue;
    }
    collectFormFieldIds(getChildren(block), acc);
  }
  return acc;
}

/** True when this subtree contains a button with the given `buttonAction`. */
function findButtonAction(blocks: Record<string, unknown>[], action: string): boolean {
  for (const block of blocks) {
    const type = normalizeBlockType((block.type as string) || "");
    if (type === "Section") continue;
    const props = (block.props || {}) as Record<string, unknown>;
    if (type === "Button" && (props.buttonAction as string) === action) return true;
    if (findButtonAction(getChildren(block), action)) return true;
  }
  return false;
}

/** The auth `buttonAction` submitted by this block subtree, if any. */
function findAuthFormAction(blocks: Record<string, unknown>[]): string | null {
  for (const block of blocks) {
    const type = normalizeBlockType((block.type as string) || "");
    if (type === "Section") continue;
    const props = (block.props || {}) as Record<string, unknown>;
    if (type === "Button" && AUTH_FORM_ACTIONS.has((props.buttonAction as string) || "")) {
      return props.buttonAction as string;
    }
    const nested = findAuthFormAction(getChildren(block));
    if (nested) return nested;
  }
  return null;
}

/**
 * Web `valueContext.path` → the mobile field name, appended to the active binding base.
 *
 * Product scope resolves against `dataContext.requests.<key>.data`, so the fields are
 * the public product API's.
 */
const VALUE_CONTEXT_MAP: Record<string, { valueField?: string; urlField?: string }> = {
  "product.title": { valueField: "name" },
  "product.description": { valueField: "description" },
  "images[0].url": { urlField: "primaryImageUrl" },
  "pricing.displayPrice": { valueField: "price" },
  "pricing.displayLineTotal": { valueField: "lineTotal" },
  quantity: { valueField: "quantity" },
  lineId: { valueField: "lineId" },
  variantId: { valueField: "variantId" },
};

/**
 * Cart rows resolve against a `cart.items` repeat item, which the engine populates from
 * the persisted cart — *not* from the product API — so the field names differ from
 * `VALUE_CONTEXT_MAP`. Authoritative list: builder-spec `20-commerce-cart-cubit-call.md`
 * § "valuePath fields on repeat `item`" (`productTitle`, `variantTitle`, `unitPrice`,
 * `quantity`, `variantId`, `thumbnailUrl`), plus `lineTotalFormatted` as used by the
 * hand-authored `/cart` and `/checkout` screens.
 *
 * Paths absent here (`product.description`, `lineId`) have no cart-item field: they fall
 * through to the "no mobile field mapping" warning instead of emitting a dead binding.
 */
const CART_VALUE_CONTEXT_MAP: Record<string, { valueField?: string; urlField?: string }> = {
  "product.title": { valueField: "productTitle" },
  "images[0].url": { urlField: "thumbnailUrl" },
  "pricing.displayPrice": { valueField: "unitPrice" },
  "pricing.displayLineTotal": { valueField: "lineTotalFormatted" },
  quantity: { valueField: "quantity" },
  variantId: { valueField: "variantId" },
};

/**
 * An orders-list row. The engine hands `variant_screen.dart`'s `_handleOrdersListSuccess`
 * an `OrderSummary.toJson()` per row and enriches it with two derived fields, so the
 * bindable set is the summary's own camelCase keys plus `totalFormatted` /
 * `orderStatusLabel`.
 *
 * Money and status go to the **enriched** fields on purpose: the raw `total` is minor
 * units (an int) and the raw `orderStatus` is the wire enum (`"SHIPPED"`), neither of
 * which is showable. `totalFormatted` is `formatSyp`'d and `orderStatusLabel` is the
 * Arabic label — which is also why the web side's `format: "money"` / `format: "datetime"`
 * hints are dropped rather than translated: the engine `text` node has no formatter.
 *
 * `order.currencyCode` is deliberately absent — `OrderSummary` carries no currency (only
 * the detail's `CustomerOrder` does), so a card binding it would render empty.
 */
const ORDER_LIST_VALUE_CONTEXT_MAP: Record<string, { valueField?: string; urlField?: string }> = {
  "order.orderNumber": { valueField: "orderNumber" },
  "order.orderStatus": { valueField: "orderStatusLabel" },
  "order.paymentStatus": { valueField: "paymentStatus" },
  "order.paymentMethod": { valueField: "paymentMethod" },
  "order.placedAt": { valueField: "placedAt" },
  "order.itemCount": { valueField: "itemCount" },
  "order.total": { valueField: "totalFormatted" },
  "order.orderId": { valueField: "orderId" },
};

/**
 * The order-detail request's payload: `CustomerOrder.toJson()` plus the five `*Formatted`
 * fields and `orderStatusLabel` that `_enrichOrderJson` adds. Richer than the list row —
 * `shippingCost`, `currencyCode`, `shippingAddress.*` and `notesCustomer` only exist here.
 */
const ORDER_DETAIL_VALUE_CONTEXT_MAP: Record<string, { valueField?: string; urlField?: string }> = {
  "order.orderNumber": { valueField: "orderNumber" },
  "order.orderStatus": { valueField: "orderStatusLabel" },
  "order.paymentStatus": { valueField: "paymentStatus" },
  "order.paymentMethod": { valueField: "paymentMethod" },
  "order.placedAt": { valueField: "placedAt" },
  "order.currencyCode": { valueField: "currencyCode" },
  "order.subtotal": { valueField: "subtotalFormatted" },
  "order.discountAmount": { valueField: "discountAmountFormatted" },
  "order.taxAmount": { valueField: "taxAmountFormatted" },
  "order.shippingCost": { valueField: "shippingCostFormatted" },
  "order.total": { valueField: "totalFormatted" },
  "order.notesCustomer": { valueField: "notesCustomer" },
  "order.invoiceNumber": { valueField: "invoiceNumber" },
  "order.orderId": { valueField: "orderId" },
  "order.shippingAddress.recipientName": { valueField: "shippingAddress.recipientName" },
  "order.shippingAddress.phone": { valueField: "shippingAddress.phone" },
  "order.shippingAddress.addressLabel": { valueField: "shippingAddress.addressLabel" },
};

/** A row of `CustomerOrder.items` — `OrderItem.toJson()`, no enrichment. */
const ORDER_ITEM_VALUE_CONTEXT_MAP: Record<string, { valueField?: string; urlField?: string }> = {
  "item.productTitle": { valueField: "productTitle" },
  "item.variantTitle": { valueField: "variantTitle" },
  "item.sku": { valueField: "sku" },
  "item.quantity": { valueField: "quantity" },
  "item.unitPrice": { valueField: "unitPrice" },
  "item.discountAmount": { valueField: "discountAmount" },
  "item.totalPrice": { valueField: "totalPrice" },
  "item.variantId": { valueField: "variantId" },
  "item.orderItemId": { valueField: "orderItemId" },
};

/** A row of `CustomerOrder.timeline` — `OrderTimelineEntry.toJson()`. */
const ORDER_TIMELINE_VALUE_CONTEXT_MAP: Record<string, { valueField?: string; urlField?: string }> = {
  "timelineEntry.action": { valueField: "action" },
  "timelineEntry.actor": { valueField: "actor" },
  "timelineEntry.details": { valueField: "details" },
  "timelineEntry.createdAt": { valueField: "createdAt" },
};

/** The `valueContext` map for the scope in play — each request shape exposes different fields. */
function valueContextMapFor(scope: BindingScope): Record<string, { valueField?: string; urlField?: string }> {
  switch (scope.kind) {
    case "cart":
      return CART_VALUE_CONTEXT_MAP;
    case "orderList":
      return ORDER_LIST_VALUE_CONTEXT_MAP;
    case "orderDetail":
      return ORDER_DETAIL_VALUE_CONTEXT_MAP;
    case "orderItem":
      return ORDER_ITEM_VALUE_CONTEXT_MAP;
    case "orderTimeline":
      return ORDER_TIMELINE_VALUE_CONTEXT_MAP;
    default:
      return VALUE_CONTEXT_MAP;
  }
}

/** Human-readable note for the "no mobile field mapping" warning. */
function bindingScopeNote(scope: BindingScope): string {
  switch (scope.kind) {
    case "cart":
      return " for cart rows (the cart item carries no such field)";
    case "orderList":
      return " for orders-list rows (OrderSummary carries no such field — the detail request is richer)";
    case "orderDetail":
      return " for the order-detail request (CustomerOrder carries no such field)";
    case "orderItem":
      return " for order-item rows (OrderItem carries no such field)";
    case "orderTimeline":
      return " for order-timeline rows (OrderTimelineEntry carries no such field)";
    default:
      return "";
  }
}

function withBindingScope<T>(scope: BindingScope | null, fn: () => T): T {
  const prev = _bindingScope;
  _bindingScope = scope;
  try {
    return fn();
  } finally {
    _bindingScope = prev;
  }
}

function getValueContextPath(props: Record<string, unknown>): string | undefined {
  const vc = props.valueContext as Record<string, unknown> | undefined;
  return vc?.path as string | undefined;
}

function applyValueContext(
  props: Record<string, unknown>,
  outProps: Record<string, unknown>,
  kind: "text" | "image" | "button"
): void {
  const path = getValueContextPath(props);
  if (path && !_bindingScope) {
    // A bound node that landed outside every scope. This used to return silently, which is
    // exactly how the `customer-orders` gap shipped unnoticed: the whole orders page bound
    // `order.*` paths, no scope was ever pushed for them, and the converter emitted the
    // template's empty `value: ""` placeholders without a word. Never silent again.
    addWarning(
      `valueContext path "${path}" was dropped: the block is not inside a bound Group, repeat ` +
        `template, or data-bound Section preset, so there is no request for it to read from. ` +
        `The static fallback value was kept — it will render blank if the template had none`
    );
    return;
  }
  if (path && _bindingScope) {
    const mapped = valueContextMapFor(_bindingScope)[path];
    const base = _bindingScope.base;
    if (mapped?.valueField && (kind === "text" || kind === "button")) {
      outProps.valuePath = `${base}.${mapped.valueField}`;
      delete outProps.value;
    }
    if (mapped?.urlField && kind === "image") {
      outProps.urlPath = `${base}.${mapped.urlField}`;
      delete outProps.url;
    }
    if (!mapped) {
      addWarning(
        `valueContext path "${path}" has no mobile field mapping${bindingScopeNote(_bindingScope)}; ` +
          `the static fallback value was kept`
      );
    }
  }
  // labelValueContext / altValueContext: engine has no labelPath or semanticsLabelPath —
  // use a sibling text node with valuePath for dynamic labels in repeat templates.
}

function normalizeBlockType(type: string): string {
  return WEB_TYPE_ALIASES[type] || type;
}

const GAP_TOKEN_MAP: Record<string, number> = { sm: 8, md: 12, lg: 16, xl: 24 };

// ─── Phone layout budget ─────────────────────────────────────────────────────

/**
 * Every fixed dimension in a web config is measured against a ~1200px canvas. The narrowest
 * screen the engine supports is 320px, so a value that carried over unchanged is not a style
 * difference — it is a render error. Rawaq's `spacing.md: 32` plus 32px section gutters left a
 * 360px screen with 296px of content, and a 134px cell inside a two-column grid; that single
 * number caused most of its layout failures.
 *
 * These are the ceilings, in logical px. Anything under them is the merchant's choice and is left
 * alone.
 */
const PHONE_MIN_WIDTH = 320;

/**
 * `theme.spacing` ceilings. Only `md` is tight, and for a specific reason: it is the engine's
 * default page inset, so it is charged once per side on every screen. The rest are ordinary gaps.
 */
const PHONE_SPACING_MAX: Record<string, number> = { xs: 8, sm: 16, md: 16, lg: 32, xl: 48 };

/**
 * Horizontal padding one section may add. Pages are emitted at `padding: 0`, so this is the whole
 * gutter — 24 per side still leaves 272px of content at 320, which lays out. It only bites on a
 * value carried straight over from the 1200px canvas.
 */
const PHONE_SECTION_PAD_MAX = 24;

/**
 * Rough glyph advance as a fraction of font size, used to guess how many lines a string wraps to.
 * Arabic in Tajawal runs narrower than Latin. This only has to be good enough to pick a cell
 * height — over-estimating costs whitespace, under-estimating costs a clipped card.
 */
const GLYPH_WIDTH_RATIO = 0.52;
/** Multiplier from font size to laid-out line height, matching `theme.lineHeight.normal`. */
const LINE_HEIGHT_RATIO = 1.5;

/**
 * Content width a row can actually use: the narrowest screen minus one section gutter per side.
 * Pages are emitted at `padding: 0`, so the section is the only inset a row inherits.
 */
const PHONE_ROW_BUDGET = PHONE_MIN_WIDTH - PHONE_SECTION_PAD_MAX * 2;

/**
 * Padding a card may draw inside a section.
 *
 * Card insets compound with everything above them — page, then section gutter, then the card — and
 * the merchant only ever sees the total against 1200px. At 320px, 40px cards left the OTP row 192px
 * to lay out six boxes in, and it overflowed by 49px. 20 is what the mobile team measured as
 * fitting, and it is still a visible card inset.
 */
const PHONE_CARD_PAD_MAX = 20;

/**
 * Padding a surface container may draw when it sits inside a grid cell (`_gridCellDepth > 0`).
 *
 * A grid cell already pays the card's own inset before a merchant-authored `Group` adds a second,
 * nested surface on top — `146px cell − card padding − inner surface padding` left a 90px-wide
 * price no 12-character `"1,150.00 USD"` fits into, so it clipped to `…U 640.00`. `PHONE_CARD_PAD_MAX`
 * (20/side) is sized for a card sitting directly in a section, not for a second wrapper stacked
 * inside one that already spent its share — this is the tighter budget for that inner layer.
 */
const PHONE_GRID_CELL_SURFACE_PAD_MAX = 6;

/**
 * Vertical padding a background-image Section may draw before its `stack` (`fit: "cover"`, sized
 * by the image's aspect ratio, not by its content — see {@link STACK_FIT}) clips instead of
 * scrolling. A hero stack's box height is fixed by the image, so oversized padding pushes the copy
 * past its bottom edge. Rawaq's 160px top + 160px bottom clipped the hero 101-153px on every
 * device (v50 audit item 1); 64 is the ceiling the mobile team measured as still reading as a hero.
 */
const PHONE_HERO_PADDING_MAX = 64;

/**
 * Ceiling for an *ordinary* Section's vertical padding on mobile — {@link scaleSectionVPad}.
 *
 * The "only costs scroll height" reasoning this used to run on breaks for the first Section on a
 * page: `section { padding: 6rem 0 }` (96px) copied literally opened `page-products` on 72px of
 * blank space above a 56px app bar, before any content was visible at all (audit item 5). Not a
 * hero-specific problem — every Section pays this now.
 */
const PHONE_SECTION_VPAD_MAX = 40;
/** Floor for {@link scaleSectionVPad} — keeps a deliberately small desktop value from vanishing. */
const PHONE_SECTION_VPAD_MIN = 16;
/** Desktop-to-phone scale factor for ordinary Section vertical padding (audit item 5). */
const PHONE_SECTION_VPAD_SCALE = 0.33;

/** Ceiling for a converted heading's `fontSize` — see {@link transformHeading}. */
const MOBILE_HEADING_MAX_FONT_SIZE = 24;

/**
 * Scales a desktop Section's `paddingTop`/`paddingBottom` down for a 360px phone screen.
 * `0` (the merchant explicitly wants no inset) passes through untouched; any positive value is
 * scaled by {@link PHONE_SECTION_VPAD_SCALE} and clamped into
 * [{@link PHONE_SECTION_VPAD_MIN}, {@link PHONE_SECTION_VPAD_MAX}].
 */
function scaleSectionVPad(webPx: number, what: string): number {
  if (webPx <= 0) return webPx;
  const scaled = Math.round(
    Math.min(Math.max(webPx * PHONE_SECTION_VPAD_SCALE, PHONE_SECTION_VPAD_MIN), PHONE_SECTION_VPAD_MAX)
  );
  if (scaled !== webPx) _phoneClamps.push({ what, from: webPx, to: scaled });
  return scaled;
}

/**
 * Horizontal padding each button variant draws around its label. A `text` button is a link with no
 * box; `filled` and `outlined` carry the theme's `buttonMdPaddingX` on both sides.
 */
const BUTTON_VARIANT_PAD_X: Record<string, number> = { text: 8, outlined: 18, filled: 18 };

/**
 * Laid-out width of a `button`, for deciding whether several fit one row.
 *
 * Font size is read back from the height the button was emitted with, because the size token is
 * resolved into `height` before this point: 32px is the `sm` step, 44px the `md` default.
 */
function estimateButtonWidth(node: Record<string, unknown>): number {
  const props = (node.props || {}) as Record<string, unknown>;
  if (typeof props.width === "number") return props.width;
  const height = (props.height as number) || 44;
  const fontSize = (props.fontSize as number) || (height <= 36 ? 14 : height <= 48 ? 16 : 18);
  const padX = BUTTON_VARIANT_PAD_X[(props.variant as string) || "filled"] ?? 18;
  return ((props.label as string) || "").length * fontSize * GLYPH_WIDTH_RATIO + padX * 2;
}

/**
 * Lines to budget for a `valuePath`-bound text. There is no literal to measure and the runtime
 * value is typically a product title, so one line is optimistic — that assumption is what left
 * every Rawaq product card clipped.
 */
const BOUND_TEXT_ASSUMED_LINES = 2;

/**
 * Lines a bound card field is capped at inside a grid cell, keyed by the `valueContext.path` the
 * merchant authored on the web side.
 *
 * A grid cell's height is one number for the whole grid ({@link estimateGridAspectRatio}), so an
 * uncapped bound text makes the card's real height depend on how long *this* product's name
 * happens to be — one design renders cards of several different heights, and the cell has to be
 * sized for the worst one. Every card then pays that worst case as dead space. Capping turns the
 * height back into a fact both sides agree on: the estimator stops charging
 * {@link GRID_HEIGHT_SLACK}, and the engine truncates instead of overflowing.
 *
 * Money is 1 line on purpose. It never legitimately wraps, and at a 90px content width Rawaq's
 * "1,150.00 USD" broke across two — the v50 audit's §2 screenshot. Reserving a second line for it
 * cost every card ~27px of whitespace.
 */
const GRID_CELL_MAX_LINES: Record<string, number> = {
  "product.title": 2,
  "product.description": 2,
  "pricing.displayPrice": 1,
  "pricing.displayLineTotal": 1,
  quantity: 1,
};

/**
 * `maxLines` to apply to a bound text the merchant did not cap themselves, when it sits in a grid
 * cell. Unknown paths fall back to {@link BOUND_TEXT_ASSUMED_LINES} so the cap matches what the
 * cell was already sized for — the estimate stops being a guess without the card getting shorter.
 *
 * Only product-card templates reach here: `withGridCell` is entered from
 * {@link transformProductsTemplateSection} alone, so ordinary page text is never truncated.
 */
function gridCellMaxLines(props: Record<string, unknown>): number | undefined {
  if (_gridCellDepth === 0) return undefined;
  const path = (props.valueContext as Record<string, unknown> | undefined)?.path;
  if (typeof path !== "string") return undefined;
  return GRID_CELL_MAX_LINES[path] ?? BOUND_TEXT_ASSUMED_LINES;
}

/** Inset a `card` draws even when nothing declares a padding on it. */
const CARD_DEFAULT_PADDING = 12;

/**
 * `fit` on every `stack` the converter emits (both background-image wrappers).
 *
 * `loose` is what the shape wants on paper — the stack should hug the content layer rather than
 * claim the viewport — but it is what the mobile team's v3 §12 review traced the broken
 * background-image Section to: nothing sizes a `loose` stack, so the overlay and the content land
 * bottom-center. Until they answer, no stack ships `loose`.
 *
 * `cover` is deliberately **outside** the documented `expand | loose` enum
 * (docs/engine/builder-specs/12-splash-screen-primitives.md §1 — `cover` is a BoxFit, not a
 * StackFit). That is the interim instruction, not a reading of the spec, and it is why this is a
 * named constant: WEB-COVERAGE-GAPS-TODO.md "S1" tracks getting a real value back from the engine
 * team, and flipping it is a one-line change here.
 */
const STACK_FIT = "cover";

/** How many lines `text` occupies at `fontSize` in `width` px. Never less than one. */
function estimateWrappedLines(text: string, fontSize: number, width: number): number {
  if (width <= 0) return 1;
  const perLine = Math.max(1, Math.floor(width / (fontSize * GLYPH_WIDTH_RATIO)));
  return Math.max(1, Math.ceil((text || "").length / perLine));
}

/** Laid-out height of `text` at `fontSize` in `width` px. */
function estimateTextHeight(text: string, fontSize: number, width: number): number {
  return estimateWrappedLines(text, fontSize, width) * fontSize * LINE_HEIGHT_RATIO;
}

/**
 * Height for a background-image hero the merchant did not size. Sums the content the hero actually
 * holds at the narrowest supported width, then adds a margin — a hero that is too tall shows
 * whitespace, one that is too short throws.
 */
function estimateHeroHeight(
  props: Record<string, unknown>,
  padding: number,
  hasButtons: boolean,
  lang: string
): number {
  const contentWidth = PHONE_MIN_WIDTH - padding * 2;
  let height = padding * 2;
  const title = pickLang(props.title, lang);
  if (title) height += estimateTextHeight(title, 28, contentWidth) + 16;
  const desc = pickLang(props.description, lang);
  if (desc) height += estimateTextHeight(desc.replace(/<[^>]*>/g, ""), 16, contentWidth) + 16;
  if (hasButtons) height += 48 + 16;
  // Round up to a 20px step and keep a floor — a hero shorter than this reads as a banner strip.
  return Math.max(240, Math.ceil(height / 20) * 20);
}

/** Height contributed by a node, split by how sure the estimate is. */
interface NodeHeightParts {
  /** Fixed/declared sizing (images with an aspect ratio, buttons, gaps, padding) — never wrong. */
  certain: number;
  /** Text wrapped from an unmeasurable runtime string — the only part that needs slack. */
  uncertain: number;
}

const ZERO_PARTS: NodeHeightParts = { certain: 0, uncertain: 0 };

/**
 * Laid-out height of an emitted node at `width` px, for sizing grid cells, split into the part
 * we know exactly (images, buttons, fixed sizes, padding, gaps) and the part that is a guess
 * (a data-bound text with no literal to measure, so line count is assumed).
 *
 * `childAspectRatio` is content-dependent, so a constant is always wrong for something: 0.75
 * clipped every Rawaq product card, and the mobile team had to measure four grids by hand (0.34,
 * 0.27, 0.24, 0.26). Estimating from the card we actually emit is the only way to get close
 * without a layout engine. Unknown node types contribute 0 — the caller adds slack to the
 * uncertain part only, not to sizes we already know for a fact.
 */
function estimateNodeHeightParts(node: unknown, width: number): NodeHeightParts {
  if (!node || typeof node !== "object") return ZERO_PARTS;
  const n = node as Record<string, unknown>;
  const props = (n.props || {}) as Record<string, unknown>;
  const pad = props.padding as Record<string, unknown> | number | undefined;
  const declaredY = typeof pad === "number" ? pad * 2
    : pad ? ((pad.top as number) || 0) + ((pad.bottom as number) || 0)
    : 0;
  const declaredX = typeof pad === "number" ? pad * 2
    : pad ? ((pad.left as number) || 0) + ((pad.right as number) || 0)
    : 0;
  // A card draws its own inset even when nothing declares one.
  const isCard = n.type === "card";
  const padY = declaredY || (isCard ? CARD_DEFAULT_PADDING * 2 : 0);
  const padX = declaredX || (isCard ? CARD_DEFAULT_PADDING * 2 : 0);
  const inner = Math.max(1, width - padX);
  const gap = (props.gap as number) || 0;
  const kids = (n.children as unknown[]) || [];

  switch (n.type) {
    case "image":
      if (typeof props.height === "number") return { certain: props.height + padY, uncertain: 0 };
      return { certain: inner / ((props.aspectRatio as number) || 1) + padY, uncertain: 0 };
    case "text":
    case "richtext": {
      const size = (props.fontSize as number) || 16;
      const literal = String(props.value ?? "");
      // A data-bound field has no literal to measure, and the runtime value is usually a product
      // title — long, Arabic, and wrapping. Assuming one line is what clipped the Rawaq cards.
      // `maxLines` turns this back into a fact: the engine truncates there, so it can't overflow.
      const isGuess = !literal && !!props.valuePath && typeof props.maxLines !== "number";
      const lines = literal
        ? estimateWrappedLines(literal, size, inner)
        : props.valuePath
          ? BOUND_TEXT_ASSUMED_LINES
          : 1;
      const capped = typeof props.maxLines === "number" ? Math.min(lines, props.maxLines as number) : lines;
      const textHeight = capped * size * LINE_HEIGHT_RATIO;
      return isGuess ? { certain: padY, uncertain: textHeight } : { certain: textHeight + padY, uncertain: 0 };
    }
    case "button":
      return { certain: ((props.height as number) || 48) + padY, uncertain: 0 };
    case "divider":
      return { certain: ((props.thickness as number) || 1) + 16 + padY, uncertain: 0 };
    case "sizedBox":
      return { certain: ((props.height as number) || 0) + padY, uncertain: 0 };
    case "otpInput":
      return { certain: ((props.boxHeight as number) || 52) + padY, uncertain: 0 };
    case "textFormField":
      return { certain: 56 + padY, uncertain: 0 };
    case "row": {
      const parts = kids.map((k) => estimateNodeHeightParts(k, inner));
      const tallest = parts.reduce<NodeHeightParts>(
        (best, p) => (p.certain + p.uncertain > best.certain + best.uncertain ? p : best),
        ZERO_PARTS
      );
      return { certain: tallest.certain + padY, uncertain: tallest.uncertain };
    }
    case "column":
    case "listView": {
      const parts = kids.map((k) => estimateNodeHeightParts(k, inner));
      const certain = parts.reduce((sum, p) => sum + p.certain, 0) + Math.max(0, kids.length - 1) * gap + padY;
      const uncertain = parts.reduce((sum, p) => sum + p.uncertain, 0);
      return { certain, uncertain };
    }
    default: {
      // container / card / stack and anything else: a single `child` slot.
      const child = estimateNodeHeightParts(n.child, inner);
      return { certain: child.certain + padY, uncertain: child.uncertain };
    }
  }
}

/**
 * How much taller than the estimate the uncertain (text-wrap) portion of a grid cell is made.
 * The estimate cannot know runtime string lengths or the engine's exact metrics, and the two
 * failure modes are not symmetric — so only the part that could be wrong pays the margin;
 * images, buttons, padding and gaps are declared facts and get none.
 */
const GRID_HEIGHT_SLACK = 1.25;

/** Content width one cell gets, given the phone budget minus a section's gutters. */
function phoneCellWidth(columns: number, gap: number, sectionPadding = PHONE_SECTION_PAD_MAX): number {
  const content = PHONE_MIN_WIDTH - sectionPadding * 2;
  return Math.max(1, (content - gap * Math.max(0, columns - 1)) / Math.max(1, columns));
}

/**
 * `childAspectRatio` for a grid, measured from the cells it will actually render — one repeated
 * template, or every static child (the grid sizes them all alike, so the tallest wins).
 *
 * Deliberately biased tall by {@link GRID_HEIGHT_SLACK} on the parts of the estimate that are
 * genuinely a guess: extra whitespace under a card is invisible, a clipped card is a render
 * error the app reports. Declared sizes (an image's aspect ratio, a button's height, padding,
 * gaps) are not guesses and get no slack, so they no longer inflate every cell's whitespace.
 */
/**
 * Safety band for any emitted `childAspectRatio`, estimate or fallback alike (validator rule #3).
 * The estimator is a heuristic, not a layout engine — an unmodelled Dart-side quirk (see the
 * column `mainAxisAlignment` fix above) can still inflate its input past what the actual card
 * needs. 0.43 (a 146px cell rendered ~340px tall) is exactly the shape that clamp stops: below
 * 0.5 a two-column phone grid reads as a wall of near-square cards standing on stilts.
 */
const GRID_ASPECT_RATIO_MIN = 0.5;
const GRID_ASPECT_RATIO_MAX = 1.8;

function estimateGridAspectRatio(
  cells: unknown[],
  columns: number,
  gap: number,
  fallback: number
): number {
  const cellWidth = phoneCellWidth(columns, gap);
  const parts = cells.map((c) => estimateNodeHeightParts(c, cellWidth));
  const tallest = parts.reduce<NodeHeightParts>(
    (best, p) => (p.certain + p.uncertain > best.certain + best.uncertain ? p : best),
    ZERO_PARTS
  );
  const height = tallest.certain + tallest.uncertain * GRID_HEIGHT_SLACK;
  if (!Number.isFinite(height) || height <= 0) return fallback;
  const ratio = Math.round((cellWidth / height) * 100) / 100;
  const clamped = Math.min(GRID_ASPECT_RATIO_MAX, Math.max(GRID_ASPECT_RATIO_MIN, ratio));
  if (clamped !== ratio) {
    _phoneClamps.push({ what: "gridView childAspectRatio", from: ratio, to: clamped });
  }
  return clamped;
}

/** Clamps recorded this run, reported as one summary warning rather than eighty. */
let _phoneClamps: { what: string; from: number; to: number }[] = [];
function resetPhoneClamps() {
  _phoneClamps = [];
}
/** Caps a desktop measurement at its phone ceiling, recording the change for the summary. */
function clampToPhone(value: number, max: number, what: string): number {
  if (!Number.isFinite(value) || value <= max) return value;
  _phoneClamps.push({ what, from: value, to: max });
  return max;
}

const BUTTON_VARIANT_MAP: Record<string, string> = {
  primary: "elevated",
  secondary: "outlined",
  outline: "outlined",
  ghost: "text",
  danger: "filled",
  error: "filled",
};

/** `"theme-md"` / `"md"` / `"44|18|9|1rem"` → `sm` | `md` | `lg`. */
function resolveButtonSizeToken(size: string | undefined): string {
  if (!size) return "md";
  const key = size.replace(/^theme-/, "");
  return key === "sm" || key === "lg" ? key : "md";
}

function resolveButtonVariant(variant: string | undefined): string {
  if (!variant) return "elevated";
  return BUTTON_VARIANT_MAP[variant] || "elevated";
}

/**
 * Which engine prop a web button's single authored colour belongs in.
 *
 * The engine's button renderer reads `backgroundColor`, `textColor` and `foregroundColor`; a bare
 * `color` is dropped, which silently rendered 129 Rawaq buttons in the default palette. The
 * destination is not a straight rename, though — it depends on the variant. Web authors one colour
 * and means "the button's colour": on a filled/elevated button that is the fill, on a text or
 * outlined button (which has no fill) it is the label.
 */
function buttonColorProp(engineVariant: string): "backgroundColor" | "textColor" {
  return engineVariant === "outlined" || engineVariant === "text" ? "textColor" : "backgroundColor";
}

/**
 * `#fff` / `#ffffff` in any case — the one colour `button_renderer.dart` cannot render on an
 * `outlined`/`text` button, because it reads `textColor` for **both** the label and the border
 * (see {@link buttonColorProp}). White there is white-on-white against a light card: a button
 * that is clickable but invisible.
 */
function isWhiteHex(color: string): boolean {
  const hex = color.trim().toLowerCase();
  return hex === "#fff" || hex === "#ffffff";
}

/**
 * A `LinkValue` of `kind: "url"` pointing at a contact URI, split into the engine's
 * `contactButton` channel + target (CONVERTER-OUTPUT-SPEC §6.5b). Anything else — a normal
 * http(s) page — returns null and stays an `openUrl` button.
 */
function parseContactUri(url: string | undefined): { channel: string; target: string } | null {
  const raw = (url || "").trim();
  if (!raw) return null;

  const scheme = raw.match(/^(tel|sms|mailto|whatsapp):(.+)$/i);
  if (scheme) {
    const [, kind, rest] = scheme;
    const target = rest.split("?")[0].trim();
    if (!target) return null;
    const channel = kind.toLowerCase() === "mailto" ? "email" : kind.toLowerCase();
    return { channel, target };
  }

  // https://wa.me/966501234567 · https://api.whatsapp.com/send?phone=966501234567
  const wa = raw.match(/^https?:\/\/(?:api\.)?(?:wa\.me|whatsapp\.com)\/(?:send\/?\?phone=)?\+?(\d[\d\s-]*)/i);
  if (wa) {
    const digits = wa[1].replace(/[\s-]/g, "");
    if (digits) return { channel: "whatsapp", target: `+${digits}` };
  }

  return null;
}

/**
 * `contactButton` per §6.5b: `channel` + `label` + `target` in `props`, the **same** target
 * repeated on the node-level `tap` (the renderer reads `props.target` for its enabled state),
 * `fullWidth` by default and never a `height`.
 */
function buildContactButton(
  label: string,
  contact: { channel: string; target: string },
  props: Record<string, unknown>,
  rootProps: Record<string, unknown>
): Record<string, unknown> {
  const outProps: Record<string, unknown> = {
    channel: contact.channel,
    label,
    target: contact.target,
    fullWidth: true,
  };

  const radius = props.radius as string;
  if (radius) outProps.borderRadius = resolveThemePx(radius, rootProps, 8);

  return {
    id: generateId("contact-btn"),
    type: "contactButton",
    props: outProps,
    tap: { type: "openContact", channel: contact.channel, target: contact.target },
  };
}

/**
 * Web `showCondition` (`ContentButton` and the canonical header presets) → `props.visibleWhen`
 * (§6.31). The engine reads the session flag out of dataContext, and `visibleWhen.value` is a
 * **string**, matching the guest-only cards in the production config.
 */
const SHOW_CONDITION_VALUE: Record<string, string> = {
  loggedIn: "true",
  loggedOut: "false",
  guest: "false",
};

function applyShowCondition(
  node: Record<string, unknown>,
  props: Record<string, unknown>
): Record<string, unknown> {
  const condition = (props.showCondition as string) || "";
  if (!condition || condition === "always") return node;

  const value = SHOW_CONDITION_VALUE[condition];
  if (value === undefined) {
    addWarning(
      `showCondition "${condition}" has no engine equivalent; the block is emitted unconditionally. ` +
        `Supported values are "loggedIn", "loggedOut" and "always"`
    );
    return node;
  }

  return {
    ...node,
    props: {
      ...((node.props || {}) as Record<string, unknown>),
      visibleWhen: { source: "data", field: "session.isLoggedIn", when: "equals", value },
    },
  };
}

function flexProps(
  mainAxisAlignment: string,
  crossAxisAlignment: string,
  extra?: Record<string, unknown>
): Record<string, unknown> {
  return { mainAxisAlignment, crossAxisAlignment, ...extra };
}

// ─── Utility functions ──────────────────────────────────────────────────────

/** Plain object narrowing for untyped Site JSON fields (excludes null/arrays). */
function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * `"0.9375rem"` → `15`, not `0.9375`. A bare `parseFloat` stops at the first non-numeric
 * character, so it silently kept the rem *number* and dropped the unit — the engine then read
 * that number as px straight into padding math (`(height − fontSize) / 2`), so a 0.9375rem
 * (15px) button font size was consumed as if it were 0.9375px, ballooning vertical padding.
 * Every other unit (bare number, `px`, anything else `parseFloat` already handled) is unchanged.
 */
function parsePx(value: string | number | undefined, fallback = 0): number {
  if (value === undefined || value === null) return fallback;
  if (typeof value === "number") return value;
  const s = String(value).trim();
  // parseFloat already stops at the first non-numeric character, so it reads the leading number
  // out of "0.9375rem" on its own — no capture group (and no noUncheckedIndexedAccess fight) needed.
  const n = parseFloat(s);
  if (isNaN(n)) return fallback;
  return /rem$/i.test(s) ? n * 16 : n;
}

/**
 * Web text fields come in two shapes: the legacy flat pair (`text` + `textAr`) and the
 * `BilingualString` object the editor writes today (`{ ar, en }` — BLOCKS-MOBILE.md §Testimonials).
 * Both collapse to the one string the engine's `text.value` accepts; an object that reached the
 * output would render as `[object Object]`.
 */
function resolveBilingual(en: unknown, ar: unknown, language: string): string {
  const pick = (value: unknown): string => {
    if (typeof value === "string") return value;
    if (value && typeof value === "object") {
      const bilingual = value as Record<string, unknown>;
      const preferred = language === "ar" ? bilingual.ar : bilingual.en;
      const fallback = language === "ar" ? bilingual.en : bilingual.ar;
      return (preferred as string) || (fallback as string) || "";
    }
    return "";
  };

  const arText = pick(ar) || (language === "ar" ? pick(en) : "");
  if (language === "ar" && arText) return arText;
  return pick(en) || pick(ar);
}

/**
 * `BilingualString` → one string, mirroring `pickLang()` in `core/lib/bilingual.ts`
 * (BLOCKS.md § Bilingual text): resolve **requested → other language → ""**, and pass a plain
 * string through untouched (legacy payloads still carry those —
 * `normalizeBilingual("نص") → { ar: "نص", en: "" }`).
 *
 * Every prop listed in BLOCKS.md's `BILINGUAL_PROPS` table must go through this. Reading one with
 * a bare `as string` cast puts a `{ ar, en }` object straight into the mobile output, where the
 * engine expects a string — and on any prop the converter also calls `.replace()` on, it throws.
 */
function pickLang(value: unknown, language: string): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return resolveBilingual(value, undefined, language);
}

/** `pickLang` against the root language, for the common `rootProps` call site. */
function bilingualProp(value: unknown, rootProps: Record<string, unknown>): string {
  return pickLang(value, (rootProps.language as string) || "ar");
}

function resolveColor(
  colorMode: string | undefined,
  colorTheme: string | undefined,
  colorFixed: string | undefined,
  rootProps: Record<string, unknown>
): string | undefined {
  if (colorMode === "fixed" && colorFixed) return colorFixed;
  if (colorMode === "theme" && colorTheme) {
    const colorMap: Record<string, string> = {
      primary: (rootProps.primary as string) || "#0b78c5",
      surface: (rootProps.surface as string) || "#ffffff",
      success: (rootProps.success as string) || "#0f9d73",
      warning: (rootProps.warning as string) || "#c77a15",
      error: (rootProps.error as string) || "#ef4444",
      dark: (rootProps.dark as string) || "#10213a",
      text: (rootProps.text as string) || "#0f172a",
      neutral: (rootProps.neutral as string) || "#64748b",
    };
    return colorMap[colorTheme];
  }
  return undefined;
}

function resolveTextColor(color: string | undefined): string | undefined {
  if (color === "default") return undefined; // theme default
  if (color === "muted") return "#6b7d93";
  return undefined;
}

const FONT_SIZE_MAP: Record<string, number> = {
  xs: 12, sm: 14, s: 14, md: 16, m: 16, lg: 18, l: 18, xl: 22, xxl: 28, "2xl": 28,
};
function resolveFontSize(size: string | undefined, fallback = 16): number {
  return FONT_SIZE_MAP[size || ""] || fallback;
}

function resolveThemePx(
  value: string | number | undefined,
  rootProps: Record<string, unknown>,
  fallback = 0
): number {
  if (value === undefined || value === null) return fallback;
  if (typeof value === "number") return value;
  const s = String(value);
  if (!s.startsWith("theme-")) return parsePx(s, fallback);

  const themeKey = s.replace("theme-", "");
  const bareNum = themeKey.match(/^(\d+)$/);
  if (bareNum) return parseInt(bareNum[1], 10);

  const spacingMap: Record<string, number> = {
    xs: 4, sm: 8, md: 16, lg: 24, xl: 36, "4": 4, "8": 8, "16": 16, "24": 24, "40": 40,
  };
  if (spacingMap[themeKey] !== undefined) return spacingMap[themeKey];

  if (themeKey === "none") return 0;
  if (themeKey === "full") return 999;

  // Radius tokens: fixed spec defaults, override with rootProps if available
  const radiusPropMap: Record<string, string> = {
    sm: "radiusSm", md: "radiusMd", lg: "radiusLg", xl: "radiusXl",
  };
  const radiusFallbackMap: Record<string, number> = { sm: 4, md: 8, lg: 12, xl: 16 };
  if (radiusPropMap[themeKey]) {
    const fromRoot = rootProps[radiusPropMap[themeKey]];
    if (fromRoot !== undefined) return parsePx(fromRoot as string, radiusFallbackMap[themeKey]);
    return radiusFallbackMap[themeKey];
  }

  return resolveFontSize(themeKey, fallback);
}

function resolveThemeColor(
  token: string | undefined,
  rootProps: Record<string, unknown>
): string | undefined {
  if (!token) return undefined;
  if (token.startsWith("theme-")) {
    const key = token.replace("theme-", "");
    return resolveColor("theme", key, undefined, rootProps);
  }
  const muted = resolveTextColor(token);
  if (muted) return muted;
  if (token.startsWith("#")) return token;
  return token;
}

function resolveThemeFontWeight(weight: string | undefined): string | undefined {
  if (!weight) return undefined;
  const map: Record<string, string> = {
    "theme-light": "normal",
    "theme-normal": "normal",
    "theme-semibold": "semibold",
    "theme-bold": "bold",
    light: "normal",
    normal: "normal",
    semibold: "semibold",
    bold: "bold",
  };
  return map[weight] || resolveFontWeight(weight);
}

function resolveThemeFontSize(
  value: string | undefined,
  rootProps: Record<string, unknown>,
  fallback = 16
): number {
  if (!value) return fallback;
  if (value.startsWith("theme-")) {
    const key = value.replace("theme-", "");
    if (FONT_SIZE_MAP[key] !== undefined) return FONT_SIZE_MAP[key];
  }
  return resolveThemePx(value, rootProps, fallback);
}

function resolveGridGap(gap: string | number | undefined): number {
  if (typeof gap === "number") return gap;
  if (!gap) return 16;
  if (GAP_TOKEN_MAP[gap]) return GAP_TOKEN_MAP[gap];
  return parsePx(gap, 16);
}

/** `CollectionPickerRef` → the segment the collection endpoint is keyed by (`id`, else `slug`). */
function resolveCollectionRef(collection: unknown): string {
  if (typeof collection === "string") return collection;
  if (collection && typeof collection === "object") {
    const ref = collection as Record<string, unknown>;
    return String(ref.id || ref.slug || "all");
  }
  return "all";
}

function buildCollectionRequestUrl(collection: string | Record<string, unknown>, maxSize: number): string {
  const size = Math.min(maxSize, 20);
  const collectionId =
    typeof collection === "object" && collection?.id
      ? String(collection.id)
      : collection && collection !== "all"
        ? String(collection)
        : "";
  if (!collectionId || collectionId === "all") {
    return `/api/v1/public/products?page=0&size=${size}`;
  }
  return `/api/v1/public/collections/${encodeURIComponent(collectionId)}/products?page=0&size=${size}`;
}

/** Mobile engine reads collection requests from `props.data` (docs/02-config-and-json.md). */
function buildCollectionDataBlock(
  requestKey: string,
  requestUrl: string,
  id: string,
  size: number,
  collection?: string
): Record<string, unknown> {
  const capped = Math.min(size, 20);
  return {
    source: "collection",
    id,
    requestKey,
    requestUrl,
    page: 0,
    size: capped,
    ...(collection && collection !== "all" ? { collection } : {}),
  };
}

/**
 * `buttonAction: "addToCart"` → `cart.addItem`, with the params read off whatever the button is
 * standing in. Nothing here is a merchant decision: the web renderer resolves the same values at
 * runtime by walking up to its `BoundDataProvider`, and this does that walk at build time.
 *
 * Only the product-detail page can produce a `variantId`. The list endpoint returns no variants at
 * all, so a card in a grid has nothing to add to the cart with — those buttons become a `navigate`
 * to the detail page, which is where the choice actually gets made.
 */
function buildAddToCartTap(): Record<string, unknown> {
  if (_bindingScope?.kind === "product" && _bindingScope.base === PRODUCT_DETAIL_BASE) {
    if (!_variantPickerAvailable) {
      // `addItem` without a `variantId` is rejected by the cart cubit, and the button would look
      // fine while doing nothing. Better to have it go somewhere than to fail silently.
      addWarning(
        `Add-to-cart on the product-detail page has no ProductVariants block to read a variant ` +
          `from, and cart.addItem cannot resolve a variantId without one. The button was left as a ` +
          `link to /cart — add a ProductVariants block to the page to make it add to the cart`
      );
      return { type: "navigate", route: "/cart", navigation_type: "push" };
    }
    return {
      type: "cubitCall",
      cubit: "cart",
      method: "addItem",
      requireValidForm: true,
      formId: VARIANT_FORM_ID,
      params: {
        variantId: { source: "form", field: VARIANT_FIELD_ID },
        variantTitle: { source: "form", field: `${VARIANT_FIELD_ID}_label` },
        quantity: { source: "form", field: VARIANT_QTY_FIELD_ID },
        // Lower-case `routeparams` / `datacontext` copies the engine's own product-detail
        // add-to-cart (`mobile_production_v2.json` page 7) verbatim. That config also contains
        // camel-case `routeParams` elsewhere (page 19) and never spells `dataContext` that way,
        // so the dispatcher most likely folds case — but this is the one `cart.addItem` known to
        // ship, and a silently unresolved param here means an add button that does nothing.
        productId: { source: "routeparams", field: "productId" },
        productTitle: { source: "datacontext", field: `requests.${PRODUCT_DETAIL_REQUEST_KEY}.data.name` },
        unitPrice: { source: "datacontext", field: `requests.${PRODUCT_DETAIL_REQUEST_KEY}.data.price` },
        thumbnailUrl: { source: "datacontext", field: `requests.${PRODUCT_DETAIL_REQUEST_KEY}.data.primaryImageUrl` },
      },
    };
  }

  // Once per conversion: this is one design decision, not a fault in each button.
  if (!_warnedAddToCartRedirect) {
    _warnedAddToCartRedirect = true;
    addWarning(
      `Add-to-cart outside a product-detail page cannot resolve a variantId — the product list ` +
        `endpoint returns no variants — so those buttons navigate to the product instead. Variant ` +
        `choice belongs on the detail page`
    );
  }
  return { type: "navigate", route: PRODUCT_DETAIL_ROUTE, navigation_type: "push" };
}

/**
 * `metadata.apiUrl` → a relative mobile path. Strips the host, rewrites `/admin/`
 * to `/public/`, and guarantees the `/api/v1` prefix the engine expects
 * (see 15-data-and-api-binding.md § Standard requestUrl paths).
 */
function normalizeAdminApiUrl(apiUrl: string): string {
  let path = apiUrl;
  let search = "";
  try {
    const url = new URL(apiUrl);
    path = url.pathname;
    search = url.search;
  } catch {
    path = apiUrl.replace(/^https?:\/\/[^/]+/, "");
    const q = path.indexOf("?");
    if (q >= 0) {
      search = path.slice(q);
      path = path.slice(0, q);
    }
  }

  path = path.replace(/^\/admin\//, "/public/");
  if (!path.startsWith("/")) path = `/${path}`;
  if (!path.startsWith("/api/")) path = `/api/v1${path}`;
  return path + search;
}

const FONT_WEIGHT_MAP: Record<string, string> = {
  normal: "normal", medium: "medium", semibold: "semibold", bold: "bold",
};
function resolveFontWeight(weight: string | undefined): string | undefined {
  return FONT_WEIGHT_MAP[weight || ""];
}

const LINE_HEIGHT_MAP: Record<string, number> = {
  tight: 1.25, normal: 1.5, relaxed: 1.75,
};
function resolveLineHeight(lh: string | undefined): number | undefined {
  return LINE_HEIGHT_MAP[lh || ""];
}

const LUCIDE_TO_MATERIAL: Record<string, string> = {
  Star: "star", star: "star", Heart: "favorite", heart: "favorite",
  ShoppingCart: "shopping_cart", "shopping-cart": "shopping_cart",
  Menu: "menu", menu: "menu", X: "close", x: "close", close: "close",
  Search: "search", search: "search", User: "person", user: "person",
  Home: "home", home: "home", Package: "package",
  Palette: "palette", ArrowRight: "arrow_forward", "arrow-right": "arrow_forward",
  ArrowLeft: "arrow_back", "arrow-left": "arrow_back",
  ChevronDown: "expand_more", ChevronUp: "expand_less", Plus: "add", plus: "add",
  Minus: "remove", minus: "remove", Trash: "delete", trash: "delete",
  Edit: "edit", edit: "edit", pencil: "edit", Settings: "settings",
  Bell: "notifications", bell: "notifications", Mail: "email", mail: "email",
  Phone: "phone", phone: "phone", MapPin: "location_on", "map-pin": "location_on",
  Clock: "access_time", clock: "access_time", Check: "check", check: "check",
  AlertCircle: "error_outline", "alert-circle": "error_outline",
  Info: "info", info: "info", XCircle: "cancel",
  ExternalLink: "open_in_new", Grid: "grid_view", grid: "grid_view",
  List: "list", list: "list", Sliders: "tune",
  "shield-check": "verified_user", ShieldCheck: "verified_user",
  truck: "local_shipping", Truck: "local_shipping",
  filter: "filter_list", share: "share", eye: "visibility",
  "check-circle": "check_circle", feather: "edit",
  calendar: "calendar_today", tag: "label",
};

function kebabToPascal(str: string): string {
  return str.split("-").map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join("");
}

function resolveIcon(lucideName: string | undefined): string {
  if (!lucideName) return "help_outline";
  if (LUCIDE_TO_MATERIAL[lucideName]) return LUCIDE_TO_MATERIAL[lucideName];
  const pascal = kebabToPascal(lucideName);
  if (LUCIDE_TO_MATERIAL[pascal]) return LUCIDE_TO_MATERIAL[pascal];
  return "help_outline";
}

function getChildren(block: Record<string, unknown>): Record<string, unknown>[] {
  const props = (block.props || {}) as Record<string, unknown>;
  return (props.content as Record<string, unknown>[]) || (props.items as Record<string, unknown>[]) || (props.children as Record<string, unknown>[]) || [];
}

/**
 * Zone keys that read as a command rather than a slot. A merchant who writes
 * `zoneKey: "cancel-order"` means "cancel the order", but zones only open popups — so when the
 * slot turns out to be empty we name the `buttonAction` that does the real work.
 */
const ZONE_KEY_DIRECT_ACTION: Record<string, { buttonAction: string; intent: string }> = {
  "cancel-order": { buttonAction: "cancelOrder", intent: "cancel the order" },
  "download-invoice": { buttonAction: "downloadInvoice", intent: "open the invoice PDF" },
};

// ─── Aspect ratio map ────────────────────────────────────────────────────────
const ASPECT_RATIO_MAP: Record<string, number> = {
  square: 1, landscape: 16 / 9, portrait: 3 / 4, wide: 21 / 9, "16:9": 16 / 9, "4:3": 4 / 3, "1:1": 1,
};
function resolveAspectRatio(ratio: string | undefined): number | undefined {
  return ASPECT_RATIO_MAP[ratio || ""];
}

// ─── Button size → height ────────────────────────────────────────────────────
const BUTTON_SIZE_HEIGHT: Record<string, number> = { sm: 36, md: 48, lg: 56 };

// ─── Resolve tap action from button/link props ────────────────────────────────
function resolveTap(props: Record<string, unknown>, rootProps: Record<string, unknown>): Record<string, unknown> | undefined {
  const destType = (props.destinationType as string) || "";

  if (destType === "zone") {
    const zoneKey = (props.zoneKey as string) || "";
    const zoneAction = (props.zoneAction as string) || "open";
    if (zoneAction === "close") return { type: "closeBottomSheet" };
    if (_drawerZoneKeys.has(zoneKey)) return { type: "openDrawer" };
    const slotBlocks = _zoneSlots.get(zoneKey);
    if ((!slotBlocks || slotBlocks.length === 0) && (zoneKey === "login" || zoneKey === "site-drawer")) {
      return zoneKey === "login"
        ? { type: "navigate", route: "/auth/login", navigation_type: "push" }
        : { type: "openDrawer" };
    }
    if (slotBlocks && slotBlocks.length > 0) {
      _zoneSlotsUsed.add(zoneKey);
      const converted = slotBlocks.map((b) => transformBlock(b, rootProps)).filter(Boolean) as Record<string, unknown>[];
      const child = converted.length === 1
        ? converted[0]
        : {
            id: generateId("zone-sheet-col"),
            type: "column",
            props: flexProps("start", "stretch", { gap: 12 }),
            children: converted,
          };
      return { type: "openBottomSheet", child };
    }
    // Naming a zone after an operation does not perform it — the zone mechanism only opens
    // whatever blocks the merchant put in the slot. An empty one is a dead button, so point at
    // the buttonAction that would actually do the job.
    const directAction = ZONE_KEY_DIRECT_ACTION[zoneKey];
    addWarning(
      `Zone "${zoneKey}" has no slot content; zone tap omitted` +
        (directAction
          ? `. If the intent was to ${directAction.intent}, set the button's destinationType to ` +
            `"action" and buttonAction to "${directAction.buttonAction}" — a zone key is only a ` +
            `popup target, it does not dispatch anything`
          : "")
    );
    return undefined;
  }

  const action = destType === "action"
    ? ((props.buttonAction as string) || "")
    : ((props.buttonAction as string) || "link");

  if (action === "link" || destType === "link") {
    const link = props.link as Record<string, unknown> | undefined;
    if (link) {
      const kind = link.kind as string;
      if (kind === "page") {
        const route = (link.pageId as string) || (link.url as string);
        if (route) return { type: "navigate", route: normalizeRoute(route), navigation_type: "push" };
      }
      if (kind === "url") {
        const url = link.url as string;
        if (url) return { type: "openUrl", url };
      }
    }
    const href = (props.href as string) || "";
    if (href) {
      if (href.startsWith("http://") || href.startsWith("https://") || href.startsWith("www.")) {
        return { type: "openUrl", url: href };
      }
      return { type: "navigate", route: normalizeRoute(href), navigation_type: "push" };
    }
    return undefined;
  }

  const redirect = (props.submitRedirectUrl as string) || "";
  const onRedirect = redirect
    ? { type: "navigate", route: normalizeRoute(redirect), navigation_type: "go" }
    : undefined;

  switch (action) {
    case "login":
      // A `login` button inside a Section that also holds input fields submits step 1 of the OTP
      // flow (auth.requestOtp). On its own it is only a link to whatever page renders the fields.
      return _activeAuthForm
        ? buildAuthFormTap("login", _activeAuthForm, onRedirect)
        : { type: "navigate", route: "/auth/login", navigation_type: "push" };
    case "logout":
      return {
        type: "cubitCall", cubit: "auth", method: "logout",
        onSuccess: { type: "navigate", route: "/auth/login", navigation_type: "clear_stack" },
      };
    case "addToCart":
      return buildAddToCartTap();
    case "addToWishlist":
      return { type: "navigate", route: "/wishlist", navigation_type: "push" };
    case "makeOrder":
      // Cart "continue to checkout" must validate the cart and hand off — not submit the order.
      if (_currentRoute === "/cart") {
        return {
          type: "cubitCall",
          cubit: "cart",
          method: "assertNotEmpty",
          onSuccess: { type: "navigate", route: "/checkout", navigation_type: "push" },
        };
      }
      if (_currentRoute === "/checkout") {
        return {
          type: "cubitCall",
          cubit: "checkout",
          method: "placeOrder",
          onSuccess: { type: "navigate", route: "/order/success", navigation_type: "clear_stack" },
          onFailure: { type: "navigate", route: "/order/failure", navigation_type: "clear_stack" },
        };
      }
      addWarning(
        'ContentButton buttonAction "makeOrder" belongs on /cart (hand-off to checkout) or /checkout ' +
          "(place order); the button renders with no tap on this route"
      );
      return undefined;
    case "placeOrder":
      return {
        type: "cubitCall",
        cubit: "checkout",
        method: "placeOrder",
        onSuccess: { type: "navigate", route: "/order/success", navigation_type: "clear_stack" },
        onFailure: { type: "navigate", route: "/order/failure", navigation_type: "clear_stack" },
      };
    case "cartQtyIncrease":
      return {
        type: "cubitCall", cubit: "cart", method: "updateQuantity",
        params: {
          variantId: { source: "item", field: "variantId" },
          delta: { source: "value", value: 1 },
        },
      };
    case "cartQtyDecrease":
      return {
        type: "cubitCall", cubit: "cart", method: "updateQuantity",
        params: {
          variantId: { source: "item", field: "variantId" },
          delta: { source: "value", value: -1 },
        },
      };
    case "verifyOtp":
      if (_activeAuthForm) return buildAuthFormTap("verifyOtp", _activeAuthForm, onRedirect);
      addWarning(
        `ContentButton with buttonAction "verifyOtp" has no sibling "${OTP_FIELD_ID}" input; ` +
          `auth.verifyOtp reads the code out of the form store, so put the button in the same ` +
          `Section as a ContentInput named "${OTP_FIELD_ID}"`
      );
      return buildAuthFormTap(
        "verifyOtp",
        { formId: AUTH_ACTION_CONTRACT.verifyOtp.formId, fields: [OTP_FIELD_ID] },
        onRedirect
      );

    // ── Customer order actions ──────────────────────────────────────────────
    // `orderId` comes from the route, not the tapped item: both live on /orders/:orderId,
    // where the engine has already put `orderId` in `dataContext.routeParams`.
    case "downloadInvoice":
      if (!isOrderDetailRoute()) {
        addWarning(
          `ContentButton buttonAction "downloadInvoice" needs an order in scope; it only works on ` +
            `/orders/:orderId. On "${_currentRoute}" the button renders with no tap`
        );
        return undefined;
      }
      // `openInvoice` fetches the invoice then hands the PDF url to the OS — there is no
      // in-app viewer, so no onSuccess navigation to wire.
      return {
        type: "cubitCall",
        cubit: "order",
        method: "openInvoice",
        requireAuth: true,
        params: { orderId: { source: "routeParams", field: "orderId" } },
      };

    case "cancelOrder":
      if (!isOrderDetailRoute()) {
        addWarning(
          `ContentButton buttonAction "cancelOrder" needs an order in scope; it only works on ` +
            `/orders/:orderId. On "${_currentRoute}" the button renders with no tap`
        );
        return undefined;
      }
      return {
        type: "cubitCall",
        cubit: "order",
        method: "cancelOrder",
        requireAuth: true,
        params: { orderId: { source: "routeParams", field: "orderId" } },
        onSuccess: { type: "reloadRequest", requestKey: ORDER_DETAIL_REQUEST_KEY },
      };

    case "ordersPrevPage":
    case "ordersNextPage":
      // Deliberately unmapped. `setPageState` can only assign a literal — the engine has no
      // increment primitive — so a prev/next pager cannot compute `page ± 1` from config alone.
      // Emitting a `setPageState` to a fixed page would give a Next button that always jumps to
      // page 1 and a Prev that always jumps to page 0, which is worse than an obviously dead
      // button. The list already fetches `size=20`; add a delta op to PageStateStore (or a
      // `loadMore` on OrderCubit, which currently replaces rather than appends) to make this real.
      addWarning(
        `ContentButton buttonAction "${action}" is not supported: the mobile engine's setPageState ` +
          `assigns literal values only, so it cannot express "current page ± 1". The orders list ` +
          `loads the first ${ORDER_PAGE_SIZE} orders and the pager buttons render with no tap — ` +
          `drop them from the mobile-facing page until the engine grows a page-state delta action`
      );
      return undefined;

    case "submitReturn":
      // No engine surface at all: the Flutter app has no returns endpoint, model, or cubit
      // method (only `PaymentStatus.refunded` / `OrderStatus.refunded` as enum values). This
      // needs the backend first, then an OrderCubit method, then a mapping here.
      addWarning(
        `ContentButton buttonAction "submitReturn" has no engine equivalent: the mobile app has no ` +
          `returns API, model, or cubit method yet. The return-item switches and reason select on ` +
          `this Section are decorative — the button renders with no tap`
      );
      return undefined;

    // ── Customer account / address actions (BLOCKS.md § buttonAction values) ──
    // The account presets submit a draft held in web `customer` state. On mobile the equivalent
    // draft lives in FormStateStore, so these map onto the checkout cubit's address methods.
    case "createAddress":
      return {
        type: "cubitCall",
        cubit: "checkout",
        method: "saveAddress",
        requireValidForm: true,
        formId: CHECKOUT_ADDRESS_FORM_ID,
        params: WEB_ADDRESS_SAVE_PARAMS,
        ...(onRedirect ? { onSuccess: onRedirect } : {}),
      };
    case "deleteAddress":
      return { type: "cubitCall", cubit: "checkout", method: "deleteAddress", requireAuth: true };

    case "saveProfile":
    case "setDefaultAddress":
      // No engine cubit method exists for these yet. Emitting a wrong cubitCall would fail at
      // runtime with no signal, so emit nothing — but say so, loudly.
      addWarning(
        `ContentButton buttonAction "${action}" has no engine equivalent; the mobile engine has no ` +
          `cubit method for it. The button renders with no tap — remove it from the mobile-facing ` +
          `page or add the method to the engine's action map first`
      );
      return undefined;

    case "toggleLanguage":
      addWarning(
        `ContentButton buttonAction "toggleLanguage" is web-only; the mobile app picks its language ` +
          `from the app envelope, not a runtime toggle. Button emitted with no tap`
      );
      return undefined;

    default:
      // A silent `undefined` here shipped dead buttons that looked fine in the output.
      if (action && action !== "link") {
        addWarning(
          `Unknown buttonAction "${action}"; no tap emitted — the button renders and does nothing. ` +
            `Check it against the buttonAction table in BLOCKS.md`
        );
      }
      return undefined;
  }
}

/**
 * `cubitCall auth.<method>` that submits an auth form. The params are **the cubit's**, not the
 * form's: each one is emitted from AUTH_ACTION_CONTRACT, and a `source: "form"` param is skipped
 * when the form has no such field (an optional `fullName`, say). Fields the contract does not name
 * are never sent — checkAuthFormFields has already warned about them.
 */
function buildAuthFormTap(
  action: string,
  form: AuthForm,
  onRedirect: Record<string, unknown> | undefined
): Record<string, unknown> {
  const contract = AUTH_ACTION_CONTRACT[action];
  const params: Record<string, unknown> = {};
  for (const [name, spec] of Object.entries(contract.params)) {
    if (spec.source === "form" && !form.fields.includes(spec.field)) continue;
    if (spec.source === "app") _usedAppEnvelopeSource = true;
    params[name] = { source: spec.source, field: spec.field };
  }

  // Auth success always resets the stack — there is no "back" into a form the user already
  // submitted — so an authored redirect keeps its route but not its navigation_type.
  let onSuccess = contract.onSuccess as Record<string, unknown>;
  if (onRedirect && contract.allowRedirectOverride) {
    onSuccess = { ...onRedirect, navigation_type: "clear_stack" };
  } else if (onRedirect && onRedirect.route !== contract.onSuccess.route) {
    addWarning(
      `Auth "${action}" button sets submitRedirectUrl "${onRedirect.route}"; auth.${contract.method} ` +
        `only sends the code, so success navigates to "${contract.onSuccess.route}" instead — put the ` +
        `redirect on the verifyOtp button that finishes the flow`
    );
  }

  return {
    type: "cubitCall",
    cubit: "auth",
    method: contract.method,
    requireValidForm: true,
    formId: contract.formId,
    params,
    onSuccess,
  };
}

function resolveLayoutTap(props: Record<string, unknown>, rootProps: Record<string, unknown>): Record<string, unknown> | undefined {
  const link = props.link as Record<string, unknown> | undefined;
  if (link) {
    const kind = link.kind as string;
    if (kind === "page") {
      const route = (link.pageId as string) || (link.url as string);
      if (route) return { type: "navigate", route: normalizeRoute(route), navigation_type: "push" };
    }
    if (kind === "url") {
      const url = link.url as string;
      if (url) return { type: "openUrl", url };
    }
  }
  const href = (props.href as string) || "";
  if (href) {
    if (href.startsWith("http://") || href.startsWith("https://") || href.startsWith("www.")) {
      return { type: "openUrl", url: href };
    }
    return { type: "navigate", route: normalizeRoute(href), navigation_type: "push" };
  }
  return undefined;
}

/**
 * Web themes name the OTP screen freely (`/verify-otp`, `/otp`, …) but `AUTH_ACTION_CONTRACT.login`
 * hardcodes its hand-off to OTP_ROUTE, so a theme that named the page anything else shipped a
 * `navigate` to a route no page defined — the flow dead-ended after "send code". Aliasing the page
 * onto OTP_ROUTE also puts it in SYSTEM_EXCLUDE_ROUTES, keeping it out of the bottom tab bar.
 *
 * `/login` is aliased for the same reason: the engine only mounts the auth host (OTP spinner,
 * error toasts, rate-limit messages) on LOGIN_ROUTE, and a route is either a tab or
 * shell-excluded — never both — so a login page cannot also be a bottom tab.
 */
const AUTH_ROUTE_ALIASES: Record<string, string> = {
  "/verify-otp": OTP_ROUTE,
  "/verify": OTP_ROUTE,
  "/otp": OTP_ROUTE,
  "/login": LOGIN_ROUTE,
  "/signin": LOGIN_ROUTE,
  "/sign-in": LOGIN_ROUTE,
  "/log-in": LOGIN_ROUTE,
};

/**
 * Web routes are authored freely; the engine's router and action dispatcher key off a fixed set of
 * paths. These rewrites apply to the **mobile** output only — the web config keeps its own routes.
 *
 * Two separate defects are fixed here:
 *
 *  1. *Param syntax.* GoRouter and the dispatcher both match params with `:([A-Za-z0-9_]+)`, so
 *     `:product-slug` parses as the param `product` followed by the literal text `-slug`. The
 *     dispatcher then sees an unresolved `:param` in the path and **cancels the navigation with no
 *     error** — every product link on the site is a no-op.
 *  2. *Param names.* The dispatcher auto-fills `:productId`, `:categorySlug` and `:orderId` from
 *     the tapped item (preferring `item.slug`, then `item.id`). Any other name has to be supplied
 *     by the page, and nothing does.
 *
 * Order matters — first match wins.
 */
const MOBILE_ROUTE_REWRITES: { match: RegExp; route: string }[] = [
  { match: /^\/products?\/:[\w-]+\/?$/, route: "/product/details/:productId" },
  { match: /^\/product\/details\/:[\w-]+\/?$/, route: "/product/details/:productId" },
  { match: /^\/categories\/:[\w-]+\/products\/?$/, route: "/categories/:categorySlug/products" },
  { match: /^\/(?:categories|category)\/:[\w-]+\/?$/, route: "/categories/:categorySlug/products" },
  { match: /^\/orders?\/:[\w-]+\/?$/, route: "/orders/:orderId" },
];

/**
 * `:product-slug` → `:productSlug`, for any param the rewrite table did not already canonicalise.
 * Underscores are left alone — they are inside the engine's param charset.
 */
function camelCaseRouteParams(route: string): string {
  return route.replace(/:([A-Za-z0-9_-]+)/g, (_match, name: string) =>
    ":" + name.replace(/-+([a-zA-Z0-9])/g, (_s, c: string) => c.toUpperCase()).replace(/-/g, "")
  );
}

function normalizeRoute(route: string): string {
  if (route === "/" || route === "") return "/home";
  const aliased = AUTH_ROUTE_ALIASES[route];
  if (aliased) return aliased;
  for (const rewrite of MOBILE_ROUTE_REWRITES) {
    if (rewrite.match.test(route)) return rewrite.route;
  }
  return camelCaseRouteParams(route);
}

// ─── Apply layout cross-cutting (padding, margin, float) ─────────────────────
/**
 * A layout edge that actually asks for space, or `undefined` when it does not.
 *
 * The layout panel seeds every block with `defaultLayoutValue`, whose eight edges are all
 * `"0px"`. Testing those with plain truthiness (`if (pt)`) read "never touched" as "explicitly
 * set to zero", which cost us twice: it emitted a full zero box on every block carrying a layout
 * (the 477 no-op `padding`/`margin` props the mobile team counted in v45), and that box then
 * overwrote spacing the block had already computed for itself — see `mergeSpacingBox`.
 *
 * Zero is the absence of spacing, so it is the absence of a prop. The engine defaults an unset
 * edge to zero anyway, and the mobile team explicitly asked us to stop shipping zero boxes.
 */
function layoutEdgePx(raw: unknown): number | undefined {
  if (raw == null || raw === "") return undefined;
  const n = parsePx(raw as string);
  return Number.isFinite(n) && n !== 0 ? n : undefined;
}

/**
 * Fold layout-panel edges onto whatever spacing the node already carries.
 *
 * Blocks compute their own spacing before calling `applyLayout` — `transformSection` turns the
 * merchant's «المسافة من الجانبين / الأعلى / الأسفل» into a `padding` box. Spreading the panel's
 * box over the node's props replaced that object wholesale, so every Section holding a default
 * (all-zero) layout shipped `{0,0,0,0}` and the merchant's spacing never reached the app.
 *
 * Emitted as all four keys: `parseEdgeInsets` documents a bare number or the full
 * `left`/`top`/`right`/`bottom` set, and anything else falls back to zero on every side.
 * Returns `undefined` when the result is entirely zero so no dead prop is written.
 */
function mergeSpacingBox(
  existing: unknown,
  override: Record<string, number>
): Record<string, number> | undefined {
  const base =
    typeof existing === "number"
      ? { top: existing, right: existing, bottom: existing, left: existing }
      : isPlainRecord(existing)
        ? (existing as Record<string, number>)
        : {};
  const merged = { top: 0, right: 0, bottom: 0, left: 0, ...base, ...override };
  return Object.values(merged).some((v) => v !== 0) ? merged : undefined;
}

function applyLayout(
  node: Record<string, unknown>,
  layout: Record<string, unknown> | undefined,
  rootProps: Record<string, unknown>
): Record<string, unknown> {
  if (!layout) return node;

  const boxProps: Record<string, unknown> = {};
  const padding: Record<string, number> = {};
  const margin: Record<string, number> = {};

  // The `padding` shorthand is the pre-per-edge field, still read for migrated data.
  const pad = layoutEdgePx(layout.padding);
  if (pad !== undefined) {
    padding.top = pad; padding.bottom = pad; padding.left = pad; padding.right = pad;
  }
  const pt = layoutEdgePx(layout.paddingTop); if (pt !== undefined) padding.top = pt;
  const pr = layoutEdgePx(layout.paddingRight); if (pr !== undefined) padding.right = pr;
  const pb = layoutEdgePx(layout.paddingBottom); if (pb !== undefined) padding.bottom = pb;
  const pl = layoutEdgePx(layout.paddingLeft); if (pl !== undefined) padding.left = pl;

  const mt = layoutEdgePx(layout.marginTop); if (mt !== undefined) margin.top = mt;
  const mr = layoutEdgePx(layout.marginRight); if (mr !== undefined) margin.right = mr;
  const mb = layoutEdgePx(layout.marginBottom); if (mb !== undefined) margin.bottom = mb;
  const ml = layoutEdgePx(layout.marginLeft); if (ml !== undefined) margin.left = ml;

  // No renderer allowlist: `component_spacing.dart` now wraps any node whose renderer does not
  // consume `padding`/`margin` itself, so both are honoured on every component type.
  const nodeProps = (node.props || {}) as Record<string, unknown>;
  if (Object.keys(padding).length > 0) {
    const merged = mergeSpacingBox(nodeProps.padding, padding);
    if (merged) boxProps.padding = merged;
  }
  if (Object.keys(margin).length > 0) {
    const merged = mergeSpacingBox(nodeProps.margin, margin);
    if (merged) boxProps.margin = merged;
  }

  if (Object.keys(boxProps).length > 0) {
    node = { ...node, props: { ...nodeProps, ...boxProps } };
  }

  const posMode = layout.positionMode as string;
  if (posMode === "float") {
    const preset = (layout.floatPreset as string) || "top-left";
    const anchorMap: Record<string, Record<string, number>> = {
      "top-left": { stackTop: 0, stackLeft: 0 },
      "top-middle": { stackTop: 0 },
      "top-right": { stackTop: 0, stackRight: 0 },
      "middle-left": { stackLeft: 0 },
      "middle-right": { stackRight: 0 },
      "bottom-left": { stackBottom: 0, stackLeft: 0 },
      "bottom-middle": { stackBottom: 0 },
      "bottom-right": { stackBottom: 0, stackRight: 0 },
    };
    const stacked = {
      ...node,
      props: { ...((node.props || {}) as Record<string, unknown>), stackLayer: "positioned", ...(anchorMap[preset] || {}) },
    };
    if (margin.top) (stacked.props as Record<string, unknown>).stackTop = margin.top;
    if (margin.right) (stacked.props as Record<string, unknown>).stackRight = margin.right;

    return {
      id: generateId("stack-wrapper"),
      type: "stack",
      // Unset `fit` defaults to Flutter's `StackFit.loose` — the same broken layout STACK_FIT
      // exists to avoid on the other two stacks this converter emits.
      props: { fit: STACK_FIT },
      children: [stacked],
    };
  }

  return node;
}

// ─── Content Block Transformers ──────────────────────────────────────────────

function transformText(block: Record<string, unknown>, rootProps: Record<string, unknown>): Record<string, unknown> {
  const props = (block.props || {}) as Record<string, unknown>;
  const dir = (rootProps.direction as string) || "rtl";
  // `ContentParagraph.text` is a BilingualString (BLOCKS.md § BILINGUAL_PROPS). Reading it as a
  // raw string threw `text.replace is not a function` on every bilingual theme.
  const text = bilingualProp(props.text, rootProps);
  const isRich = /<[a-z][\s\S]*>/i.test(text);
  const type = isRich ? "richtext" : "text";

  const fontSize = props.fontSize
    ? resolveThemeFontSize(props.fontSize as string, rootProps, 16)
    : resolveFontSize(props.size as string, 16);

  const node: Record<string, unknown> = {
    id: generateId("text"),
    type,
    props: {
      value: isRich ? text : text.replace(/<[^>]*>/g, ""),
      fontSize,
      textAlign: (props.textAlign as string) || (props.align as string) || (dir === "rtl" ? "right" : "left"),
    },
  };

  const fontWeight = resolveThemeFontWeight(props.fontWeight as string);
  if (fontWeight) (node.props as Record<string, unknown>).fontWeight = fontWeight;

  const textColor = resolveThemeColor(props.color as string, rootProps)
    || resolveTextColor(props.color as string);
  if (textColor) (node.props as Record<string, unknown>).color = textColor;

  const maxLines =
    typeof props.maxLines === "number" && props.maxLines > 0 ? props.maxLines : gridCellMaxLines(props);
  if (maxLines) {
    (node.props as Record<string, unknown>).maxLines = maxLines;
    (node.props as Record<string, unknown>).overflow = "ellipsis";
  }

  if (_bindingScope) applyValueContext(props, node.props as Record<string, unknown>, "text");

  return applyLayout(node, props.layout as Record<string, unknown> | undefined, rootProps);
}

function transformHeading(block: Record<string, unknown>, rootProps: Record<string, unknown>): Record<string, unknown> {
  const props = (block.props || {}) as Record<string, unknown>;
  const lang = (rootProps.language as string) || "ar";
  const dir = (rootProps.direction as string) || "rtl";
  const levelRaw = (props.level as string) || "2";
  const levelNum = levelRaw.startsWith("h")
    ? parseInt(levelRaw.replace("h", ""), 10)
    : parseInt(levelRaw, 10) || 2;
  const sizeMap: Record<number, number> = { 1: 28, 2: 22, 3: 18, 4: 16 };
  const levelSize = resolveFontSize(props.size as string, sizeMap[levelNum] || 22);
  // ContentHeading carries `fontSize` as a theme token; legacy Heading carries `size`.
  const rawFontSize = props.fontSize
    ? resolveThemeFontSize(props.fontSize as string, rootProps, levelSize)
    : levelSize;
  // `theme-xxl`/`h1` desktop headings resolve to 28px, which wraps Arabic copy onto 3 lines at a
  // 360px width — 22-24 is the ceiling the mobile team measured as still fitting 2 lines.
  const fontSize = Math.min(rawFontSize, MOBILE_HEADING_MAX_FONT_SIZE);

  const node: Record<string, unknown> = {
    id: generateId("heading"),
    type: "text",
    props: {
      value: resolveBilingual(props.text as string, props.textAr as string, lang),
      fontSize,
      fontWeight: resolveThemeFontWeight(props.fontWeight as string) || (levelNum <= 2 ? "bold" : "w600"),
      textAlign: (props.align as string) || (props.textAlign as string) || (dir === "rtl" ? "right" : "left"),
    },
  };

  const color = resolveColor(props.colorMode as string, props.colorTheme as string, props.colorFixed as string, rootProps)
    || resolveThemeColor(props.color as string, rootProps);
  if (color) (node.props as Record<string, unknown>).color = color;

  const maxLines =
    typeof props.maxLines === "number" && props.maxLines > 0 ? props.maxLines : gridCellMaxLines(props);
  if (maxLines) {
    (node.props as Record<string, unknown>).maxLines = maxLines;
    (node.props as Record<string, unknown>).overflow = "ellipsis";
  }

  if (_bindingScope) applyValueContext(props, node.props as Record<string, unknown>, "text");

  return applyLayout(node, props.layout as Record<string, unknown> | undefined, rootProps);
}

function transformSpace(block: Record<string, unknown>, rootProps: Record<string, unknown>): Record<string, unknown> {
  const props = (block.props || {}) as Record<string, unknown>;
  const size = resolveThemePx(props.size as string | number, rootProps, 16);
  const dir = (props.direction as string) || "vertical";

  const node: Record<string, unknown> = {
    id: generateId("spacer"),
    type: "sizedBox",
    props: dir === "vertical" ? { height: size } : { width: size },
  };
  return applyLayout(node, props.layout as Record<string, unknown> | undefined, rootProps);
}

/** Returns `null` when the button is hoisted into the page-level sticky footer (makeOrder). */
function transformButton(block: Record<string, unknown>, rootProps: Record<string, unknown>): Record<string, unknown> | null {
  const props = (block.props || {}) as Record<string, unknown>;
  const lang = (rootProps.language as string) || "ar";
  const label = resolveBilingual(props.label as string, props.labelAr as string, lang);
  const isFixedMode = (props.buttonVariantMode as string) === "fixed";
  const size = resolveButtonSizeToken(
    (props.size as string)
      || (isFixedMode ? (props.buttonSize as string) : (props.buttonVariantSize as string))
  );
  const fullWidth = (props.fullWidth as string) === "on" || props.fullWidth === true
    || (props.submitWidth as string) === "full";

  const variant = resolveButtonVariant((props.variant as string) || (props.buttonVariant as string));
  const outProps: Record<string, unknown> = { label, variant };
  if (size !== "md") outProps.height = BUTTON_SIZE_HEIGHT[size] || 48;

  // Fixed mode overrides the theme variant colours. The authored colour lands on the prop the
  // renderer actually reads for this variant — see buttonColorProp.
  const btnColor = resolveColor(props.colorMode as string, props.colorTheme as string, props.colorFixed as string, rootProps)
    || (isFixedMode ? resolveThemeColor(props.bgColor as string, rootProps) : undefined);
  if (btnColor) outProps[buttonColorProp(variant)] = btnColor;
  // An explicitly authored label colour wins over the variant-derived placement above — except
  // white on outlined/text, which buttonColorProp also routes into the border. Dropping it lets
  // the button fall back to theme.colors.primary instead of rendering invisible (see isWhiteHex).
  const btnTextColor = resolveThemeColor(props.textColor as string, rootProps);
  if (btnTextColor && !(buttonColorProp(variant) === "textColor" && isWhiteHex(btnTextColor))) {
    outProps.textColor = btnTextColor;
  }
  if (fullWidth) outProps.fullWidth = true;

  const tap = resolveTap(props, rootProps);

  // A link to a contact URI is a `contactButton`, not a `button` + `openUrl` (§6.5b).
  if (tap?.type === "openUrl") {
    const contact = parseContactUri(tap.url as string);
    if (contact) {
      return applyLayout(
        buildContactButton(label, contact, props, rootProps),
        props.layout as Record<string, unknown> | undefined,
        rootProps
      );
    }
  }

  const tapCubit = tap?.type === "cubitCall" ? (tap as Record<string, unknown>).cubit : undefined;
  const tapMethod = tap?.type === "cubitCall" ? (tap as Record<string, unknown>).method : undefined;
  if ((tapCubit === "checkout" && tapMethod === "placeOrder")
    || (tapCubit === "cart" && tapMethod === "assertNotEmpty")) {
    _pageStickyFooter = {
      id: generateId("sticky-footer"),
      type: "container",
      props: { color: "#FFFFFF", shadow: "md", padding: { top: 12, bottom: 12, left: 16, right: 16 } },
      child: {
        id: generateId("sticky-footer-btn"),
        type: "button",
        props: { ...outProps },
        tap,
      },
    };
    return null;
  }

  const node: Record<string, unknown> = {
    id: generateId("button"),
    type: "button",
    props: outProps,
  };
  if (tap) node.tap = tap;

  if (_bindingScope) applyValueContext(props, node.props as Record<string, unknown>, "button");

  return applyLayout(node, props.layout as Record<string, unknown> | undefined, rootProps);
}

function transformLink(block: Record<string, unknown>, rootProps: Record<string, unknown>): Record<string, unknown> {
  const props = (block.props || {}) as Record<string, unknown>;
  const lang = (rootProps.language as string) || "ar";
  // ContentLink stores its text in `title` (a BilingualString); the legacy Link block uses
  // `label` / `labelAr`.
  const label = pickLang(props.title, lang) || resolveBilingual(props.label as string, props.labelAr as string, lang);

  const outProps: Record<string, unknown> = { label, variant: "text" };

  // `type: "button"` is the engine node this converts to — its renderer reads
  // `backgroundColor` / `foregroundColor` / `textColor`, never a bare `color`. A `variant: "text"`
  // button has no background, so the authored colour is the label colour.
  const color = resolveThemeColor(props.color as string, rootProps);
  if (color) outProps.textColor = color;

  const icon = props.icon as string;
  if (icon && icon !== "none") {
    addWarning(`ContentLink icon "${icon}" dropped; the engine \`button\` has no icon prop`);
  }

  const tap = resolveLayoutTap(props, rootProps);

  if (tap?.type === "openUrl") {
    const contact = parseContactUri(tap.url as string);
    if (contact) {
      return applyLayout(
        buildContactButton(label, contact, props, rootProps),
        props.layout as Record<string, unknown> | undefined,
        rootProps
      );
    }
  }

  const node: Record<string, unknown> = { id: generateId("link"), type: "button", props: outProps };
  if (tap) node.tap = tap;

  return applyLayout(node, props.layout as Record<string, unknown> | undefined, rootProps);
}

// ─── Form input blocks ───────────────────────────────────────────────────────

const INPUT_KEYBOARD_MAP: Record<string, string> = {
  email: "email",
  tel: "phone",
  number: "number",
  text: "text",
  search: "text",
  password: "text",
};

/** Digit count of the engine's OTP boxes. The backend issues six-digit codes. */
const OTP_LENGTH = 6;

/**
 * The engine binds the code by the exact field id `otpCode`, but merchants name the input freely
 * (`otp`, `otp-code`, `otpcode`…). Treating only the exact spelling as OTP shipped a plain text
 * field while `auth.verifyOtp` still read `otpCode` — the code was never submitted and login
 * always failed. Accept the unambiguous spellings and normalise to the contract's id.
 *
 * Deliberately narrow: a bare `code` is **not** included. It is too generic to claim (a discount
 * code is also a "code"), and the credential-contract check is expected to flag it instead.
 */
const OTP_FIELD_ALIASES = new Set(["otpcode", "otp"]);

function isOtpFieldName(fieldId: string): boolean {
  return OTP_FIELD_ALIASES.has(fieldId.toLowerCase().replace(/[-_\s]/g, ""));
}

/**
 * A `ContentInput` named `otpCode` is the OTP step, not a text field: the engine ships a dedicated
 * `otpInput` (one box per digit) whose `fieldId` is what `auth.verifyOtp` reads out of
 * `FormStateStore`. There is no `inputType: "otp"` on the web side — the field **name** is the
 * signal. See docs/engine/builder-specs/16-app-drawer-tabs-otp.md § 3.
 */
function buildOtpInput(): Record<string, unknown> {
  return {
    id: generateId("otp"),
    type: "otpInput",
    props: {
      fieldId: OTP_FIELD_ID,
      length: OTP_LENGTH,
      // Sized for a 320px screen: 6 boxes at the engine's 48px default overflow once nested
      // paddings eat into the row. 36 (v45 fix) still overflowed by 9px on a bare 320px row —
      // 6 * 36 + 5 * 5 = 241 against 232 available. 32 is the v50 mobile-team measurement.
      boxWidth: 32,
      boxHeight: 52,
      gap: 5,
      autofocus: true,
      validateRequired: true,
      validateMinLength: OTP_LENGTH,
      validateMaxLength: OTP_LENGTH,
    },
  };
}

function transformInput(block: Record<string, unknown>, rootProps: Record<string, unknown>): Record<string, unknown> {
  const props = (block.props || {}) as Record<string, unknown>;
  const dir = (rootProps.direction as string) || "rtl";
  const fieldId = (props.name as string) || (props.id as string) || "field";
  const inputType = (props.inputType as string) || "text";

  if (isOtpFieldName(fieldId)) {
    if (fieldId !== OTP_FIELD_ID) {
      addWarning(
        `ContentInput "${fieldId}" is treated as the OTP field and emitted as an otpInput with ` +
          `fieldId "${OTP_FIELD_ID}" — auth.verifyOtp only reads "${OTP_FIELD_ID}" from the form ` +
          `store. Rename it to "${OTP_FIELD_ID}" on the web side to make this explicit`
      );
    }
    return applyLayout(buildOtpInput(), props.layout as Record<string, unknown> | undefined, rootProps);
  }
  // Credentials and contact identifiers are always Latin-keyed, even in an RTL app.
  const isLtrField = inputType === "email" || inputType === "tel" || inputType === "password";

  const outProps: Record<string, unknown> = {
    id: fieldId,
    label: bilingualProp(props.label, rootProps),
    hint: bilingualProp(props.placeholder, rootProps),
    textDirection: isLtrField ? "ltr" : dir === "rtl" ? "rtl" : "ltr",
  };

  const keyboardType = INPUT_KEYBOARD_MAP[inputType];
  if (keyboardType && keyboardType !== "text") outProps.keyboardType = keyboardType;
  if (inputType === "password") outProps.obscureText = true;
  if (inputType === "email") outProps.validateEmail = true;
  if (inputType === "tel") outProps.validatePhone = true;
  if (props.required === true) outProps.validateRequired = true;
  if ((props.prependIcon as string) === "search") outProps.prefixIcon = "search";

  if ((props.inputAction as string) === "search_products") {
    addWarning(
      `ContentInput "${fieldId}" uses inputAction "search_products"; the mobile field is emitted without wiring — connect it to the search cubit manually`
    );
  }

  const node: Record<string, unknown> = { id: generateId("input"), type: "textFormField", props: outProps };
  return applyLayout(node, props.layout as Record<string, unknown> | undefined, rootProps);
}

function transformSwitch(block: Record<string, unknown>, rootProps: Record<string, unknown>): Record<string, unknown> {
  const props = (block.props || {}) as Record<string, unknown>;
  const fieldId = (props.name as string) || (props.id as string) || "switch";

  const outProps: Record<string, unknown> = {
    id: fieldId,
    label: bilingualProp(props.label, rootProps),
    activeColor: (rootProps.primary as string) || "#1D4ED8",
  };

  // `switchField` stores "true" / "false" strings in FormStateStore.
  if (props.defaultChecked === true) outProps.value = "true";

  const switchAction = (props.switchAction as string) || "";
  if (switchAction) {
    addWarning(
      `ContentSwitch "${fieldId}" uses switchAction "${switchAction}"; the mobile field is emitted as a plain switchField without store wiring — connect it manually`
    );
  }
  // `helperText` and `labelPosition` have no engine equivalent on switchField.
  if (props.helperText) {
    addWarning(`ContentSwitch "${fieldId}" helperText dropped; the engine switchField has no helper-text prop`);
  }

  const node: Record<string, unknown> = { id: generateId("switch"), type: "switchField", props: outProps };
  return applyLayout(node, props.layout as Record<string, unknown> | undefined, rootProps);
}

/** The request key `transformProductGrid` gives every catalog grid — what a category tab reloads. */
const PRODUCT_LIST_REQUEST_KEY = "product-list";
const CATEGORY_TREE_REQUEST_KEY = "category-tree";

/**
 * `ButtonGroup bindingMode: "categories"` → the engine's live category filter: a `tabs` node whose
 * items come from the public category tree, writing the selection into `PageStateStore` and
 * reloading the page's product grid. The web block reads the same filter out of
 * `StoreContext.productsPage`, so the two stay behaviourally equivalent.
 *
 * The grid it reloads is the converter's own catalog grid (`requestKey: "product-list"`), whose
 * `requestUrl` binds `:categorySlug` from the same page-state key.
 */
function buildCategoryTabs(
  props: Record<string, unknown>,
  rootProps: Record<string, unknown>,
  gap: number,
  activeColor: string | undefined,
  inactiveColor: string | undefined
): Record<string, unknown> {
  const lang = (rootProps.language as string) || "ar";
  const prependAll = props.prependAllButton !== false;
  const allTitle = resolveBilingual(props.allButtonTitle as string, props.allButtonTitleAr as string, lang) || "الكل";

  const tabProps: Record<string, unknown> = {
    selectedIndexPath: "pageState.filterTabIndex",
    itemsPath: `dataContext.requests.${CATEGORY_TREE_REQUEST_KEY}.data`,
    itemLabelPath: "name",
    itemValuePath: "slug",
    spacing: gap,
    runSpacing: 6,
  };
  if (activeColor) tabProps.activeColor = activeColor;
  if (inactiveColor) tabProps.inactiveColor = inactiveColor;

  return {
    id: generateId("category-tabs"),
    type: "tabs",
    props: tabProps,
    data: {
      requestKey: CATEGORY_TREE_REQUEST_KEY,
      requestUrl: "/api/v1/public/categories",
      ...(prependAll ? { staticItems: [{ title: allTitle, index: 0, slug: "" }] } : {}),
    },
    tap: {
      type: "setPageState",
      values: {
        filterTabIndex: { source: "tap", field: "index" },
        selectedCategorySlug: { source: "tap", field: "slug" },
      },
      onSuccess: { type: "reloadRequest", requestKey: PRODUCT_LIST_REQUEST_KEY },
    },
  };
}

function transformButtonGroup(block: Record<string, unknown>, rootProps: Record<string, unknown>): Record<string, unknown> | null {
  const props = (block.props || {}) as Record<string, unknown>;
  const bindingMode = (props.bindingMode as string) || "static";
  const activeStyle = (props.activeStyle as Record<string, unknown>) || {};
  const inactiveStyle = (props.inactiveStyle as Record<string, unknown>) || {};
  const gap = resolveThemePx(props.gap as string, rootProps, 8);
  const activeColor = resolveThemeColor(activeStyle.bgColor as string, rootProps);
  const inactiveColor = resolveThemeColor(inactiveStyle.textColor as string, rootProps);

  if (bindingMode === "categories") {
    return applyLayout(buildCategoryTabs(props, rootProps, gap, activeColor, inactiveColor), props.layout as Record<string, unknown> | undefined, rootProps);
  }

  if (bindingMode !== "static") {
    addWarning(
      `ButtonGroup bindingMode "${bindingMode}" builds its items from runtime store data; no static mobile equivalent. Wire pagination manually.`
    );
    return noteUnsupportedBlock(`ButtonGroup (bindingMode: ${bindingMode})`);
  }

  const items = (props.items as Record<string, unknown>[]) || [];
  if (items.length === 0) return null;

  const selected = props.defaultSelectedValue as string;
  const alignMap: Record<string, string> = { left: "start", center: "center", right: "end" };

  // Items with no destination are a pure single-choice control — the engine tracks that state in a
  // `radioGroup` (§6.30 / §11 "radio-style single-choice blocks → radioGroup, not a column of
  // buttons"). Only when the items navigate does the row of buttons below stay the right shape.
  const hasDestination = items.some((item) => resolveTap(item, rootProps) !== undefined);
  if (!hasDestination) {
    const fieldId = (props.name as string) || (props.id as string) || "selection";
    const outProps: Record<string, unknown> = {
      id: fieldId,
      layout: "chips",
      gap,
      data: {
        items: items.map((item) => ({
          label: bilingualProp(item.title, rootProps),
          value: (item.value as string) || "",
        })),
      },
    };
    if (selected) outProps.value = selected;
    if (activeColor) {
      outProps.activeColor = activeColor;
      outProps.selectedBorderColor = activeColor;
    }
    const inactiveBg = resolveThemeColor(inactiveStyle.bgColor as string, rootProps);
    if (inactiveBg) outProps.color = inactiveBg;
    const radius = (activeStyle.radius as string) || (inactiveStyle.radius as string);
    if (radius) outProps.borderRadius = resolveThemePx(radius, rootProps, 8);

    const node: Record<string, unknown> = { id: generateId("button-group"), type: "radioGroup", props: outProps };
    return applyLayout(node, props.layout as Record<string, unknown> | undefined, rootProps);
  }

  addWarning(
    "ButtonGroup selection state is not tracked on mobile; converted to a row of buttons with the default item styled as active"
  );

  const children = items.map((item) => {
    const isActive = (item.value as string) === selected;
    const style = isActive ? activeStyle : inactiveStyle;
    const outProps: Record<string, unknown> = {
      label: bilingualProp(item.title, rootProps),
      variant: isActive ? "filled" : "outlined",
    };
    const bg = resolveThemeColor(style.bgColor as string, rootProps);
    if (bg) outProps.color = bg;
    const size = resolveButtonSizeToken(style.buttonSize as string);
    if (size !== "md") outProps.height = BUTTON_SIZE_HEIGHT[size];

    const tap = resolveTap(item, rootProps);
    return {
      id: generateId("btn-group-item"),
      type: "button",
      props: outProps,
      ...(tap ? { tap } : {}),
    };
  });

  const node: Record<string, unknown> = {
    id: generateId("button-group"),
    type: "row",
    props: flexProps(alignMap[(props.align as string) || "center"] || "center", "center", { gap }),
    children,
  };
  return applyLayout(node, props.layout as Record<string, unknown> | undefined, rootProps);
}

/**
 * `ContentMap` is a Leaflet pin picker on the web (BLOCKS.md § ContentMap). The mobile engine has
 * no inline map widget — it opens the native picker through `checkout.pickAddressLocation`, which
 * writes the same latitude/longitude the web block writes to `customer.addressDraft`. So the
 * closest faithful conversion is the button that launches it, not a dropped node.
 *
 * A static map (`mapAction: ""`) has nothing to launch and no engine equivalent at all.
 */
function transformContentMap(block: Record<string, unknown>, rootProps: Record<string, unknown>): Record<string, unknown> | null {
  const props = (block.props || {}) as Record<string, unknown>;
  const lang = (rootProps.language as string) || "ar";
  const mapAction = (props.mapAction as string) || "";

  if (mapAction !== "address_draft_location") {
    addWarning(
      "ContentMap with no mapAction is a static display map; the mobile engine has no map widget " +
        "and nothing to launch — block skipped"
    );
    return null;
  }

  addWarning(
    'ContentMap converted to a "pick location" button (cubit checkout.pickAddressLocation); the ' +
      "mobile engine opens the native map picker instead of rendering an inline map"
  );

  const node: Record<string, unknown> = {
    id: generateId("map-picker"),
    type: "button",
    props: {
      label: lang === "ar" ? "تحديد الموقع على الخريطة" : "Pick location on map",
      variant: "outlined",
      fullWidth: true,
      icon: "location_on",
      iconPosition: "leading",
    },
    tap: { type: "cubitCall", cubit: "checkout", method: "pickAddressLocation" },
  };
  return applyLayout(node, props.layout as Record<string, unknown> | undefined, rootProps);
}

/**
 * Two different blocks share the `Chip` type.
 *
 * With `listValueContext` it is a chip *list* over a runtime array (`product.tags`), which the
 * engine cannot express — no chip-list primitive — so it is dropped.
 *
 * With a scalar `valueContext` it is a **status badge** (`order.orderStatus` + `enumMap`), which
 * is just a pill-shaped text node. Dropping those was why order status never appeared on the
 * converted orders screens even though the field was bound.
 */
function transformChip(
  block: Record<string, unknown>,
  rootProps: Record<string, unknown>
): Record<string, unknown> | null {
  const props = (block.props || {}) as Record<string, unknown>;
  const scalarPath = getValueContextPath(props);

  if (scalarPath && _bindingScope && valueContextMapFor(_bindingScope)[scalarPath]) {
    const size = (props.size as string) || "sm";
    const fontSize = size === "sm" ? 12 : size === "lg" ? 16 : 14;
    const label: Record<string, unknown> = {
      id: generateId("chip-label"),
      type: "text",
      props: { fontSize, fontWeight: "bold" },
    };
    applyValueContext(props, label.props as Record<string, unknown>, "text");

    const fg = resolveThemeColor(props.textColor as string, rootProps);
    const bg = resolveThemeColor(props.bgColor as string, rootProps);
    if (fg) (label.props as Record<string, unknown>).color = fg;

    // `enumMap` names a web-side label dictionary (orderStatus → "تم الشحن"). The engine has no
    // such lookup, but for order status it does not need one: `_enrichOrderJson` already ships
    // `orderStatusLabel`, which is what ORDER_*_VALUE_CONTEXT_MAP points `order.orderStatus` at.
    // Anything else lands on the raw wire enum, so say so.
    const enumMap = props.enumMap as string | undefined;
    if (enumMap && enumMap !== "orderStatus") {
      addWarning(
        `Chip enumMap "${enumMap}" has no mobile equivalent; the engine has no enum-label ` +
          `dictionary, so "${scalarPath}" renders the raw uppercase wire value. Only orderStatus ` +
          `is pre-labelled (the engine derives orderStatusLabel server-side) — either add a ` +
          `matching *Label field to the API response or accept the wire value on mobile`
      );
    }

    const node: Record<string, unknown> = {
      id: generateId("chip-badge"),
      type: "container",
      props: {
        padding: { left: 8, right: 8, top: 4, bottom: 4 },
        borderRadius: 9999,
        ...(bg ? { color: bg } : {}),
      },
      child: label,
    };
    return applyLayout(node, props.layout as Record<string, unknown> | undefined, rootProps);
  }

  const listPath = ((props.listValueContext as Record<string, unknown>)?.path as string) || "";
  if (listPath) {
    addWarning(
      `Chip renders a runtime array from "${listPath}"; the engine has no chip-list primitive and the path is not in the valueContext map — block skipped`
    );
    return null;
  }

  addWarning(
    scalarPath
      ? `Chip bound to "${scalarPath}" was skipped: that path has no mobile field mapping in the ` +
          `scope it sits in, so the badge would render blank`
      : `Chip has neither a bound value nor a list source; block skipped`
  );
  return null;
}

function transformCartQuantity(block: Record<string, unknown>, rootProps: Record<string, unknown>): Record<string, unknown> {
  const props = (block.props || {}) as Record<string, unknown>;
  const alignMap: Record<string, string> = { left: "start", center: "center", right: "end" };
  const qtyAction = (delta: number) => ({
    type: "cubitCall",
    cubit: "cart",
    method: "updateQuantity",
    params: {
      variantId: { source: "item", field: "variantId" },
      delta: { source: "value", value: delta },
    },
  });

  const node: Record<string, unknown> = {
    id: generateId("cart-qty"),
    type: "row",
    props: flexProps(alignMap[(props.align as string) || "right"] || "end", "center", { gap: 8 }),
    children: [
      { id: generateId("cart-qty-dec"), type: "button", props: { label: "−", height: 36, variant: "outlined" }, tap: qtyAction(-1) },
      { id: generateId("cart-qty-val"), type: "text", props: { valuePath: "item.quantity", fontSize: 14, textAlign: "center" } },
      { id: generateId("cart-qty-inc"), type: "button", props: { label: "+", height: 36, variant: "outlined" }, tap: qtyAction(1) },
    ],
  };
  return applyLayout(node, props.layout as Record<string, unknown> | undefined, rootProps);
}

function transformProductGallery(block: Record<string, unknown>, rootProps: Record<string, unknown>): Record<string, unknown> {
  const props = (block.props || {}) as Record<string, unknown>;
  const aspect = resolveAspectRatio((props.aspectRatio as string) || "square") ?? 1.0;
  const radius = resolveThemePx((props.radius as string) || "theme-md", rootProps, 12);

  addWarning(
    "ProductImageCarousel thumbnail strip has no engine equivalent; converted to the bound main image only"
  );

  const outProps: Record<string, unknown> = {
    source: "network",
    fit: "cover",
    aspectRatio: aspect,
    borderRadius: radius,
  };
  if (_bindingScope) {
    const imageField = _bindingScope.kind === "cart" ? "thumbnailUrl" : "primaryImageUrl";
    outProps.urlPath = `${_bindingScope.base}.${imageField}`;
  } else outProps.url = (props.placeholderSrc as string) || "";

  const node: Record<string, unknown> = { id: generateId("product-gallery"), type: "image", props: outProps };
  return applyLayout(node, props.layout as Record<string, unknown> | undefined, rootProps);
}

function transformIcon(block: Record<string, unknown>, rootProps: Record<string, unknown>): Record<string, unknown> {
  const props = (block.props || {}) as Record<string, unknown>;
  const iconName = resolveIcon((props.icon as string) || (props.name as string));
  const size = parsePx(props.size as string, 24);

  const outProps: Record<string, unknown> = { name: iconName, size };

  const color = resolveColor(props.colorMode as string, props.colorTheme as string, props.colorFixed as string, rootProps);
  if (color) outProps.color = color;

  const node: Record<string, unknown> = { id: generateId("icon"), type: "icon", props: outProps };
  return applyLayout(node, props.layout as Record<string, unknown> | undefined, rootProps);
}

function transformImage(block: Record<string, unknown>, rootProps: Record<string, unknown>): Record<string, unknown> {
  const props = (block.props || {}) as Record<string, unknown>;
  const wRaw = props.width ?? props.maxWidth ?? "100%";
  const w = String(wRaw);
  const hRaw = props.height ?? "auto";
  const h = String(hRaw);
  const aspect = resolveAspectRatio(props.aspectRatio as string);

  const outProps: Record<string, unknown> = {
    url: (props.src as string) || "",
    source: "network",
    semanticsLabel: bilingualProp(props.alt, rootProps),
    fit: (props.objectFit as string) || "cover",
  };
  const wNum = w !== "100%" && !w.includes("auto") ? parsePx(w) : undefined;
  const hNum = h !== "auto" ? parsePx(h) : undefined;
  if (aspect !== undefined) outProps.aspectRatio = aspect;
  else if (wNum && hNum && hNum > 0) outProps.aspectRatio = wNum / hNum;

  const radiusToken = (props.radius as string) || (props.borderRadius as string);
  if (radiusToken) {
    outProps.borderRadius = radiusToken.startsWith("theme-")
      ? resolveThemePx(radiusToken, rootProps, 12)
      : radiusToken;
  }

  if (w !== "100%" && !w.includes("auto")) outProps.width = parsePx(w);
  if (h !== "auto") outProps.height = parsePx(h);

  if (_bindingScope) applyValueContext(props, outProps, "image");

  const node: Record<string, unknown> = { id: generateId("image"), type: "image", props: outProps };
  return applyLayout(node, props.layout as Record<string, unknown> | undefined, rootProps);
}

function transformVideo(block: Record<string, unknown>, rootProps: Record<string, unknown>): Record<string, unknown> {
  const props = (block.props || {}) as Record<string, unknown>;
  const aspect = resolveAspectRatio(props.aspectRatio as string);

  const outProps: Record<string, unknown> = {
    url: (props.src as string) || "",
    showControls: (props.controls as string) !== "off",
    autoplay: (props.autoPlay as string) === "on",
  };
  if (props.poster) outProps.poster = props.poster;
  if (props.borderRadius) outProps.borderRadius = props.borderRadius;

  let node: Record<string, unknown> = { id: generateId("video"), type: "videoPlayer", props: outProps };

  if (aspect !== undefined) {
    node = {
      id: generateId("video-wrapper"),
      type: "container",
      props: { aspectRatio: aspect },
      child: node,
    };
  }

  return applyLayout(node, props.layout as Record<string, unknown> | undefined, rootProps);
}

function transformYouTube(block: Record<string, unknown>, rootProps: Record<string, unknown>): Record<string, unknown> {
  const props = (block.props || {}) as Record<string, unknown>;
  const rawUrl = (props.url as string) || (props.src as string) || "";
  const videoId = extractYouTubeVideoId(rawUrl);
  const aspect = resolveAspectRatio((props.aspectRatio as string) || "16:9") ?? 1.777;

  const radiusToken = (props.radius as string) || (props.borderRadius as string);
  const borderRadius = radiusToken
    ? (radiusToken.startsWith("theme-") ? resolveThemePx(radiusToken, rootProps, 12) : parsePx(radiusToken, 12))
    : undefined;

  if (videoId || isYouTubeUrl(rawUrl)) {
    const id = videoId || extractYouTubeVideoId(toEmbedUrl(rawUrl)) || "";
    const imageProps: Record<string, unknown> = {
      url: id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : rawUrl,
      source: "network",
      aspectRatio: aspect,
      fit: "cover",
    };
    if (borderRadius !== undefined) imageProps.borderRadius = borderRadius;

    const node: Record<string, unknown> = {
      id: generateId("youtube-thumb"),
      type: "image",
      props: imageProps,
      tap: { type: "openUrl", url: rawUrl },
    };
    return applyLayout(node, props.layout as Record<string, unknown> | undefined, rootProps);
  }

  const outProps: Record<string, unknown> = {
    url: rawUrl,
    showControls: true,
    autoplay: false,
  };

  const sizeToken = props.size as string;
  if (sizeToken) outProps.height = resolveThemePx(sizeToken, rootProps, 480);
  if (borderRadius !== undefined) outProps.borderRadius = borderRadius;

  let node: Record<string, unknown> = { id: generateId("video"), type: "videoPlayer", props: outProps };

  if (aspect !== undefined && !sizeToken) {
    node = {
      id: generateId("video-wrapper"),
      type: "container",
      props: { aspectRatio: aspect },
      child: node,
    };
  }

  return applyLayout(node, props.layout as Record<string, unknown> | undefined, rootProps);
}

function toEmbedUrl(url: string): string {
  if (!url) return "";
  if (url.includes("/embed/")) return url;
  const watchMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]+)/);
  if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`;
  return url;
}

function extractYouTubeVideoId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

function isYouTubeUrl(url: string): boolean {
  return /youtube\.com|youtu\.be/.test(url);
}

function transformHero(block: Record<string, unknown>, rootProps: Record<string, unknown>): Record<string, unknown> {
  const props = (block.props || {}) as Record<string, unknown>;
  const dir = (rootProps.direction as string) || "rtl";
  const align = (props.align as string) || "center";
  const lang = (rootProps.language as string) || "ar";
  const padding = clampToPhone(parsePx(props.padding as string, 80), 24, "Hero padding");

  const children: Record<string, unknown>[] = [];

  const title = pickLang(props.title, lang);
  if (title) {
    children.push({
      id: generateId("hero-title"),
      type: "text",
      props: { value: title, fontSize: 28, fontWeight: "bold", textAlign: align },
    });
  }

  const desc = pickLang(props.description, lang);
  if (desc) {
    const isRich = /<[a-z][\s\S]*>/i.test(desc);
    children.push({
      id: generateId("hero-desc"),
      type: isRich ? "richtext" : "text",
      props: { value: desc.replace(/<[^>]*>/g, ""), fontSize: 16, textAlign: align },
    });
  }

  const buttons = (props.buttons as Record<string, unknown>[]) || [];
  if (buttons.length > 0) {
    const btnNodes = buttons.map((btn) => {
      const bProps: Record<string, unknown> = {
        label: resolveBilingual(
          (btn.label as string) || (btn.text as string),
          btn.labelAr as string,
          lang
        ),
        height: 48,
        variant: resolveButtonVariant((btn.variant as string) || "primary"),
      };
      const tapHref = (btn.href as string) || "";
      return {
        id: generateId("hero-btn"),
        type: "button",
        props: bProps,
        ...(tapHref ? { tap: { type: "navigate", route: normalizeRoute(tapHref), navigation_type: "push" } } : {}),
      };
    });
    children.push({
      id: generateId("hero-buttons"),
      type: "row",
      props: { mainAxisAlignment: align === "center" ? "center" : align === "right" ? "end" : "start", crossAxisAlignment: "center", gap: 12 },
      children: btnNodes,
    });
  }

  const imgMode = (props.image as Record<string, unknown>)?.mode as string
    || ((props.variant as string) === "background" ? "background" : undefined);
  const imgUrl = (props.image as Record<string, unknown>)?.url as string
    || (props.backgroundImage as string);
  const heroHeight = props.height ? parsePx(props.height as string, 0) : undefined;

  if (imgMode === "background" && imgUrl) {
    const innerCol: Record<string, unknown> = {
      id: generateId("hero-col"),
      type: "column",
      // No `height` here — the wrapping sizedBox below owns it.
      props: flexProps("center", align === "center" ? "center" : align === "right" ? "end" : "start", {
        gap: 16,
        padding,
      }),
      children,
    };
    // A stack whose layer 0 is a fill image needs bounded constraints from its parent — inside a
    // scrolling column it throws "A Stack requires bounded constraints from its parent". The
    // engine's own configs solve it with a `sizedBox` + `fit: "expand"`, so mirror that. The
    // height is an estimate when the merchant did not author one; erring tall is free (whitespace)
    // and erring short is a render error.
    return applyLayout(
      {
        id: generateId("hero-box"),
        type: "sizedBox",
        props: { height: heroHeight ?? estimateHeroHeight(props, padding, buttons.length > 0, lang) },
        child: {
          id: generateId("hero-stack"),
          type: "stack",
          props: { fit: "expand" },
          children: [
            {
              id: generateId("hero-bg"),
              type: "image",
              props: { url: imgUrl, source: "network", fit: "cover" },
            },
            innerCol,
          ],
        },
      },
      props.layout as Record<string, unknown> | undefined,
      rootProps
    );
  }

  if (imgUrl && imgMode === "split") {
    const col: Record<string, unknown> = {
      id: generateId("hero-split-col"),
      type: "column",
      props: { crossAxisAlignment: "stretch", mainAxisAlignment: "start", gap: 16 },
      children: [
        {
          id: generateId("hero-split-img"),
          type: "image",
          props: { url: imgUrl, source: "network", fit: "cover" },
        },
        {
          id: generateId("hero-split-content"),
          type: "column",
          props: { crossAxisAlignment: align, mainAxisAlignment: "start", gap: 16 },
          children,
        },
      ],
    };
    return applyLayout(col, props.layout as Record<string, unknown> | undefined, rootProps);
  }

  const column: Record<string, unknown> = {
    id: generateId("hero-col"),
    type: "column",
    props: { crossAxisAlignment: align, mainAxisAlignment: "center", gap: 16 },
    children,
  };

  return applyLayout(
    {
      id: generateId("hero-container"),
      type: "container",
      props: { padding: { top: padding, bottom: padding, left: 24, right: 24 } },
      child: column,
    },
    props.layout as Record<string, unknown> | undefined,
    rootProps
  );
}

function transformCard(block: Record<string, unknown>, rootProps: Record<string, unknown>): Record<string, unknown> {
  const props = (block.props || {}) as Record<string, unknown>;
  const title = bilingualProp(props.title, rootProps);
  const description = bilingualProp(props.description, rootProps);
  const image = props.image as Record<string, unknown> | undefined;
  const mode = (props.mode as string) || (props.variant as string) || "card";

  const cardChildren: Record<string, unknown>[] = [];

  if (props.icon) {
    const iconColor = resolveColor(props.colorMode as string, props.colorTheme as string, props.colorFixed as string, rootProps) || "#2563eb";
    cardChildren.push({
      id: generateId("card-icon"),
      type: "icon",
      props: { name: resolveIcon(props.icon as string), size: 32, color: iconColor },
    });
  }

  if (image?.url) {
    cardChildren.push({
      id: generateId("card-img"),
      type: "image",
      props: { url: image.url as string, alt: (image.alt as string) || "", source: "network", fit: "cover", borderRadius: "md" },
    });
  }
  if (title) {
    cardChildren.push({
      id: generateId("card-title"),
      type: "text",
      props: { value: title, fontSize: 16, fontWeight: "bold" },
    });
  }
  if (description) {
    cardChildren.push({
      id: generateId("card-desc"),
      type: "text",
      props: { value: description.replace(/<[^>]*>/g, ""), fontSize: 14, color: "#6b7d93" },
    });
  }

  const elevationMap: Record<string, number> = { flat: 0, card: 2, default: 1, outlined: 0, elevated: 4 };
  let elevation = elevationMap[mode] ?? 2;
  if (typeof props.elevation === "number") elevation = props.elevation;
  const cardOutProps: Record<string, unknown> = { elevation, borderRadius: 8 };
  if (typeof props.padding === "number") {
    cardOutProps.padding = props.padding;
  }

  const color = resolveColor(props.colorMode as string, props.colorTheme as string, props.colorFixed as string, rootProps);
  if (color) cardOutProps.color = color;

  const node: Record<string, unknown> = {
    id: generateId("card"),
    type: "card",
    props: cardOutProps,
    child: {
      id: generateId("card-body"),
      type: "column",
      props: flexProps("start", "start", { gap: 8, padding: 16 }),
      children: cardChildren,
    },
  };
  return applyLayout(node, props.layout as Record<string, unknown> | undefined, rootProps);
}

function transformBadge(block: Record<string, unknown>, rootProps: Record<string, unknown>): Record<string, unknown> {
  const props = (block.props || {}) as Record<string, unknown>;
  const lang = (rootProps.language as string) || "ar";
  const label = resolveBilingual(props.label as string, props.labelAr as string, lang)
    || (props.text as string) || "";
  const variant = (props.variant as string) || "discount";

  const badgeColors: Record<string, { bg: string; fg: string }> = {
    discount: { bg: "#FEE2E2", fg: "#DC2626" },
    inStock: { bg: "#DCFCE7", fg: "#16A34A" },
    outOfStock: { bg: "#F3F4F6", fg: "#6B7280" },
    custom: { bg: "#EBF5FF", fg: "#2563EB" },
  };
  const bc = badgeColors[variant] || badgeColors.custom;
  const size = (props.size as string) || "sm";
  const fontSize = size === "sm" ? 12 : size === "lg" ? 16 : 14;

  const node: Record<string, unknown> = {
    id: generateId("badge"),
    type: "container",
    props: { padding: { left: 8, right: 8, top: 4, bottom: 4 }, color: bc.bg, borderRadius: 9999 },
    child: {
      id: generateId("badge-label"),
      type: "text",
      props: { value: label, fontSize, fontWeight: "bold", color: bc.fg },
    },
  };
  return applyLayout(node, props.layout as Record<string, unknown> | undefined, rootProps);
}

function transformDivider(block: Record<string, unknown>, rootProps: Record<string, unknown>): Record<string, unknown> {
  const props = (block.props || {}) as Record<string, unknown>;
  const orient = (props.orientation as string) || "horizontal";
  const thickness = parsePx(props.thickness as string, 1);

  const color = resolveColor(props.colorMode as string, props.colorTheme as string, props.colorFixed as string, rootProps);

  if (orient === "vertical") {
    const dividerProps: Record<string, unknown> = { width: 1, color: color || "#cbd5e1" };
    const w = props.width as string;
    if (w) dividerProps.width = parsePx(w);
    const h = props.height as string;
    if (h) dividerProps.height = parsePx(h);

    return applyLayout(
      {
        id: generateId("v-divider"),
        type: "container",
        props: dividerProps,
      },
      props.layout as Record<string, unknown> | undefined,
      rootProps
    );
  }

  const node: Record<string, unknown> = {
    id: generateId("divider"),
    type: "divider",
    props: { thickness },
  };
  if (color) (node.props as Record<string, unknown>).color = color;
  if ((props.variant as string) === "dashed" || (props.style as string) === "dashed") {
    (node.props as Record<string, unknown>).variant = "dashed";
  }

  const w = props.width as string;
  if (w && w !== "100%") (node.props as Record<string, unknown>).width = parsePx(w);

  return applyLayout(node, props.layout as Record<string, unknown> | undefined, rootProps);
}

// ─── Layout Block Transformers ──────────────────────────────────────────────

function transformSection(block: Record<string, unknown>, rootProps: Record<string, unknown>): Record<string, unknown> | null {
  const props = (block.props || {}) as Record<string, unknown>;
  if (props.visible === false) return null;

  // Section presets (`metadata.preset`, legacy `sectionKind`) are mostly a web authoring
  // convenience: once the preset has been expanded into ordinary blocks, every Section
  // converts the same way and the commerce behaviour lives on the blocks themselves
  // (bound Group, cartLineId Group, makeOrder ContentButton). The one exception is a
  // products-grid / products-page Section still holding its unexpanded card template —
  // see transformProductsTemplateSection.
  const children = getChildren(block);

  for (const child of children) {
    if ((child.type as string) === "Section") {
      addWarning("Nested Section detected; converted as sibling container");
    }
  }

  const bgImage = (props.backgroundImage as string) || "";
  // A background-image Section's stack is sized by the image (`fit: "cover"`), not by this
  // padding, so it gets a hard ceiling rather than the scale — an oversized value clips the hero
  // copy instead of growing the page. An ordinary Section scales down instead: copied literally
  // (`section { padding: 6rem 0 }`), it opens the page on a screen's worth of blank space before
  // any content is visible — see {@link scaleSectionVPad}.
  const paddingTop = bgImage
    ? clampToPhone(
        parsePx(props.paddingTop as string, 0),
        PHONE_HERO_PADDING_MAX,
        `Section "${(props.name as string) || block.type}" paddingTop (background-image hero)`
      )
    : scaleSectionVPad(
        parsePx(props.paddingTop as string, 0),
        `Section "${(props.name as string) || block.type}" paddingTop`
      );
  const paddingBottom = bgImage
    ? clampToPhone(
        parsePx(props.paddingBottom as string, 0),
        PHONE_HERO_PADDING_MAX,
        `Section "${(props.name as string) || block.type}" paddingBottom (background-image hero)`
      )
    : scaleSectionVPad(
        parsePx(props.paddingBottom as string, 0),
        `Section "${(props.name as string) || block.type}" paddingBottom`
      );
  // Horizontal only: vertical padding costs scroll, horizontal padding costs content width, and
  // on a 320px screen there is none to spare. Pages are emitted at `padding: 0` so this is the
  // only inset the content pays (mobile checklist item 9 — declare page padding once).
  const padH = clampToPhone(
    parsePx(props.paddingHorizontal as string, 16),
    PHONE_SECTION_PAD_MAX,
    `Section "${(props.name as string) || block.type}" paddingHorizontal`
  );
  const bgColor = (props.backgroundColor as string) || undefined;
  const columnsMobile = parseInt(String(props.columnsMobile || props.columns || 1), 10);
  const gridGap = parsePx(props.gridGap as string, 16);

  // An auth Section (input fields + a login / verifyOtp button) becomes a real `form` node so the
  // submit button can gate on validity and read its params out of FormStateStore. The formId is the
  // cubit's, not the button's — `login` submits `auth.requestOtp`, whose form is `otp-request-form`.
  const authAction = findAuthFormAction(children);
  const authFields = authAction ? collectFormFieldIds(children) : [];
  const authForm: AuthForm | null =
    authAction && authFields.length > 0
      ? { formId: AUTH_ACTION_CONTRACT[authAction].formId, fields: authFields }
      : null;
  if (authForm) {
    _pageHasAuthForm = true;
    checkAuthFormFields(authAction as string, AUTH_ACTION_CONTRACT[authAction as string], authFields);
  }

  const preset = readSectionPreset(props);
  const templateGrid =
    transformProductsTemplateSection(block, rootProps) ??
    (preset === "customer-orders" ? transformCustomerOrdersSection(block, rootProps) : null) ??
    (preset === "customer-order-items" ? transformOrderSubListSection(block, rootProps, "orderItem") : null) ??
    (preset === "customer-order-timeline" ? transformOrderSubListSection(block, rootProps, "orderTimeline") : null);

  // A `customer-order-detail` Section is not a repeat: its children are ordinary blocks reading
  // scalar fields off the one order. They convert normally, just inside the detail binding scope
  // so `order.*` resolves to an absolute path into the shared request.
  const isOrderDetailSection = preset === "customer-order-detail" && !templateGrid && isOrderDetailRoute();
  if (preset === "customer-order-detail" && !isOrderDetailSection && !templateGrid) {
    addWarning(
      `Section preset "customer-order-detail" sits on route "${_currentRoute}"; the order-detail ` +
        `request is only declared on /orders/:orderId, so its fields render blank here`
    );
  }

  const prevAuthForm = _activeAuthForm;
  if (authForm) _activeAuthForm = authForm;
  let transformedChildren: Record<string, unknown>[];
  try {
    const convertChildren = () =>
      children.map((c: Record<string, unknown>) => transformBlock(c, rootProps)).filter(Boolean) as Record<
        string,
        unknown
      >[];
    transformedChildren = templateGrid
      ? []
      : isOrderDetailSection
        ? withBindingScope({ kind: "orderDetail", base: ORDER_DETAIL_BASE }, convertChildren)
        : convertChildren();
  } finally {
    _activeAuthForm = prevAuthForm;
  }

  let contentWrapper: Record<string, unknown>;
  if (templateGrid) {
    contentWrapper = templateGrid;
  } else if (columnsMobile > 1) {
    contentWrapper = {
      id: generateId("section-grid"),
      type: "gridView",
      props: {
        crossAxisCount: columnsMobile,
        mainAxisSpacing: gridGap,
        crossAxisSpacing: gridGap,
        childAspectRatio: estimateGridAspectRatio(transformedChildren, columnsMobile, gridGap, 1.0),
      },
      children: transformedChildren,
    };
  } else {
    contentWrapper = {
      id: generateId("section-column"),
      type: "column",
      props: flexProps("start", "stretch", { gap: 16 }),
      children: transformedChildren,
    };
  }

  if (authForm) {
    contentWrapper = {
      id: generateId("form"),
      type: "form",
      props: { formId: authForm.formId, id: authForm.formId },
      child: contentWrapper,
    };
  } else if (findButtonAction(children, "createAddress") && collectFormFieldIds(children).length > 0) {
    // Account address presets: wrap inputs so createAddress can read FormStateStore by field id.
    contentWrapper = {
      id: generateId("form"),
      type: "form",
      props: { formId: CHECKOUT_ADDRESS_FORM_ID, id: CHECKOUT_ADDRESS_FORM_ID },
      child: contentWrapper,
    };
  }

  // First Section on /orders/:orderId that reads the order carries the fetch for all of them —
  // detail Sections and the items / timeline repeats alike share one `CustomerOrder`.
  const declaresOrderDetail =
    isOrderDetailRoute() &&
    !_orderDetailRequestEmitted &&
    (isOrderDetailSection || preset === "customer-order-items" || preset === "customer-order-timeline");
  if (declaresOrderDetail) _orderDetailRequestEmitted = true;

  const innerContainer: Record<string, unknown> = {
    id: generateId("section-inner"),
    type: "container",
    props: {
      ...(bgColor && !bgImage ? { color: bgColor } : {}),
      // A Section the merchant set to «بدون» on all three axes wants no inset; the engine already
      // defaults an absent `padding` to zero, so writing the box would be dead weight on the wire.
      ...(paddingTop || paddingBottom || padH
        ? { padding: { top: paddingTop, bottom: paddingBottom, left: padH, right: padH } }
        : {}),
      ...(declaresOrderDetail ? { data: buildOrderDetailRequestData() } : {}),
    },
    child: contentWrapper,
  };

  if (bgImage) {
    const stackChildren: Record<string, unknown>[] = [
      {
        id: generateId("section-bg-image"),
        type: "image",
        props: { url: bgImage, source: "network", fit: "cover" },
      },
    ];
    if (props.backgroundOverlayColor) {
      stackChildren.push({
        id: generateId("section-overlay"),
        type: "container",
        props: { color: props.backgroundOverlayColor as string },
      });
    }
    stackChildren.push(innerContainer);
    return applyLayout(
      {
        id: generateId("section-stack"),
        type: "stack",
        props: { fit: STACK_FIT },
        children: stackChildren,
      },
      props.layout as Record<string, unknown> | undefined,
      rootProps
    );
  }

  const container: Record<string, unknown> = {
    ...innerContainer,
    id: generateId("section-container"),
  };

  return applyLayout(container, props.layout as Record<string, unknown> | undefined, rootProps);
}

function wrapWithSurfaceContainer(
  node: Record<string, unknown>,
  props: Record<string, unknown>,
  rootProps: Record<string, unknown>
): Record<string, unknown> {
  const bgColor = (props.backgroundColor as string) || "";
  const padding = props.padding as string;
  const borderRadius = props.borderRadius as string;
  const boxShadow = (props.boxShadow as string) || "none";
  const bgImage = (props.backgroundImage as string) || "";

  const hasSurface =
    (bgColor && bgColor !== "") ||
    (padding && padding !== "0px") ||
    (borderRadius && borderRadius !== "theme-none" && borderRadius !== "0") ||
    (boxShadow && boxShadow !== "none") ||
    (bgImage && bgImage !== "");

  if (!hasSurface) return node;

  const containerProps: Record<string, unknown> = {};
  if (bgColor) containerProps.color = resolveThemeColor(bgColor, rootProps) || bgColor;
  if (padding && padding !== "0px") {
    const p = _gridCellDepth > 0
      ? clampToPhone(parsePx(padding), PHONE_GRID_CELL_SURFACE_PAD_MAX, "grid cell surface padding")
      : clampToPhone(parsePx(padding), PHONE_CARD_PAD_MAX, "card padding");
    containerProps.padding = { top: p, bottom: p, left: p, right: p };
  }
  if (borderRadius) {
    containerProps.borderRadius = borderRadius.startsWith("theme-")
      ? resolveThemePx(borderRadius, rootProps, 0)
      : parsePx(borderRadius, 0);
  }
  if (boxShadow && boxShadow !== "none") containerProps.shadow = boxShadow;

  if (bgImage) {
    return {
      id: generateId("group-surface-stack"),
      type: "stack",
      props: { fit: STACK_FIT },
      children: [
        { id: generateId("group-bg"), type: "image", props: { url: bgImage, source: "network", fit: "cover" } },
        { id: generateId("group-surface"), type: "container", props: containerProps, child: node },
      ],
    };
  }

  return {
    id: generateId("group-surface"),
    type: "container",
    props: containerProps,
    child: node,
  };
}

function transformFlex(block: Record<string, unknown>, rootProps: Record<string, unknown>): Record<string, unknown> {
  const props = (block.props || {}) as Record<string, unknown>;
  const items = getChildren(block);
  let direction = (props.direction as string) || "";
  if (!direction) {
    const orientation = props.orientation as string;
    if (orientation === "vertical") direction = "column";
    else if (orientation === "horizontal") direction = "row";
    else direction = "row";
  }
  const isRow = direction === "row" || direction === "horizontal";
  const gap = parsePx(props.gap as string | number, 0);

  const axisMap: Record<string, string> = {
    center: "center", "flex-start": "start", start: "start",
    "flex-end": "end", end: "end", "space-between": "spaceBetween",
    spaceBetween: "spaceBetween", "space-around": "spaceAround", spaceAround: "spaceAround",
    "space-evenly": "spaceEvenly", spaceEvenly: "spaceEvenly",
    stretch: "stretch", baseline: "baseline",
  };
  // `.filter(Boolean)` is not optional: a block that maps to nothing returns null, and the
  // engine rejects the whole page on a hole in `children` ("children must contain objects").
  const children = items
    .map((c: Record<string, unknown>) => transformBlock(c, rootProps))
    .filter(Boolean) as Record<string, unknown>[];

  const stackReason = isRow ? shouldStackOnPhone(children, (props.name as string) || "row", gap) : null;
  const asRow = isRow && !stackReason;

  // Stacked buttons take the full width rather than each shrinking to its own label — a column of
  // ragged buttons reads as a mistake, and the merchant's row alignment no longer applies once the
  // axis has flipped.
  const crossAxisAlignment =
    stackReason === "all-buttons"
      ? "stretch"
      : axisMap[(props.alignItems as string) || ""] || (asRow ? "center" : "stretch");
  const mainAxisAlignment = axisMap[(props.justifyContent as string) || ""] || "start";

  let node: Record<string, unknown> = {
    id: generateId(asRow ? "row" : "column"),
    type: asRow ? "row" : "column",
    props: flexProps(mainAxisAlignment, crossAxisAlignment, { gap }),
    // Only in a row that has siblings competing for width — a lone child cannot be squeezed by one.
    children: asRow && children.length > 1 ? children.map(flexTextInRow) : children,
  };

  node = wrapWithSurfaceContainer(node, props, rootProps);
  return applyLayout(node, props.layout as Record<string, unknown> | undefined, rootProps);
}

/**
 * Child types that must not sit inside a `row`. A row hands its children unbounded width, and each
 * of these needs a bounded box to lay out — the failures are hard throws, not overflow warnings:
 * a `textFormField` gives "An InputDecorator cannot have an unbounded width", a nested `column` or
 * grid gives "BoxConstraints forces an infinite width".
 */
const UNBOUNDED_IN_ROW = new Set(["column", "textFormField", "form", "gridView", "listView", "otpInput"]);

/**
 * A web row with more than one content column is a desktop layout; on a 360px screen it becomes a
 * `column`. Only rows whose children genuinely sit side by side at that width stay rows — an icon
 * and a label, a price and a badge.
 *
 * Returns the reason, because it changes the column that replaces the row: a stack of buttons wants
 * `stretch` so they share one width, while the other cases keep whatever the merchant authored.
 */
type StackReason = "unbounded-child" | "grid-cell" | "all-buttons";

function shouldStackOnPhone(
  children: Record<string, unknown>[],
  name: string,
  gap: number
): StackReason | null {
  const offenders = children.filter((c) => UNBOUNDED_IN_ROW.has(c.type as string));
  if (offenders.length > 0) {
    addWarning(
      `Row "${name}" holds ${offenders.map((c) => c.type).join(", ")}, which cannot lay out inside a ` +
        `row's unbounded width; converted to a column for mobile. Author it as a vertical stack on ` +
        `the web side if the phone layout matters.`
    );
    return "unbounded-child";
  }

  // A grid cell is ~130px. Whatever the merchant put side by side there — the recurring case is a
  // price next to a "view item" button — needs more width than the cell has, and the overflow is
  // repeated once per card.
  if (_gridCellDepth > 0 && children.length > 1) {
    addWarning(
      `Row "${name}" sits inside a grid cell (~130px at 320px), which cannot lay out ${children.length} ` +
        `children side by side; converted to a column. A card is a vertical stack on a phone.`
    );
    return "grid-cell";
  }

  // Buttons rarely share a 320px row once their labels are Arabic: "تصفّح المجموعة" beside
  // "حكاية الورشة" overflowed by 183px, and the add-to-cart pair by 285px.
  //
  // The mobile team's rule is written as "a row whose children are all buttons becomes a column",
  // but applying it literally also stacked the footer's two legal links, which measure ~258px
  // together and fit. Their own review rendered all nine pages at 320px across three rounds and
  // reported each overflowing row by name — the footer rows were never among them. So this measures
  // instead, and errs toward stacking: over-stacking costs a layout the merchant did not draw,
  // under-stacking costs the overflow they keep reporting.
  //
  // The footer itself no longer converts (SiteFooter is skipped entirely), so that specific row can
  // no longer reach here. It is kept as the worked example because it is *why* this is measured
  // rather than assumed, and the same short-label-pair shape shows up in page bodies.
  if (children.length > 1 && children.every((c) => c.type === "button")) {
    const needed =
      children.reduce((sum, c) => sum + estimateButtonWidth(c), 0) + gap * (children.length - 1);
    if (needed > PHONE_ROW_BUDGET) {
      addWarning(
        `Row "${name}" holds ${children.length} buttons needing ~${Math.round(needed)}px, more than ` +
          `the ${PHONE_ROW_BUDGET}px a 320px screen leaves inside a section; converted to a ` +
          `full-width column. Author it as a vertical stack on the web side.`
      );
      return "all-buttons";
    }
  }

  return null;
}

/**
 * Wraps bare `text` in a row with the engine's flex marker. A `text` takes its full intrinsic
 * width inside a row, and Arabic headings are long — the Rawaq "section heading + see-all link"
 * rows overflowed by 191px. `expand` is what makes it yield.
 */
function flexTextInRow(child: Record<string, unknown>): Record<string, unknown> {
  if (child.type !== "text") return child;
  return {
    id: generateId("text-flex"),
    type: "container",
    props: { expand: true, expandAxis: "horizontal" },
    child,
  };
}

/** `metadata.apiUrl` → relative public path, or a public product path built from the picker ref. */
function resolveProductRequestUrl(
  metadata: Record<string, unknown> | undefined,
  product: Record<string, unknown> | undefined
): string {
  if (metadata?.apiUrl) {
    return normalizeAdminApiUrl(metadata.apiUrl as string);
  }
  const ref = (product?.slug as string) || (product?.id as string) || "";
  return ref ? `/api/v1/public/products/${encodeURIComponent(ref)}` : "";
}

/**
 * The product-detail screen's own request.
 *
 * A web product-detail page binds its Group to a **route**, not to a product chosen at authoring
 * time: `product` is left `null` and the storefront's `BoundDataProvider` fills it from the URL
 * slug. Mobile does the same thing with one request whose `:productId` the engine substitutes from
 * the route, so the whole page needs exactly one of these — never one per product.
 *
 * `include` is copied from the engine's own `mobile_production_v2.json`. `VARIANTS` is the load-
 * bearing part: without it the variant picker has no options to offer and `cart.addItem` can never
 * resolve a `variantId`.
 */
const PRODUCT_DETAIL_ROUTE = "/product/details/:productId";
const PRODUCT_DETAIL_REQUEST_KEY = "product-detail";
const PRODUCT_DETAIL_REQUEST = {
  requestKey: PRODUCT_DETAIL_REQUEST_KEY,
  requestUrl: "/api/v1/public/products/:productId",
  include: "PRICING,IMAGES,VARIANTS,CATEGORIES,TAGS",
};
const PRODUCT_DETAIL_BASE = `dataContext.requests.${PRODUCT_DETAIL_REQUEST_KEY}.data`;

/**
 * The variant picker's form.
 *
 * `requireValidForm` + `formId` resolve through the FormStateStore by id, **not** by tree position
 * — in the engine's own config the form sits in `body` while the add-to-cart button that gates on
 * it sits in `footer`. So only the dropdown has to live inside the `form` node; the button just
 * has to name it.
 *
 * The engine publishes a companion `<fieldId>_label` field holding the chosen `itemLabelPath`
 * text, which is where `variantTitle` comes from.
 */
const VARIANT_FORM_ID = "product-variant-form";
const VARIANT_FIELD_ID = "selectedVariantId";
const VARIANT_QTY_FIELD_ID = "addQty";

/** Synthesised checkout address-details wizard. */
const ADDRESS_DETAILS_FORM_ID = "address-details-form";
/** Web account/settings sections that submit via `buttonAction: "createAddress"`. */
const CHECKOUT_ADDRESS_FORM_ID = "checkout-address-form";

/** Form field ids on `/checkout/address-details` (camelCase, matches saveAddress API keys). */
const SYNTH_ADDRESS_SAVE_PARAMS: Record<string, { source: string; field: string }> = {
  label: { source: "form", field: "addressLabel" },
  recipientName: { source: "form", field: "recipientName" },
  recipientPhone: { source: "form", field: "recipientPhone" },
  governorate: { source: "form", field: "governorate" },
  city: { source: "form", field: "city" },
  streetAddress: { source: "form", field: "streetAddress" },
  notes: { source: "form", field: "addressNotes" },
  isDefault: { source: "form", field: "isDefault" },
};

/** Web `ContentInput` `name` values on address presets (hyphenated). */
const WEB_ADDRESS_SAVE_PARAMS: Record<string, { source: string; field: string }> = {
  label: { source: "form", field: "address-label" },
  recipientName: { source: "form", field: "address-recipient-name" },
  recipientPhone: { source: "form", field: "address-recipient-phone" },
  governorate: { source: "form", field: "address-governorate" },
  city: { source: "form", field: "address-city" },
  streetAddress: { source: "form", field: "address-street" },
  notes: { source: "form", field: "address-notes" },
  isDefault: { source: "form", field: "address-is-default" },
};

/**
 * True for a `ContentDropdown` the converter can turn into the engine's variant picker.
 *
 * `dropdownAction: "select_variant"` is now self-sufficient: it always means "the current
 * product's variants," the same fixed source `ProductVariants` reads — no `options[]` source to
 * configure or get wrong (see `transformContentDropdown`). `hasVariantPicker` and
 * `transformContentDropdown` must agree exactly: the first decides whether add-to-cart emits
 * `cart.addItem`, the second whether the form field that call reads exists. Disagreement ships a
 * button gated on a field nothing writes — it validates forever and never fires, which is
 * indistinguishable from a dead button on the phone.
 */
function isVariantPickerDropdown(node: Record<string, unknown>): boolean {
  if (node.type !== "ContentDropdown") return false;
  const props = (node.props || {}) as Record<string, unknown>;
  return props.dropdownAction === "select_variant";
}

/**
 * True if a variant picker sits anywhere under this block — either the legacy `ProductVariants`
 * block or the `ContentDropdown` that replaced it in the palette (BLOCKS.md § ContentDropdown).
 * Both write the same `selectedVariantId`, so add-to-cart does not care which one authored it.
 */
function hasVariantPicker(node: unknown): boolean {
  if (Array.isArray(node)) return node.some(hasVariantPicker);
  if (!node || typeof node !== "object") return false;
  const n = node as Record<string, unknown>;
  if (n.type === "ProductVariants" || isVariantPickerDropdown(n)) return true;
  return Object.values(n).some(hasVariantPicker);
}

/**
 * `ProductVariants` → the engine's variant dropdown.
 *
 * The web block renders the full option matrix — a chip row per option group (colour, size), with
 * unavailable combinations disabled. The engine has no matrix widget: it offers one flat list of
 * variants off the detail request. Two option groups therefore collapse into a single list of
 * SKUs, which is a real fidelity loss and is warned about once.
 *
 * `onChanged` seeds the quantity field, so `addItem` has a `quantity` to read the moment a variant
 * is chosen — mirroring `mobile_production_v2.json`.
 */
function transformProductVariants(rootProps: Record<string, unknown>): Record<string, unknown> {
  const lang = (rootProps.language as string) || "ar";
  addWarning(
    `ProductVariants converted to a single "${VARIANT_FIELD_ID}" dropdown over ` +
      `${PRODUCT_DETAIL_BASE}.variants. The engine has no option-matrix widget, so separate option ` +
      `groups (colour, size) become one flat list of variants, and out-of-stock combinations are ` +
      `not greyed out — the picker lists whatever the detail request returns`
  );
  return {
    id: generateId("product-variant-dropdown"),
    type: "dropdown",
    props: {
      id: VARIANT_FIELD_ID,
      label: lang === "ar" ? "اختر الخيار" : "Choose an option",
      isExpanded: true,
      validateRequired: true,
      itemsPath: `${PRODUCT_DETAIL_BASE}.variants`,
      itemValuePath: "variantId",
      itemLabelPath: "sku",
      onChanged: { type: "formAdjust", field: VARIANT_QTY_FIELD_ID, value: 1 },
    },
  };
}

/**
 * A plain `ContentDropdown` → the engine's static `dropdown` (`data.items[]`), the shape
 * `settings-language-dropdown` uses in `mobile_production_v2.json`.
 *
 * Only `mode: "static"` sources survive: `bound` needs a binding scope this block has no claim on
 * outside the variant picker, and `categories` needs a category *list* request the converter does
 * not open yet.
 */
function buildStaticDropdown(
  props: Record<string, unknown>,
  rootProps: Record<string, unknown>
): Record<string, unknown> | null {
  const lang = (rootProps.language as string) || "ar";
  const fieldId = (props.name as string) || "dropdown";
  const sources = Array.isArray(props.options) ? props.options : [];

  const items: Record<string, unknown>[] = [];
  const seen = new Set<string>();
  let boundSources = 0;
  let categorySources = 0;
  let groupLabels = 0;

  for (const entry of sources) {
    if (!entry || typeof entry !== "object") continue;
    const source = entry as Record<string, unknown>;
    const mode = (source.mode as string) || "static";
    if (mode === "bound" || mode === "productVariants") {
      boundSources++;
      continue;
    }
    if (mode === "categories") {
      categorySources++;
      continue;
    }
    if (pickLang(source.groupLabel, lang)) groupLabels++;

    for (const value of Array.isArray(source.values) ? source.values : []) {
      if (!value || typeof value !== "object") continue;
      const row = value as Record<string, unknown>;
      const label = pickLang(row.title, lang);
      // BLOCKS.md § ContentDropdown: a value-less option falls back to its own title, so a
      // merchant can type titles only and still get a working select.
      const rowValue = (row.value as string) || label;
      // A `<select>` cannot tell two options with the same value apart either — first wins.
      if (!rowValue || seen.has(rowValue)) continue;
      seen.add(rowValue);
      items.push({ label: label || rowValue, value: rowValue, index: items.length });
    }
  }

  if (boundSources) {
    addWarning(
      `ContentDropdown "${fieldId}" has ${boundSources} bound option source(s) but no ` +
        `dropdownAction; the engine resolves itemsPath against a page request, and a plain form ` +
        `select has none. Those options were dropped`
    );
  }
  if (categorySources) {
    addWarning(
      `ContentDropdown "${fieldId}" reads the storefront category list; the converter opens no ` +
        `category list request, so those options were dropped`
    );
  }
  if (groupLabels) {
    addWarning(`ContentDropdown "${fieldId}" option groups flattened; the engine dropdown has no optgroup`);
  }

  if (!items.length) {
    addWarning(`ContentDropdown "${fieldId}" resolved no options; dropped rather than emitted empty`);
    return noteUnsupportedBlock("ContentDropdown (no resolvable options)");
  }

  const outProps: Record<string, unknown> = {
    id: fieldId,
    label: bilingualProp(props.label, rootProps),
    hint: bilingualProp(props.placeholder, rootProps),
    isExpanded: true,
    data: { items },
  };
  if (props.required === true) outProps.validateRequired = true;

  const defaultValue = (props.defaultValue as string) || "";
  if (defaultValue && seen.has(defaultValue)) outProps.value = defaultValue;
  else if (defaultValue) {
    addWarning(
      `ContentDropdown "${fieldId}" defaultValue "${defaultValue}" matches none of its options; ` +
        `the field starts empty`
    );
  }

  return { id: generateId("dropdown"), type: "dropdown", props: outProps };
}

/**
 * `ContentDropdown` → the engine's `dropdown`, in one of two shapes chosen by `dropdownAction`
 * (BLOCKS.md § ContentDropdown).
 *
 * `filter_category` writes `productsPage.selectedCategorySlug` on the web. The mobile equivalent is
 * the `tabs` node `buildCategoryTabs` already emits for `ButtonGroup bindingMode: "categories"`, so
 * routing a dropdown into it is a real option — but it needs the same category request wired to the
 * grid it filters, which is tracked separately.
 */
/**
 * Actions merged in from the retired `ContentSelect` block (checkout address / payment method /
 * return-item-condition pickers). None have a mobile equivalent yet — those screens are the
 * engine's own checkout/returns flow, not a merchant-authored dropdown — so they drop with a
 * specific warning rather than falling through to `buildStaticDropdown`'s generic "no options"
 * one, which named the wrong reason.
 */
const UNMAPPED_DROPDOWN_ACTIONS = new Set([
  "checkout_address",
  "checkout_payment_method",
  "return_item_condition",
]);

function transformContentDropdown(
  block: Record<string, unknown>,
  rootProps: Record<string, unknown>
): Record<string, unknown> | null {
  const props = (block.props || {}) as Record<string, unknown>;
  const action = (props.dropdownAction as string) || "";
  const layout = props.layout as Record<string, unknown> | undefined;
  const name = (props.name as string) || "dropdown";

  if (action === "filter_category") {
    addWarning(
      `ContentDropdown "${name}" filters by category; the mobile ` +
        `category filter is the tabs strip built from ButtonGroup bindingMode "categories". Author ` +
        `it as a ButtonGroup, or wire the filter manually — dropped`
    );
    return noteUnsupportedBlock("ContentDropdown (filter_category)");
  }

  if (UNMAPPED_DROPDOWN_ACTIONS.has(action)) {
    addWarning(
      `ContentDropdown "${name}" uses action "${action}"; the engine has no merchant-authored ` +
        `equivalent — checkout address, payment method, and return-condition are its own built-in ` +
        `screens, not something a dropdown wires into — dropped`
    );
    return noteUnsupportedBlock(`ContentDropdown (${action})`);
  }

  if (action === "select_variant") {
    if (!_productDetailRequestEmitted) {
      addWarning(
        `ContentDropdown "${name}" selects a variant but sits outside a product-detail page, so ` +
          `there is no "${PRODUCT_DETAIL_REQUEST_KEY}" request for it to read variants from; dropped`
      );
      return noteUnsupportedBlock("ContentDropdown (no product-detail request)");
    }
    if (name !== VARIANT_FIELD_ID) {
      addWarning(
        `ContentDropdown "${name}" emitted with field id "${VARIANT_FIELD_ID}" — cart.addItem only ` +
          `reads that name from the form store. Rename it on the web side to make this explicit`
      );
    }
    if (props.required === false) {
      addWarning(
        `ContentDropdown "${name}" is optional on the web, but add-to-cart gates on ` +
          `requireValidForm — an optional picker lets the call through with no variant chosen. ` +
          `Emitted as required`
      );
    }
    if (props.hideWhenSingle === true || props.autoSelectFirst === true) {
      addWarning(
        `ContentDropdown "${name}": hideWhenSingle / autoSelectFirst have no engine equivalent. The ` +
          `picker always renders and starts empty, so a single-variant product costs one extra tap`
      );
    }
    // "select_variant" is self-sufficient: it always means "the current product's variants," the
    // same fixed source `ProductVariants` reads — `options[]` plays no part, so there is nothing
    // here for a merchant to misconfigure.
    const node = transformProductVariants(rootProps);
    return node ? applyLayout(node, layout, rootProps) : null;
  }

  const node = buildStaticDropdown(props, rootProps);
  return node ? applyLayout(node, layout, rootProps) : null;
}

/**
 * True for the outer Group of a web product-detail page — the one bound to the route.
 *
 * `product: null` alone is not enough to tell: a repeater cell carries the same null, because its
 * product also arrives at runtime. Those are marked `skipProductDetailFetch` (BLOCKS.md § Group)
 * and resolve against the grid's repeat item instead, so they must not claim this scope.
 */
function isRouteBoundProductGroup(props: Record<string, unknown>): boolean {
  return (
    "product" in props &&
    !props.product &&
    props.skipProductDetailFetch !== true &&
    // Already inside a repeat template: whatever this Group binds to arrives per item, not from the
    // route. Merchants mark the template Group itself with `skipProductDetailFetch`, but a card is
    // usually two Groups deep (a cell wrapping a body), and the inner one carries no such flag — on
    // the product-detail route it would otherwise claim the page's own request and render every
    // card in the grid with the name and price of the product being viewed.
    _bindingScope?.base !== "item" &&
    _currentRoute === PRODUCT_DETAIL_ROUTE
  );
}

function transformGroup(block: Record<string, unknown>, rootProps: Record<string, unknown>): Record<string, unknown> | null {
  const props = (block.props || {}) as Record<string, unknown>;

  // A Group with `cartLineId` is a cart-row template, whatever section it sits in.
  // Mobile cart lines are dynamic, so the first one becomes the list; the rest are
  // the same row repeated by the web editor and would duplicate the whole cart.
  if (props.cartLineId) {
    if (_cartTemplateEmitted) {
      addWarning(`Cart line Group "${props.cartLineId}" dropped; the cart already renders as one listView over cart.items`);
      return null;
    }
    _cartTemplateEmitted = true;
    const template = withBindingScope({ kind: "cart", base: "item" }, () => transformFlex(block, rootProps));
    return {
      id: generateId("cart-lines"),
      type: "listView",
      props: { emptyMessage: "السلة فارغة" },
      itemBuilder: { type: "repeat", source: CART_ITEMS_SOURCE, item: template },
    };
  }

  // The product-detail page's route-bound Group. Its children resolve against the page's single
  // `product-detail` request; the request itself is declared once, on the first such Group, and
  // later ones just reuse the scope — `dataContext.requests.…` is an absolute path, so it resolves
  // from anywhere on the page regardless of nesting.
  if (isRouteBoundProductGroup(props)) {
    const lang = (rootProps.language as string) || "ar";
    const firstOnPage = !_productDetailRequestEmitted;
    const ownsPicker = hasVariantPicker(block);
    // Both are set before the subtree is converted: the picker checks that its request exists,
    // and add-to-cart asks whether a picker exists at all — neither should depend on block order.
    _productDetailRequestEmitted = true;
    if (ownsPicker) _variantPickerAvailable = true;

    let node = withBindingScope({ kind: "product", base: PRODUCT_DETAIL_BASE }, () =>
      transformFlex(block, rootProps)
    );
    // Route-bound Groups nest (a media column and an info column inside a page-level root), so
    // several of them can "own" the same picker. The subtree is converted before the wrap, which
    // means the innermost owner finishes first and claims the form — the tightest scope that still
    // contains the field. A second wrapper would duplicate both the node id and the form id, and
    // the button's `formId` would then resolve to whichever one the store registered last.
    if (ownsPicker && !_variantFormEmitted) {
      _variantFormEmitted = true;
      node = {
        id: VARIANT_FORM_ID,
        type: "form",
        props: { id: VARIANT_FORM_ID, formId: VARIANT_FORM_ID },
        child: node,
      };
    }
    if (!firstOnPage) return node;
    return {
      id: generateId("product-detail-request"),
      type: "container",
      props: {
        expand: true,
        data: { ...PRODUCT_DETAIL_REQUEST },
        errorMessage: lang === "ar" ? "تعذر تحميل تفاصيل المنتج" : "Could not load product details",
        emptyMessage: lang === "ar" ? "المنتج غير متوفر" : "Product unavailable",
      },
      child: node,
    };
  }

  // A Group with `product` is a card bound to one product: it owns its own request,
  // so its children resolve against that request rather than a repeat item.
  const product = props.product as Record<string, unknown> | undefined;
  if (product) {
    const productId = String(product.id || product.slug || generateId("product"));
    const requestKey = `product-${productId}`;
    const requestUrl = resolveProductRequestUrl(props.metadata as Record<string, unknown> | undefined, product);
    const node = withBindingScope(
      { kind: "product", base: `dataContext.requests.${requestKey}.data` },
      () => transformFlex(block, rootProps)
    );

    if (!requestUrl) {
      addWarning(`Bound Group for product "${productId}" has no metadata.apiUrl, id or slug; emitted without a request`);
      return node;
    }
    if (!_warnedContainerRequest) {
      _warnedContainerRequest = true;
      addWarning(
        "Product-bound Groups declare a per-card request (requestKey/requestUrl on the wrapping container) and bind children to dataContext.requests.<key>.data.* — confirm the engine resolves requests on container nodes"
      );
    }
    return {
      id: generateId("product-bound"),
      type: "container",
      props: { requestKey, requestUrl },
      child: node,
    };
  }

  return transformFlex(block, rootProps);
}

function transformLayoutGrid(block: Record<string, unknown>, rootProps: Record<string, unknown>): Record<string, unknown> {
  const props = (block.props || {}) as Record<string, unknown>;
  const items = getChildren(block);
  const numCols = parseInt((props.numColumns as string) || "2", 10);
  const gap = parsePx(props.gap as string | number, 16);

  const converted = items.map((c: Record<string, unknown>) => transformBlock(c, rootProps)).filter(Boolean) as Record<string, unknown>[];

  const node: Record<string, unknown> = {
    id: generateId("grid-layout"),
    type: "gridView",
    props: {
      crossAxisCount: numCols,
      mainAxisSpacing: gap,
      crossAxisSpacing: gap,
      childAspectRatio: estimateGridAspectRatio(converted, numCols, gap, 1.0),
    },
    children: converted,
  };
  return applyLayout(node, props.layout as Record<string, unknown> | undefined, rootProps);
}

// ─── Commerce Block Transformers ─────────────────────────────────────────────

function transformProductImage(block: Record<string, unknown>, rootProps: Record<string, unknown>): Record<string, unknown> {
  const props = (block.props || {}) as Record<string, unknown>;
  const aspect = resolveAspectRatio(props.aspectRatio as string);
  const outProps: Record<string, unknown> = {
    url: (props.product as Record<string, unknown>)?.image as string || "",
    source: "network",
    fit: (props.objectFit as string) || "cover",
    alt: (props.product as Record<string, unknown>)?.title as string || "",
  };
  if (aspect !== undefined) outProps.aspectRatio = aspect;
  if (props.borderRadius) outProps.borderRadius = props.borderRadius;

  const node: Record<string, unknown> = { id: generateId("prod-img"), type: "image", props: outProps };
  return applyLayout(node, props.layout as Record<string, unknown> | undefined, rootProps);
}

function buildProductGridItemTemplate(cardVariant: string): Record<string, unknown> {
  const isHorizontal = cardVariant === "horizontal";
  const imageHeight = cardVariant === "compact" ? 120 : cardVariant === "featured" ? 240 : 200;

  const imageNode = {
    id: generateId("pt-image"),
    type: "image",
    props: {
      urlPath: "item.primaryImageUrl",
      source: "network",
      fit: "cover",
      aspectRatio: 1.0,
      ...(isHorizontal ? { width: 120, height: imageHeight } : {}),
    },
  };

  const textNodes = [
    { id: generateId("pt-name"), type: "text", props: { valuePath: "item.name", fontSize: cardVariant === "compact" ? 12 : 14, fontWeight: "w600" } },
    { id: generateId("pt-price"), type: "text", props: { valuePath: "item.price", fontSize: cardVariant === "compact" ? 12 : 13 } },
  ];

  const bodyChildren = isHorizontal
    ? [{
        id: generateId("pt-row"),
        type: "row",
        props: { crossAxisAlignment: "start", mainAxisAlignment: "start", gap: 12 },
        children: [imageNode, { id: generateId("pt-info"), type: "column", props: { crossAxisAlignment: "start", gap: 4 }, children: textNodes }],
      }]
    : [imageNode, ...textNodes];

  return {
    id: generateId("product-template"),
    type: "card",
    props: { elevation: cardVariant === "featured" ? 3 : 1, borderRadius: 12 },
    child: {
      id: generateId("pt-body"),
      type: "column",
      props: { crossAxisAlignment: "start", mainAxisAlignment: "start", gap: 8 },
      children: bodyChildren,
    },
    tap: { type: "navigate", route: "/product/details/:productId", navigation_type: "push" },
  };
}

function transformProductCard(block: Record<string, unknown>, rootProps: Record<string, unknown>): Record<string, unknown> {
  const props = (block.props || {}) as Record<string, unknown>;
  const product = props.product as Record<string, unknown> | undefined;
  const lang = (props.language as string) || (rootProps.language as string) || "ar";
  const variant = (props.variant as string) || "vertical";
  const isHorizontal = variant === "horizontal";
  const isCompact = variant === "compact";
  const isFeatured = variant === "featured";

  const productTitle = lang === "ar"
    ? (product?.titleAr as string) || (product?.title as string) || ""
    : (product?.titleEn as string) || (product?.title as string) || "";

  const imageHeight = isCompact ? 120 : isFeatured ? 240 : 200;

  const imageNode = {
    id: generateId("pc-img"),
    type: "image",
    props: {
      url: (product?.image as string) || (product?.primaryImageUrl as string) || "",
      source: "network",
      fit: (props.imageObjectFit as string) || "cover",
      borderRadius: resolveThemePx((props.radius as string) || "theme-md", rootProps, 12),
      height: imageHeight,
    },
  };

  const textChildren: Record<string, unknown>[] = [
    {
      id: generateId("pc-name"),
      type: "text",
      props: {
        value: productTitle,
        fontSize: isCompact ? 12 : isFeatured ? 16 : 14,
        fontWeight: "bold",
        color: resolveThemeColor(props.titleColor as string, rootProps),
      },
    },
    {
      id: generateId("pc-price"),
      type: "text",
      props: {
        value: `${product?.price ?? ""}`,
        fontSize: isCompact ? 12 : 14,
        color: resolveThemeColor(props.descriptionColor as string, rootProps) || "#0b78c5",
      },
    },
  ];

  if (props.showDescription !== false && product?.description) {
    textChildren.push({
      id: generateId("pc-desc"),
      type: "text",
      props: {
        value: product.description as string,
        fontSize: 12,
        color: resolveThemeColor(props.descriptionColor as string, rootProps) || "#6b7d93",
      },
    });
  }

  const actionButtons: Record<string, unknown>[] = [];
  if (props.showAddToCart !== false) {
    actionButtons.push({
      id: generateId("pc-add-cart"),
      type: "button",
      props: { label: lang === "ar" ? "أضف للسلة" : "Add to cart", height: 40, variant: resolveButtonVariant((props.actionButtonVariant as string) || "primary") },
      // Was `params: { productId }` — a bare value where the engine expects a `{source, field}`
      // spec, and no variantId either, so the call could never succeed.
      tap: buildAddToCartTap(),
    });
  }
  if (props.showViewDetails !== false) {
    actionButtons.push({
      id: generateId("pc-view"),
      type: "button",
      props: { label: lang === "ar" ? "التفاصيل" : "View details", height: 40, variant: "outlined" },
      tap: {
        type: "navigate",
        route: product?.id ? `/product/details/${product.id}` : "/product/details/:productId",
        navigation_type: "push",
      },
    });
  }
  if (props.showFavoriteButton !== false) {
    actionButtons.push({
      id: generateId("pc-wishlist"),
      type: "button",
      props: { label: "♥", height: 40, variant: "text" },
      tap: { type: "navigate", route: "/wishlist", navigation_type: "push" },
    });
  }

  if (actionButtons.length > 0 && props.showActionButtons !== false) {
    textChildren.push({
      id: generateId("pc-actions"),
      type: "row",
      props: { mainAxisAlignment: "start", crossAxisAlignment: "center", gap: 8 },
      children: actionButtons,
    });
  }

  const cardChildren: Record<string, unknown>[] = isHorizontal
    ? [{
        id: generateId("pc-row"),
        type: "row",
        props: { crossAxisAlignment: "start", mainAxisAlignment: "start", gap: 12 },
        children: [
          { ...imageNode, props: { ...imageNode.props, width: 120, height: 120 } },
          { id: generateId("pc-info"), type: "column", props: { crossAxisAlignment: "start", mainAxisAlignment: "start", gap: 4 }, children: textChildren },
        ],
      }]
    : [imageNode, ...textChildren];

  const node: Record<string, unknown> = {
    id: generateId("product-card"),
    type: "card",
    props: { elevation: isFeatured ? 3 : 1, borderRadius: resolveThemePx((props.radius as string) || "theme-md", rootProps, 12) },
    child: {
      id: generateId("pc-body"),
      type: "column",
      props: { crossAxisAlignment: "start", mainAxisAlignment: "start", gap: 8 },
      children: cardChildren,
    },
    tap: {
      type: "navigate",
      route: product?.id ? `/product/details/${product.id}` : "/product/details/:productId",
      navigation_type: "push",
    },
  };

  return node;
}

function transformProductGrid(block: Record<string, unknown>, rootProps: Record<string, unknown>): Record<string, unknown> {
  const props = (block.props || {}) as Record<string, unknown>;
  const columns = parseInt(String(props.columns || "3"), 10);
  const gap = resolveGridGap(props.gap as string | number);
  const maxProducts = parseInt(
    (props.maxProducts as string) || (props.maxRows as string) || "6",
    10
  );
  const collectionRaw = props.collection;
  const collection =
    typeof collectionRaw === "object" && collectionRaw !== null
      ? (collectionRaw as Record<string, unknown>).id as string
      : (collectionRaw as string) || "all";
  const metadata = props.metadata as Record<string, unknown> | undefined;
  const cardVariant = (props.cardVariant as string) || (props.variant as string) || "vertical";
  const requestKey = "product-list";

  let requestUrl = buildCollectionRequestUrl(collection, maxProducts);
  if (metadata?.apiUrl) {
    requestUrl = normalizeAdminApiUrl(metadata.apiUrl as string);
  }

  const itemTemplate = buildProductGridItemTemplate(cardVariant);

  return {
    id: generateId("products-grid"),
    type: "gridView",
    props: {
      crossAxisCount: columns,
      mainAxisSpacing: gap,
      crossAxisSpacing: gap,
      childAspectRatio: estimateGridAspectRatio([itemTemplate], columns, gap, 0.75),
      enableInnerScroll: false,
      emptyMessage: "لا توجد منتجات",
      errorMessage: "حدث خطأ",
      data: buildCollectionDataBlock(
        requestKey,
        requestUrl,
        "products-grid",
        maxProducts,
        typeof collection === "string" && collection !== "all" ? collection : undefined
      ),
    },
    itemBuilder: {
      type: "repeat",
      source: `dataContext.requests.${requestKey}.data`,
      item: itemTemplate,
    },
  };
}

/** `metadata.preset`, falling back to the legacy `sectionKind` field. */
function readSectionPreset(props: Record<string, unknown>): string {
  const metadata = props.metadata as Record<string, unknown> | undefined;
  const fromMetadata = typeof metadata?.preset === "string" ? metadata.preset : "";
  return fromMetadata || (typeof props.sectionKind === "string" ? props.sectionKind : "");
}

/**
 * A products-grid / products-page Section that still holds its **unexpanded** card
 * template: `content` is exactly one `Group` with `product: null` whose children bind
 * through `valueContext`, and the web repeater clones it once per product at render
 * time (BLOCKS.md § "Section presets: the one-template-card contract").
 *
 * Mobile has the same primitive, so the template maps straight onto a `gridView` whose
 * `itemBuilder` repeats it over the collection request, with children bound to `item.*`.
 *
 * Returns `null` for anything that does not match the contract — a preset Section whose
 * content is already expanded into ordinary blocks converts as a plain Section (§9.6).
 */
function transformProductsTemplateSection(
  block: Record<string, unknown>,
  rootProps: Record<string, unknown>
): Record<string, unknown> | null {
  const props = (block.props || {}) as Record<string, unknown>;
  const preset = readSectionPreset(props);
  if (preset !== "products-grid" && preset !== "products-page") return null;

  // `cardTemplate` mirrors `content[0]`; it is the only copy left if content was cleared.
  const children = getChildren(block);
  const cardTemplate = Array.isArray(props.cardTemplate) ? (props.cardTemplate as Record<string, unknown>[]) : [];
  const source = children.length > 0 ? children : cardTemplate;
  if (source.length !== 1) return null;

  const template = source[0];
  const templateProps = (template?.props || {}) as Record<string, unknown>;
  if (template?.type !== "Group" || templateProps.product) return null;

  const columns = parseInt(String(props.columnsMobile || props.columns || 2), 10) || 2;
  const gap = resolveGridGap(props.gridGap as string | number);
  const requestKey = "product-list";
  const size = 20;
  const collectionRef =
    preset === "products-grid" ? resolveCollectionRef(props.collection) : "all";
  // products-page has no collection picker — its grid is the whole catalogue, filtered
  // at runtime by the search / category controls that sit in the wrapper Section.
  const requestUrl = buildCollectionRequestUrl(collectionRef, size);

  const item = withGridCell(() =>
    withBindingScope({ kind: "product", base: "item" }, () => transformBlock(template, rootProps))
  );
  if (!item) {
    addWarning(`Section preset "${preset}" has an empty card template; the grid was dropped`);
    return null;
  }

  const itemWithTap = item.tap
    ? item
    : {
        ...item,
        tap: { type: "navigate", route: "/product/details/:productId", navigation_type: "push" },
      };

  return {
    id: generateId("products-grid"),
    type: "gridView",
    props: {
      crossAxisCount: columns,
      mainAxisSpacing: gap,
      crossAxisSpacing: gap,
      childAspectRatio: estimateGridAspectRatio([itemWithTap], columns, gap, 0.75),
      enableInnerScroll: false,
      emptyMessage: "لا توجد منتجات",
      errorMessage: "حدث خطأ",
      data: buildCollectionDataBlock(
        requestKey,
        requestUrl,
        "product-list",
        size,
        collectionRef !== "all" ? collectionRef : undefined
      ),
    },
    itemBuilder: {
      type: "repeat",
      source: `dataContext.requests.${requestKey}.data`,
      item: itemWithTap,
    },
  };
}

// ─── Customer order presets ─────────────────────────────────────────────────
//
// The engine has had full orders support for a while (`OrderCubit.loadOrders` /
// `loadOrderDetail`, dispatched from `EngineRequestMapper` in the mobile repo) but the
// converter had no vocabulary for it: `readSectionPreset` was only ever consulted by
// `transformProductsTemplateSection`, so every `customer-order*` Section fell through to a
// plain static column and the page declared no request at all. The result rendered as a
// card of empty strings with a dead pager.
//
// Requests are classified by URL substring on the mobile side, so these paths are load-bearing:
//   `/customer/orders`      + no id segment → `_isCustomerOrdersListRequest`  → loadOrders
//   `/customer/orders/<id>`                → `_isCustomerOrderDetailRequest` → loadOrderDetail
// Changing them silently unhooks the cubit — the page still renders, just never fetches.

const ORDER_LIST_REQUEST_KEY = "customer-orders";
const ORDER_DETAIL_REQUEST_KEY = "customer-order-detail";
const ORDER_DETAIL_BASE = `dataContext.requests.${ORDER_DETAIL_REQUEST_KEY}.data`;
const ORDER_PAGE_SIZE = 20;

/**
 * `/orders` is one of the three routes `variant_screen.dart`'s `_isOrderRoute` recognises
 * (`/orders`, `/orders/track`, `/orders/<id>`); off them the `OrderCubit` host is never
 * mounted and the request is collected but never dispatched.
 */
function isOrdersListRoute(): boolean {
  return _currentRoute === "/orders";
}

function isOrderDetailRoute(): boolean {
  return /^\/orders\/[^/]+$/.test(_currentRoute);
}

/**
 * The one-template-card contract, shared with the products presets: `content` is exactly one
 * `Group` whose children bind through `valueContext`, and the web repeater clones it per row
 * at render time. `cardTemplate` mirrors `content[0]` and is the only copy left if the web
 * editor cleared `content`.
 */
function readCardTemplate(block: Record<string, unknown>): Record<string, unknown> | null {
  const props = (block.props || {}) as Record<string, unknown>;
  const children = getChildren(block);
  const cardTemplate = Array.isArray(props.cardTemplate) ? (props.cardTemplate as Record<string, unknown>[]) : [];
  const source = children.length > 0 ? children : cardTemplate;
  if (source.length !== 1) return null;
  const template = source[0];
  return template?.type === "Group" ? template : null;
}

/**
 * `metadata.preset: "customer-orders"` → a `listView` over `GET /api/v1/customer/orders`.
 *
 * Each row taps through to `/orders/:orderId`; the engine's `_lookupRouteValue` fills
 * `:orderId` from the repeat item, so no explicit binding is needed on the tap.
 */
function transformCustomerOrdersSection(
  block: Record<string, unknown>,
  rootProps: Record<string, unknown>
): Record<string, unknown> | null {
  const template = readCardTemplate(block);
  if (!template) {
    addWarning(
      `Section preset "customer-orders" needs exactly one Group as its card template ` +
        `(the row cloned per order); found something else, so the orders list was left static ` +
        `and no request is declared`
    );
    return null;
  }

  if (!isOrdersListRoute()) {
    addWarning(
      `Section preset "customer-orders" sits on route "${_currentRoute}", but the mobile engine ` +
        `only mounts the OrderCubit on /orders — the list would render empty. Move it to the ` +
        `/orders page`
    );
    return null;
  }

  const item = withBindingScope({ kind: "orderList", base: "item" }, () => transformBlock(template, rootProps));
  if (!item) {
    addWarning(`Section preset "customer-orders" has an empty card template; the list was dropped`);
    return null;
  }

  const itemWithTap = item.tap
    ? item
    : { ...item, tap: { type: "navigate", route: "/orders/:orderId", navigation_type: "push" } };

  return {
    id: generateId("customer-orders"),
    type: "listView",
    props: {
      enableInnerScroll: false,
      emptyMessage: "لا توجد طلبات",
      errorMessage: "تعذّر تحميل الطلبات",
      data: {
        source: "collection",
        id: ORDER_LIST_REQUEST_KEY,
        requestKey: ORDER_LIST_REQUEST_KEY,
        requestUrl: `/api/v1/customer/orders?page=0&size=${ORDER_PAGE_SIZE}`,
        page: 0,
        size: ORDER_PAGE_SIZE,
      },
    },
    itemBuilder: {
      type: "repeat",
      source: `dataContext.requests.${ORDER_LIST_REQUEST_KEY}.data`,
      item: itemWithTap,
    },
  };
}

/**
 * `customer-order-items` / `customer-order-timeline` → a `listView` repeating over a slice of
 * the **already-declared** order-detail request. These rows are not their own fetch: `items`
 * and `timeline` arrive inside the same `CustomerOrder`, so the repeat source is a path into
 * that response and no `data` block is emitted.
 */
function transformOrderSubListSection(
  block: Record<string, unknown>,
  rootProps: Record<string, unknown>,
  kind: "orderItem" | "orderTimeline"
): Record<string, unknown> | null {
  const preset = kind === "orderItem" ? "customer-order-items" : "customer-order-timeline";
  const field = kind === "orderItem" ? "items" : "timeline";

  const template = readCardTemplate(block);
  if (!template) {
    addWarning(`Section preset "${preset}" needs exactly one Group as its row template; left static`);
    return null;
  }

  if (!isOrderDetailRoute()) {
    addWarning(
      `Section preset "${preset}" reads the order-detail request, which only exists on ` +
        `/orders/:orderId; on "${_currentRoute}" it has nothing to repeat over`
    );
    return null;
  }

  const item = withBindingScope({ kind, base: "item" }, () => transformBlock(template, rootProps));
  if (!item) {
    addWarning(`Section preset "${preset}" has an empty row template; the list was dropped`);
    return null;
  }

  return {
    id: generateId(preset),
    type: "listView",
    props: {
      enableInnerScroll: false,
      emptyMessage: kind === "orderItem" ? "لا توجد عناصر" : "لا يوجد سجل",
    },
    itemBuilder: {
      type: "repeat",
      source: `${ORDER_DETAIL_BASE}.${field}`,
      item,
    },
  };
}

/**
 * Declares `GET /api/v1/customer/orders/:orderId` once per page. `:orderId` comes from the
 * route, which the engine resolves in `resolveRequestUrl` before classifying the request.
 *
 * The request rides on a plain `container`: `_buildMappedRequest` reads `props.data` off any
 * node type, not just list views, so the detail page's non-repeating Sections (header, totals,
 * address, notes) can share one fetch.
 */
function buildOrderDetailRequestData(): Record<string, unknown> {
  return {
    source: "collection",
    id: ORDER_DETAIL_REQUEST_KEY,
    requestKey: ORDER_DETAIL_REQUEST_KEY,
    requestUrl: "/api/v1/customer/orders/:orderId",
    page: 0,
    size: 1,
  };
}

function transformProductCarousel(block: Record<string, unknown>, rootProps: Record<string, unknown>): Record<string, unknown> {
  const props = (block.props || {}) as Record<string, unknown>;
  const maxProducts = parseInt((props.maxProducts as string) || "8", 10);
  const requestKey = "product-list";

  return {
    id: generateId("product-carousel"),
    type: "listView",
    props: {
      scrollDirection: "horizontal",
      data: {
        source: "collection",
        id: "product-carousel",
        requestKey,
        requestUrl: "/api/v1/public/products?page=0&size=20",
        page: 0,
        size: Math.min(maxProducts, 20),
      },
    },
    itemBuilder: {
      type: "repeat",
      source: `dataContext.requests.${requestKey}.data`,
      item: {
        id: generateId("carousel-item"),
        type: "card",
        props: { elevation: 1, borderRadius: 12 },
        child: {
          id: generateId("carousel-body"),
          type: "column",
          props: { crossAxisAlignment: "start", mainAxisAlignment: "start", gap: 4 },
          children: [
            { id: generateId("carousel-img"), type: "image", props: { urlPath: "item.image", source: "network", fit: "cover", width: 160, height: 160, borderRadius: "md" } },
            { id: generateId("carousel-name"), type: "text", props: { valuePath: "item.name", fontSize: 12, fontWeight: "bold" } },
            { id: generateId("carousel-price"), type: "text", props: { valuePath: "item.price", fontSize: 12 } },
          ],
        },
        tap: { type: "navigate", route: "/product/details/:productId", navigation_type: "push" },
      },
    },
  };
}

/**
 * The all-in-one `ProductDetails` block: image, name, price, add to cart.
 *
 * It binds to the `product-detail` request but never declared one, so on its own it rendered an
 * empty page with a dead button. It now carries its own request and variant picker, the same way
 * the route-bound Group does — this block *is* a product-detail page, so the two agree by
 * construction rather than by the merchant happening to place them together.
 */
function transformProductDetails(block: Record<string, unknown>, rootProps: Record<string, unknown>): Record<string, unknown> {
  const lang = (rootProps.language as string) || "ar";
  const firstOnPage = !_productDetailRequestEmitted;
  _productDetailRequestEmitted = true;
  _variantPickerAvailable = true;

  const column: Record<string, unknown> = {
    id: generateId("product-detail"),
    type: "column",
    props: { crossAxisAlignment: "stretch", mainAxisAlignment: "start", gap: 16 },
    children: [
      {
        id: generateId("pd-image"),
        type: "image",
        props: { urlPath: `${PRODUCT_DETAIL_BASE}.primaryImageUrl`, source: "network", fit: "cover", borderRadius: "md", height: 300 },
      },
      {
        id: generateId("pd-name"),
        type: "text",
        props: { valuePath: `${PRODUCT_DETAIL_BASE}.name`, fontSize: 22, fontWeight: "bold" },
      },
      {
        id: generateId("pd-price"),
        type: "text",
        props: { valuePath: `${PRODUCT_DETAIL_BASE}.price`, fontSize: 18, color: "#0b78c5" },
      },
      transformProductVariants(rootProps),
      {
        id: generateId("pd-add-cart"),
        type: "button",
        props: { label: lang === "ar" ? "أضف إلى السلة" : "Add to cart", height: 48, variant: "elevated", fullWidth: true },
        tap: withBindingScope({ kind: "product", base: PRODUCT_DETAIL_BASE }, buildAddToCartTap),
      },
    ],
  };

  const form = {
    id: generateId("pd-variant-form"),
    type: "form",
    props: { id: VARIANT_FORM_ID, formId: VARIANT_FORM_ID },
    child: column,
  };

  const node = firstOnPage
    ? {
        id: generateId("product-detail-request"),
        type: "container",
        props: {
          expand: true,
          data: { ...PRODUCT_DETAIL_REQUEST },
          errorMessage: lang === "ar" ? "تعذر تحميل تفاصيل المنتج" : "Could not load product details",
          emptyMessage: lang === "ar" ? "المنتج غير متوفر" : "Product unavailable",
        },
        child: form,
      }
    : form;

  return applyLayout(node, (block.props as Record<string, unknown>).layout as Record<string, unknown> | undefined, rootProps);
}

/** Legacy `CartSection` / `CartList` — a generic cart list with a fixed row template. */
/**
 * The live cart collection. Every `itemBuilder.source` has to start with `dataContext.` or
 * `props.` — a bare `cart.items` resolves against nothing and the list renders permanently empty.
 */
const CART_ITEMS_SOURCE = "dataContext.cart.items";

/** True if anything on the page repeats over the live cart. */
function hasCartBinding(node: unknown): boolean {
  if (Array.isArray(node)) return node.some(hasCartBinding);
  if (!node || typeof node !== "object") return false;
  const n = node as Record<string, unknown>;
  const source = (n.itemBuilder as Record<string, unknown> | undefined)?.source;
  if (typeof source === "string" && source.endsWith("cart.items")) return true;
  return Object.values(n).some(hasCartBinding);
}

/**
 * The cart screen, hand-written rather than converted.
 *
 * This is the one page a website genuinely cannot be mapped 1:1 from: the web cart is server-
 * rendered HTML, the mobile cart is local state in the `cart` cubit. A merchant who lays out a
 * `/cart` page in the web builder gets a heading, some prose and a "keep browsing" link — no list
 * bound to `dataContext.cart.items`, no quantity stepper, no remove button, no total, no checkout.
 * The cart tab is decoration, and nothing in the block palette would fix that.
 *
 * So when a `/cart` page arrives with no cart binding on it, its body is replaced with this: the
 * shape the engine ships in `mobile_production_v2.json`, re-coloured from the merchant's theme. A
 * cart line has exactly `variantId, productId, quantity, productTitle, variantTitle, unitPrice,
 * thumbnailUrl, unitPriceFormatted, lineTotalFormatted` — every binding below is one of those.
 */
function buildCanonicalCartBody(rootProps: Record<string, unknown>): Record<string, unknown>[] {
  const primary = resolveThemeColor("theme-primary", rootProps) || "#132A4F";
  const surface = resolveThemeColor("theme-surface", rootProps) || "#FFFFFF";
  const text = resolveThemeColor("theme-text", rootProps) || "#0F172A";
  const muted = resolveThemeColor("theme-neutral", rootProps) || "#64748B";
  const shade = resolveThemeColor("theme-background", rootProps) || "#F1F5F9";
  const danger = resolveThemeColor("theme-error", rootProps) || "#DC2626";

  const qtyButton = (label: string, delta: number) => ({
    id: generateId("cart-qty"),
    type: "button",
    props: { label, variant: "text", textColor: muted },
    tap: {
      type: "cubitCall", cubit: "cart", method: "updateQuantity",
      params: { variantId: { source: "item", field: "variantId" }, delta: { value: delta } },
    },
  });

  const line = {
    id: generateId("cart-line"),
    type: "card",
    props: { color: surface, borderRadius: 16, elevation: 0 },
    style: { margin: { bottom: 12 } },
    child: {
      id: generateId("cart-line-inner"),
      type: "container",
      style: { padding: 14 },
      child: {
        id: generateId("cart-line-col"),
        type: "column",
        props: { crossAxisAlignment: "stretch", gap: 10 },
        children: [
          {
            id: generateId("cart-line-top"),
            type: "row",
            props: { mainAxisAlignment: "spaceBetween", crossAxisAlignment: "center" },
            children: [
              {
                id: generateId("cart-line-total-col"),
                type: "column",
                props: { crossAxisAlignment: "start", gap: 2 },
                children: [
                  { id: generateId("cart-line-total-label"), type: "text", props: { value: "المبلغ الكلي", fontSize: 12, textAlign: "right", color: muted } },
                  { id: generateId("cart-line-total-val"), type: "text", props: { valuePath: "item.lineTotalFormatted", value: "", fontSize: 18, fontWeight: "bold", textAlign: "right", color: primary } },
                ],
              },
              {
                id: generateId("cart-stepper"),
                type: "container",
                style: { background: shade, borderRadius: 10, padding: { left: 4, right: 4, top: 2, bottom: 2 } },
                child: {
                  id: generateId("cart-stepper-row"),
                  type: "row",
                  props: { gap: 2, crossAxisAlignment: "center" },
                  children: [
                    qtyButton("−", -1),
                    {
                      id: generateId("cart-qty-wrap"),
                      type: "container",
                      props: { width: 28 },
                      child: {
                        id: generateId("cart-qty-col"),
                        type: "column",
                        props: { crossAxisAlignment: "center", mainAxisAlignment: "center" },
                        children: [{ id: generateId("cart-qty-val"), type: "text", props: { valuePath: "item.quantity", value: "1", fontSize: 14, fontWeight: "bold", textAlign: "center", color: text } }],
                      },
                    },
                    qtyButton("+", 1),
                  ],
                },
              },
            ],
          },
          { id: generateId("cart-line-div"), type: "divider" },
          {
            id: generateId("cart-line-bottom"),
            type: "row",
            props: { gap: 12, crossAxisAlignment: "start" },
            children: [
              { id: generateId("cart-line-img"), type: "image", props: { source: "network", urlPath: "item.thumbnailUrl", url: "", width: 88, height: 88, fit: "cover" }, style: { borderRadius: 12 } },
              {
                id: generateId("cart-line-info-expand"),
                type: "container",
                props: { expand: true },
                child: {
                  id: generateId("cart-line-info"),
                  type: "column",
                  props: { crossAxisAlignment: "stretch", gap: 8 },
                  children: [
                    { id: generateId("cart-line-name"), type: "text", props: { valuePath: "item.productTitle", value: "", fontSize: 15, fontWeight: "bold", textAlign: "right", color: text, maxLines: 2, overflow: "ellipsis" } },
                    { id: generateId("cart-line-variant"), type: "text", props: { valuePath: "item.variantTitle", value: "", fontSize: 12, textAlign: "right", color: muted, maxLines: 1, overflow: "ellipsis" } },
                    {
                      id: generateId("cart-line-price-row"),
                      type: "row",
                      props: { mainAxisAlignment: "spaceBetween", crossAxisAlignment: "center" },
                      children: [
                        {
                          id: generateId("cart-line-price-wrap"),
                          type: "container",
                          props: { expand: true },
                          child: {
                            id: generateId("cart-line-price"),
                            type: "text",
                            props: { valuePath: "item.lineTotalFormatted", value: "", fontSize: 16, fontWeight: "bold", textAlign: "left", color: primary, maxLines: 1, overflow: "ellipsis" },
                          },
                        },
                        {
                          id: generateId("cart-line-remove"),
                          type: "button",
                          props: { label: "", variant: "text", icon: "delete_outline", textColor: danger },
                          tap: { type: "cubitCall", cubit: "cart", method: "removeItem", params: { variantId: { source: "item", field: "variantId" } } },
                        },
                      ],
                    },
                  ],
                },
              },
            ],
          },
        ],
      },
    },
  };

  return [{
    id: generateId("cart-body-expand"),
    type: "container",
    props: { expand: true },
    child: {
      id: generateId("cart-fixed-col"),
      type: "column",
      props: { crossAxisAlignment: "stretch", mainAxisSize: "max", gap: 0 },
      children: [
        {
          id: generateId("cart-scroll-area"),
          type: "container",
          props: { expand: true },
          child: {
            id: generateId("cart-scroll"),
            type: "singleChildScrollView",
            child: {
              id: generateId("cart-main-col"),
              type: "column",
              props: { crossAxisAlignment: "stretch", gap: 24 },
              children: [
                {
                  id: generateId("cart-items-list"),
                  type: "listView",
                  props: { enableInnerScroll: false, emptyMessage: "سلتك فارغة — تصفّح منتجاتنا وأضف ما يعجبك" },
                  itemBuilder: { type: "repeat", source: "dataContext.cart.items", item: line },
                },
                { id: generateId("cart-scroll-spacer"), type: "sizedBox", props: { height: 12 } },
              ],
            },
          },
        },
        {
          id: generateId("cart-footer"),
          type: "container",
          style: { background: surface, borderRadius: 16, padding: { left: 16, right: 16, top: 16, bottom: 16 }, shadow: "lg" },
          child: {
            id: generateId("cart-checkout-col"),
            type: "column",
            props: { gap: 12, crossAxisAlignment: "stretch" },
            children: [
              {
                id: generateId("cart-total-row"),
                type: "row",
                props: { mainAxisAlignment: "spaceBetween", crossAxisAlignment: "center" },
                children: [
                  { id: generateId("cart-total-label"), type: "text", props: { value: "المبلغ الإجمالي", fontSize: 12, fontWeight: "semibold", textAlign: "right", color: text } },
                  { id: generateId("cart-total-val"), type: "text", props: { valuePath: "dataContext.cart.subtotalFormatted", value: "", fontSize: 17, fontWeight: "bold", textAlign: "left", color: primary } },
                ],
              },
              {
                id: generateId("cart-checkout-btn"),
                type: "button",
                props: { label: "متابعة الدفع", variant: "filled", fullWidth: true, icon: "payment", iconPosition: "leading" },
                tap: {
                  type: "cubitCall", cubit: "cart", method: "assertNotEmpty",
                  onSuccess: { type: "navigate", route: "/checkout", navigation_type: "push" },
                },
              },
              {
                id: generateId("cart-continue-btn"),
                type: "button",
                props: { label: "متابعة التسوق", variant: "outlined", fullWidth: true, textColor: muted },
                tap: { type: "navigate", route: "/home", navigation_type: "clear_stack" },
              },
            ],
          },
        },
      ],
    },
  }];
}

function commerceThemeColors(rootProps: Record<string, unknown>) {
  return {
    primary: resolveThemeColor("theme-primary", rootProps) || "#132A4F",
    surface: resolveThemeColor("theme-surface", rootProps) || "#FFFFFF",
    text: resolveThemeColor("theme-text", rootProps) || "#0F172A",
    muted: resolveThemeColor("theme-neutral", rootProps) || "#475569",
    shade: resolveThemeColor("theme-background", rootProps) || "#F1F5F9",
    danger: resolveThemeColor("theme-error", rootProps) || "#DC2626",
    success: resolveThemeColor("theme-success", rootProps) || "#16A34A",
  };
}

function visibleWhenData(field: string, value: string) {
  return { source: "data", field, when: "equals", value };
}

/**
 * The engine's checkout screen, re-coloured from the merchant theme. Emitted whenever a `/checkout`
 * page arrives from the web side (which cannot express cubit-driven wizard state) or is synthesised
 * because the theme has a `/cart` but no checkout routes.
 *
 * Scope (v1): logged-in, saved-address picker, static COD payment, no coupon, no guest email.
 * Shape copied from `mobile_production_v2.json` § page-checkout.
 */
function buildCanonicalCheckoutBody(rootProps: Record<string, unknown>): {
  body: Record<string, unknown>[];
  footer: Record<string, unknown>;
} {
  const { primary, surface, text, muted, shade, danger } = commerceThemeColors(rootProps);

  const addressPickerSheet = {
    id: generateId("checkout-address-picker-sheet"),
    type: "column",
    props: { gap: 14, crossAxisAlignment: "stretch" },
    children: [
      {
        id: generateId("checkout-address-picker-header"),
        type: "row",
        props: { mainAxisAlignment: "spaceBetween", crossAxisAlignment: "center" },
        children: [
          {
            id: generateId("checkout-address-picker-title"),
            type: "text",
            props: { value: "اختر عنوان التوصيل", fontSize: 17, fontWeight: "bold", textAlign: "right", color: text },
          },
          {
            id: generateId("checkout-address-picker-close"),
            type: "container",
            props: { color: shade, borderRadius: 16 },
            style: { padding: 6 },
            tap: { type: "closeBottomSheet", semanticLabel: "إغلاق" },
            child: {
              id: generateId("checkout-address-picker-close-icon"),
              type: "icon",
              props: { name: "close", size: 16, color: muted },
            },
          },
        ],
      },
      {
        id: generateId("checkout-address-picker-options"),
        type: "radioGroup",
        props: {
          id: "addressOption",
          itemsPath: "checkout.addressOptions",
          selectedValuePath: "checkout.selectedAddressId",
          itemPadding: 12,
          color: surface,
          borderRadius: 12,
          border: { width: 1, color: "#E2E8F0" },
          selectedBorderColor: primary,
          activeColor: primary,
          gap: 10,
          emptyHint: "لا يوجد عنوان محفوظ بعد — أضف عنوانك الأول",
          semanticsLabel: "عناوين التوصيل",
          tap: {
            type: "cubitCall",
            cubit: "checkout",
            method: "selectSavedAddress",
            params: { addressId: { source: "tap", field: "value" } },
            onSuccess: { type: "closeBottomSheet" },
          },
          onItemRemove: {
            type: "cubitCall",
            cubit: "checkout",
            method: "deleteAddress",
            params: { addressId: { source: "tap", field: "value" } },
            onSuccess: { type: "closeBottomSheet" },
          },
        },
      },
      {
        id: generateId("checkout-address-picker-add"),
        type: "button",
        props: { label: "+ إضافة عنوان جديد", variant: "outlined", fullWidth: true, fontSize: 14 },
        tap: {
          type: "cubitCall",
          cubit: "checkout",
          method: "pickAddressLocation",
          semanticLabel: "إضافة عنوان جديد",
          onSuccess: { type: "navigate", route: "/checkout/address-details", navigation_type: "push" },
        },
      },
    ],
  };

  const summaryItem = {
    id: generateId("checkout-summary-item"),
    type: "container",
    style: { margin: { bottom: 10 } },
    child: {
      id: generateId("checkout-summary-item-row"),
      type: "row",
      props: { gap: 10, crossAxisAlignment: "center" },
      children: [
        {
          id: generateId("checkout-summary-item-thumb"),
          type: "image",
          props: { source: "network", urlPath: "item.thumbnailUrl", url: "", width: 48, height: 48, fit: "cover" },
          style: { borderRadius: 8 },
        },
        {
          id: generateId("checkout-summary-item-text-wrap"),
          type: "container",
          props: { expand: true, expandAxis: "horizontal" },
          child: {
            id: generateId("checkout-summary-item-text-col"),
            type: "column",
            props: { gap: 2, crossAxisAlignment: "start" },
            children: [
              {
                id: generateId("checkout-summary-item-title"),
                type: "text",
                props: { valuePath: "item.productTitle", value: "", fontSize: 13, fontWeight: "semibold", textAlign: "right", maxLines: 1, color: text },
              },
              {
                id: generateId("checkout-summary-item-variant"),
                type: "text",
                props: { valuePath: "item.variantTitle", value: "", fontSize: 12, textAlign: "right", maxLines: 1, color: muted },
              },
            ],
          },
        },
        {
          id: generateId("checkout-summary-item-total"),
          type: "text",
          props: { valuePath: "item.lineTotalFormatted", value: "", fontSize: 13, fontWeight: "semibold", textAlign: "left", color: text },
        },
      ],
    },
  };

  const summaryRow = (label: string, valuePath: string, opts?: { bold?: boolean; color?: string }) => ({
    id: generateId("checkout-summary-row"),
    type: "row",
    props: { mainAxisAlignment: "spaceBetween", crossAxisAlignment: "center" },
    children: [
      {
        id: generateId("checkout-summary-row-label"),
        type: "text",
        props: { value: label, fontSize: opts?.bold ? 15 : 13, fontWeight: opts?.bold ? "bold" : "normal", textAlign: "right", color: opts?.bold ? text : muted },
      },
      {
        id: generateId("checkout-summary-row-value"),
        type: "text",
        props: {
          valuePath,
          value: "",
          fontSize: opts?.bold ? 16 : 13,
          fontWeight: opts?.bold ? "bold" : "semibold",
          textAlign: "left",
          color: opts?.color || (opts?.bold ? primary : text),
        },
      },
    ],
  });

  const body: Record<string, unknown>[] = [{
    id: generateId("checkout-summary-wrap"),
    type: "column",
    props: { gap: 12, crossAxisAlignment: "stretch" },
    children: [
      {
        id: generateId("checkout-address-card"),
        type: "card",
        props: { color: surface, borderRadius: 14, elevation: 0 },
        child: {
          id: generateId("checkout-address-inner"),
          type: "container",
          style: { padding: 14 },
          child: {
            id: generateId("checkout-address-col"),
            type: "column",
            props: { gap: 10, crossAxisAlignment: "stretch" },
            children: [
              {
                id: generateId("checkout-address-header"),
                type: "row",
                props: { mainAxisAlignment: "spaceBetween", crossAxisAlignment: "center" },
                children: [
                  {
                    id: generateId("checkout-address-title-row"),
                    type: "row",
                    props: { gap: 6, crossAxisAlignment: "center" },
                    children: [
                      { id: generateId("checkout-address-pin"), type: "icon", props: { name: "location_on", size: 20, color: danger } },
                      { id: generateId("checkout-address-title"), type: "text", props: { value: "العنوان", fontSize: 15, fontWeight: "semibold", textAlign: "right", color: text } },
                    ],
                  },
                  {
                    id: generateId("checkout-address-edit"),
                    type: "row",
                    props: { gap: 4, crossAxisAlignment: "center" },
                    tap: { type: "openBottomSheet", semanticLabel: "تعديل العنوان", child: addressPickerSheet },
                    children: [
                      { id: generateId("checkout-address-edit-icon"), type: "icon", props: { name: "edit", size: 16, color: primary } },
                      { id: generateId("checkout-address-edit-label"), type: "text", props: { value: "تعديل", fontSize: 13, fontWeight: "semibold", color: primary } },
                    ],
                  },
                ],
              },
              { id: generateId("checkout-address-divider"), type: "divider", props: { height: 1, thickness: 1, color: shade } },
              {
                id: generateId("checkout-address-filled"),
                type: "column",
                props: { gap: 4, crossAxisAlignment: "stretch", visibleWhen: visibleWhenData("checkout.hasAddress", "true") },
                children: [
                  { id: generateId("checkout-address-summary"), type: "text", props: { valuePath: "checkout.addressSummary", value: "", fontSize: 14, fontWeight: "semibold", textAlign: "right", color: text } },
                  { id: generateId("checkout-address-label"), type: "text", props: { valuePath: "checkout.draft.shippingAddress.addressLabel", value: "", fontSize: 13, textAlign: "right", color: muted } },
                ],
              },
              {
                id: generateId("checkout-address-empty"),
                type: "text",
                props: {
                  value: "لم يتم حفظ عنوان بعد — اضغط تعديل لإضافة عنوانك",
                  fontSize: 13,
                  textAlign: "right",
                  color: muted,
                  visibleWhen: visibleWhenData("checkout.hasAddress", "false"),
                },
              },
            ],
          },
        },
      },
      {
        id: generateId("checkout-payment-card"),
        type: "card",
        props: { color: surface, borderRadius: 14, elevation: 0 },
        child: {
          id: generateId("checkout-payment-inner"),
          type: "container",
          style: { padding: 14 },
          child: {
            id: generateId("checkout-payment-col"),
            type: "column",
            props: { gap: 10, crossAxisAlignment: "stretch" },
            children: [
              { id: generateId("checkout-payment-title"), type: "text", props: { value: "طرق الدفع", fontSize: 15, fontWeight: "semibold", textAlign: "right", color: text } },
              {
                id: generateId("checkout-payment-cod"),
                type: "radioGroup",
                props: {
                  id: "paymentMethod",
                  selectedValuePath: "checkout.selectedPaymentMethod",
                  activeColor: primary,
                  selectedBorderColor: primary,
                  itemPadding: 12,
                  color: surface,
                  borderRadius: 12,
                  border: { width: 1, color: "#E2E8F0" },
                  gap: 10,
                  semanticsLabel: "طرق الدفع",
                  data: { items: [{ label: "الدفع عند الاستلام (COD)", value: "COD", subtitle: "ادفع نقداً عند التوصيل" }] },
                },
                tap: {
                  type: "cubitCall",
                  cubit: "checkout",
                  method: "selectPaymentMethod",
                  params: { providerCode: { source: "tap", field: "value" } },
                },
              },
            ],
          },
        },
      },
      {
        id: generateId("checkout-summary-card"),
        type: "card",
        props: { color: surface, borderRadius: 14, elevation: 0 },
        child: {
          id: generateId("checkout-summary-inner"),
          type: "container",
          style: { padding: 14 },
          child: {
            id: generateId("checkout-summary-col"),
            type: "column",
            props: { gap: 10, crossAxisAlignment: "stretch" },
            children: [
              { id: generateId("checkout-summary-title"), type: "text", props: { value: "ملخص الطلب", fontSize: 15, fontWeight: "semibold", textAlign: "right", color: text } },
              {
                id: generateId("checkout-summary-items"),
                type: "listView",
                props: { enableInnerScroll: false, emptyMessage: "سلتك فارغة" },
                itemBuilder: { type: "repeat", source: "dataContext.cart.items", item: summaryItem },
              },
              { id: generateId("checkout-summary-div1"), type: "divider", props: { height: 1, thickness: 1, color: shade } },
              summaryRow("المجموع الفرعي", "cart.subtotalFormatted"),
              summaryRow("الشحن", "checkout.shippingCostFormatted"),
              { id: generateId("checkout-summary-div2"), type: "divider", props: { variant: "dashed", height: 16, thickness: 1, color: "#CBD5E1" } },
              summaryRow("إجمالي الدفع", "checkout.payableTotalFormatted", { bold: true }),
            ],
          },
        },
      },
    ],
  }];

  const footer: Record<string, unknown> = {
    id: generateId("checkout-footer"),
    type: "container",
    props: { color: surface, shadow: "md" },
    style: { padding: { top: 12, bottom: 12, left: 16, right: 16 } },
    child: {
      id: generateId("checkout-place-order"),
      type: "button",
      props: { label: "تأكيد الطلب", variant: "filled", fullWidth: false, trailingTextPath: "checkout.payableTotalFormatted" },
      tap: {
        type: "cubitCall",
        cubit: "checkout",
        method: "placeOrder",
        onSuccess: { type: "navigate", route: "/order/success", navigation_type: "clear_stack" },
        onFailure: { type: "navigate", route: "/order/failure", navigation_type: "clear_stack" },
      },
    },
  };

  return { body, footer };
}

function buildAddressDetailsPage(rootProps: Record<string, unknown>): Record<string, unknown> {
  const { primary, surface, text, muted, shade } = commerceThemeColors(rootProps);

  const saveAddressTap = {
    type: "cubitCall",
    cubit: "checkout",
    method: "saveAddress",
    requireValidForm: true,
    formId: ADDRESS_DETAILS_FORM_ID,
    params: SYNTH_ADDRESS_SAVE_PARAMS,
    onSuccess: { type: "navigate", route: "/checkout" },
  };

  return {
    id: "page-address-details",
    route: "/checkout/address-details",
    title: "تفاصيل العنوان الجديد",
    background: shade,
    scroll: "vertical",
    padding: 0,
    appBar: {
      id: generateId("address-details-appbar"),
      type: "appBar",
      props: { title: "تفاصيل العنوان الجديد", elevation: 0, backgroundColor: surface, foregroundColor: text },
    },
    body: [{
      id: "address-details-col",
      type: "column",
      props: { gap: 12, crossAxisAlignment: "stretch" },
      style: { padding: { top: 12, bottom: 24, left: 16, right: 16 } },
      children: [
        {
          id: "address-details-location-card",
          type: "card",
          props: { color: surface, borderRadius: 14, elevation: 0 },
          child: {
            id: generateId("address-details-location-inner"),
            type: "container",
            style: { padding: 14 },
            child: {
              id: generateId("address-details-location-row"),
              type: "row",
              props: { mainAxisAlignment: "spaceBetween", crossAxisAlignment: "center", gap: 8 },
              children: [
                {
                  id: generateId("address-details-location-info-wrap"),
                  type: "container",
                  props: { expand: true },
                  child: {
                    id: generateId("address-details-location-info"),
                    type: "row",
                    props: { gap: 8, crossAxisAlignment: "center" },
                    children: [
                      { id: generateId("address-details-location-pin"), type: "icon", props: { name: "location_on", size: 22, color: primary } },
                      {
                        id: generateId("address-details-location-lines-wrap"),
                        type: "container",
                        props: { expand: true },
                        child: {
                          id: generateId("address-details-location-lines"),
                          type: "column",
                          props: { gap: 2, crossAxisAlignment: "start" },
                          children: [
                            { id: generateId("address-details-area-line"), type: "text", props: { valuePath: "checkout.pendingLocation.areaLine", value: "", fontSize: 14, fontWeight: "semibold", textAlign: "right", color: text, maxLines: 1 } },
                            { id: generateId("address-details-street-line"), type: "text", props: { valuePath: "checkout.pendingLocation.streetLine", value: "", fontSize: 12, textAlign: "right", color: muted, maxLines: 2 } },
                          ],
                        },
                      },
                    ],
                  },
                },
                {
                  id: generateId("address-details-edit-location"),
                  type: "text",
                  props: { value: "تعديل", fontSize: 13, fontWeight: "semibold", color: primary },
                  tap: { type: "cubitCall", cubit: "checkout", method: "pickAddressLocation", semanticLabel: "تعديل الموقع على الخريطة" },
                },
              ],
            },
          },
        },
        {
          id: ADDRESS_DETAILS_FORM_ID,
          type: "form",
          props: { formId: ADDRESS_DETAILS_FORM_ID, id: ADDRESS_DETAILS_FORM_ID },
          child: {
            id: "address-details-form-col",
            type: "column",
            props: { gap: 12, crossAxisAlignment: "stretch" },
            children: [
              {
                id: "address-details-label-chips",
                type: "radioGroup",
                props: {
                  id: "addressLabel",
                  layout: "chips",
                  value: "HOME",
                  activeColor: primary,
                  selectedBorderColor: primary,
                  color: surface,
                  borderRadius: 12,
                  gap: 10,
                  semanticsLabel: "نوع العنوان",
                  data: {
                    items: [
                      { label: "المنزل", value: "HOME", icon: "home" },
                      { label: "العمل", value: "WORK", icon: "work_outline" },
                      { label: "غير ذلك", value: "OTHER", icon: "more_horiz" },
                    ],
                  },
                },
              },
              { id: "address-details-recipient-name", type: "textFormField", props: { id: "recipientName", label: "اسم المستلم", hint: "مثال: Ahmed Ali", textDirection: "rtl", textAlign: "right", validateRequired: true } },
              { id: "address-details-recipient-phone", type: "textFormField", props: { id: "recipientPhone", label: "رقم هاتف المستلم", hint: "+963911000111", keyboardType: "phone", textDirection: "ltr", textAlign: "left", validateRequired: true, validatePhone: true } },
              { id: "address-details-governorate", type: "textFormField", props: { id: "governorate", label: "المحافظة", hint: "مثال: Damascus", textDirection: "rtl", textAlign: "right", validateRequired: true } },
              { id: "address-details-city", type: "textFormField", props: { id: "city", label: "المدينة", hint: "مثال: Mezzeh", textDirection: "rtl", textAlign: "right", validateRequired: true } },
              { id: "address-details-street", type: "textFormField", props: { id: "streetAddress", label: "تفاصيل العنوان", hint: "مثال: Building 12, Floor 3", textDirection: "rtl", textAlign: "right", maxLines: 3, validateRequired: true } },
              {
                id: "address-details-hint-banner",
                type: "container",
                props: { color: "#FEF3C7", borderRadius: 10 },
                style: { padding: 10 },
                child: { id: "address-details-hint-text", type: "text", props: { value: "ⓘ تفاصيل العنوان تساعد الكابتن على الوصول إليك بسرعة ودقة.", fontSize: 11, textAlign: "right", color: "#92400E" } },
              },
              { id: "address-details-notes", type: "textFormField", props: { id: "addressNotes", label: "ملاحظات (اختياري)", hint: "مثال: Gate code 1234", textDirection: "rtl", textAlign: "right" } },
              {
                id: "address-details-default-toggle",
                type: "switchField",
                props: { id: "isDefault", label: "تعيين كعنوان افتراضي", activeColor: primary, visibleWhen: visibleWhenData("session.isLoggedIn", "true") },
              },
              {
                id: "address-details-confirm",
                type: "button",
                props: { label: "تأكيد عنوان التوصيل", variant: "filled", fullWidth: true, height: 48 },
                tap: saveAddressTap,
              },
            ],
          },
        },
      ],
    }],
  };
}

function buildOrderSuccessPage(rootProps: Record<string, unknown>): Record<string, unknown> {
  const { primary, text, muted, shade, success } = commerceThemeColors(rootProps);

  return {
    id: "page-order-success",
    route: "/order/success",
    title: "نجاح الطلب",
    background: shade,
    layout: "centered",
    padding: 0,
    body: [{
      id: generateId("order-success-expand"),
      type: "container",
      props: { expand: true },
      child: {
        id: generateId("order-success-center-wrap"),
        type: "column",
        props: { crossAxisAlignment: "stretch", mainAxisAlignment: "center", mainAxisSize: "max" },
        child: {
          id: generateId("order-success-root"),
          type: "container",
          child: {
            id: generateId("order-success-col"),
            type: "column",
            props: { crossAxisAlignment: "center", gap: 12 },
            children: [
              { id: generateId("order-success-icon"), type: "icon", props: { name: "check_circle", size: 72, color: success } },
              { id: generateId("order-success-title"), type: "text", props: { value: "تم تأكيد طلبك", fontSize: 22, fontWeight: "bold", textAlign: "center", color: text } },
              { id: generateId("order-success-sub"), type: "text", props: { value: "شكراً لتسوقك معنا. سنرسل لك تحديثات التوصيل.", fontSize: 14, textAlign: "center", color: muted } },
              { id: generateId("order-success-number"), type: "text", props: { valuePath: "checkout.lastOrder.orderNumber", value: "", fontSize: 16, fontWeight: "semibold", textAlign: "center", color: text } },
              {
                id: generateId("order-success-subtotal-row"),
                type: "row",
                props: { mainAxisAlignment: "center", crossAxisAlignment: "center", gap: 6 },
                children: [
                  { id: generateId("order-success-subtotal-label"), type: "text", props: { value: "المجموع الفرعي", fontSize: 13, color: muted } },
                  { id: generateId("order-success-subtotal-value"), type: "text", props: { valuePath: "checkout.lastOrder.subtotalFormatted", value: "", fontSize: 13, fontWeight: "semibold", color: text } },
                ],
              },
              {
                id: generateId("order-success-primary"),
                type: "button",
                props: { label: "العودة للرئيسية", variant: "filled", fullWidth: true, backgroundColor: primary },
                tap: { type: "navigate", route: "/home", navigation_type: "clear_stack" },
              },
            ],
          },
        },
      },
    }],
  };
}

function buildOrderFailurePage(rootProps: Record<string, unknown>): Record<string, unknown> {
  const { primary, text, muted, shade, danger } = commerceThemeColors(rootProps);

  return {
    id: "page-order-failure",
    route: "/order/failure",
    title: "فشل الطلب",
    background: shade,
    scroll: "vertical",
    padding: 0,
    body: [{
      id: generateId("order-failure-root"),
      type: "container",
      child: {
        id: generateId("order-failure-col"),
        type: "column",
        props: { crossAxisAlignment: "center", gap: 12 },
        children: [
          { id: generateId("order-failure-icon"), type: "icon", props: { name: "cancel", size: 72, color: danger } },
          { id: generateId("order-failure-title"), type: "text", props: { value: "تعذر إتمام الطلب", fontSize: 22, fontWeight: "bold", textAlign: "center", color: text } },
          { id: generateId("order-failure-sub"), type: "text", props: { value: "حاول مرة أخرى أو اختر طريقة دفع أخرى.", fontSize: 14, textAlign: "center", color: muted } },
          {
            id: generateId("order-failure-primary"),
            type: "button",
            props: { label: "إعادة المحاولة", variant: "filled", fullWidth: true, backgroundColor: primary },
            tap: { type: "navigate", route: "/checkout", navigation_type: "clear_stack" },
          },
        ],
      },
    }],
  };
}

function buildSyntheticCheckoutPage(route: string, rootProps: Record<string, unknown>): Record<string, unknown> {
  const { surface, text, shade } = commerceThemeColors(rootProps);

  if (route === "/checkout/address-details") return buildAddressDetailsPage(rootProps);
  if (route === "/order/success") return buildOrderSuccessPage(rootProps);
  if (route === "/order/failure") return buildOrderFailurePage(rootProps);

  const { body, footer } = buildCanonicalCheckoutBody(rootProps);
  return {
    id: "page-checkout",
    route: "/checkout",
    title: "إتمام الطلب",
    background: shade,
    scroll: "vertical",
    padding: 0,
    appBar: {
      id: generateId("checkout-appbar"),
      type: "appBar",
      props: { title: "إتمام الطلب", elevation: 0, backgroundColor: surface, foregroundColor: text },
    },
    footer,
    body,
  };
}

function ensureSyntheticCheckoutPages(pages: Record<string, unknown>[], rootProps: Record<string, unknown>): void {
  const hasCart = pages.some((p) => normalizeRoute((p.route as string) || "/") === "/cart");
  if (!hasCart) return;

  for (const route of SYNTHETIC_CHECKOUT_ROUTES) {
    const exists = pages.some((p) => normalizeRoute((p.route as string) || "/") === route);
    if (!exists) {
      pages.push(buildSyntheticCheckoutPage(route, rootProps));
      addWarning(
        `Synthesised checkout route "${route}" because the theme has /cart but no working checkout ` +
          "wizard — the engine needs these routes to place an order"
      );
    }
  }
}

function assertCheckoutContracts(pages: Record<string, unknown>[]): void {
  const violations: string[] = [];

  const walkTaps = (node: unknown, route: string): void => {
    if (Array.isArray(node)) {
      node.forEach((child) => walkTaps(child, route));
      return;
    }
    if (!node || typeof node !== "object") return;
    const n = node as Record<string, unknown>;
    const tap = n.tap as Record<string, unknown> | undefined;
    if (tap?.type === "cubitCall" && tap.cubit === "checkout" && tap.method === "placeOrder") {
      if (route === "/cart") violations.push("placeOrder tap on /cart (must be cart.assertNotEmpty hand-off)");
      if (!tap.onSuccess) violations.push(`placeOrder on ${route} missing onSuccess`);
      if (!tap.onFailure) violations.push(`placeOrder on ${route} missing onFailure`);
    }
    for (const value of Object.values(n)) walkTaps(value, route);
  };

  for (const page of pages) {
    const route = normalizeRoute((page.route as string) || "/");
    walkTaps(page.body, route);
    walkTaps(page.footer, route);
  }

  if (violations.length > 0) {
    addWarning(
      `Checkout contract violations (${violations.length}): ${violations.slice(0, 4).join("; ")}` +
        `${violations.length > 4 ? `; +${violations.length - 4} more` : ""}`
    );
  }
}

function transformCartSection(block: Record<string, unknown>, rootProps: Record<string, unknown>): Record<string, unknown> | null {
  // Shares the one-cart-list-per-page rule with `cartLineId` Groups: a page carrying
  // both a legacy CartList and a modern cart-row Group would otherwise render twice.
  if (_cartTemplateEmitted) {
    addWarning(`${block.type as string} dropped; the cart already renders as one listView over cart.items`);
    return null;
  }
  _cartTemplateEmitted = true;

  const node: Record<string, unknown> = {
    id: generateId("cart-list"),
    type: "listView",
    props: { emptyMessage: "السلة فارغة" },
    itemBuilder: {
      type: "repeat",
      source: CART_ITEMS_SOURCE,
      item: {
        id: generateId("cart-line-tpl"),
        type: "row",
        props: { gap: 12, crossAxisAlignment: "center" },
        children: [
          { id: generateId("cart-img-tpl"), type: "image", props: { urlPath: "item.thumbnailUrl", source: "network", width: 72, height: 72, fit: "cover" } },
          { id: generateId("cart-name-tpl"), type: "text", props: { valuePath: "item.productTitle", fontSize: 14 } },
        ],
      },
    },
  };
  return applyLayout(node, (block.props as Record<string, unknown>).layout as Record<string, unknown> | undefined, rootProps);
}

function transformCartSummary(block: Record<string, unknown>, rootProps: Record<string, unknown>): Record<string, unknown> {
  // `cart.subtotalFormatted` is the display string both hand-authored screens bind to.
  // The engine exposes no shipping/total equivalent on the cart (they live on the
  // checkout draft once an address sets a shipping quote), so those two rows stay
  // bound-but-empty until the merchant moves them to a CheckoutSummary.
  addWarning(
    "CartSummary shipping/total rows bind to cart.shipping / cart.total, which the cart cubit does not expose; " +
      "use CheckoutSummary on a /checkout page for shipping and order total"
  );
  const node: Record<string, unknown> = {
    id: generateId("cart-summary"),
    type: "card",
    props: { elevation: 1, borderRadius: 12 },
    child: {
      id: generateId("cs-body"),
      type: "column",
      props: { crossAxisAlignment: "stretch", mainAxisAlignment: "start", gap: 12 },
      children: [
        { id: generateId("cs-subtotal"), type: "text", props: { valuePath: "cart.subtotalFormatted", fontSize: 16, fontWeight: "bold" } },
        { id: generateId("cs-shipping"), type: "text", props: { valuePath: "cart.shipping", fontSize: 14, color: "#6b7d93" } },
        { id: generateId("cs-total"), type: "text", props: { valuePath: "cart.total", fontSize: 18, fontWeight: "bold", color: "#0b78c5" } },
      ],
    },
  };
  return applyLayout(node, (block.props as Record<string, unknown>).layout as Record<string, unknown> | undefined, rootProps);
}

function transformCheckoutForm(block: Record<string, unknown>, rootProps: Record<string, unknown>): Record<string, unknown> {
  const props = (block.props || {}) as Record<string, unknown>;
  const lang = (rootProps.language as string) || "ar";
  const rawFields = (props.fields as Record<string, unknown>[]) || [
    { name: "name", label: "الاسم الكامل", hint: "أدخل اسمك" },
    { name: "phone", label: "رقم الهاتف", hint: "09XXXXXXXX" },
    { name: "address", label: "العنوان", hint: "المدينة، الشارع" },
  ];
  const submissionAction = props.submissionAction as Record<string, unknown> | undefined;

  const addressFields = rawFields.filter((field) => {
    const fieldId = (field.name as string) || "";
    if (fieldId === "email") {
      addWarning("Email field omitted from address form; guest email belongs on /checkout contact card → placeOrder.params.guestEmail");
      return false;
    }
    return true;
  });

  const fieldNodes = addressFields.map((field) => {
    const fieldId = (field.name as string) || "";
    const fieldType = (field.type as string) || "";
    if (fieldType === "boolean" || fieldId === "isDefault") {
      return {
        id: generateId("cf-switch"),
        type: "switchField",
        props: {
          id: fieldId || "isDefault",
          label: (field.label as string) || "تعيين كعنوان افتراضي",
          activeColor: (rootProps.primary as string) || "#1D4ED8",
        },
      };
    }
    const fieldProps: Record<string, unknown> = {
      id: fieldId,
      label: (field.label as string) || "",
      hint: (field.placeholder as string) || (field.hint as string) || "",
      textDirection: fieldId === "phone" ? "ltr" : "rtl",
    };
    if (fieldId === "email") {
      fieldProps.keyboardType = "email";
      fieldProps.validateEmail = true;
    }
    if ((field.required as boolean) || fieldId === "name" || fieldId === "phone" || fieldId === "recipientName" || fieldId === "recipientPhone" || fieldId === "streetAddress") {
      fieldProps.validateRequired = true;
    }
    return { id: generateId("cf-field"), type: "textFormField", props: fieldProps };
  });

  const mapPickerBtn = {
    id: generateId("cf-map-picker"),
    type: "button",
    props: {
      label: lang === "ar" ? "تحديد الموقع على الخريطة" : "Pick location on map",
      variant: "outlined",
      fullWidth: true,
    },
    tap: { type: "cubitCall", cubit: "checkout", method: "pickAddressLocation" },
  };

  const node: Record<string, unknown> = {
    id: generateId("checkout-form"),
    type: "form",
    props: { formId: "checkout-address-form", id: "checkout-address-form" },
    child: {
      id: generateId("cf-fields"),
      type: "column",
      props: flexProps("start", "stretch", { gap: 16 }),
      children: [
        ...fieldNodes,
        mapPickerBtn,
        {
          id: generateId("cf-submit"),
          type: "button",
          props: {
            label: (props.submitLabel as string) || "متابعة",
            height: 48,
            variant: "elevated",
            fullWidth: true,
          },
          tap: submissionAction || {
            type: "cubitCall",
            cubit: "checkout",
            method: "saveAddress",
            requireValidForm: true,
            formId: "checkout-address-form",
          },
        },
      ],
    },
  };
  return applyLayout(node, props.layout as Record<string, unknown> | undefined, rootProps);
}

function transformCheckoutSummary(block: Record<string, unknown>, rootProps: Record<string, unknown>): Record<string, unknown> {
  const node: Record<string, unknown> = {
    id: generateId("co-summary"),
    type: "card",
    props: { elevation: 1, borderRadius: 12 },
    child: {
      id: generateId("cos-body"),
      type: "column",
      props: { crossAxisAlignment: "stretch", mainAxisAlignment: "start", gap: 12 },
      children: [
        { id: generateId("cos-subtotal"), type: "text", props: { valuePath: "checkout.draft.subtotal", fontSize: 16, fontWeight: "bold" } },
        { id: generateId("cos-shipping"), type: "text", props: { valuePath: "checkout.draft.shipping", fontSize: 14 } },
        { id: generateId("cos-total"), type: "text", props: { valuePath: "checkout.draft.total", fontSize: 18, fontWeight: "bold", color: "#0b78c5" } },
      ],
    },
  };
  return applyLayout(node, (block.props as Record<string, unknown>).layout as Record<string, unknown> | undefined, rootProps);
}

function transformOrderList(block: Record<string, unknown>, rootProps: Record<string, unknown>): Record<string, unknown> {
  const props = (block.props || {}) as Record<string, unknown>;
  // BLOCKS.md OrderHistory uses `limit`; the legacy converter input used `maxOrders`.
  const maxOrders = parseInt(String(props.maxOrders ?? props.limit ?? "10"), 10);
  const statusFilter = (props.statusFilter as string) || "all";
  const requestKey = "order-history";
  const statusQuery = statusFilter && statusFilter !== "all" ? `&status=${encodeURIComponent(statusFilter)}` : "";
  return {
    id: generateId("orders-list"),
    type: "listView",
    props: {
      requestKey,
      requestUrl: `/api/v1/customer/orders?page=0&size=${maxOrders}${statusQuery}`,
      emptyMessage: (props.emptyStateText as string) || "لا توجد طلبات بعد.",
    },
    itemBuilder: {
      type: "repeat",
      source: `dataContext.requests.${requestKey}.data`,
      item: {
        id: generateId("order-item"),
        type: "card",
        props: { borderRadius: 8 },
      },
    },
  };
}

function transformOrderDetails(block: Record<string, unknown>, rootProps: Record<string, unknown>): Record<string, unknown> {
  const node: Record<string, unknown> = {
    id: generateId("order-detail"),
    type: "column",
    props: { crossAxisAlignment: "stretch", mainAxisAlignment: "start", gap: 16 },
    children: [
      { id: generateId("od-number"), type: "text", props: { valuePath: "dataContext.requests.order-detail.data.orderNumber", fontSize: 18, fontWeight: "bold" } },
      { id: generateId("od-status"), type: "text", props: { valuePath: "dataContext.requests.order-detail.data.status", fontSize: 14 } },
      { id: generateId("od-total"), type: "text", props: { valuePath: "dataContext.requests.order-detail.data.total", fontSize: 16, fontWeight: "bold", color: "#0b78c5" } },
    ],
  };
  return applyLayout(node, (block.props as Record<string, unknown>).layout as Record<string, unknown> | undefined, rootProps);
}

// ─── BLOCKS.md-specific transformers ─────────────────────────────────────────

function buildTestimonialCardFromItem(
  item: Record<string, unknown>,
  parentProps: Record<string, unknown>,
  rootProps: Record<string, unknown>
): Record<string, unknown> {
  const lang = (parentProps.language as string) || (rootProps.language as string) || "ar";
  const dir = (rootProps.direction as string) || "rtl";
  const showAvatar = parentProps.showAvatars !== false;
  const showRating = parentProps.showRating !== false;

  const children: Record<string, unknown>[] = [];

  if (showAvatar && item.avatar) {
    children.push({
      id: generateId("tm-avatar"),
      type: "image",
      props: {
        url: item.avatar as string,
        source: "network",
        fit: "cover",
        borderRadius: "full",
        width: 48,
        height: 48,
      },
    });
  }

  if (showRating && item.rating) {
    children.push({
      id: generateId("tm-rating"),
      type: "text",
      props: { value: "★".repeat(item.rating as number), fontSize: 16, color: "#f59e0b" },
    });
  }

  const quote = resolveBilingual(item.text as string, item.textAr as string, lang);
  if (quote) {
    children.push({
      id: generateId("tm-quote"),
      type: "text",
      props: { value: quote, fontSize: 14, textAlign: dir === "rtl" ? "right" : "left" },
    });
  }

  const name = resolveBilingual(item.name as string, item.nameAr as string, lang);
  if (name) {
    children.push({
      id: generateId("tm-name"),
      type: "text",
      props: { value: name, fontSize: 14, fontWeight: "bold" },
    });
  }

  const role = resolveBilingual(item.role as string, item.roleAr as string, lang);
  if (role) {
    children.push({
      id: generateId("tm-role"),
      type: "text",
      props: { value: role, fontSize: 12, color: "#6b7d93" },
    });
  }

  return {
    id: generateId("testimonial"),
    type: "card",
    props: { elevation: 1, borderRadius: 12 },
    child: {
      id: generateId("tm-body"),
      type: "column",
      props: { crossAxisAlignment: "start", mainAxisAlignment: "start", gap: 8 },
      children,
    },
  };
}

function transformRichText(block: Record<string, unknown>, rootProps: Record<string, unknown>): Record<string, unknown> {
  const props = (block.props || {}) as Record<string, unknown>;
  const html = (props.richtext as string) || "";

  const node: Record<string, unknown> = {
    id: generateId("richtext"),
    type: "richtext",
    props: { value: html },
  };
  return applyLayout(node, props.layout as Record<string, unknown> | undefined, rootProps);
}

function transformTestimonials(block: Record<string, unknown>, rootProps: Record<string, unknown>): Record<string, unknown> {
  const props = (block.props || {}) as Record<string, unknown>;

  if (props.source === "cms") {
    addWarning("Testimonials CMS source not supported; using inline items only");
  }

  const inlineItems = (props.inlineItems as Record<string, unknown>[]) || Object.values(SAMPLE_TESTIMONIALS);
  const itemCount = Math.min(parseInt(String(props.itemCount || inlineItems.length), 10) || inlineItems.length, 12);
  const items = inlineItems.slice(0, itemCount);
  const layoutVariant = (props.layoutVariant as string) || "grid";
  const columns = parseInt(String(props.columns || 3), 10);
  const gap = 16;

  const cards = items.map((item) => buildTestimonialCardFromItem(item, props, rootProps));

  if (layoutVariant === "carousel") {
    return applyLayout(
      {
        id: generateId("testimonials-carousel"),
        type: "listView",
        props: { scrollDirection: "horizontal" },
        children: cards.map((card) => ({
          id: generateId("tm-carousel-cell"),
          type: "container",
          props: { width: 280 },
          child: card,
        })),
      },
      props.layout as Record<string, unknown> | undefined,
      rootProps
    );
  }

  const rows: Record<string, unknown>[] = [];
  for (let i = 0; i < cards.length; i += columns) {
    const rowItems = cards.slice(i, i + columns).map((card) => ({
      id: generateId("tm-row-cell"),
      type: "container",
      props: { expand: true, expandAxis: "horizontal" },
      child: card,
    }));
    rows.push({
      id: generateId("tm-row"),
      type: "row",
      props: { mainAxisAlignment: "spaceBetween", crossAxisAlignment: "stretch", gap },
      children: rowItems,
    });
  }

  return applyLayout(
    {
      id: generateId("testimonials-grid"),
      type: "column",
      props: { crossAxisAlignment: "stretch", mainAxisAlignment: "start", gap },
      children: rows,
    },
    props.layout as Record<string, unknown> | undefined,
    rootProps
  );
}

function transformImageGallery(block: Record<string, unknown>, rootProps: Record<string, unknown>): Record<string, unknown> {
  const props = (block.props || {}) as Record<string, unknown>;
  const images = (props.images as Record<string, unknown>[]) || [];
  const mode = (props.mode as string) || "grid";
  const gap = resolveThemePx(props.gap as string, rootProps, 16);
  const aspect = resolveAspectRatio(props.aspectRatio as string);
  const radius = resolveThemePx((props.radius as string) || "theme-md", rootProps, 12);
  const objectFit = (props.objectFit as string) || "cover";

  const imageNodes = images.map((img) => ({
    id: generateId("gallery-image"),
    type: "image",
    props: {
      url: (img.src as string) || "",
      source: "network",
      alt: bilingualProp(img.alt, rootProps),
      fit: objectFit,
      ...(aspect !== undefined ? { aspectRatio: aspect } : {}),
      borderRadius: radius,
    },
  }));

  if (mode === "slider") {
    const intervalMs = props.autoplayDuration
      ? (String(props.autoplayDuration).startsWith("theme-5") ? 5000 : parsePx(props.autoplayDuration as string, 5) * 1000)
      : 5000;
    return applyLayout(
      {
        id: generateId("gallery-slider"),
        type: "imageSlider",
        props: {
          images: images.map((img) => ({
            url: (img.src as string) || (img.url as string) || "",
            alt: (img.alt as string) || "",
          })),
          aspectRatio: aspect ?? 1.777,
          fit: objectFit,
          borderRadius: radius,
          autoPlay: props.autoplay === true || props.autoplay === "on",
          intervalMs,
          showIndicators: true,
          indicatorStyle: "dot",
        },
      },
      props.layout as Record<string, unknown> | undefined,
      rootProps
    );
  }

  const cols = parseInt(String(props.gridColumns || 3), 10);
  const gapSpacing = gap;
  const maxRows = parseInt(String(props.gridRows || 0), 10);
  let displayImages = imageNodes;
  if (maxRows > 0) displayImages = imageNodes.slice(0, cols * maxRows);

  return applyLayout(
    {
      id: generateId("gallery-grid"),
      type: "gridView",
      props: {
        crossAxisCount: cols,
        mainAxisSpacing: gapSpacing,
        crossAxisSpacing: gapSpacing,
        childAspectRatio: aspect ?? 1.0,
      },
      children: displayImages,
    },
    props.layout as Record<string, unknown> | undefined,
    rootProps
  );
}

function transformAccordion(block: Record<string, unknown>, rootProps: Record<string, unknown>): Record<string, unknown> {
  const props = (block.props || {}) as Record<string, unknown>;
  const items = (props.items as Record<string, unknown>[]) || [];
  const children: Record<string, unknown>[] = [];

  const heading = bilingualProp(props.heading, rootProps);
  const description = bilingualProp(props.description, rootProps);
  if (heading) {
    children.push({
      id: generateId("accordion-heading"),
      type: "text",
      props: { value: heading, fontSize: 18, fontWeight: "bold" },
    });
  }
  if (description) {
    children.push({
      id: generateId("accordion-desc"),
      type: "text",
      props: { value: description, fontSize: 14, color: "#6b7d93" },
    });
  }

  const variant = (props.variant as string) || "soft";
  const variantStyles: Record<string, Record<string, unknown>> = {
    soft: { backgroundColor: "#f8fafc", borderRadius: 8, showDivider: true },
    outline: { showDivider: true },
    minimal: { showDivider: false },
  };
  const tileStyle = variantStyles[variant] || variantStyles.soft;

  for (const item of items) {
    let tile: Record<string, unknown> = {
      id: generateId("accordion-item"),
      type: "expansionTile",
      props: {
        title: bilingualProp(item.title, rootProps),
        initiallyExpanded: item.open === true,
        ...tileStyle,
      },
      children: [
        {
          id: generateId("accordion-body"),
          type: "text",
          props: { value: bilingualProp(item.body, rootProps), fontSize: 14 },
        },
      ],
    };

    if (variant === "outline") {
      tile = {
        id: generateId("accordion-outline-wrap"),
        type: "container",
        props: { border: { width: 1, color: "#e2e8f0" }, borderRadius: 8 },
        child: tile,
      };
    }

    children.push(tile);
  }

  const node: Record<string, unknown> = {
    id: generateId("accordion"),
    type: "column",
    props: flexProps("start", "stretch", { gap: 0 }),
    children,
  };
  return applyLayout(node, props.layout as Record<string, unknown> | undefined, rootProps);
}

function transformBlank(_block: Record<string, unknown>, _rootProps: Record<string, unknown>): null {
  return null;
}

function transformProductInfo(block: Record<string, unknown>, rootProps: Record<string, unknown>): Record<string, unknown> {
  const props = (block.props || {}) as Record<string, unknown>;
  const product = props.product as Record<string, unknown> | undefined;
  const lang = (rootProps.language as string) || "ar";
  const dir = (rootProps.direction as string) || "rtl";
  const align = (props.align as string) || (dir === "rtl" ? "right" : "left");

  const title = lang === "ar"
    ? (product?.titleAr as string) || (product?.title as string) || ""
    : (product?.titleEn as string) || (product?.title as string) || "";

  const children: Record<string, unknown>[] = [];
  if (props.showTitle !== false && title) {
    children.push({
      id: generateId("pi-title"),
      type: "text",
      props: { value: title, fontSize: resolveFontSize(props.titleSize as string, 18), fontWeight: "bold", textAlign: align },
    });
  }
  if (props.showDescription !== false && product?.description) {
    children.push({
      id: generateId("pi-desc"),
      type: "text",
      props: { value: product.description as string, fontSize: 14, textAlign: align, color: "#6b7d93" },
    });
  }
  if (props.showPrice !== false) {
    children.push({
      id: generateId("pi-price"),
      type: "text",
      props: { value: `${product?.price ?? ""}`, fontSize: resolveFontSize(props.priceSize as string, 16), color: "#0b78c5", textAlign: align },
    });
  }

  const node: Record<string, unknown> = {
    id: generateId("product-info"),
    type: "column",
    props: { crossAxisAlignment: "stretch", mainAxisAlignment: "start", gap: 8 },
    children,
  };
  return applyLayout(node, props.layout as Record<string, unknown> | undefined, rootProps);
}

function transformWishlist(block: Record<string, unknown>, rootProps: Record<string, unknown>): Record<string, unknown> {
  const props = (block.props || {}) as Record<string, unknown>;
  const columns = parseInt(String(props.columns || 2), 10);
  const requestKey = "wishlist";

  return applyLayout(
    {
      id: generateId("wishlist-grid"),
      type: "gridView",
      props: {
        crossAxisCount: columns,
        mainAxisSpacing: resolveGridGap(props.gap as string),
        crossAxisSpacing: resolveGridGap(props.gap as string),
        requestKey,
        requestUrl: "/api/v1/customer/wishlist",
        emptyMessage: (props.emptyStateText as string) || "قائمة المفضلة فارغة.",
      },
      itemBuilder: {
        type: "repeat",
        source: `dataContext.requests.${requestKey}.data`,
        item: {},
      },
    },
    props.layout as Record<string, unknown> | undefined,
    rootProps
  );
}

// ─── Testimonial Block Transformers ──────────────────────────────────────────

const SAMPLE_TESTIMONIALS: Record<string, Record<string, unknown>> = {
  "t-1": { id: "t-1", name: "Sarah", nameAr: "سارة", role: "Customer", roleAr: "زبونة", avatar: "", rating: 5, text: "Great product and excellent service!", textAr: "منتج رائع وخدمة ممتازة!" },
  "t-2": { id: "t-2", name: "Ahmed", nameAr: "أحمد", role: "Merchant", roleAr: "تاجر", avatar: "", rating: 4, text: "Very satisfied with the quality.", textAr: "راضٍ جداً عن الجودة." },
  "t-3": { id: "t-3", name: "Layla", nameAr: "ليلى", role: "Designer", roleAr: "مصممة", avatar: "", rating: 5, text: "Beautiful designs and fast delivery!", textAr: "تصاميم جميلة وتوصيل سريع!" },
};

function transformTestimonialCard(block: Record<string, unknown>, rootProps: Record<string, unknown>): Record<string, unknown> {
  const props = (block.props || {}) as Record<string, unknown>;
  const lang = (rootProps.language as string) || "ar";
  const dir = (rootProps.direction as string) || "rtl";
  const testimonialId = (props.testimonial as string) || "t-1";
  const t = SAMPLE_TESTIMONIALS[testimonialId] || SAMPLE_TESTIMONIALS["t-1"];
  const variant = (props.variant as string) || "default";
  const elevationMap: Record<string, number> = { default: 1, outlined: 0, elevated: 4 };

  const children: Record<string, unknown>[] = [];

  const showAvatar = (props.showAvatar as string) !== "off";
  if (showAvatar && (t.avatar as string)) {
    children.push({
      id: generateId("tm-avatar"),
      type: "image",
      props: { url: t.avatar as string, source: "network", fit: "cover", borderRadius: "full", width: 48, height: 48 },
    });
  }

  const showRating = (props.showRating as string) !== "off";
  if (showRating && t.rating) {
    const stars = "★".repeat(t.rating as number);
    children.push({
      id: generateId("tm-rating"),
      type: "text",
      props: { value: stars, fontSize: 16, color: "#f59e0b" },
    });
  }

  const quote = resolveBilingual(t.text as string, t.textAr as string, lang);
  if (quote) {
    children.push({
      id: generateId("tm-quote"),
      type: "text",
      props: { value: quote, fontSize: 14, textAlign: dir === "rtl" ? "right" : "left" },
    });
  }

  const name = resolveBilingual(t.name as string, t.nameAr as string, lang);
  if (name) {
    children.push({
      id: generateId("tm-name"),
      type: "text",
      props: { value: name, fontSize: 14, fontWeight: "bold" },
    });
  }

  const role = resolveBilingual(t.role as string, t.roleAr as string, lang);
  if (role) {
    children.push({
      id: generateId("tm-role"),
      type: "text",
      props: { value: role, fontSize: 12, color: "#6b7d93" },
    });
  }

  const node: Record<string, unknown> = {
    id: generateId("testimonial"),
    type: "card",
    props: { elevation: elevationMap[variant] || 1, borderRadius: 12 },
    child: {
      id: generateId("tm-body"),
      type: "column",
      props: { crossAxisAlignment: "start", mainAxisAlignment: "start", gap: 8 },
      children,
    },
  };
  return applyLayout(node, props.layout as Record<string, unknown> | undefined, rootProps);
}

function transformTestimonialGrid(block: Record<string, unknown>, rootProps: Record<string, unknown>): Record<string, unknown> {
  const props = (block.props || {}) as Record<string, unknown>;
  const columns = parseInt((props.columns as string) || "2", 10);
  const gap = parsePx(props.gap as string | number, 24);
  const maxItems = parseInt((props.maxItems as string) || "6", 10);

  const cards = Object.values(SAMPLE_TESTIMONIALS)
    .slice(0, maxItems)
    .map((t) => {
      const cardBlock: Record<string, unknown> = {
        type: "TestimonialCard",
        props: { testimonial: t.id, showAvatar: props.showAvatar, showRating: props.showRating, variant: props.cardVariant || "default" },
      };
      return transformTestimonialCard(cardBlock as Record<string, unknown>, rootProps);
    });

  const rows: Record<string, unknown>[] = [];
  for (let i = 0; i < cards.length; i += columns) {
    const rowItems = cards.slice(i, i + columns).map((card) => ({
      id: generateId("tgrid-cell"),
      type: "container",
      props: { expand: true, expandAxis: "horizontal" },
      child: card,
    }));
    rows.push({
      id: generateId("tgrid-row"),
      type: "row",
      props: { mainAxisAlignment: "spaceBetween", crossAxisAlignment: "stretch", gap },
      children: rowItems,
    });
  }

  const node: Record<string, unknown> = {
    id: generateId("testimonial-grid"),
    type: "column",
    props: { crossAxisAlignment: "stretch", mainAxisAlignment: "start", gap },
    children: rows,
  };
  return applyLayout(node, props.layout as Record<string, unknown> | undefined, rootProps);
}

// ─── Utility Block Transformers ─────────────────────────────────────────────

function transformHtml(block: Record<string, unknown>, rootProps: Record<string, unknown>): Record<string, unknown> {
  const props = (block.props || {}) as Record<string, unknown>;
  const html = (props.html as string) || "";
  const stripped = html.replace(/<[^>]*>/g, "").trim();

  const node: Record<string, unknown> = {
    id: generateId("html-block"),
    type: "text",
    props: { value: stripped || "(empty)", fontSize: 14 },
  };
  return applyLayout(node, props.layout as Record<string, unknown> | undefined, rootProps);
}

function transformCountdown(block: Record<string, unknown>, rootProps: Record<string, unknown>): Record<string, unknown> {
  const props = (block.props || {}) as Record<string, unknown>;
  const lang = (rootProps.language as string) || "ar";
  const title = resolveBilingual(props.title as string, props.titleAr as string, lang);
  const showDays = (props.showDays as string) !== "off";
  const showHours = (props.showHours as string) !== "off";
  const showMinutes = (props.showMinutes as string) !== "off";
  const showSeconds = (props.showSeconds as string) !== "off";

  const units: { key: string; label: string; labelAr: string }[] = [];
  if (showDays) units.push({ key: "days", label: "Days", labelAr: "أيام" });
  if (showHours) units.push({ key: "hours", label: "Hours", labelAr: "ساعات" });
  if (showMinutes) units.push({ key: "minutes", label: "Minutes", labelAr: "دقائق" });
  if (showSeconds) units.push({ key: "seconds", label: "Seconds", labelAr: "ثواني" });

  const children: Record<string, unknown>[] = [];

  if (title) {
    children.push({
      id: generateId("cd-title"),
      type: "text",
      props: { value: title, fontSize: 18, fontWeight: "bold", textAlign: "center" },
    });
  }

  const unitNodes = units.map((unit) => ({
    id: generateId(`cd-${unit.key}`),
    type: "column",
    props: { crossAxisAlignment: "center", mainAxisAlignment: "center", gap: 4 },
    children: [
      { id: generateId(`cd-${unit.key}-val`), type: "timer", props: { durationMs: 0 } },
      { id: generateId(`cd-${unit.key}-lbl`), type: "text", props: { value: resolveBilingual(unit.label, unit.labelAr, lang), fontSize: 12, color: "#6b7d93" } },
    ],
  }));

  children.push({
    id: generateId("cd-units"),
    type: "row",
    props: { mainAxisAlignment: "center", crossAxisAlignment: "center", gap: 16 },
    children: unitNodes,
  });

  const node: Record<string, unknown> = {
    id: generateId("countdown"),
    type: "column",
    props: { crossAxisAlignment: "center", mainAxisAlignment: "center", gap: 12 },
    children,
  };
  return applyLayout(node, props.layout as Record<string, unknown> | undefined, rootProps);
}

function transformCookieConsent(block: Record<string, unknown>, rootProps: Record<string, unknown>): Record<string, unknown> {
  const props = (block.props || {}) as Record<string, unknown>;
  const lang = (rootProps.language as string) || "ar";
  const message = resolveBilingual(props.message as string, props.messageAr as string, lang);
  const acceptLabel = resolveBilingual(props.acceptLabel as string, props.acceptLabelAr as string, lang) || (lang === "ar" ? "قبول" : "Accept");
  const declineLabel = resolveBilingual(props.declineLabel as string, props.declineLabelAr as string, lang) || (lang === "ar" ? "رفض" : "Decline");

  const node: Record<string, unknown> = {
    id: generateId("cookie-consent"),
    type: "container",
    props: { color: "#1f2937", padding: { top: 16, bottom: 16, left: 16, right: 16 } },
    child: {
      id: generateId("cc-body"),
      type: "column",
      props: { crossAxisAlignment: "stretch", mainAxisAlignment: "start", gap: 12 },
      children: [
        { id: generateId("cc-message"), type: "text", props: { value: message, fontSize: 14, color: "#ffffff" } },
        {
          id: generateId("cc-buttons"),
          type: "row",
          props: { mainAxisAlignment: "end", crossAxisAlignment: "center", gap: 12 },
          children: [
            { id: generateId("cc-decline"), type: "button", props: { label: declineLabel, height: 36, variant: "outlined" } },
            { id: generateId("cc-accept"), type: "button", props: { label: acceptLabel, height: 36, variant: "elevated" } },
          ],
        },
      ],
    },
  };
  return applyLayout(node, props.layout as Record<string, unknown> | undefined, rootProps);
}

function transformSearchModal(block: Record<string, unknown>, rootProps: Record<string, unknown>): Record<string, unknown> {
  const props = (block.props || {}) as Record<string, unknown>;
  const lang = (rootProps.language as string) || "ar";
  const placeholder = resolveBilingual(props.placeholder as string, props.placeholderAr as string, lang) || (lang === "ar" ? "بحث عن منتجات…" : "Search products…");

  const node: Record<string, unknown> = {
    id: generateId("search-btn"),
    type: "button",
    props: { label: placeholder, icon: "search", height: 48, variant: "outlined", fullWidth: true },
    tap: { type: "navigate", route: "/search", navigation_type: "push" },
  };
  return applyLayout(node, props.layout as Record<string, unknown> | undefined, rootProps);
}

// ─── Shell Block Transformers ───────────────────────────────────────────────

function transformLogo(block: Record<string, unknown>, rootProps: Record<string, unknown>): Record<string, unknown> {
  const props = (block.props || {}) as Record<string, unknown>;

  const node: Record<string, unknown> = {
    id: generateId("logo"),
    type: "image",
    props: {
      url: (props.src as string) || "",
      source: "network",
      alt: (props.alt as string) || "Logo",
      fit: "contain",
      width: parsePx(props.width as string, 120),
      height: parsePx(props.height as string, 36),
    },
  };
  return applyLayout(node, props.layout as Record<string, unknown> | undefined, rootProps);
}

// ─── Legacy / Gap Block Transformers ─────────────────────────────────────────

function transformLogos(block: Record<string, unknown>, rootProps: Record<string, unknown>): Record<string, unknown> {
  const props = (block.props || {}) as Record<string, unknown>;
  const logos = (props.logos as Record<string, unknown>[]) || [];

  const node: Record<string, unknown> = {
    id: generateId("logos-list"),
    type: "listView",
    props: { scrollDirection: "horizontal", height: 60 },
    children: logos.map((logo) => ({
      id: generateId("logo"),
      type: "image",
      props: {
        url: (logo.src as string) || (logo.url as string) || "",
        source: "network",
        height: 48,
        fit: "contain",
        alt: (logo.alt as string) || "",
      },
    })),
  };
  return applyLayout(node, props.layout as Record<string, unknown> | undefined, rootProps);
}

function transformStats(block: Record<string, unknown>, rootProps: Record<string, unknown>): Record<string, unknown> {
  const props = (block.props || {}) as Record<string, unknown>;
  const items = (props.items as Record<string, unknown>[]) || [];

  const node: Record<string, unknown> = {
    id: generateId("stats-row"),
    type: "row",
    props: flexProps("spaceAround", "center"),
    children: items.map((item) => ({
      id: generateId("stat-col"),
      type: "column",
      props: flexProps("start", "center", { gap: 4 }),
      children: [
        {
          id: generateId("stat-value"),
          type: "text",
          props: { value: (item.title as string) || (item.value as string) || "", fontSize: 22, fontWeight: "bold" },
        },
        {
          id: generateId("stat-label"),
          type: "text",
          props: { value: (item.description as string) || (item.label as string) || "", fontSize: 14 },
        },
      ],
    })),
  };
  return applyLayout(node, props.layout as Record<string, unknown> | undefined, rootProps);
}

function transformContactForm(block: Record<string, unknown>, rootProps: Record<string, unknown>): Record<string, unknown> {
  const props = (block.props || {}) as Record<string, unknown>;
  const lang = (props.language as string) || (rootProps.language as string) || "ar";
  const ar = lang === "ar";
  const formId = (props.id as string) || "contact-form";

  // BLOCKS.md ContactForm exposes field toggles rather than a `fields[]` array.
  const defaultFields: Record<string, unknown>[] = [
    { name: "name", label: ar ? "الاسم" : "Name" },
    { name: "email", label: ar ? "البريد الإلكتروني" : "Email" },
    ...(props.showPhone !== false
      ? [{ name: "phone", label: ar ? "رقم الهاتف" : "Phone", required: props.requirePhone === true }]
      : []),
    ...(props.showSubject !== false ? [{ name: "subject", label: ar ? "الموضوع" : "Subject" }] : []),
    { name: "message", label: ar ? "الرسالة" : "Message" },
  ];
  const fields = (props.fields as Record<string, unknown>[]) || defaultFields;

  if (props.enableCaptcha === true) {
    addWarning("ContactForm CAPTCHA has no mobile equivalent; the converted form submits without it");
  }

  const fieldNodes = fields.map((field) => {
    const fieldId = (field.name as string) || "";
    const isLtrField = fieldId === "email" || fieldId === "phone";
    const fieldProps: Record<string, unknown> = {
      id: fieldId,
      label: (field.label as string) || "",
      hint: (field.placeholder as string) || "",
      textDirection: isLtrField ? "ltr" : ((rootProps.direction as string) === "rtl" ? "rtl" : "ltr"),
    };
    if (fieldId === "email") {
      fieldProps.keyboardType = "email";
      fieldProps.validateEmail = true;
    }
    if (fieldId === "phone") {
      fieldProps.keyboardType = "phone";
      fieldProps.validatePhone = true;
    }
    if (fieldId === "name" || fieldId === "email" || field.required === true) {
      fieldProps.validateRequired = true;
    }
    if (fieldId === "message") {
      fieldProps.maxLines = 5;
      fieldProps.minLines = 3;
    }
    return { id: generateId("contact-field"), type: "textFormField", props: fieldProps };
  });

  const headingNodes: Record<string, unknown>[] = [];
  const title = props.title as Record<string, unknown> | string | undefined;
  const subtitle = props.subtitle as Record<string, unknown> | string | undefined;
  const bilingual = (v: Record<string, unknown> | string | undefined) =>
    typeof v === "string" ? v : resolveBilingual(v?.en as string, v?.ar as string, lang);

  if (bilingual(title)) {
    headingNodes.push({
      id: generateId("contact-title"),
      type: "text",
      props: { value: bilingual(title), fontSize: 22, fontWeight: "bold" },
    });
  }
  if (bilingual(subtitle)) {
    headingNodes.push({
      id: generateId("contact-subtitle"),
      type: "text",
      props: { value: bilingual(subtitle), fontSize: 14, color: "#6b7d93" },
    });
  }

  const node: Record<string, unknown> = {
    id: generateId("contact-form"),
    type: "form",
    props: { formId, id: formId },
    child: {
      id: generateId("contact-col"),
      type: "column",
      props: flexProps("start", "stretch", { gap: 16 }),
      children: [
        ...headingNodes,
        ...fieldNodes,
        {
          id: generateId("contact-submit"),
          type: "button",
          props: {
            label: resolveBilingual(props.submitLabel as string, props.submitLabelAr as string, lang) || (ar ? "إرسال" : "Submit"),
            height: 48,
            variant: "elevated",
            fullWidth: (props.submitWidth as string) !== "auto",
          },
          tap: {
            type: "apiCall",
            method: "POST",
            url: (props.submitUrl as string) || "/api/v1/public/contact",
            requireValidForm: true,
            formId,
          },
        },
      ],
    },
  };
  return applyLayout(node, props.layout as Record<string, unknown> | undefined, rootProps);
}

function transformNavMenu(block: Record<string, unknown>, rootProps: Record<string, unknown>): Record<string, unknown> {
  const props = (block.props || {}) as Record<string, unknown>;
  const items = (props.items as Record<string, unknown>[]) || (props.links as Record<string, unknown>[]) || [];
  const lang = (rootProps.language as string) || "ar";

  const node: Record<string, unknown> = {
    id: generateId("nav-menu"),
    type: "column",
    props: flexProps("start", "stretch", { gap: 0 }),
    children: items.map((item) => {
      const linkProps = { link: item.link, href: item.href, pageId: item.pageId };
      const tap = resolveLayoutTap(linkProps as Record<string, unknown>, rootProps);
      return {
        id: generateId("nav-link"),
        type: "button",
        props: {
          label: resolveBilingual(item.label as string, item.labelAr as string, lang),
          variant: "text",
          fullWidth: true,
        },
        ...(tap ? { tap } : {}),
      };
    }),
  };
  return applyLayout(node, props.layout as Record<string, unknown> | undefined, rootProps);
}

function transformSidebar(block: Record<string, unknown>, rootProps: Record<string, unknown>): Record<string, unknown> | null {
  const props = (block.props || {}) as Record<string, unknown>;
  if ((props.showOnMobile as string) === "hidden") {
    addWarning("Sidebar has showOnMobile: \"hidden\"; block omitted");
    return null;
  }
  if (props.dock) addWarning("Sidebar dock prop is ignored on mobile; rendered as inline column");

  const children = getChildren(block);
  const node: Record<string, unknown> = {
    id: generateId("sidebar"),
    type: "column",
    props: flexProps("start", "stretch", { gap: 16 }),
    children: children.map((c) => transformBlock(c, rootProps)).filter(Boolean),
  };
  return applyLayout(node, props.layout as Record<string, unknown> | undefined, rootProps);
}

function transformTemplate(block: Record<string, unknown>, rootProps: Record<string, unknown>): Record<string, unknown> | null {
  const children = getChildren(block)
    .map((c) => transformBlock(c, rootProps))
    .filter(Boolean) as Record<string, unknown>[];

  if (children.length === 0) return null;
  if (children.length === 1) return children[0];

  return {
    id: generateId("template-flat"),
    type: "column",
    props: flexProps("start", "stretch", { gap: 8 }),
    children,
  };
}

function transformLoginButton(block: Record<string, unknown>, rootProps: Record<string, unknown>): Record<string, unknown> {
  const props = (block.props || {}) as Record<string, unknown>;
  const lang = (rootProps.language as string) || "ar";
  const node: Record<string, unknown> = {
    id: generateId("login-btn"),
    type: "button",
    props: {
      label: (props.guestLabel as string) || (lang === "ar" ? "تسجيل الدخول" : "Login"),
      variant: "text",
    },
    tap: { type: "navigate", route: "/auth/login", navigation_type: "push" },
  };
  return applyLayout(node, props.layout as Record<string, unknown> | undefined, rootProps);
}

function transformCartIconButton(_block: Record<string, unknown>, _rootProps: Record<string, unknown>): null {
  addWarning("CartIconButton omitted; use appBar.showCartIcon when SiteHeader is present");
  return null;
}

/**
 * The mobile launch screen. Only `image` and the six colour props are authorable in the web
 * editor (`@/core/config/blocks/SplashHero`) — everything else here is fixed by contract with the
 * mobile engine and mirrors that block's `SPLASH_HERO_DEFAULT_PROPS` verbatim, so a merchant edit
 * to any of these fields (icons, headline, button label, tap target) can never reach the output.
 */
function transformSplashHero(block: Record<string, unknown>, _rootProps: Record<string, unknown>): Record<string, unknown> {
  const props = (block.props || {}) as Record<string, unknown>;
  return {
    id: "splash-hero",
    type: "splashHero",
    props: {
      image: (props.image as string) || "assets/images/splashImage.png",
      imageFit: "contain",
      background: (props.background as string) || "#132A4F",
      decorColor: (props.decorColor as string) || "#2A3F63",
      accentColor: (props.accentColor as string) || "#E8912B",
      icons: [
        { name: "shopping_cart", color: "#12244A" },
        { name: "smartphone", color: "#FFFFFF", background: "#E8912B" },
        { name: "palette", color: "#12244A" },
        { name: "inventory_2", color: "#12244A" },
        { name: "local_shipping", color: "#12244A" },
        { name: "bookmark", color: "#12244A" },
      ],
      headline: "تسوق.. اختر, واستلم",
      headlineColor: (props.headlineColor as string) || "#FFFFFF",
      buttonLabel: "ابدأ الآن",
      buttonColor: (props.buttonColor as string) || "#D7DCE5",
      buttonTextColor: (props.buttonTextColor as string) || "#12244A",
      tap: { type: "navigate", route: "/home", navigation_type: "clear_stack" },
    },
  };
}

// ─── Block Dispatcher ───────────────────────────────────────────────────────

function transformBlock(block: Record<string, unknown>, rootProps: Record<string, unknown>): Record<string, unknown> | null {
  if (!block || typeof block !== "object") return null;

  _debugTrail.push(describeBlockForTrail(block));
  try {
    const node = dispatchBlock(block, rootProps);
    if (!node) return null;

    return applyShowCondition(node, (block.props || {}) as Record<string, unknown>);
  } catch (e) {
    tagWithTrail(e);
  } finally {
    _debugTrail.pop();
  }
}

function dispatchBlock(block: Record<string, unknown>, rootProps: Record<string, unknown>): Record<string, unknown> | null {
  const blockProps = (block.props || {}) as Record<string, unknown>;
  const layout = blockProps.layout as Record<string, unknown> | undefined;
  if (layout?.hideOnMobile === true) return null;

  const rawType = (block.type as string) || "";

  if (PRESET_ONLY_TYPES.has(rawType)) {
    addWarning(
      `"${rawType}" is a web preset, not a block — it should already be expanded into a cartLineId Group before export; skipped`
    );
    return null;
  }

  const type = normalizeBlockType(rawType);

  switch (type) {
    // Layout blocks
    case "Section": return transformSection(block, rootProps);
    case "Flex": return transformFlex(block, rootProps);
    case "Grid": return transformLayoutGrid(block, rootProps);
    case "RowGroup": {
      const rowBlock = {
        ...block,
        props: { ...blockProps, direction: "row" },
      };
      return transformGroup(rowBlock, rootProps);
    }
    case "Group":
    case "FlexGroup":
    case "Div": return transformGroup(block, rootProps);

    // Content blocks
    case "Heading": return transformHeading(block, rootProps);
    case "Text":
    case "Paragraph": return transformText(block, rootProps);
    case "RichText": return transformRichText(block, rootProps);
    case "Space": return transformSpace(block, rootProps);
    case "Button": return transformButton(block, rootProps);
    case "ButtonGroup": return transformButtonGroup(block, rootProps);
    case "Chip": return transformChip(block, rootProps);
    case "Link": return transformLink(block, rootProps);
    case "Input": return transformInput(block, rootProps);
    case "Switch": return transformSwitch(block, rootProps);
    case "ContentDropdown": return transformContentDropdown(block, rootProps);
    case "Icon": return transformIcon(block, rootProps);
    case "Image": return transformImage(block, rootProps);
    case "Video": return transformVideo(block, rootProps);
    case "YouTube": return transformYouTube(block, rootProps);
    case "Hero": return transformHero(block, rootProps);
    case "Card": return transformCard(block, rootProps);
    case "Badge": return transformBadge(block, rootProps);
    case "Divider": return transformDivider(block, rootProps);
    case "Accordion": return transformAccordion(block, rootProps);
    case "Blank": return transformBlank(block, rootProps);
    case "ImageGallery": return transformImageGallery(block, rootProps);
    case "Logos": return transformLogos(block, rootProps);
    case "Stats": return transformStats(block, rootProps);
    case "ContactForm": return transformContactForm(block, rootProps);
    case "NavMenu": return transformNavMenu(block, rootProps);
    case "Sidebar": return transformSidebar(block, rootProps);
    case "Template": return transformTemplate(block, rootProps);

    // Commerce blocks
    case "ProductImage": return transformProductImage(block, rootProps);
    case "ProductInfo": return transformProductInfo(block, rootProps);
    case "ProductCard": return transformProductCard(block, rootProps);
    case "ProductGrid": return transformProductGrid(block, rootProps);
    case "ProductCarousel": return transformProductCarousel(block, rootProps);
    case "ProductGallery": return transformProductGallery(block, rootProps);
    case "ProductDetails": return transformProductDetails(block, rootProps);
    case "ProductVariants":
      // Only meaningful against the detail request's `variants`. Anywhere else the itemsPath
      // resolves against nothing and the picker renders permanently empty.
      if (!_productDetailRequestEmitted) {
        addWarning(
          `ProductVariants sits outside a product-detail page, so there is no ` +
            `"${PRODUCT_DETAIL_REQUEST_KEY}" request for it to read variants from; dropped`
        );
        return noteUnsupportedBlock(rawType);
      }
      return transformProductVariants(rootProps);
    case "CartSection": return transformCartSection(block, rootProps);
    case "CartQuantity": return transformCartQuantity(block, rootProps);
    case "CartSummary": return transformCartSummary(block, rootProps);
    case "CheckoutForm": return transformCheckoutForm(block, rootProps);
    case "CheckoutSummary": return transformCheckoutSummary(block, rootProps);
    case "OrderList": return transformOrderList(block, rootProps);
    case "OrderDetails": return transformOrderDetails(block, rootProps);
    case "Wishlist": return transformWishlist(block, rootProps);

    // Testimonial blocks
    case "Testimonials": return transformTestimonials(block, rootProps);
    case "TestimonialCard": return transformTestimonialCard(block, rootProps);
    case "TestimonialGrid": return transformTestimonialGrid(block, rootProps);

    // Utility blocks
    case "ContentMap": return transformContentMap(block, rootProps);
    case "Html": return transformHtml(block, rootProps);
    case "Countdown": return transformCountdown(block, rootProps);
    case "CookieConsent": return transformCookieConsent(block, rootProps);
    case "SearchModal": return transformSearchModal(block, rootProps);

    // Header chrome blocks
    case "LoginButton": return transformLoginButton(block, rootProps);
    case "CartIconButton": return transformCartIconButton(block, rootProps);

    // Logo
    case "Logo": return transformLogo(block, rootProps);

    // The fixed mobile launch screen — only image + colors are authorable.
    case "SplashHero": return transformSplashHero(block, rootProps);

    // Zone / shell blocks handled at page level — return null to skip
    case "SiteHeader":
    case "SiteFooter":
    case "SiteDrawerShell":
    case "SideDrawer":
    case "ZoneDrawer":
      return null;

    // Overlay zones only reach the body when nothing triggers them (they are
    // otherwise inlined into `openBottomSheet` by resolveTap).
    case "ZonePopup":
    case "ZoneBottomSheet":
      addWarning(`${rawType} "${(blockProps.key as string) || ""}" has no zone trigger on this page; dropped`);
      return noteUnsupportedBlock(rawType);

    default: {
      if (UNSUPPORTED_LEAF_BLOCKS.has(type)) {
        addWarning(`Block type "${rawType}" has no mobile equivalent; dropped. If this merchant has a ${rawType === "CategoryListMenu" ? "categories" : "search"} screen, wire manually; otherwise omit the block.`);
        return noteUnsupportedBlock(rawType);
      }

      const props = block.props as Record<string, unknown> || {};
      const children = getChildren(block);
      if (children.length > 0) {
        addWarning(`Unknown block type "${rawType}"; converted children only`);
        noteUnsupportedBlock(`${rawType} (container — children kept, wrapper dropped)`);
        return {
          id: generateId("unknown"),
          type: "container",
          child: {
            id: generateId("unknown-body"),
            type: "column",
            props: { crossAxisAlignment: "stretch", mainAxisAlignment: "start", gap: 8 },
            children: children.map((c) => transformBlock(c, rootProps)).filter(Boolean),
          },
        };
      }

      addWarning(`Unsupported leaf block type "${rawType}"; skipped`);
      return noteUnsupportedBlock(rawType);
    }
  }
}

// ─── Theme Mapping ──────────────────────────────────────────────────────────

/**
 * `bodyFont` slug → the font family name the engine loads.
 *
 * Covers the Arabic-first `FONT_OPTIONS` list from BLOCKS-MOBILE.md plus the Latin faces. An
 * unknown or missing slug falls back to Tajawal, which is also the `system` face for Arabic —
 * so an Arabic store that never touched the setting keeps its previous output.
 */
const FONT_FAMILY_MAP: Record<string, string> = {
  // Arabic (FONT_OPTIONS)
  cairo: "Cairo", tajawal: "Tajawal", almarai: "Almarai",
  "ibm-plex-sans-arabic": "IBM Plex Sans Arabic", "noto-sans-arabic": "Noto Sans Arabic",
  "readex-pro": "Readex Pro", rubik: "Rubik", changa: "Changa", "el-messiri": "El Messiri",
  amiri: "Amiri", "noto-naskh-arabic": "Noto Naskh Arabic", "scheherazade-new": "Scheherazade New",
  // Latin
  "dm-sans": "DM Sans", inter: "Inter", roboto: "Roboto", "open-sans": "Open Sans",
  lato: "Lato", poppins: "Poppins", montserrat: "Montserrat", raleway: "Raleway",
  nunito: "Nunito", manrope: "Manrope", sora: "Sora",
  "playfair-display": "Playfair Display", merriweather: "Merriweather",
  lora: "Lora", "space-grotesk": "Space Grotesk", geist: "Geist",
  fraunces: "Fraunces",
};

/** Latin faces cannot render Arabic glyphs — an Arabic store asking for one gets Tajawal. */
const LATIN_ONLY_FONTS = new Set([
  "dm-sans", "inter", "roboto", "open-sans", "lato", "poppins", "montserrat", "raleway",
  "nunito", "manrope", "sora", "playfair-display", "merriweather", "lora",
  "space-grotesk", "geist", "fraunces",
]);

function transformFontFamily(fontSlug: string | undefined, language: string): string {
  const slug = fontSlug || "";
  if (slug === "system") return language === "ar" ? "Tajawal" : "Inter";
  if (language === "ar" && LATIN_ONLY_FONTS.has(slug)) return "Tajawal";
  return FONT_FAMILY_MAP[slug] || "Tajawal";
}

function transformTheme(rootProps: Record<string, unknown>): Record<string, unknown> {
  const lang = (rootProps.language as string) || "ar";

  return {
    mode: "light",
    colors: {
      primary: (rootProps.primary as string) || "#0b78c5",
      surface: (rootProps.surface as string) || "#f6f8fc",
      background: "#F1F5F9",
      text: (rootProps.text as string) || "#14243f",
      muted: (rootProps.neutral as string) || "#6b7d93",
      success: (rootProps.success as string) || "#16A34A",
      warning: (rootProps.warning as string) || "#D97706",
      error: (rootProps.error as string) || "#DC2626",
    },
    typography: {
      fontFamily: transformFontFamily(rootProps.bodyFont as string, lang),
      scale: { xs: 12, sm: 14, md: 16, lg: 18, xl: 22, xxl: 28, display: 36 },
      weights: { normal: 400, medium: 500, bold: 700 },
      lineHeight: { tight: 1.25, normal: 1.5, relaxed: 1.75 },
    },
    radius: {
      none: 0, sm: parsePx(rootProps.radiusSm as string, 8), md: parsePx(rootProps.radiusMd as string, 12),
      lg: parsePx(rootProps.radiusLg as string, 18), xl: parsePx(rootProps.radiusXl as string, 24), full: 9999,
    },
    // The web side exposes two named spacing scales (vertical + side). `theme.spacing` is the
    // engine's inline/box scale, so it tracks the **side** scale; `xl` borrows the vertical
    // medium step for the one level the side scale does not reach. Absent props keep the
    // previous fixed numbers, so a store that never touched the setting is unaffected.
    // Clamped to the phone budget: `md` is also the engine's default page inset, so a desktop
    // value here is charged twice per screen (see PHONE_SPACING_MAX).
    spacing: {
      xs: clampToPhone(4, PHONE_SPACING_MAX.xs, "theme.spacing.xs"),
      sm: clampToPhone(parsePx(rootProps.spacingSideNarrow as string, 10), PHONE_SPACING_MAX.sm, "theme.spacing.sm"),
      md: clampToPhone(parsePx(rootProps.spacingSideMedium as string, 16), PHONE_SPACING_MAX.md, "theme.spacing.md"),
      lg: clampToPhone(parsePx(rootProps.spacingSideWide as string, 24), PHONE_SPACING_MAX.lg, "theme.spacing.lg"),
      xl: clampToPhone(parsePx(rootProps.spacingVerticalMedium as string, 36), PHONE_SPACING_MAX.xl, "theme.spacing.xl"),
    },
    buttons: {
      sm: { height: parsePx(rootProps.buttonSmHeight as string, 36), padX: parsePx(rootProps.buttonSmPaddingX as string, 14), fontSize: parsePx(rootProps.buttonSmFontSize as string, 14), radius: 10 },
      md: { height: parsePx(rootProps.buttonMdHeight as string, 48), padX: parsePx(rootProps.buttonMdPaddingX as string, 18), fontSize: parsePx(rootProps.buttonMdFontSize as string, 16), radius: 12 },
      lg: { height: parsePx(rootProps.buttonLgHeight as string, 56), padX: parsePx(rootProps.buttonLgPaddingX as string, 26), fontSize: parsePx(rootProps.buttonLgFontSize as string, 16), radius: 14 },
    },
  };
}

const SPLASH_ROUTE = "/splash";

/**
 * The launch screen, emitted verbatim as `pages[0]` when the input carries no `/splash` page at
 * all — raw page arrays, hand-crafted fixtures, or pre-M1 exports. In the ordinary case the web
 * editor always authors a mandatory `/splash` page (`@/core/config/lib/site-data.ts`), which goes
 * through the normal `transformPage`/`transformSplashHero` pipeline instead; this is only the
 * defensive fallback so `navigation.initialRoute` always resolves to a real page.
 */
const SPLASH_PAGE: Record<string, unknown> = {
  id: "page-splash",
  route: SPLASH_ROUTE,
  title: "Splash",
  background: "#132A4F",
  layout: "centered",
  body: [
    {
      id: "splash-hero",
      type: "splashHero",
      props: {
        image: "assets/images/splashImage.png",
        imageFit: "contain",
        background: "#132A4F",
        decorColor: "#2A3F63",
        accentColor: "#E8912B",
        icons: [
          { name: "shopping_cart", color: "#12244A" },
          { name: "smartphone", color: "#FFFFFF", background: "#E8912B" },
          { name: "palette", color: "#12244A" },
          { name: "inventory_2", color: "#12244A" },
          { name: "local_shipping", color: "#12244A" },
          { name: "bookmark", color: "#12244A" },
        ],
        headline: "تسوق.. اختر, واستلم",
        headlineColor: "#FFFFFF",
        buttonLabel: "ابدأ الآن",
        buttonColor: "#D7DCE5",
        buttonTextColor: "#12244A",
        tap: { type: "navigate", route: "/home", navigation_type: "clear_stack" },
      },
    },
  ],
  padding: 0,
};

/**
 * Canonical tab chrome per route. A tab is only emitted for a route that has a real page, so this
 * is a lookup for label/icon — not the tab list itself. Routes absent here fall back to the page's
 * own title.
 */
const TAB_CATALOGUE: Record<string, { id: string; label: string; icon: string }> = {
  "/home": { id: "tab-home", label: "الرئيسية", icon: "home" },
  "/categories": { id: "tab-categories", label: "الأقسام", icon: "grid_view" },
  "/search": { id: "tab-search", label: "بحث", icon: "search" },
  "/cart": { id: "tab-cart", label: "السلة", icon: "shopping_cart" },
  "/profile": { id: "tab-profile", label: "حسابي", icon: "person" },
  "/products": { id: "tab-products", label: "المنتجات", icon: "grid_view" },
  "/wishlist": { id: "tab-wishlist", label: "المفضلة", icon: "favorite" },
  // Both standard pages, and both fell through to the fallback below before this entry existed:
  // the merchant's page title ("إعدادات الحساب", 14 chars) ran uncropped into a 5-tab bar and
  // clipped, and both landed on the fallback's one hardcoded icon ("article") — indistinguishable
  // from each other in the bar. v50 audit item 4.
  "/settings": { id: "tab-settings", label: "الحساب", icon: "settings" },
  "/about": { id: "tab-about", label: "عن المتجر", icon: "info" },
  // No `/login` entry: AUTH_ROUTE_ALIASES rewrites it to LOGIN_ROUTE, which is shell-excluded and
  // therefore ineligible for the tab bar. The drawer's login link covers it.
};

/**
 * Icon names the mobile engine accepts for `navigation.tabs[].icon` — the union of
 * supported-icons.md categories (أ) "safe everywhere" and (ب) "tabs/app bar only". A name
 * outside this list doesn't error, it silently renders a placeholder glyph, so an authored
 * `tabIcon` that isn't in here is treated as if it were never set.
 */
const VALID_TAB_ICONS = new Set([
  "account_circle", "close", "delete", "edit", "favorite", "grid_view", "home",
  "list", "local_offer", "notifications", "person", "search", "settings",
  "shopping_bag", "shopping_cart",
  "add", "arrow_back", "arrow_forward", "back", "category", "favorite_outline",
  "home_outlined", "image", "info", "inventory", "menu", "notifications_outlined",
  "person_outline", "play_circle", "receipt", "share", "shopping_cart_outlined",
  "star", "star_outline", "store", "videocam", "view_list",
]);

/** Fallback tab icon for a page with no canonical entry and no valid authored `tabIcon`. */
const DEFAULT_TAB_ICON = "list";

/** Routes synthesised when the theme has a /cart page but no checkout wizard. */
const SYNTHETIC_CHECKOUT_ROUTES = [
  "/checkout",
  "/checkout/address-details",
  "/order/success",
  "/order/failure",
] as const;

/** Routes the engine owns; never tab roots, always shell-excluded. */
const SYSTEM_EXCLUDE_ROUTES = [
  "/splash", "/splash-carousel", "/auth/login", "/auth/otp-reset",
  "/product/details", "/checkout", "/checkout/address", "/checkout/address-details",
  "/checkout/payment", "/checkout/success", "/order/success", "/order/failure", "/orders",
];

/** A Flutter bottom bar past five tabs is unreadable; the rest become shell-excluded routes. */
const MAX_TABS = 5;

function transformNavigation(rootProps: Record<string, unknown>, pages: Record<string, unknown>[]): Record<string, unknown> {
  const systemRoutes = new Set(SYSTEM_EXCLUDE_ROUTES);
  const pageRoutes = [...new Set(pages.map((p) => normalizeRoute((p.route as string) || "/")))];
  const pageByRoute = new Map(
    pages.map((p) => [normalizeRoute((p.route as string) || "/"), p])
  );

  // Tabs are derived from the pages that actually exist. A hardcoded list produces tabs that
  // navigate to a route with no page behind it — every merchant without the full canonical
  // catalogue (and both worked examples) shipped four dead tabs.
  //
  // A merchant can also opt a page out of the tab bar from the mobile editor's page settings
  // (`showInTabs: false`); absent/undefined still defaults to included, matching the behaviour
  // before that toggle existed.
  const candidates = pageRoutes.filter(
    (r) => !systemRoutes.has(r) && !r.includes(":") && pageByRoute.get(r)?.showInTabs !== false
  );
  const ordered = [
    ...candidates.filter((r) => r === "/home"),
    ...candidates.filter((r) => r !== "/home"),
  ];
  const tabRoutes = ordered.slice(0, MAX_TABS);

  if (ordered.length > MAX_TABS) {
    addWarning(
      `${ordered.length} pages are eligible for the tab bar; kept the first ${MAX_TABS} ` +
        `(${tabRoutes.join(", ")}) and shell-excluded the rest — a bottom bar holds ${MAX_TABS} tabs`
    );
  }

  const tabs = tabRoutes.map((route) => {
    const canonical = TAB_CATALOGUE[route];
    const authoredIcon = pageByRoute.get(route)?.tabIcon;
    const icon =
      typeof authoredIcon === "string" && VALID_TAB_ICONS.has(authoredIcon)
        ? authoredIcon
        : canonical?.icon || DEFAULT_TAB_ICON;
    if (canonical) return { ...canonical, icon, route };
    const slug = route.replace(/^\//, "").replace(/[/:]/g, "-") || "page";
    const label = (pageByRoute.get(route)?.title as string) || slug;
    return { id: `tab-${slug}`, label, icon, route };
  });

  // Derived, never templated: `pages[].route − tabs[].route`. Unioning SYSTEM_EXCLUDE_ROUTES in
  // here is what put seven phantom routes (`/checkout`, `/orders`, …) in every output — harmless
  // at runtime, but it hid the fact that the list was not tracking the real page set.
  const tabRouteSet = new Set(tabRoutes);
  const shellExcludeRoutes = pageRoutes.filter((r) => !tabRouteSet.has(r));

  return {
    type: "tabs",
    // Backed by the fixed splash page prepended in buildEnvelope — the route table is built from
    // pages[] alone, so an initialRoute with no page is `GoException: no routes for location`.
    initialRoute: SPLASH_ROUTE,
    shellExcludeRoutes,
    tabs,
  };
}

// ─── Page Assembly ──────────────────────────────────────────────────────────

const SIDEBAR_WIDTH_PX: Record<string, number> = { narrow: 260, medium: 320, wide: 380 };

/**
 * The mobile editor's site-level `Sidebar` block **is** the app drawer — it is the
 * only drawer surface the mobile canvas offers, persisted as `SiteData.sidebar`
 * rather than as a zone. Restate it in the drawer vocabulary `buildAppDrawer`
 * already understands: `items` is a slot of blocks (see the Sidebar block's
 * `items: { type: "slot" }`), so it feeds the slot branch, not the nav-link one.
 */
function sidebarToDrawerBlock(
  sidebar: Record<string, unknown>,
  rootProps: Record<string, unknown>
): Record<string, unknown> {
  const props = isPlainRecord(sidebar.props) ? sidebar.props : {};
  const token = (props.backgroundColor as string) || "";

  // `backgroundColor` here is a Sidebar preset name (transparent | surface |
  // muted), not a color — G3 forbids that string reaching the engine. A drawer
  // always needs something opaque behind it, so transparent resolves to white.
  const background =
    token && token !== "transparent"
      ? resolveThemeColor(`theme-${token}`, rootProps) || "#ffffff"
      : "#ffffff";

  return {
    type: "ZoneDrawer",
    props: {
      side: props.dock === "right" ? "right" : "left",
      backgroundColor: background,
      width: SIDEBAR_WIDTH_PX[(props.width as string) || "medium"] ?? 320,
      slot: Array.isArray(props.items) ? props.items : [],
    },
  };
}

function buildAppDrawer(drawerBlock: Record<string, unknown>, rootProps: Record<string, unknown>): Record<string, unknown> {
  const props = (drawerBlock.props || {}) as Record<string, unknown>;
  const dir = (rootProps.direction as string) || "rtl";
  const sideRaw = (props.side as string) || (props.drawerSide as string) || "";
  let drawerEdge = "start";
  if (sideRaw === "right") drawerEdge = "end";
  else if (sideRaw === "left") drawerEdge = "start";
  else drawerEdge = dir === "rtl" ? "start" : "start";

  const bg = (props.backgroundColor as string) || "#ffffff";
  const width = parsePx(props.width as string, 320);
  const lang = (rootProps.language as string) || "ar";

  const navLinks = (props.items as Record<string, unknown>[]) || (props.links as Record<string, unknown>[]) || [];
  const slot = (props.slot as Record<string, unknown>[]) || [];

  if (slot.length > 0) {
    const slotChildren = slot.map((b) => transformBlock(b, rootProps)).filter(Boolean) as Record<string, unknown>[];
    return {
      id: generateId("drawer"),
      type: "appDrawer",
      props: { drawerEdge, width, backgroundColor: bg },
      child: {
        id: generateId("drawer-col"),
        type: "column",
        props: { gap: 0 },
        children: slotChildren.length > 0 ? slotChildren : [{
          id: generateId("drawer-link-home"),
          type: "button",
          props: { label: lang === "ar" ? "الرئيسية" : "Home", variant: "text", fullWidth: true },
          tap: { type: "navigate", route: "/home", navigation_type: "go" },
        }],
      },
    };
  }

  const linkNodes = navLinks.map((item) => {
    const tap = resolveLayoutTap({ link: item.link, href: item.href } as Record<string, unknown>, rootProps);
    return {
      id: generateId("drawer-link"),
      type: "button",
      props: {
        label: resolveBilingual(item.label as string, item.labelAr as string, lang),
        variant: "text",
        fullWidth: true,
      },
      ...(tap ? { tap } : {}),
    };
  });

  if (linkNodes.length === 0) {
    linkNodes.push({
      id: generateId("drawer-link-home"),
      type: "button",
      props: { label: lang === "ar" ? "الرئيسية" : "Home", variant: "text", fullWidth: true },
      tap: { type: "navigate", route: "/home", navigation_type: "go" },
    });
  }

  return {
    id: generateId("drawer"),
    type: "appDrawer",
    props: { drawerEdge, width, backgroundColor: bg },
    child: {
      id: generateId("drawer-col"),
      type: "column",
      props: { gap: 0 },
      children: linkNodes,
    },
  };
}

/** Every node in a converted subtree, in document order. */
function walkNodes(node: unknown, visit: (n: Record<string, unknown>) => void): void {
  if (Array.isArray(node)) {
    for (const child of node) walkNodes(child, visit);
    return;
  }
  if (!node || typeof node !== "object") return;
  const obj = node as Record<string, unknown>;
  if (typeof obj.type === "string") visit(obj);
  for (const value of Object.values(obj)) walkNodes(value, visit);
}

/**
 * A category filter (`buildCategoryTabs`) only does something if the grid it reloads reads the
 * slug back. When both are on the page, the catalog grid's request is rebound to the category
 * endpoint with the page-state slug as its path param, and its original URL becomes the fallback
 * used while "All" is selected.
 */
function bindCategoryFilterToGrid(body: Record<string, unknown>[], path: string): void {
  let hasCategoryFilter = false;
  walkNodes(body, (node) => {
    const tap = node.tap as Record<string, unknown> | undefined;
    const values = tap?.values as Record<string, unknown> | undefined;
    if (node.type === "tabs" && tap?.type === "setPageState" && values?.selectedCategorySlug) {
      hasCategoryFilter = true;
    }
  });
  if (!hasCategoryFilter) return;

  let boundGrid = false;
  walkNodes(body, (node) => {
    const props = node.props as Record<string, unknown> | undefined;
    const data = props?.data as Record<string, unknown> | undefined;
    if (!data || data.requestKey !== PRODUCT_LIST_REQUEST_KEY) return;

    const size = typeof data.size === "number" ? data.size : 20;
    data.fallbackRequestUrl = data.requestUrl;
    data.requestUrl = `/api/v1/public/categories/:categorySlug/products?page=0&size=${size}`;
    data.pathBindings = { ":categorySlug": { source: "pageState", field: "selectedCategorySlug" } };
    boundGrid = true;
  });

  if (!boundGrid) {
    addWarning(
      `Route "${path}" has a category filter ButtonGroup but no products grid to reload; add a ` +
        `products-grid Section to the same page or the filter taps do nothing`
    );
  }
}

function transformPage(page: Record<string, unknown>): Record<string, unknown> {
  const path = normalizeRoute((page.path as string) || "/");
  const label = (page.label as string) || (page.title as string) || "Page";
  const blocks = Array.isArray(page.blocks) ? (page.blocks as Record<string, unknown>[]) : [];
  const rootProps = (page.rootProps as Record<string, unknown>) || {};
  const slugPart = path.replace(/^\//, "").replace(/[/:]/g, "-") || "home";

  // Shell authored on the mobile side. A chrome-less page has neither; otherwise
  // these outrank whatever the web root props would have implied, because they
  // are the merchant's explicit mobile choices.
  const fullScreen = page.fullScreen === true;
  const authoredAppBar = !fullScreen && isPlainRecord(page.appBar) ? page.appBar : null;
  const authoredSidebar = !fullScreen && isPlainRecord(page.sidebar) ? page.sidebar : null;

  _pageStickyFooter = null;
  _zoneSlots = new Map();
  _zoneSlotsUsed = new Set();
  _drawerZoneKeys = new Set();
  _cartTemplateEmitted = false;
  _activeAuthForm = null;
  _pageHasAuthForm = false;
  _currentRoute = path;
  _productDetailRequestEmitted = false;
  _orderDetailRequestEmitted = false;
  _variantPickerAvailable = false;
  _variantFormEmitted = false;

  // Separate zone / shell blocks from body blocks
  const bodyBlocks: Record<string, unknown>[] = [];
  let drawerBlock: Record<string, unknown> | null = null;

  for (const block of blocks) {
    const type = block.type as string;
    const bProps = (block.props || {}) as Record<string, unknown>;

    // Mobile has no header/footer zone: skip these entirely, as if they never existed. The appBar
    // is still built from rootProps fallbacks below (a page always needs one); no SiteFooter
    // content of any kind reaches the output.
    if (type === "SiteHeader" || type === "SiteFooter") continue;

    if (type === "ZonePopup" || type === "ZoneBottomSheet") {
      if (bProps.is_active === false) {
        addWarning(`${type} "${(bProps.key as string) || ""}" is inactive (is_active: false); overlay skipped`);
        continue;
      }
      const key = (bProps.key as string) || type.toLowerCase();
      _zoneSlots.set(key, (bProps.slot as Record<string, unknown>[]) || []);
      continue;
    }

    if (type === "SiteDrawerShell" || type === "SideDrawer" || type === "ZoneDrawer") {
      const inactive = bProps.is_active === false || bProps.enabled === false || bProps.visible === false;
      if (inactive) {
        addWarning(`${type} "${(bProps.key as string) || (bProps.name as string) || ""}" is inactive; appDrawer skipped`);
        continue;
      }
      const key = (bProps.key as string) || (bProps.name as string) || "site-drawer";
      _drawerZoneKeys.add(key);
      if (drawerBlock) addWarning(`Multiple drawer zones found; "${key}" dropped — mobile supports one appDrawer per page`);
      else drawerBlock = block;
      continue;
    }

    bodyBlocks.push(block);
  }

  // The header zone is skipped entirely above, so appBar below is always built from rootProps
  // fallbacks — never from SiteHeader content.
  const headerProps = {} as Record<string, unknown>;
  const headerDrawerName = (headerProps.drawerName as string) || "";
  if (headerDrawerName) _drawerZoneKeys.add(headerDrawerName);

  // Convert body blocks
  let body = bodyBlocks.map((b) => transformBlock(b, rootProps)).filter(Boolean) as Record<string, unknown>[];

  // A `/cart` page the merchant laid out by hand has no cart in it — see buildCanonicalCartBody.
  const isDecorativeCart = path === "/cart" && !hasCartBinding(body);
  if (isDecorativeCart) {
    addWarning(
      `The "/cart" page has no list bound to dataContext.cart.items, so nothing on it was a cart: ` +
        `its body was replaced with the engine's cart screen (list, quantity stepper, remove, ` +
        `subtotal, checkout). Web blocks cannot express a local-state cart — author /cart with a ` +
        `CartList preset if you want control over it.`
    );
    body = buildCanonicalCartBody(rootProps);
  }

  // A `/checkout` page from the web builder cannot express cubit-driven wizard state — replace it
  // with the engine's checkout screen (address picker, COD, summary, place order).
  let rescuedCheckoutFooter: Record<string, unknown> | null = null;
  const isSyntheticCheckout = path === "/checkout";
  if (isSyntheticCheckout) {
    addWarning(
      'The "/checkout" page body was replaced with the engine\'s checkout wizard (address picker, ' +
        "COD payment, order summary, place order). Web blocks cannot drive checkout cubit state."
    );
    const rescued = buildCanonicalCheckoutBody(rootProps);
    body = rescued.body;
    rescuedCheckoutFooter = rescued.footer;
  }

  bindCategoryFilterToGrid(body, path);

  // An overlay zone only reaches mobile through the tap that opens it (openBottomSheet).
  // Anything left unopened on this page would silently disappear.
  for (const [key, slot] of _zoneSlots) {
    if (slot.length > 0 && !_zoneSlotsUsed.has(key)) {
      addWarning(
        `Overlay zone "${key}" is never opened on route "${path}"; nothing triggers it, so its content was dropped. Add a ContentButton with destinationType "zone" and zoneKey "${key}".`
      );
    }
  }

  // Build appBar from the SiteHeader block, falling back to root props
  const headerTitle = (headerProps.title as string) || (rootProps.headerBrandTitle as string) || label;
  // Header colors are authored as a hex **or** a theme token; G3 forbids a `theme-*` string ever
  // reaching the engine, so both go through the token resolver (a hex passes straight back out).
  const headerBgRaw = (headerProps.backgroundColor as string) || (rootProps.headerBackgroundColor as string) || "#ffffff";
  const headerFgRaw = (headerProps.textColor as string) || (rootProps.headerTextColor as string) || "#0f172a";
  const headerBg = resolveThemeColor(headerBgRaw, rootProps) || "#ffffff";
  const headerFg = resolveThemeColor(headerFgRaw, rootProps) || "#0f172a";
  const showDrawer = headerProps.showDrawerButton === true
    || (rootProps.headerShowDrawerButton as string) === "on"
    || rootProps.headerShowDrawerButton === true
    || drawerBlock !== null
    || authoredSidebar !== null;

  const rightSlot = (headerProps.rightSlot as Record<string, unknown>[]) || [];
  const hasCartInSlot = rightSlot.some((b) => (b.type as string) === "CartIconButton");
  const unmappedSlot = rightSlot.filter((b) => (b.type as string) !== "CartIconButton");
  if (unmappedSlot.length > 0) {
    addWarning(
      `SiteHeader.rightSlot blocks [${unmappedSlot.map((b) => b.type).join(", ")}] have no appBar equivalent; wire them as appBar trailing actions manually`
    );
  }
  const showCartIcon = hasCartInSlot || (rootProps.headerShowCart as string) !== "off";

  const appBarProps: Record<string, unknown> = {
    title: isSyntheticCheckout ? "إتمام الطلب" : (headerTitle || label),
    backgroundColor: headerBg,
    foregroundColor: headerFg,
    elevation: 0,
  };

  if (showDrawer) {
    appBarProps.showMenu = true;
    appBarProps.menuAction = { type: "openDrawer" };
  }

  if (showCartIcon) {
    appBarProps.showCartIcon = true;
    appBarProps.cartBadgePath = "cart.itemCount";
    appBarProps.cartAction = { type: "navigate", route: "/cart", navigation_type: "push" };
  }

  const gradientTop = (rootProps.headerBackgroundGradientTop as string) || "";
  const gradientBottom = (rootProps.headerBackgroundGradientBottom as string) || "";
  const useBrandGradient = rootProps.headerBackgroundGradient === true
    || rootProps.headerBackgroundGradient === "on"
    || rootProps.headerUseBrandGradient === true
    || rootProps.headerUseBrandGradient === "on";
  if (gradientTop && gradientBottom) {
    appBarProps.backgroundGradientTop = gradientTop;
    appBarProps.backgroundGradientBottom = gradientBottom;
  } else if (useBrandGradient) {
    appBarProps.backgroundGradient = true;
  }

  // An app bar authored in the mobile editor replaces the derived one outright
  // rather than merging into it: `buildPersistedAppBarProps` omits a key when
  // the merchant switches it off, so overlaying would leave the derived
  // `showCartIcon` / `showMenu` on and make those toggles dead.
  const authoredAppBarProps = authoredAppBar && isPlainRecord(authoredAppBar.props)
    ? authoredAppBar.props
    : null;

  const appBar: Record<string, unknown> = authoredAppBarProps
    ? {
        id: (authoredAppBar!.id as string) || `${slugPart}-app-bar`,
        type: "appBar",
        props: {
          ...authoredAppBarProps,
          title: authoredAppBarProps.title || appBarProps.title,
          // The editor keeps the bar's background under `style.background`,
          // the engine wants it on props alongside the foreground.
          backgroundColor:
            resolveThemeColor(
              isPlainRecord(authoredAppBar!.style)
                ? (authoredAppBar!.style.background as string)
                : undefined,
              rootProps
            ) || headerBg,
          foregroundColor:
            resolveThemeColor(authoredAppBarProps.foregroundColor as string, rootProps) || headerFg,
        },
      }
    : {
        id: `${slugPart}-app-bar`,
        type: "appBar",
        props: appBarProps,
      };

  // Build footer — page-level slot, not body[].
  //
  // Only checkout-shaped footers reach it. `pages[].footer` is a pinned action bar, and the two
  // things that legitimately fill it are the engine's checkout wizard bar and a checkout button
  // lifted out of the body (`_pageStickyFooter`). A web `SiteFooter` is site chrome — tagline,
  // link columns, legal row — and mobile has no footer zone to put it in, the same way it has no
  // header zone (SiteHeader survives only as an appBar + drawer, not as a zone). So the block is
  // skipped entirely, silently, at collection — see the SiteHeader/SiteFooter skip above.
  const stickyFooter = _pageStickyFooter;
  const footerNode = rescuedCheckoutFooter || stickyFooter;

  // Build appDrawer from the drawer zone, or from SiteHeader nav links when the
  // header exposes a burger button but the merchant defined no drawer zone.
  let appDrawer: Record<string, unknown> | undefined;
  if (drawerBlock) {
    appDrawer = buildAppDrawer(drawerBlock, rootProps);
  } else if (authoredSidebar) {
    appDrawer = buildAppDrawer(sidebarToDrawerBlock(authoredSidebar, rootProps), rootProps);
  } else if (showDrawer && Array.isArray(headerProps.links) && (headerProps.links as unknown[]).length > 0) {
    appDrawer = buildAppDrawer(
      { type: "ZoneDrawer", props: { links: headerProps.links, side: "left" } },
      rootProps
    );
  }

  const background = (page.background as string) || "#ffffff";

  // An auth page is a full-viewport, non-scrolling shell. `layout: "centered"` is the only way to
  // ask for one: the engine forces `pageScroll: none`, sets the root column to `mainAxisSize: max`
  // + `crossAxisAlignment: stretch`, and exempts the page from the `viewport_center_without_expand`
  // / `static_page_overflow_risk` validators. A bare `scroll: "none"` does none of that — it just
  // removes the scroll, leaving a shrink-wrapped form pinned under the app bar that overflows as
  // soon as the body is taller than the screen. See docs/engine/builder-specs/08-page-scroll.md
  // and 15-page-layout-preset.md.
  const pageNode: Record<string, unknown> = {
    id: `page-${slugPart}`,
    route: path,
    title: label,
    background,
    // The canonical cart body owns its own scrolling (an expanding scroll area above a pinned
    // checkout panel), so the page must not scroll underneath it.
    ...(_pageHasAuthForm || fullScreen
      ? { layout: "centered" }
      : { scroll: isDecorativeCart ? "none" : (page.scroll as string) || "vertical" }),
    // Declared once, and it is the Sections that declare it. Left unset the engine insets the page
    // by `theme.spacing.md`, which stacks with each Section's own horizontal padding — two gutters
    // per side, and a two-column grid ends up with cells too narrow to lay out.
    padding: 0,
    // A page the merchant marked full-screen (a splash) renders no chrome at
    // all — `composePuckData` composes neither app bar nor sidebar into its
    // canvas, so emitting a derived one here would contradict the editor.
    ...(fullScreen ? {} : { appBar }),
    body,
    // Transient — read by transformNavigation below, stripped in buildEnvelope before the
    // final pages array is assembled. Not part of the mobile page schema.
    ...(typeof page.tabIcon === "string" ? { tabIcon: page.tabIcon } : {}),
    ...(page.showInTabs === false ? { showInTabs: false } : {}),
  };

  if (footerNode) {
    if (path.includes("/product/") && stickyFooter) {
      pageNode.footer = { overlay: true, ...footerNode };
      body.push({ id: generateId("footer-spacer"), type: "sizedBox", props: { height: 116 } });
    } else {
      pageNode.footer = footerNode;
    }
  }
  // After the footer spacer, so it is centered with the rest of the body.
  if (_pageHasAuthForm) pageNode.body = [buildCenteredViewport(body, background)];
  // The page parser accepts a fixed key set (id, route, title, background, scroll, layout,
  // padding, appBar, body, footer, appBarCartIcon) and silently discards everything else — a
  // page-level `appDrawer` never reached the renderer, so the burger button did nothing. The
  // drawer node itself is right, it just belongs at `body[0]` (mobile_production_v2 pages[4]).
  if (appDrawer && !fullScreen) (pageNode.body as Record<string, unknown>[]).unshift(appDrawer);

  return pageNode;
}

/**
 * Resets {@link _debugTrail} to this page before converting it, so an error thrown by
 * `transformPage`'s own top-level logic (outside any `transformBlock` call — e.g. checkout/cart
 * synthesis, header/drawer handling) is still tagged with at least the page it happened on.
 */
function transformPageWithTrail(page: Record<string, unknown>): Record<string, unknown> {
  _debugTrail = [`page ${normalizeRoute((page.path as string) || "/")}`];
  try {
    return transformPage(page);
  } catch (e) {
    tagWithTrail(e);
  }
}

/**
 * The body shell `layout: "centered"` expects: an `expand` container to give the page a bounded
 * height, and a `mainAxisSize: max` column that centers its children inside it. Mirrors the
 * `/auth/login` shape the engine ships in `mobile_production_v2.json`.
 */
function buildCenteredViewport(
  body: Record<string, unknown>[],
  background: string
): Record<string, unknown> {
  return {
    id: generateId("page-expand"),
    type: "container",
    props: { expand: true, color: background },
    child: {
      id: generateId("page-center"),
      type: "column",
      props: flexProps("center", "stretch", { mainAxisSize: "max" }),
      children: body,
    },
  };
}

// ─── SiteData ingest (ZONES.md / BLOCKS.md envelope) ────────────────────────

/**
 * Zone bucket order — overlays only. `zone-header` and `zone-footer` are deliberately absent:
 * mobile has no header/footer zone, so their blocks are skipped at collection, as if those zones
 * were never in the input (see `collectZoneBlocks`).
 */
const ZONE_ORDER = ["zone-drawer", "zone-popup", "zone-bottom-sheet"];

/**
 * `root:zone-header` | `zone:header` | `root:shell-left-zone` → `zone-header` | `zone-drawer`.
 * Mirrors `canonicalZoneName()` in the web editor (ZONES.md § Migration notes).
 */
function canonicalZoneName(key: string): string {
  let name = String(key || "").trim();
  if (name.startsWith("root:")) name = name.slice("root:".length);
  name = name.replace(/^zone:/, "zone-");
  if (name === "shell-left-zone" || name === "shell-right-zone") return "zone-drawer";
  return name;
}

function collectZoneBlocks(zones: unknown): Record<string, unknown>[] {
  if (!zones || typeof zones !== "object") return [];

  const buckets = new Map<string, Record<string, unknown>[]>();
  for (const [key, value] of Object.entries(zones as Record<string, unknown>)) {
    if (!Array.isArray(value) || value.length === 0) continue;
    const name = canonicalZoneName(key);
    // Skip the header/footer zones entirely — never bucketed, never merged into a page's blocks.
    if (name === "zone-header" || name === "zone-footer") continue;
    buckets.set(name, [...(buckets.get(name) || []), ...(value as Record<string, unknown>[])]);
  }

  const ordered: Record<string, unknown>[] = [];
  for (const name of ZONE_ORDER) ordered.push(...(buckets.get(name) || []));
  for (const [name, blocks] of buckets) {
    if (ZONE_ORDER.includes(name)) continue;
    addWarning(`Unknown zone "${name}"; its blocks were converted into the page body`);
    ordered.push(...blocks);
  }
  return ordered;
}

/** True for a web `SiteData` payload or a single-page Puck `UserData` payload. */
function isSiteDataEnvelope(obj: Record<string, unknown>): boolean {
  if (Array.isArray(obj.pages)) return true;
  return Boolean(obj.root) && (Array.isArray(obj.content) || Boolean(obj.zones));
}

/** `{ root, zones, pages }` → the converter's `{ path, label, rootProps, blocks }` page shells. */
function normalizeSiteData(site: Record<string, unknown>): Record<string, unknown>[] {
  const root = site.root as Record<string, unknown> | undefined;
  const rootProps = (root?.props as Record<string, unknown>) || {};
  const zoneBlocks = collectZoneBlocks(site.zones);

  const rawPages = Array.isArray(site.pages) && site.pages.length > 0
    ? (site.pages as Record<string, unknown>[])
    : [{ path: "/", name: rootProps.title, content: Array.isArray(site.content) ? site.content : [] }];

  // Mobile shell authored in the mobile editor. `composePuckData` injects these
  // into the canvas and `applyPuckSave` extracts them back out, so they live on
  // `page.appBar` / `site.sidebar` and never appear in `page.content` — without
  // carrying them here every app-bar and drawer edit made on the mobile side is
  // silently dropped and the appBar is re-derived from web root props instead.
  const sidebar = isPlainRecord(site.sidebar) && Object.keys(site.sidebar).length > 0
    ? (site.sidebar as Record<string, unknown>)
    : null;

  return rawPages.map((page) => {
    // Dynamic routes keep the web path verbatim (`/products/:product-slug`) — the
    // engine resolves `:param` from the repeat item / route params.
    const path = (page.path as string) || (page.slug as string) || (page.link as string) || "/";
    const content = Array.isArray(page.content) ? (page.content as Record<string, unknown>[]) : [];
    const appBar = isPlainRecord(page.appBar) && Object.keys(page.appBar).length > 0
      ? (page.appBar as Record<string, unknown>)
      : null;
    // The splash page has no page-level `background` of its own — its one authorable colour is
    // the `SplashHero` block's own `background` prop, so the page background is derived from it.
    const splashHero = content.find((node) => (node as Record<string, unknown>).type === "SplashHero") as
      | Record<string, unknown>
      | undefined;
    const splashBackground = splashHero
      ? ((splashHero.props as Record<string, unknown> | undefined)?.background as string | undefined)
      : undefined;
    return {
      path,
      label: (page.title as string) || (page.name as string) || (page.label as string) || "Page",
      rootProps,
      blocks: [...zoneBlocks, ...content],
      ...(page.background
        ? { background: page.background }
        : splashBackground
          ? { background: splashBackground }
          : {}),
      ...(page.scroll ? { scroll: page.scroll } : {}),
      // A chrome-less page (splash) carries neither app bar nor drawer.
      ...(page.fullScreen === true ? { fullScreen: true } : {}),
      ...(appBar ? { appBar } : {}),
      ...(sidebar ? { sidebar } : {}),
      // Mobile tab-bar authoring (page settings panel): read by transformNavigation via
      // transformPage below, then stripped in buildEnvelope before the final pages array.
      ...(typeof page.tabIcon === "string" ? { tabIcon: page.tabIcon } : {}),
      ...(page.showInTabs === false ? { showInTabs: false } : {}),
    };
  });
}

/**
 * The `app` envelope the deployment supplies. Web `root.props` carries no tenant — the converter
 * must never invent one (docs/engine/web-to-mobile-converter/02-mobile-output-schema.md), so these
 * are injectable and the built-in values are placeholders that only make the output runnable.
 */
export type AppEnvelopeConfig = {
  name?: string;
  bundleId?: string;
  apiBaseUrl?: string;
  tenantId?: string;
  tenantSlug?: string;
};

const PLACEHOLDER_APP_ENVELOPE = {
  name: "SOOQ Merchant Mobile",
  bundleId: "com.sooq.merchant.mobile",
  // "sooq.up.railway.app" 404s — the backend moved and this placeholder went stale with it
  // (web-to-mobile-config-audit-2026-08-22.md item P2). Still a placeholder: callers should pass
  // the real merchant apiBaseUrl, but the fallback should at least be a live host.
  apiBaseUrl: "https://shopengine-production-9b4c.up.railway.app",
  tenantId: "00000000-0000-0000-0000-000000000000",
  tenantSlug: "example-merchant",
} as const;

/**
 * Emitted when an action resolves a param out of the `app` envelope while that envelope still
 * holds the placeholder tenant — the call would reach the backend keyed to nobody.
 */
export const TENANT_PLACEHOLDER_WARNING =
  `Actions read "tenantSlug" from the app envelope, but app.tenantSlug is still the ` +
  `"${PLACEHOLDER_APP_ENVELOPE.tenantSlug}" placeholder; pass the merchant's real ` +
  `apiBaseUrl / tenantId / tenantSlug to transformWebToMobile before building the APK`;

let _appConfig: AppEnvelopeConfig = {};

/**
 * A `BilingualString` that survived to the output. The mobile app has **no runtime locale switch**
 * — it renders one language, chosen at build time — so every string field must be a `String`. A
 * `{ ar, en }` map reaching the parser is a hard cast failure:
 * `type '_Map<String, dynamic>' is not a subtype of type 'String?'`.
 */
function isLocaleMap(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const keys = Object.keys(value as Record<string, unknown>);
  return keys.length > 0 && keys.every((k) => k === "ar" || k === "en");
}

/**
 * Last line of defence for locale maps: collapses every `{ ar, en }` left in the tree to its `ar`
 * string (falling back to `en`). Individual call sites should still use {@link pickLang} — this
 * exists so that one missed `as string` cast can no longer white-screen the app, and so the rule
 * holds for props added later without anyone remembering it.
 */
function scrubLocaleMaps(node: unknown, language: string, hits: string[], path = ""): unknown {
  if (Array.isArray(node)) return node.map((v, i) => scrubLocaleMaps(v, language, hits, `${path}[${i}]`));
  if (!node || typeof node !== "object") return node;
  if (isLocaleMap(node)) {
    hits.push(path);
    return pickLang(node, language);
  }
  const obj = node as Record<string, unknown>;
  for (const [key, value] of Object.entries(obj)) {
    obj[key] = scrubLocaleMaps(value, language, hits, path ? `${path}.${key}` : key);
  }
  return obj;
}

/**
 * Drops every node whose `tap` navigates to a **static** route no page defines.
 *
 * The router is built from `pages[]` alone, so these are not merely dead links — the first tap
 * crashes the app. They come from web content that outlived its page (the Rawaq footer and drawer
 * linked `/orders` fifteen times with no orders page anywhere). Removing the whole node rather
 * than just the tap is deliberate: a footer link you cannot follow is worse than no link.
 *
 * Dynamic targets (`/product/details/:productId`) are exempt. Those are emitted by the converter
 * itself on every product card, so a missing detail page means *the page* needs authoring — strip
 * the taps and the entire catalogue goes inert, which is a worse failure than the one being fixed.
 * They are reported instead.
 */
function pruneDanglingNavigation(pages: Record<string, unknown>[]): void {
  const defined = new Set(pages.map((p) => normalizeRoute((p.route as string) || "/")));
  const dropped = new Map<string, number>();
  const missingDynamic = new Set<string>();
  const strippedHandoffs = new Map<string, number>();

  const isDangling = (node: Record<string, unknown>): boolean => {
    const tap = node.tap as Record<string, unknown> | undefined;
    if (!tap) return false;

    // A cubitCall that hands off on success (`cart.assertNotEmpty` → /checkout). The call itself
    // is wanted; only the hand-off is broken, so strip the hand-off rather than the button.
    const onSuccess = tap.onSuccess as Record<string, unknown> | undefined;
    if (onSuccess?.type === "navigate" && typeof onSuccess.route === "string"
      && !defined.has(onSuccess.route) && !onSuccess.route.includes(":")) {
      strippedHandoffs.set(onSuccess.route as string, (strippedHandoffs.get(onSuccess.route as string) || 0) + 1);
      delete tap.onSuccess;
    }

    if (tap.type !== "navigate" || typeof tap.route !== "string") return false;
    const route = tap.route as string;
    if (defined.has(route)) return false;
    if (route.includes(":")) {
      missingDynamic.add(route);
      return false;
    }
    dropped.set(route, (dropped.get(route) || 0) + 1);
    return true;
  };

  const walk = (value: unknown): unknown => {
    if (Array.isArray(value)) {
      return value
        .filter((v) => !(v && typeof v === "object" && isDangling(v as Record<string, unknown>)))
        .map(walk);
    }
    if (!value || typeof value !== "object") return value;
    const obj = value as Record<string, unknown>;
    for (const [key, child] of Object.entries(obj)) {
      // A dangling link in a single-child slot cannot be removed without orphaning the slot;
      // strip the tap so the widget renders inert instead of crashing.
      if (child && typeof child === "object" && !Array.isArray(child)
        && isDangling(child as Record<string, unknown>)) {
        delete (child as Record<string, unknown>).tap;
      }
      obj[key] = walk(child);
    }
    return obj;
  };

  for (const page of pages) page.body = walk(page.body) as Record<string, unknown>[];
  for (const page of pages) if (page.footer) page.footer = walk(page.footer);

  // The app bar's cart icon is chrome, not a tap, so it never reaches the walk above — and it is
  // emitted by default rather than on request, so a store with no /cart page shipped an icon that
  // crashed the app. Silent, unlike the cases above: nothing the merchant authored is being
  // removed, the icon simply does not apply to a store without a cart.
  for (const page of pages) {
    const barProps = ((page.appBar as Record<string, unknown> | undefined)?.props || {}) as Record<string, unknown>;
    const cartAction = barProps.cartAction as Record<string, unknown> | undefined;
    if (!cartAction || typeof cartAction.route !== "string" || defined.has(cartAction.route)) continue;
    delete barProps.cartAction;
    delete barProps.showCartIcon;
    delete barProps.cartBadgePath;
  }

  /**
   * The app bar's other action slots hold a bare action object rather than a `tap`, so the walk
   * above never saw them either — `/home`'s bell shipped pointing at `/notifications`, a route no
   * page defines, and tapping it did nothing. Each slot's paired icon goes with it so the bar does
   * not keep a button that no longer acts. Reported, unlike `cartAction`: this one the merchant
   * (or the theme preset) authored, so the fix is theirs — add the page or drop the action.
   */
  const APP_BAR_ACTION_CHROME: Record<string, string[]> = {
    trailingAction: ["trailingIcon"],
    leadingAction: ["leadingIcon"],
    menuAction: ["menuIcon", "showMenu"],
  };
  for (const page of pages) {
    const barProps = ((page.appBar as Record<string, unknown> | undefined)?.props || {}) as Record<string, unknown>;
    for (const [slot, chrome] of Object.entries(APP_BAR_ACTION_CHROME)) {
      const action = barProps[slot] as Record<string, unknown> | undefined;
      // `openDrawer` and friends carry no route; only navigation can dangle.
      if (!action || action.type !== "navigate" || typeof action.route !== "string") continue;
      const route = action.route as string;
      if (defined.has(route)) continue;
      if (route.includes(":")) { missingDynamic.add(route); continue; }
      dropped.set(route, (dropped.get(route) || 0) + 1);
      delete barProps[slot];
      for (const key of chrome) delete barProps[key];
    }
  }

  // `/auth/*` targets are the converter's own, and checkAuthRouteTargets already reports them with
  // instructions for authoring the page. Reporting them here too would just say it twice.
  for (const route of [...dropped.keys()]) if (route.startsWith("/auth/")) dropped.delete(route);
  for (const route of [...strippedHandoffs.keys()]) if (route.startsWith("/auth/")) strippedHandoffs.delete(route);

  for (const [route, count] of dropped) {
    addWarning(
      `${count} link${count === 1 ? "" : "s"} target "${route}" but no page defines that route; ` +
        `removed. The app builds its router from pages[] only, so the first tap would crash it — ` +
        `add the page, or drop the link on the web side.`
    );
  }
  for (const [route, count] of strippedHandoffs) {
    addWarning(
      `${count} action${count === 1 ? "" : "s"} hand off to "${route}" on success but no page ` +
        `defines it; the hand-off was removed and the action itself kept. The button now runs and ` +
        `goes nowhere — author the page to complete the flow.`
    );
  }
  for (const route of [...missingDynamic].sort()) {
    addWarning(
      `Product/detail links navigate to "${route}" but no page defines it. The links were kept — ` +
        `stripping them would make every card inert — so the tap dead-ends until the web side ` +
        `authors a page on that dynamic route.`
    );
  }
}

/**
 * `column.mainAxisAlignment` values `column_renderer.dart:250-259` wraps in
 * `ConstrainedBox(minHeight: constraints.maxHeight)` — any alignment that isn't `start`/`end`
 * makes the column stretch to fill its parent's full height (a grid cell, a card) and pushes
 * whatever sits last in it down into empty space. `row` has no such quirk; only `column` does.
 */
const DISALLOWED_COLUMN_MAIN_AXIS = new Set(["spaceBetween", "spaceAround", "spaceEvenly"]);

/**
 * Node-tree contracts the phone needs and the web canvas never did. Runs once, after the whole
 * tree is built, so it catches every source — `transformFlex`'s own conversions, hand-built
 * templates (cart lines, testimonial cards), and the row→column demotion a few lines below, all
 * in one place instead of re-deriving these rules at every call site that can produce them.
 *
 * 1. *Images with no size.* An unsized image sizes to its intrinsic bitmap — inside a grid cell
 *    that throws (a 134px cell trying to lay out a 407px column); standalone it can eat the whole
 *    first screen before the real content scrolls into view. Every `network` image needs a
 *    declared `aspectRatio` or `height`; square is the safe default.
 * 2. *Fixed pixel widths in a row.* Three 120px thumbnails and two 12px gaps need 384px; a 320px
 *    screen minus section gutters has 288. Rather than drop children, the row's fixed widths are
 *    scaled down to fit — the layout survives at every width.
 * 3. *`spaceBetween`/`spaceAround`/`spaceEvenly` on a `column`* — see
 *    {@link DISALLOWED_COLUMN_MAIN_AXIS}. Reset to `start`; a two-item row a grid cell can't fit
 *    side by side should be authored as a stack on the web side, not rely on this fallback to look
 *    intentional.
 * 4. *Oversized gaps.* A literal (non-token) `gap` above what a 320px screen can spare between two
 *    stacked elements — `spacing.xl` (36-48px desktop) reads as an intentional section break, not a
 *    gap between a form and its label.
 * 5. *Physical `textAlign`.* `"right"`/`"left"` hardcode a direction; the app is RTL-only today
 *    (`dir` defaults `"rtl"` everywhere the value gets no explicit align), so `"right"` is always
 *    logical `"start"` and `"left"` is `"end"` — see docs/orders-mobile-conversion.md and
 *    CLAUDE.md's Arabic-first convention. Only physical values are rewritten; anything already
 *    `start`/`end`/`center` is left alone.
 */
const PHONE_GAP_MAX = 24;

function enforcePhoneWidthContracts(pages: Record<string, unknown>[]): void {
  const rowBudget = PHONE_MIN_WIDTH - PHONE_SECTION_PAD_MAX * 2;

  const visit = (node: unknown): void => {
    if (Array.isArray(node)) {
      for (const child of node) visit(child);
      return;
    }
    if (!node || typeof node !== "object") return;
    const n = node as Record<string, unknown>;
    const props = (n.props || {}) as Record<string, unknown>;

    if (
      n.type === "image" && props.source === "network" &&
      props.aspectRatio === undefined && props.height === undefined
    ) {
      props.aspectRatio = 1;
    }

    if (n.type === "row") {
      // transformFlex demotes web-authored rows, but rows also come out of hand-built templates
      // (cart lines, testimonial cards, galleries). The constraint is the engine's, not the web
      // side's, so it has to hold for every row in the tree.
      const kids0 = (n.children as Record<string, unknown>[]) || [];
      if (kids0.some((c) => UNBOUNDED_IN_ROW.has(c?.type as string))) {
        n.type = "column";
        const rowProps = n.props as Record<string, unknown> | undefined;
        if (rowProps?.crossAxisAlignment === "center") rowProps.crossAxisAlignment = "stretch";
        addWarning(
          `A built-in template puts ${kids0.filter((c) => UNBOUNDED_IN_ROW.has(c?.type as string))
            .map((c) => c.type).join(", ")} inside a row, which cannot lay out at an unbounded ` +
            `width; converted to a column.`
        );
      }
    }

    if (n.type === "row") {
      const kids = (n.children as Record<string, unknown>[]) || [];
      const widths = kids.map((k) => ((k.props as Record<string, unknown>)?.width as number) || 0);
      const fixed = widths.reduce((a, b) => a + b, 0);
      if (fixed > 0) {
        const gaps = ((props.gap as number) || 0) * Math.max(0, kids.length - 1);
        if (fixed + gaps > rowBudget) {
          const scale = (rowBudget - gaps) / fixed;
          kids.forEach((k, i) => {
            if (!widths[i]) return;
            const next = Math.max(24, Math.floor(widths[i] * scale));
            _phoneClamps.push({ what: `${k.type} width in row`, from: widths[i], to: next });
            (k.props as Record<string, unknown>).width = next;
          });
        }
      }
    }

    // Checked by current `n.type`, not the original one — this also catches the row→column
    // demotion just above, which never had a reason to know about this constraint.
    if (n.type === "column" && DISALLOWED_COLUMN_MAIN_AXIS.has(props.mainAxisAlignment as string)) {
      addWarning(
        `A column had mainAxisAlignment "${props.mainAxisAlignment}"; the engine's column_renderer ` +
          `stretches any non-start/end alignment to fill the full parent height, leaving a blank gap ` +
          `where the last child got pushed. Reset to "start" — author opposite-ends content ` +
          `("price ↔ button") as a row on the web side if there is room for one.`
      );
      props.mainAxisAlignment = "start";
    }

    if (typeof props.gap === "number" && props.gap > PHONE_GAP_MAX) {
      _phoneClamps.push({ what: `${n.type} gap`, from: props.gap, to: PHONE_GAP_MAX });
      props.gap = PHONE_GAP_MAX;
    }

    if (props.textAlign === "right") props.textAlign = "start";
    else if (props.textAlign === "left") props.textAlign = "end";

    for (const value of Object.values(n)) visit(value);
  };

  for (const page of pages) {
    visit(page.body);
    visit(page.footer);
  }
}

/** Counts nodes {@link pruneDeadNodes} removes this run, for the one summary warning. */
let _deadNodesPruned = 0;
function resetDeadNodesPruned() {
  _deadNodesPruned = 0;
}

/**
 * A node with nothing in it: a `text` with no literal `value` and no `valuePath` to fetch one at
 * runtime, or a `column`/`row` whose `children` array is empty. Both still occupy their box —
 * line height for the text, `mainAxisSize` for the flex — so they render as a blank gap rather
 * than nothing at all (validator checklist items 8 and 9).
 */
function isDeadNode(node: unknown): boolean {
  if (!node || typeof node !== "object" || Array.isArray(node)) return false;
  const n = node as Record<string, unknown>;
  const props = (n.props || {}) as Record<string, unknown>;
  if (n.type === "text" && !props.valuePath && (props.value === undefined || props.value === "")) return true;
  if ((n.type === "column" || n.type === "row") && Array.isArray(n.children) && n.children.length === 0) return true;
  return false;
}

/**
 * Removes dead nodes bottom-up so a container that only becomes empty *after* its own dead
 * children are dropped is caught too — a `column` holding one now-removed empty `text` is itself
 * empty once that child is gone, and a grandparent should not have to know that.
 */
function pruneDeadNodes(node: unknown): void {
  if (Array.isArray(node)) {
    for (const child of node) pruneDeadNodes(child);
    return;
  }
  if (!node || typeof node !== "object") return;
  const n = node as Record<string, unknown>;

  for (const value of Object.values(n)) pruneDeadNodes(value);

  if (Array.isArray(n.children)) {
    const before = (n.children as unknown[]).length;
    n.children = (n.children as unknown[]).filter((c) => !isDeadNode(c));
    _deadNodesPruned += before - (n.children as unknown[]).length;
  }
  if (n.child !== undefined && isDeadNode(n.child)) {
    delete n.child;
    _deadNodesPruned++;
  }
}

function buildEnvelope(pages: Record<string, unknown>[], rootProps: Record<string, unknown>): Record<string, unknown> {
  const app = { ...PLACEHOLDER_APP_ENVELOPE, ..._appConfig };
  const language = (rootProps.language as string) || "ar";

  // Idempotent: a config that already carries a splash (a mobile → web → mobile round trip) keeps
  // the one it has rather than growing a second one.
  const hasSplash = pages.some((p) => normalizeRoute((p.route as string) || "/") === SPLASH_ROUTE);
  const allPages = hasSplash ? [...pages] : [SPLASH_PAGE, ...pages];

  // Checkout routes must exist before navigation is derived — shellExcludeRoutes is pages[] − tabs[].
  ensureSyntheticCheckoutPages(allPages, rootProps);

  const navigation = transformNavigation(rootProps, allPages);

  // The fallback splash's CTA defaults to "/home" — retarget it at the first real tab so the
  // launch path always works, even when the store has no "/home" page.
  if (!hasSplash) {
    const firstTab = ((navigation.tabs as Record<string, unknown>[])[0]?.route as string) || "/home";
    const splash = JSON.parse(JSON.stringify(SPLASH_PAGE)) as Record<string, unknown>;
    const splashHero = (splash.body as Record<string, unknown>[])[0] as Record<string, unknown>;
    (splashHero.props as Record<string, unknown>).tap =
      { type: "navigate", route: firstTab, navigation_type: "clear_stack" };
    allPages[0] = splash;
  }

  // `tabIcon`/`showInTabs` are editor-only authoring fields consumed above by
  // transformNavigation; the mobile page schema has a fixed key set and doesn't know about
  // them, so strip before they reach the final pages array.
  for (const p of allPages) {
    delete p.tabIcon;
    delete p.showInTabs;
  }

  checkAuthRouteTargets(pages);
  pruneDanglingNavigation(allPages);
  assertCheckoutContracts(allPages);
  enforcePhoneWidthContracts(allPages);
  pruneDeadNodes(allPages);
  if (_deadNodesPruned > 0) {
    addWarning(
      `${_deadNodesPruned} node${_deadNodesPruned === 1 ? "" : "s"} removed as dead output: an empty ` +
        `text with neither a literal value nor a valuePath, or a column/row with no children. Each ` +
        `still reserved layout space (line height, mainAxisSize) as a blank gap.`
    );
  }
  if (_usedAppEnvelopeSource && app.tenantSlug === PLACEHOLDER_APP_ENVELOPE.tenantSlug) {
    addWarning(TENANT_PLACEHOLDER_WARNING);
  }

  const envelope = {
    schemaVersion: "1.0",
    app,
    theme: transformTheme(rootProps),
    navigation,
    pages: allPages,
  };

  if (_phoneClamps.length > 0) {
    const shown = _phoneClamps.slice(0, 6).map((c) => `${c.what} ${c.from}→${c.to}`);
    addWarning(
      `${_phoneClamps.length} desktop measurement${_phoneClamps.length === 1 ? "" : "s"} exceeded the ` +
        `${PHONE_MIN_WIDTH}px phone budget and ${_phoneClamps.length === 1 ? "was" : "were"} clamped: ` +
        `${shown.join(", ")}${_phoneClamps.length > 6 ? `, +${_phoneClamps.length - 6} more` : ""}. ` +
        `Set phone-scale values on the web side to keep the preview honest.`
    );
  }

  const localeHits: string[] = [];
  scrubLocaleMaps(envelope, language, localeHits);
  if (localeHits.length > 0) {
    addWarning(
      `${localeHits.length} bilingual { ar, en } object${localeHits.length === 1 ? "" : "s"} reached ` +
        `the output and ${localeHits.length === 1 ? "was" : "were"} collapsed to "${language}". The ` +
        `mobile app renders one build-time language, so every string field must be a String. ` +
        `Fix the call site${localeHits.length === 1 ? "" : "s"} to use pickLang(): ${localeHits.slice(0, 8).join(", ")}` +
        `${localeHits.length > 8 ? `, +${localeHits.length - 8} more` : ""}`
    );
  }

  return envelope;
}

/** Tags a `buildEnvelope` failure with the `"building envelope"` trail set by its callers. */
function buildEnvelopeWithTrail(
  pages: Record<string, unknown>[],
  rootProps: Record<string, unknown>
): Record<string, unknown> {
  try {
    return buildEnvelope(pages, rootProps);
  } catch (e) {
    tagWithTrail(e);
  }
}

/** Every `navigate` route reachable from a converted page tree. */
function collectNavigateRoutes(node: unknown, acc: Set<string>): Set<string> {
  if (Array.isArray(node)) {
    for (const child of node) collectNavigateRoutes(child, acc);
    return acc;
  }
  if (!node || typeof node !== "object") return acc;
  const obj = node as Record<string, unknown>;
  if (obj.type === "navigate" && typeof obj.route === "string") acc.add(obj.route);
  for (const value of Object.values(obj)) collectNavigateRoutes(value, acc);
  return acc;
}

/**
 * The app registers its routes from `pages[]` — nothing is natively mounted — so a navigate to a
 * route no page defines is a dead end at runtime. Checked for `/auth/*` only: those are the routes
 * the **converter itself** emits (`/auth/otp-reset` after `requestOtp`, `/auth/login` from a bare
 * login button), so a merchant can ship a dangling one without ever authoring the target page.
 */
function checkAuthRouteTargets(pages: Record<string, unknown>[]): void {
  const defined = new Set(pages.map((p) => normalizeRoute((p.route as string) || "/")));
  const targets = [...collectNavigateRoutes(pages, new Set<string>())]
    .filter((r) => r.startsWith("/auth/") && !defined.has(r))
    .sort();

  for (const route of targets) {
    addWarning(
      `A navigate action targets "${route}" but no page defines that route; the app builds its ` +
        `router from pages[] only. Add the page — an OTP screen is a Section holding a ContentInput ` +
        `named "${OTP_FIELD_ID}" and a ContentButton with buttonAction "verifyOtp"`
    );
  }
}

// ─── Main Entry Point ───────────────────────────────────────────────────────

export type TransformResult =
  | { success: true; output: unknown; warnings?: string[]; unsupportedBlocks?: UnsupportedBlockReport[] }
  | { success: false; error: string };

function successResult(output: unknown): TransformResult {
  const warnings = takeWarnings();
  const unsupportedBlocks = takeUnsupportedBlocks();
  return {
    success: true,
    output,
    ...(warnings.length > 0 ? { warnings } : {}),
    ...(unsupportedBlocks.length > 0 ? { unsupportedBlocks } : {}),
  };
}

export function transformWebToMobile(input: string, appConfig: AppEnvelopeConfig = {}): TransformResult {
  resetIdCounter();
  resetWarnings();
  resetUnsupportedBlocks();
  resetPhoneClamps();
  resetDeadNodesPruned();
  _warnedContainerRequest = false;
  _warnedAddToCartRedirect = false;
  _usedAppEnvelopeSource = false;
  _appConfig = appConfig;
  _debugTrail = [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch (e) {
    return { success: false, error: `Invalid JSON: ${(e as Error).message}` };
  }

  try {
    if (Array.isArray(parsed)) {
      const isPageArray = parsed.length > 0 && typeof (parsed[0] as Record<string, unknown>).path === "string";

      if (isPageArray) {
        const pages = (parsed as Record<string, unknown>[]).map(transformPageWithTrail);
        const rootProps = ((parsed[0] as Record<string, unknown>).rootProps as Record<string, unknown>) || {};
        _debugTrail = ["building envelope (navigation/theme/pruning)"];
        return successResult(buildEnvelopeWithTrail(pages, rootProps));
      }

      const rootProps = {};
      const output = (parsed as Record<string, unknown>[]).map((b) => transformBlock(b, rootProps)).filter(Boolean);
      return successResult(output);
    }

    const obj = parsed as Record<string, unknown>;

    // Web `SiteData` / Puck `UserData`: { root, zones, pages | content }
    if (isSiteDataEnvelope(obj)) {
      const rootProps = ((obj.root as Record<string, unknown> | undefined)?.props as Record<string, unknown>) || {};
      const pageShells = normalizeSiteData(obj);
      const pages = pageShells.map(transformPageWithTrail);
      _debugTrail = ["building envelope (navigation/theme/pruning)"];
      return successResult(buildEnvelopeWithTrail(pages, rootProps));
    }

    if (typeof obj.path === "string" || typeof obj.blocks !== "undefined") {
      const rootProps = (obj.rootProps as Record<string, unknown>) || {};
      const page = transformPageWithTrail(obj);
      _debugTrail = ["building envelope (navigation/theme/pruning)"];
      return successResult(buildEnvelopeWithTrail([page], rootProps));
    }

    const rootProps = {};
    _debugTrail = [];
    const output = transformBlock(obj, rootProps);
    if (output === null) return { success: false, error: "Unsupported block type or empty result" };
    return successResult(output);
  } catch (e) {
    const trail = e instanceof Error ? (e as Error & { sooqTrail?: string[] }).sooqTrail : undefined;
    const where = trail && trail.length > 0 ? ` — stopped while converting: ${trail.join(" > ")}` : "";
    return { success: false, error: `Transform error: ${(e as Error).message}${where}` };
  }
}

// ─── Example Presets ─────────────────────────────────────────────────────────

const PK = (o: Record<string, unknown>) => JSON.stringify(o, null, 2);

export type ExamplePreset = {
  label: string;
  json: string;
  /**
   * Legacy presets are authored from web block types that are **not** in the mobile block set
   * (docs/BLOCKS-MOBILE.md) — `Text`, `Heading`, `Button`, `Hero`, `Card`, `Badge`, `Space`,
   * `ProductGrid`, `TestimonialGrid`, `Countdown`, … They still convert, so they are kept as
   * regression fixtures for old `store_config.json` payloads, but they must not be used as a
   * template for new work. The converter UI shows them disabled behind a "Show legacy" toggle.
   */
  legacy?: boolean;
  /** Why this preset is legacy — shown in the UI. */
  legacyReason?: string;
};

/**
 * The product-detail page every catalogue needs.
 *
 * A products grid emits `navigate → /product/details/:productId` on each card whether or not the
 * merchant authored a target, so a catalogue without this page has a dead tap on every product.
 * The web route stays `/products/:product-slug`; normalizeRoute rewrites it to the canonical
 * mobile route, and the dispatcher fills `:productId` from the tapped item.
 *
 * The bound `Group` is what makes it a real page rather than a mockup: `metadata.apiUrl` becomes
 * the page's own request, and each child's `valueContext` becomes a `valuePath` into the response.
 * `addToCart` then resolves `variantId` from that same response — a bare `cart.addItem` with no
 * params fails every time.
 */
const PRODUCT_DETAILS_PAGE = {
  path: "/products/:product-slug", slug: "/products/example-product", name: "تفاصيل المنتج",
  link: "/products/example-product", title: "تفاصيل المنتج",
  dynamic: true, examplePath: "/products/example-product", iconName: "Package",
  content: [{
    type: "Section",
    props: {
      name: "تفاصيل المنتج", visible: true,
      paddingTop: "24px", paddingBottom: "32px", paddingHorizontal: "16px",
      columns: 1, columnsMobile: 1, gridGap: "16px",
      content: [{
        type: "Group",
        props: {
          direction: "column", gap: 16, alignItems: "stretch", language: "ar",
          product: { id: "prod-001", titleAr: "قميص كلاسيكي", titleEn: "Classic Shirt", slug: "classic-shirt" },
          metadata: {
            type: "product", method: "get", id: "prod-001",
            apiUrl: "https://api.example.com/public/products/classic-shirt?include=PRICING&include=IMAGES",
          },
          content: [
            { type: "ContentImage", props: { src: "https://placehold.co/600x600", valueContext: { path: "images[0].url" }, alt: "صورة المنتج", aspectRatio: "square", radius: "theme-lg" } },
            { type: "ContentHeading", props: { text: "قميص كلاسيكي", valueContext: { path: "product.title" }, level: "1", textAlign: "right", fontSize: "theme-xl", fontWeight: "theme-bold", color: "theme-text" } },
            { type: "ContentParagraph", props: { text: "٠ ل.س", valueContext: { path: "pricing.displayPrice" }, textAlign: "right", fontSize: "theme-lg", fontWeight: "theme-semibold", color: "theme-primary" } },
            { type: "ContentParagraph", props: { text: "وصف المنتج", valueContext: { path: "product.description" }, textAlign: "right", fontSize: "theme-sm", color: "theme-neutral" } },
            { type: "ContentButton", props: { label: "إضافة إلى السلة", align: "center", destinationType: "action", buttonAction: "addToCart", buttonVariantMode: "variant", buttonVariant: "primary", buttonVariantSize: "lg" } },
          ],
        },
      }],
    },
  }],
};

export const EXAMPLE_PRESETS: ExamplePreset[] = [
  {
    // ── Canonical example ──────────────────────────────────────────────────────
    // Four pages, authored strictly from the mobile block set in docs/BLOCKS-MOBILE.md:
    //   /                static content only  — ContentHeading, ContentParagraph, ContentImage,
    //                                          ImageGallery, ContentIcon, ContentDivider,
    //                                          Accordion, Testimonials, VideoEmbed, Group, Flex
    //   /login           OTP step 1           — ContentInput + ContentSwitch + ContentButton(login)
    //   /auth/otp-reset  OTP step 2           — otpCode ContentInput + ContentButton(verifyOtp)
    //   /products        products-grid preset — one unexpanded card-template Group (§9.7)
    // No SiteHeader / SiteFooter / ZonePopup / Space / RowGroup: none are in the mobile set.
    label: "Mobile Site JSON · 4 pages (home · login · otp · products)",
    json: PK({
      root: {
        props: {
          title: "متجري", direction: "rtl", language: "ar",
          primary: "#0b78c5", surface: "#f6f8fc", text: "#14243f", neutral: "#6b7d93",
          success: "#0f9d73", warning: "#c77a15", error: "#c24133",
          bodyFont: "cairo", radiusSm: "8px", radiusMd: "12px", radiusLg: "18px",
          breakpointMobileMax: 767, breakpointTabletMax: 1023,
        },
      },
      zones: {
        // ZoneDrawer is one of the two site zones in the mobile block set. Its slot content
        // becomes the page-level `appDrawer`; the appBar gets showMenu + openDrawer from it.
        "root:zone-drawer": [{
          type: "ZoneDrawer",
          props: {
            is_active: true, is_mobile_only: true, zoneKey: "site-drawer", side: "left",
            backgroundColor: "#ffffff", overlay: true, showCloseButton: true,
            slot: [
              { type: "ContentHeading", props: { text: "القائمة", level: "3", textAlign: "right", fontSize: "theme-lg", fontWeight: "theme-semibold", color: "theme-text" } },
              { type: "ContentLink", props: { title: "الرئيسية", link: { kind: "page", pageId: "/" }, align: "right", color: "theme-text", fontSize: "theme-md" } },
              { type: "ContentLink", props: { title: "المنتجات", link: { kind: "page", pageId: "/products" }, align: "right", color: "theme-text", fontSize: "theme-md" } },
              { type: "ContentLink", props: { title: "تسجيل الدخول", link: { kind: "page", pageId: "/login" }, align: "right", color: "theme-primary", fontSize: "theme-md" } },
            ],
          },
        }],
      },
      pages: [
        // ── 1. Home — static blocks only, no data binding, no actions ──────────
        {
          path: "/", slug: "/", name: "الرئيسية", link: "/", title: "الرئيسية",
          description: "الصفحة الرئيسية للمتجر", iconName: "home",
          content: [
            {
              type: "Section",
              props: {
                name: "الترحيب", anchorId: "", visible: true,
                paddingTop: "40px", paddingBottom: "32px", paddingHorizontal: "16px",
                backgroundColor: "#f6f8fc", theme: "dark", maxWidth: "1280px",
                columns: 1, columnsMobile: 1, gridGap: "16px",
                content: [
                  { type: "ContentHeading", props: { text: "أهلاً بك في متجري", level: "1", textAlign: "center", fontFamily: "body", fontSize: "theme-2xl", fontWeight: "theme-bold", lineHeight: "theme-tight", color: "theme-text" } },
                  { type: "ContentParagraph", props: { text: "تشكيلة مختارة بعناية، وتوصيل خلال ٢-٤ أيام عمل لكل المحافظات.", textAlign: "center", fontFamily: "body", fontSize: "theme-md", fontWeight: "theme-light", lineHeight: "theme-normal", color: "theme-neutral" } },
                  { type: "ContentImage", props: { src: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80", alt: "صورة البانر الرئيسي", align: "center", objectFit: "cover", radius: "theme-lg", maxWidth: "100%" } },
                  { type: "ContentButton", props: { label: "تصفّح المنتجات", align: "center", destinationType: "link", link: { kind: "page", pageId: "/products" }, buttonVariantMode: "variant", buttonVariant: "primary", buttonVariantSize: "lg" } },
                ],
              },
            },
            {
              // Flex row of icon+text pairs — the mobile-set way to build a features strip
              // (the legacy `Card` / `Stats` blocks are not in the mobile registry).
              type: "Section",
              props: {
                name: "المزايا", visible: true,
                paddingTop: "32px", paddingBottom: "32px", paddingHorizontal: "16px",
                backgroundColor: "#ffffff", columns: 1, columnsMobile: 1, gridGap: "16px",
                content: [
                  { type: "ContentHeading", props: { text: "لماذا نحن؟", level: "2", textAlign: "right", fontSize: "theme-xl", fontWeight: "theme-bold", color: "theme-text" } },
                  {
                    type: "Flex",
                    props: {
                      direction: "row", justifyContent: "center", gap: 16, wrap: "nowrap",
                      items: [
                        {
                          type: "Group",
                          props: {
                            direction: "column", gap: 8, alignItems: "center", justifyContent: "flex-start", wrap: "nowrap",
                            backgroundColor: "theme-surface", padding: "16px", borderRadius: "theme-md", boxShadow: "sm",
                            content: [
                              { type: "ContentIcon", props: { icon: "truck", size: 32, colorMode: "theme", colorTheme: "primary" } },
                              { type: "ContentHeading", props: { text: "توصيل سريع", level: "3", textAlign: "center", fontSize: "theme-md", fontWeight: "theme-semibold", color: "theme-text" } },
                              { type: "ContentParagraph", props: { text: "٢-٤ أيام عمل", textAlign: "center", fontSize: "theme-sm", color: "theme-neutral" } },
                            ],
                          },
                        },
                        {
                          type: "Group",
                          props: {
                            direction: "column", gap: 8, alignItems: "center", justifyContent: "flex-start", wrap: "nowrap",
                            backgroundColor: "theme-surface", padding: "16px", borderRadius: "theme-md", boxShadow: "sm",
                            content: [
                              { type: "ContentIcon", props: { icon: "shield-check", size: 32, colorMode: "theme", colorTheme: "success" } },
                              { type: "ContentHeading", props: { text: "دفع آمن", level: "3", textAlign: "center", fontSize: "theme-md", fontWeight: "theme-semibold", color: "theme-text" } },
                              { type: "ContentParagraph", props: { text: "الدفع عند الاستلام متاح", textAlign: "center", fontSize: "theme-sm", color: "theme-neutral" } },
                            ],
                          },
                        },
                      ],
                    },
                  },
                  { type: "ContentDivider", props: { thickness: "1px", colorMode: "theme", colorTheme: "neutral" } },
                ],
              },
            },
            {
              type: "Section",
              props: {
                name: "المعرض", visible: true,
                paddingTop: "32px", paddingBottom: "32px", paddingHorizontal: "16px",
                backgroundColor: "#ffffff", columns: 1, columnsMobile: 1, gridGap: "16px",
                content: [
                  { type: "ContentHeading", props: { text: "من المتجر", level: "2", textAlign: "right", fontSize: "theme-xl", fontWeight: "theme-bold", color: "theme-text" } },
                  {
                    type: "ImageGallery",
                    props: {
                      mode: "slider", aspectRatio: "landscape", objectFit: "cover",
                      radius: "theme-md", gap: "theme-16", slidesPerView: 1,
                      autoplay: true, autoplayDuration: "theme-5", showArrows: true,
                      images: [
                        { src: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1000&q=80", alt: "ساعة" },
                        { src: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=1000&q=80", alt: "كاميرا" },
                      ],
                    },
                  },
                  { type: "ContentHeading", props: { text: "شاهد الفيديو التعريفي", level: "3", textAlign: "right", fontSize: "theme-lg", fontWeight: "theme-semibold", color: "theme-text" } },
                  { type: "VideoEmbed", props: { src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", align: "center", size: "theme-315", radius: "theme-lg" } },
                ],
              },
            },
            {
              type: "Section",
              props: {
                name: "آراء العملاء والأسئلة", visible: true,
                paddingTop: "32px", paddingBottom: "40px", paddingHorizontal: "16px",
                backgroundColor: "#f6f8fc", columns: 1, columnsMobile: 1, gridGap: "16px",
                content: [
                  {
                    type: "Testimonials",
                    props: {
                      source: "inline", layoutVariant: "carousel", columns: 2, language: "ar",
                      showRating: true, showAvatars: false, itemCount: 2,
                      inlineItems: [
                        { id: "t1", name: { ar: "أحمد علي", en: "Ahmed Ali" }, role: { ar: "عميل", en: "Customer" }, avatar: "", rating: 5, text: { ar: "منتجات رائعة وتوصيل سريع.", en: "Great products, fast delivery." } },
                        { id: "t2", name: { ar: "سارة حسن", en: "Sara Hasan" }, role: { ar: "عميلة", en: "Customer" }, avatar: "", rating: 4, text: { ar: "خدمة عملاء ممتازة.", en: "Excellent support." } },
                      ],
                    },
                  },
                  {
                    type: "Accordion",
                    props: {
                      heading: "الأسئلة الشائعة",
                      description: "إجابات مختصرة وعملية.",
                      variant: "soft", backgroundColor: "", textColor: "",
                      items: [
                        { title: "كم يستغرق التوصيل؟", body: "معظم الطلبات تصل خلال ٢-٤ أيام عمل حسب المدينة.", open: true },
                        { title: "هل يمكن الدفع عند الاستلام؟", body: "نعم، الدفع عند الاستلام متاح لجميع المناطق المؤهلة.", open: false },
                        { title: "هل تقدّمون إرجاعاً للمنتجات؟", body: "يمكنك طلب الإرجاع خلال ٧ أيام للمنتجات غير المستخدمة.", open: false },
                      ],
                    },
                  },
                ],
              },
            },
          ],
        },

        // ── 2. Login — step 1 of the OTP flow ──────────────────────────────────
        // The Section holds ContentInput fields *and* a ContentButton with buttonAction "login",
        // so the converter wraps its content in a `form` node and the button submits
        // cubitCall auth.requestOtp (requireValidForm + formId + form params). There is no
        // AuthCubit.login and no password in the flow — the button sends a code and hands off to
        // /auth/otp-reset.
        // No `scroll` here: an auth form makes the page emit `layout: "centered"` (§7 page rules).
        {
          path: "/login", slug: "/login", name: "تسجيل الدخول", link: "/login",
          title: "تسجيل الدخول", description: "الدخول إلى حسابك", iconName: "user",
          isCustom: true,
          content: [{
            type: "Section",
            props: {
              name: "نموذج الدخول", visible: true,
              paddingTop: "48px", paddingBottom: "48px", paddingHorizontal: "24px",
              backgroundColor: "#ffffff", maxWidth: "480px",
              columns: 1, columnsMobile: 1, gridGap: "16px",
              content: [
                { type: "ContentHeading", props: { text: "تسجيل الدخول", level: "1", textAlign: "center", fontSize: "theme-2xl", fontWeight: "theme-bold", color: "theme-text" } },
                { type: "ContentParagraph", props: { text: "أدخل رقم هاتفك واسمك، وسنرسل لك رمز تحقق.", textAlign: "center", fontSize: "theme-sm", fontWeight: "theme-light", color: "theme-neutral" } },
                { type: "ContentInput", props: { label: "رقم الهاتف", name: "phone", inputType: "tel", placeholder: "09xxxxxxxx", required: true, prependIcon: "none", inputAction: "" } },
                { type: "ContentInput", props: { label: "الاسم الكامل", name: "fullName", inputType: "text", placeholder: "الاسم الثلاثي", required: true, prependIcon: "none", inputAction: "" } },
                { type: "ContentSwitch", props: { label: "تذكّرني", name: "rememberMe", helperText: "", defaultChecked: false, labelPosition: "start", switchAction: "" } },
                { type: "ContentButton", props: { label: "إرسال رمز التحقق", align: "center", destinationType: "action", buttonAction: "login", buttonVariantMode: "variant", buttonVariant: "primary", buttonVariantSize: "lg" } },
                { type: "ContentDivider", props: { thickness: "1px", colorMode: "theme", colorTheme: "neutral" } },
                { type: "ContentLink", props: { title: "العودة إلى الرئيسية", link: { kind: "page", pageId: "/" }, align: "center", color: "theme-primary", hoverEffect: "underline", fontSize: "theme-sm", icon: "none" } },
              ],
            },
          }],
        },

        // ── 3. OTP — step 2 of the OTP flow ────────────────────────────────────
        // `/auth/otp-reset` is where requestOtp lands. The app registers routes from pages[], so
        // the screen has to be authored here. The `otpCode` ContentInput becomes the engine's
        // six-box `otpInput`; verifyOtp reads the phone back out of `authState`.
        {
          path: "/auth/otp-reset", slug: "/auth/otp-reset", name: "رمز التحقق", link: "/auth/otp-reset",
          title: "رمز التحقق", description: "تأكيد رقم الهاتف", iconName: "shield",
          isCustom: true,
          content: [{
            type: "Section",
            props: {
              name: "نموذج التحقق", visible: true,
              paddingTop: "48px", paddingBottom: "48px", paddingHorizontal: "24px",
              backgroundColor: "#ffffff", maxWidth: "480px",
              columns: 1, columnsMobile: 1, gridGap: "16px",
              content: [
                { type: "ContentHeading", props: { text: "رمز التحقق", level: "1", textAlign: "center", fontSize: "theme-2xl", fontWeight: "theme-bold", color: "theme-text" } },
                { type: "ContentParagraph", props: { text: "أدخل الرمز المكوّن من ستة أرقام الذي أرسلناه إلى رقم هاتفك.", textAlign: "center", fontSize: "theme-sm", fontWeight: "theme-light", color: "theme-neutral" } },
                { type: "ContentInput", props: { label: "", name: "otpCode", inputType: "text", placeholder: "______", required: true, prependIcon: "none", inputAction: "" } },
                { type: "ContentButton", props: { label: "تأكيد", align: "center", destinationType: "action", buttonAction: "verifyOtp", submitRedirectUrl: "/", buttonVariantMode: "variant", buttonVariant: "primary", buttonVariantSize: "lg" } },
              ],
            },
          }],
        },

        // ── 4. Products — the products-grid section preset ─────────────────────
        // The preset Section is NOT expanded on the web side: `content` holds exactly one
        // card-template Group with `product: null`, and the repeater clones it per product.
        // The converter maps that onto gridView + itemBuilder.repeat over the collection
        // request (§9.7); children `valueContext` paths become item.* paths (§9.5).
        {
          path: "/products", slug: "/products", name: "المنتجات", link: "/products",
          title: "كل المنتجات", description: "تصفّح كل منتجات المتجر", iconName: "package",
          isCustom: true,
          content: [
            {
              type: "Section",
              props: {
                name: "مقدمة", visible: true,
                paddingTop: "32px", paddingBottom: "0px", paddingHorizontal: "16px",
                backgroundColor: "#ffffff", columns: 1, columnsMobile: 1, gridGap: "16px",
                content: [
                  { type: "ContentHeading", props: { text: "المنتجات المميزة", level: "2", textAlign: "right", fontSize: "theme-xl", fontWeight: "theme-bold", color: "theme-text" } },
                  { type: "ContentParagraph", props: { text: "اضغط على أي منتج لعرض تفاصيله.", textAlign: "right", fontSize: "theme-sm", fontWeight: "theme-light", color: "theme-neutral" } },
                ],
              },
            },
            {
              type: "Section",
              props: {
                name: "Featured", visible: true,
                paddingTop: "16px", paddingBottom: "40px", paddingHorizontal: "16px",
                backgroundColor: "#ffffff", maxWidth: "1280px",
                columns: 3, columnsMobile: 2, gridGap: "16px",
                metadata: { preset: "products-grid" },
                collection: { id: "coll_featured", name: "Featured", slug: "featured", productCount: 24 },
                content: [{
                  type: "Group",
                  props: {
                    product: null, metadata: null,
                    direction: "column", gap: 10, alignItems: "stretch", justifyContent: "flex-start", wrap: "nowrap",
                    backgroundColor: "theme-surface", padding: "12px", borderRadius: "theme-md", boxShadow: "sm",
                    language: "ar",
                    content: [
                      { type: "ContentImage", props: { src: "https://placehold.co/400x400", valueContext: { path: "images[0].url" }, alt: "صورة المنتج", altValueContext: { path: "product.title" }, align: "center", objectFit: "cover", radius: "theme-md", maxWidth: "100%" } },
                      { type: "ContentHeading", props: { text: "اسم المنتج", valueContext: { path: "product.title" }, level: "3", textAlign: "right", fontSize: "theme-md", fontWeight: "theme-semibold", color: "theme-text" } },
                      { type: "ContentParagraph", props: { text: "٠ ل.س", valueContext: { path: "pricing.displayPrice" }, textAlign: "right", fontSize: "theme-sm", fontWeight: "theme-semibold", color: "theme-primary" } },
                      { type: "ContentButton", props: { label: "إضافة إلى السلة", align: "center", destinationType: "action", buttonAction: "addToCart", buttonVariantMode: "variant", buttonVariant: "primary", buttonVariantSize: "sm" } },
                    ],
                  },
                }],
              },
            },
          ],
        },

        // ── 5. Product detail — the target every product card navigates to ─────
        PRODUCT_DETAILS_PAGE,
      ],
    }),
  },
  {
    // ── Second canonical example ───────────────────────────────────────────────
    // Three pages, mobile block set only, with a deliberately non-default theme:
    //   /                 "about us" heading, then a grid Section (columnsMobile: 1 ⇒ every cell
    //                     full width) whose cells are Group blocks stacking a title over a
    //                     description, then a ContentButton linking to /login
    //   /login            phone + fullName + a login ContentButton ⇒ form + auth.requestOtp
    //   /auth/otp-reset   otpCode + a verifyOtp ContentButton     ⇒ form + auth.verifyOtp
    // The two auth pages are the complete engine flow, end to end:
    //   /login --requestOtp--> /auth/otp-reset --verifyOtp--> /home
    // Theme departs from the defaults on every axis the converter reads: a serif Arabic face
    // (Amiri), a warm plum/clay palette, wider radii and a custom spacing scale.
    label: "Mobile Site JSON · 3 pages (about us · login · otp) — serif theme",
    json: PK({
      root: {
        props: {
          title: "دار الحرفة", direction: "rtl", language: "ar",

          // Serif Arabic face — `amiri` is a classic naskh serif. The converter maps the
          // FONT_OPTIONS slug to the family name; it no longer forces Tajawal on every ar store.
          bodyFont: "amiri",
          fontOption1: "el-messiri",
          fontOption2: "noto-naskh-arabic",

          // Palette: warm plum / clay, nothing like the default blue-grey.
          primary: "#7c3f5d",
          surface: "#faf3ee",
          text: "#2f2320",
          neutral: "#8a7268",
          success: "#4f7a4a",
          warning: "#b8802a",
          error: "#a3423a",
          dark: "#2a1c22",

          // Softer, wider corners than the defaults (8 / 12 / 18 / 24).
          radiusSm: "10px",
          radiusMd: "18px",
          radiusLg: "28px",
          radiusXl: "36px",

          // Custom spacing scale. The side scale drives theme.spacing sm/md/lg,
          // spacingVerticalMedium drives xl.
          spacingSideNarrow: "14px",
          spacingSideMedium: "16px",
          spacingSideWide: "32px",
          spacingVerticalNarrow: "32px",
          spacingVerticalMedium: "48px",
          spacingVerticalWide: "96px",

          // Roomier buttons than the 36 / 48 / 56 defaults.
          buttonSmHeight: "40px",
          buttonMdHeight: "52px",
          buttonLgHeight: "60px",

          breakpointMobileMax: 767,
          breakpointTabletMax: 1023,
        },
      },
      zones: {
        // Navigation drawer — the site zone the mobile block set exposes. Becomes the
        // page-level appDrawer on both pages and turns on appBar.showMenu.
        "root:zone-drawer": [{
          type: "ZoneDrawer",
          props: {
            is_active: true, is_mobile_only: true, zoneKey: "site-drawer", side: "right",
            backgroundColor: "#faf3ee", overlay: true, showCloseButton: true,
            slot: [
              { type: "ContentHeading", props: { text: "دار الحرفة", level: "3", textAlign: "right", fontSize: "theme-lg", fontWeight: "theme-bold", color: "theme-primary" } },
              { type: "ContentDivider", props: { thickness: "1px", colorMode: "theme", colorTheme: "neutral" } },
              { type: "ContentLink", props: { title: "من نحن", link: { kind: "page", pageId: "/" }, align: "right", color: "theme-text", hoverEffect: "underline", fontSize: "theme-md", icon: "none" } },
              { type: "ContentLink", props: { title: "تسجيل الدخول", link: { kind: "page", pageId: "/login" }, align: "right", color: "theme-primary", hoverEffect: "underline", fontSize: "theme-md", icon: "none" } },
            ],
          },
        }],
      },
      pages: [
        // ── 1. Home — "about us" heading + full-width grid ────────────────────
        {
          path: "/", slug: "/", name: "من نحن", link: "/", title: "من نحن",
          description: "تعرّف على دار الحرفة", iconName: "home",
          content: [
            // Section 1 — the "about us" title.
            {
              type: "Section",
              props: {
                name: "عنوان من نحن", anchorId: "", visible: true,
                paddingTop: "56px", paddingBottom: "20px", paddingHorizontal: "20px",
                backgroundColor: "#faf3ee", theme: "dark", maxWidth: "1280px",
                columns: 1, columnsMobile: 1, gridGap: "20px",
                content: [
                  { type: "ContentHeading", props: { text: "من نحن", level: "1", textAlign: "right", fontFamily: "body", fontSize: "theme-2xl", fontWeight: "theme-bold", lineHeight: "theme-tight", color: "theme-primary" } },
                  { type: "ContentParagraph", props: { text: "ورشة عائلية تصنع الأثاث الخشبي يدويًا منذ عام ١٩٧٨.", textAlign: "right", fontFamily: "body", fontSize: "theme-md", fontWeight: "theme-light", lineHeight: "theme-normal", color: "theme-neutral" } },
                  { type: "ContentDivider", props: { thickness: "1px", colorMode: "theme", colorTheme: "neutral" } },
                ],
              },
            },
            // Section 2 — the grid. The SECTION is the grid container here: two columns on a
            // wide viewport, `columnsMobile: 1` so every cell takes the full width on mobile.
            // At one mobile column transformSection emits a plain `column`, so the cards keep
            // their natural heights. A `Grid` block would instead emit gridView with
            // childAspectRatio: 1.0 and square off every card — wrong for variable-height text.
            // Each cell is a Group stacking its title above its description.
            {
              type: "Section",
              props: {
                name: "بطاقات من نحن", visible: true,
                paddingTop: "0px", paddingBottom: "20px", paddingHorizontal: "20px",
                backgroundColor: "#faf3ee", maxWidth: "1280px",
                columns: 2, columnsMobile: 1, gridGap: "20px",
                content: [
                  {
                    type: "Group",
                    props: {
                      direction: "column", gap: 8, alignItems: "stretch", justifyContent: "flex-start", wrap: "nowrap",
                      backgroundColor: "theme-surface", padding: "20px", borderRadius: "theme-md", boxShadow: "sm",
                      content: [
                        { type: "ContentHeading", props: { text: "قصتنا", level: "2", textAlign: "right", fontSize: "theme-lg", fontWeight: "theme-semibold", color: "theme-text" } },
                        { type: "ContentParagraph", props: { text: "بدأت الورشة بغرفة صغيرة وأربع أدوات. اليوم نصنع قطعًا تدوم لأجيال، بالطريقة نفسها التي تعلّمها جدّي.", textAlign: "right", fontSize: "theme-md", fontWeight: "theme-light", lineHeight: "theme-relaxed", color: "theme-neutral" } },
                      ],
                    },
                  },
                  {
                    type: "Group",
                    props: {
                      direction: "column", gap: 8, alignItems: "stretch", justifyContent: "flex-start", wrap: "nowrap",
                      backgroundColor: "theme-surface", padding: "20px", borderRadius: "theme-md", boxShadow: "sm",
                      content: [
                        { type: "ContentHeading", props: { text: "حرفتنا", level: "2", textAlign: "right", fontSize: "theme-lg", fontWeight: "theme-semibold", color: "theme-text" } },
                        { type: "ContentParagraph", props: { text: "خشب الجوز والزان المعالج طبيعيًا، وتجميع بالنقر والفتحة بلا مسامير. كل قطعة تُصقل يدويًا.", textAlign: "right", fontSize: "theme-md", fontWeight: "theme-light", lineHeight: "theme-relaxed", color: "theme-neutral" } },
                      ],
                    },
                  },
                  {
                    type: "Group",
                    props: {
                      direction: "column", gap: 8, alignItems: "stretch", justifyContent: "flex-start", wrap: "nowrap",
                      backgroundColor: "theme-surface", padding: "20px", borderRadius: "theme-md", boxShadow: "sm",
                      content: [
                        { type: "ContentHeading", props: { text: "وعدنا", level: "2", textAlign: "right", fontSize: "theme-lg", fontWeight: "theme-semibold", color: "theme-text" } },
                        { type: "ContentParagraph", props: { text: "ضمان خمس سنوات على كل قطعة، وإصلاح مجاني لأي عيب في التصنيع مدى الحياة.", textAlign: "right", fontSize: "theme-md", fontWeight: "theme-light", lineHeight: "theme-relaxed", color: "theme-neutral" } },
                      ],
                    },
                  },
                ],
              },
            },
            // Section 3 — link to the login screen.
            {
              type: "Section",
              props: {
                name: "دعوة للتسجيل", visible: true,
                paddingTop: "0px", paddingBottom: "56px", paddingHorizontal: "20px",
                backgroundColor: "#faf3ee", columns: 1, columnsMobile: 1, gridGap: "20px",
                content: [
                  { type: "ContentButton", props: { label: "تسجيل الدخول", align: "center", destinationType: "link", link: { kind: "page", pageId: "/login" }, buttonVariantMode: "variant", buttonVariant: "primary", buttonVariantSize: "lg" } },
                ],
              },
            },
          ],
        },

        // ── 2. Login — step 1 of the OTP flow ─────────────────────────────────
        // `buttonAction: "login"` does not call a `login` method: AuthCubit has none. It submits
        // `auth.requestOtp` (phone + fullName from the form, tenantSlug from the app envelope) and
        // lands on /auth/otp-reset. The credential stays `phone` / `inputType: "tel"` regardless of
        // theme — auth is a phone/OTP flow, and there is no password anywhere in it.
        {
          path: "/login", slug: "/login", name: "تسجيل الدخول", link: "/login",
          title: "تسجيل الدخول", description: "الدخول إلى حسابك", iconName: "user",
          isCustom: true,
          content: [{
            type: "Section",
            props: {
              name: "نموذج الدخول", visible: true,
              paddingTop: "56px", paddingBottom: "56px", paddingHorizontal: "20px",
              backgroundColor: "#faf3ee", maxWidth: "480px",
              columns: 1, columnsMobile: 1, gridGap: "20px",
              content: [
                { type: "ContentHeading", props: { text: "تسجيل الدخول", level: "1", textAlign: "center", fontSize: "theme-2xl", fontWeight: "theme-bold", color: "theme-primary" } },
                { type: "ContentInput", props: { label: "رقم الهاتف", name: "phone", inputType: "tel", placeholder: "09xxxxxxxx", required: true, prependIcon: "none", inputAction: "" } },
                { type: "ContentInput", props: { label: "الاسم الكامل", name: "fullName", inputType: "text", placeholder: "الاسم الثلاثي", required: true, prependIcon: "none", inputAction: "" } },
                { type: "ContentButton", props: { label: "إرسال رمز التحقق", align: "center", destinationType: "action", buttonAction: "login", buttonVariantMode: "variant", buttonVariant: "primary", buttonVariantSize: "lg" } },
              ],
            },
          }],
        },

        // ── 3. OTP — step 2 of the OTP flow ───────────────────────────────────
        // The route the app registers is `/auth/otp-reset`; nothing is natively mounted, so the
        // page has to be authored here or the requestOtp success navigate is a dead end.
        // The `otpCode` ContentInput is what becomes the engine's six-box `otpInput`, and the
        // verifyOtp button reads the phone back out of `authState` — the screen never re-asks
        // for it. `submitRedirectUrl: "/"` is the post-login landing (normalized to /home).
        {
          path: "/auth/otp-reset", slug: "/auth/otp-reset", name: "رمز التحقق", link: "/auth/otp-reset",
          title: "رمز التحقق", description: "تأكيد رقم الهاتف", iconName: "shield",
          isCustom: true,
          content: [{
            type: "Section",
            props: {
              name: "نموذج التحقق", visible: true,
              paddingTop: "56px", paddingBottom: "56px", paddingHorizontal: "20px",
              backgroundColor: "#faf3ee", maxWidth: "480px",
              columns: 1, columnsMobile: 1, gridGap: "20px",
              content: [
                { type: "ContentHeading", props: { text: "رمز التحقق", level: "1", textAlign: "center", fontSize: "theme-2xl", fontWeight: "theme-bold", color: "theme-primary" } },
                { type: "ContentParagraph", props: { text: "أدخل الرمز المكوّن من ستة أرقام الذي أرسلناه إلى رقم هاتفك.", textAlign: "center", fontSize: "theme-md", fontWeight: "theme-light", lineHeight: "theme-normal", color: "theme-neutral" } },
                { type: "ContentInput", props: { label: "", name: "otpCode", inputType: "text", placeholder: "______", required: true, prependIcon: "none", inputAction: "" } },
                { type: "ContentButton", props: { label: "تأكيد", align: "center", destinationType: "action", buttonAction: "verifyOtp", submitRedirectUrl: "/", buttonVariantMode: "variant", buttonVariant: "primary", buttonVariantSize: "lg" } },
              ],
            },
          }],
        },
      ],
    }),
  },
  {
    // ── Third canonical example ────────────────────────────────────────────────
    // Builds on Example 2 (about us · login · otp, serif theme) and adds commerce
    // binding: products-page preset (full catalogue + addToCart) and cart template.
    //   /                 about us + login CTA (+ browse products CTA)
    //   /login            auth.requestOtp
    //   /auth/otp-reset   auth.verifyOtp → /home
    //   /products         products-page preset ⇒ gridView + props.data + itemBuilder
    //   /cart             cartLineId Group ⇒ listView over cart.items
    label: "Mobile Site JSON · about us · login · otp · products · cart — serif theme",
    json: PK({
      root: {
        props: {
          title: "دار الحرفة", direction: "rtl", language: "ar",
          bodyFont: "amiri",
          fontOption1: "el-messiri",
          fontOption2: "noto-naskh-arabic",
          primary: "#7c3f5d",
          surface: "#faf3ee",
          text: "#2f2320",
          neutral: "#8a7268",
          success: "#4f7a4a",
          warning: "#b8802a",
          error: "#a3423a",
          dark: "#2a1c22",
          radiusSm: "10px",
          radiusMd: "18px",
          radiusLg: "28px",
          radiusXl: "36px",
          spacingSideNarrow: "14px",
          spacingSideMedium: "16px",
          spacingSideWide: "32px",
          spacingVerticalNarrow: "32px",
          spacingVerticalMedium: "48px",
          spacingVerticalWide: "96px",
          buttonSmHeight: "40px",
          buttonMdHeight: "52px",
          buttonLgHeight: "60px",
          breakpointMobileMax: 767,
          breakpointTabletMax: 1023,
        },
      },
      zones: {
        "root:zone-drawer": [{
          type: "ZoneDrawer",
          props: {
            is_active: true, is_mobile_only: true, zoneKey: "site-drawer", side: "right",
            backgroundColor: "#faf3ee", overlay: true, showCloseButton: true,
            slot: [
              { type: "ContentHeading", props: { text: "دار الحرفة", level: "3", textAlign: "right", fontSize: "theme-lg", fontWeight: "theme-bold", color: "theme-primary" } },
              { type: "ContentDivider", props: { thickness: "1px", colorMode: "theme", colorTheme: "neutral" } },
              { type: "ContentLink", props: { title: "من نحن", link: { kind: "page", pageId: "/" }, align: "right", color: "theme-text", hoverEffect: "underline", fontSize: "theme-md", icon: "none" } },
              { type: "ContentLink", props: { title: "المنتجات", link: { kind: "page", pageId: "/products" }, align: "right", color: "theme-text", hoverEffect: "underline", fontSize: "theme-md", icon: "none" } },
              { type: "ContentLink", props: { title: "تسجيل الدخول", link: { kind: "page", pageId: "/login" }, align: "right", color: "theme-primary", hoverEffect: "underline", fontSize: "theme-md", icon: "none" } },
            ],
          },
        }],
      },
      pages: [
        {
          path: "/", slug: "/", name: "من نحن", link: "/", title: "من نحن",
          description: "تعرّف على دار الحرفة", iconName: "home",
          content: [
            {
              type: "Section",
              props: {
                name: "عنوان من نحن", anchorId: "", visible: true,
                paddingTop: "56px", paddingBottom: "20px", paddingHorizontal: "20px",
                backgroundColor: "#faf3ee", theme: "dark", maxWidth: "1280px",
                columns: 1, columnsMobile: 1, gridGap: "20px",
                content: [
                  { type: "ContentHeading", props: { text: "من نحن", level: "1", textAlign: "right", fontFamily: "body", fontSize: "theme-2xl", fontWeight: "theme-bold", lineHeight: "theme-tight", color: "theme-primary" } },
                  { type: "ContentParagraph", props: { text: "ورشة عائلية تصنع الأثاث الخشبي يدويًا منذ عام ١٩٧٨.", textAlign: "right", fontFamily: "body", fontSize: "theme-md", fontWeight: "theme-light", lineHeight: "theme-normal", color: "theme-neutral" } },
                  { type: "ContentDivider", props: { thickness: "1px", colorMode: "theme", colorTheme: "neutral" } },
                ],
              },
            },
            {
              type: "Section",
              props: {
                name: "بطاقات من نحن", visible: true,
                paddingTop: "0px", paddingBottom: "20px", paddingHorizontal: "20px",
                backgroundColor: "#faf3ee", maxWidth: "1280px",
                columns: 2, columnsMobile: 1, gridGap: "20px",
                content: [
                  {
                    type: "Group",
                    props: {
                      direction: "column", gap: 8, alignItems: "stretch", justifyContent: "flex-start", wrap: "nowrap",
                      backgroundColor: "theme-surface", padding: "20px", borderRadius: "theme-md", boxShadow: "sm",
                      content: [
                        { type: "ContentHeading", props: { text: "قصتنا", level: "2", textAlign: "right", fontSize: "theme-lg", fontWeight: "theme-semibold", color: "theme-text" } },
                        { type: "ContentParagraph", props: { text: "بدأت الورشة بغرفة صغيرة وأربع أدوات. اليوم نصنع قطعًا تدوم لأجيال، بالطريقة نفسها التي تعلّمها جدّي.", textAlign: "right", fontSize: "theme-md", fontWeight: "theme-light", lineHeight: "theme-relaxed", color: "theme-neutral" } },
                      ],
                    },
                  },
                  {
                    type: "Group",
                    props: {
                      direction: "column", gap: 8, alignItems: "stretch", justifyContent: "flex-start", wrap: "nowrap",
                      backgroundColor: "theme-surface", padding: "20px", borderRadius: "theme-md", boxShadow: "sm",
                      content: [
                        { type: "ContentHeading", props: { text: "حرفتنا", level: "2", textAlign: "right", fontSize: "theme-lg", fontWeight: "theme-semibold", color: "theme-text" } },
                        { type: "ContentParagraph", props: { text: "خشب الجوز والزان المعالج طبيعيًا، وتجميع بالنقر والفتحة بلا مسامير. كل قطعة تُصقل يدويًا.", textAlign: "right", fontSize: "theme-md", fontWeight: "theme-light", lineHeight: "theme-relaxed", color: "theme-neutral" } },
                      ],
                    },
                  },
                  {
                    type: "Group",
                    props: {
                      direction: "column", gap: 8, alignItems: "stretch", justifyContent: "flex-start", wrap: "nowrap",
                      backgroundColor: "theme-surface", padding: "20px", borderRadius: "theme-md", boxShadow: "sm",
                      content: [
                        { type: "ContentHeading", props: { text: "وعدنا", level: "2", textAlign: "right", fontSize: "theme-lg", fontWeight: "theme-semibold", color: "theme-text" } },
                        { type: "ContentParagraph", props: { text: "ضمان خمس سنوات على كل قطعة، وإصلاح مجاني لأي عيب في التصنيع مدى الحياة.", textAlign: "right", fontSize: "theme-md", fontWeight: "theme-light", lineHeight: "theme-relaxed", color: "theme-neutral" } },
                      ],
                    },
                  },
                ],
              },
            },
            {
              type: "Section",
              props: {
                name: "دعوة للتسجيل والتسوق", visible: true,
                paddingTop: "0px", paddingBottom: "56px", paddingHorizontal: "20px",
                backgroundColor: "#faf3ee", columns: 1, columnsMobile: 1, gridGap: "20px",
                content: [
                  { type: "ContentButton", props: { label: "تصفّح المنتجات", align: "center", destinationType: "link", link: { kind: "page", pageId: "/products" }, buttonVariantMode: "variant", buttonVariant: "primary", buttonVariantSize: "lg" } },
                  { type: "ContentButton", props: { label: "تسجيل الدخول", align: "center", destinationType: "link", link: { kind: "page", pageId: "/login" }, buttonVariantMode: "variant", buttonVariant: "secondary", buttonVariantSize: "lg" } },
                ],
              },
            },
          ],
        },
        {
          path: "/login", slug: "/login", name: "تسجيل الدخول", link: "/login",
          title: "تسجيل الدخول", description: "الدخول إلى حسابك", iconName: "user",
          isCustom: true,
          content: [{
            type: "Section",
            props: {
              name: "نموذج الدخول", visible: true,
              paddingTop: "56px", paddingBottom: "56px", paddingHorizontal: "20px",
              backgroundColor: "#faf3ee", maxWidth: "480px",
              columns: 1, columnsMobile: 1, gridGap: "20px",
              content: [
                { type: "ContentHeading", props: { text: "تسجيل الدخول", level: "1", textAlign: "center", fontSize: "theme-2xl", fontWeight: "theme-bold", color: "theme-primary" } },
                { type: "ContentInput", props: { label: "رقم الهاتف", name: "phone", inputType: "tel", placeholder: "09xxxxxxxx", required: true, prependIcon: "none", inputAction: "" } },
                { type: "ContentInput", props: { label: "الاسم الكامل", name: "fullName", inputType: "text", placeholder: "الاسم الثلاثي", required: true, prependIcon: "none", inputAction: "" } },
                { type: "ContentButton", props: { label: "إرسال رمز التحقق", align: "center", destinationType: "action", buttonAction: "login", buttonVariantMode: "variant", buttonVariant: "primary", buttonVariantSize: "lg" } },
              ],
            },
          }],
        },
        {
          path: "/auth/otp-reset", slug: "/auth/otp-reset", name: "رمز التحقق", link: "/auth/otp-reset",
          title: "رمز التحقق", description: "تأكيد رقم الهاتف", iconName: "shield",
          isCustom: true,
          content: [{
            type: "Section",
            props: {
              name: "نموذج التحقق", visible: true,
              paddingTop: "56px", paddingBottom: "56px", paddingHorizontal: "20px",
              backgroundColor: "#faf3ee", maxWidth: "480px",
              columns: 1, columnsMobile: 1, gridGap: "20px",
              content: [
                { type: "ContentHeading", props: { text: "رمز التحقق", level: "1", textAlign: "center", fontSize: "theme-2xl", fontWeight: "theme-bold", color: "theme-primary" } },
                { type: "ContentParagraph", props: { text: "أدخل الرمز المكوّن من ستة أرقام الذي أرسلناه إلى رقم هاتفك.", textAlign: "center", fontSize: "theme-md", fontWeight: "theme-light", lineHeight: "theme-normal", color: "theme-neutral" } },
                { type: "ContentInput", props: { label: "", name: "otpCode", inputType: "text", placeholder: "______", required: true, prependIcon: "none", inputAction: "" } },
                { type: "ContentButton", props: { label: "تأكيد", align: "center", destinationType: "action", buttonAction: "verifyOtp", submitRedirectUrl: "/", buttonVariantMode: "variant", buttonVariant: "primary", buttonVariantSize: "lg" } },
              ],
            },
          }],
        },
        {
          path: "/products", slug: "/products", name: "المنتجات", link: "/products",
          title: "كل المنتجات", description: "تصفّح منتجات دار الحرفة", iconName: "package",
          isCustom: true,
          content: [
            {
              type: "Section",
              props: {
                name: "مقدمة", visible: true,
                paddingTop: "32px", paddingBottom: "0px", paddingHorizontal: "20px",
                backgroundColor: "#faf3ee", columns: 1, columnsMobile: 1, gridGap: "20px",
                content: [
                  { type: "ContentHeading", props: { text: "منتجاتنا", level: "2", textAlign: "right", fontSize: "theme-xl", fontWeight: "theme-bold", color: "theme-primary" } },
                  { type: "ContentParagraph", props: { text: "اضغط على أي منتج لعرض تفاصيله، أو أضفه مباشرة إلى السلة.", textAlign: "right", fontSize: "theme-sm", color: "theme-neutral" } },
                ],
              },
            },
            {
              type: "Section",
              props: {
                name: "Catalogue", visible: true,
                paddingTop: "16px", paddingBottom: "40px", paddingHorizontal: "20px",
                backgroundColor: "#faf3ee", maxWidth: "1280px",
                columns: 3, columnsMobile: 2, gridGap: "20px",
                metadata: { preset: "products-page" },
                sectionKind: "products-page",
                content: [{
                  type: "Group",
                  props: {
                    product: null, metadata: null,
                    direction: "column", gap: 10, alignItems: "stretch", justifyContent: "flex-start", wrap: "nowrap",
                    backgroundColor: "theme-surface", padding: "12px", borderRadius: "theme-md", boxShadow: "sm",
                    language: "ar",
                    content: [
                      { type: "ContentImage", props: { src: "https://placehold.co/400x400", valueContext: { path: "images[0].url" }, alt: "صورة المنتج", altValueContext: { path: "product.title" }, align: "center", objectFit: "cover", radius: "theme-md", maxWidth: "100%" } },
                      { type: "ContentHeading", props: { text: "اسم المنتج", valueContext: { path: "product.title" }, level: "3", textAlign: "right", fontSize: "theme-md", fontWeight: "theme-semibold", color: "theme-text" } },
                      { type: "ContentParagraph", props: { text: "٠ ل.س", valueContext: { path: "pricing.displayPrice" }, textAlign: "right", fontSize: "theme-sm", fontWeight: "theme-semibold", color: "theme-primary" } },
                      { type: "ContentButton", props: { label: "إضافة إلى السلة", align: "center", destinationType: "action", buttonAction: "addToCart", buttonVariantMode: "variant", buttonVariant: "primary", buttonVariantSize: "sm" } },
                    ],
                  },
                }],
              },
            },
          ],
        },
        {
          path: "/cart", slug: "/cart", name: "السلة", link: "/cart", title: "سلة التسوق",
          description: "عرض سلة التسوق", iconName: "shopping-cart",
          content: [{
            type: "Section",
            props: {
              name: "سلة التسوق", visible: true,
              paddingTop: "32px", paddingBottom: "32px", paddingHorizontal: "20px",
              backgroundColor: "#faf3ee", maxWidth: "900px", columns: 1, columnsMobile: 1, gridGap: "20px",
              content: [
                { type: "ContentHeading", props: { text: "سلة التسوق", level: "2", textAlign: "right", fontSize: "theme-2xl", fontWeight: "theme-bold", color: "theme-primary" } },
                {
                  type: "Group",
                  props: {
                    cartLineId: "prod-001:{\"Color\":\"Red\"}",
                    direction: "row", gap: 12, alignItems: "center", language: "ar",
                    content: [
                      { type: "ContentImage", props: { src: "https://placehold.co/144x144", valueContext: { path: "images[0].url" }, maxWidth: "72px", radius: "theme-md" } },
                      { type: "ContentHeading", props: { text: "اسم المنتج", valueContext: { path: "product.title" }, level: "3", fontSize: "theme-md", textAlign: "right" } },
                      { type: "ContentParagraph", props: { text: "٠ ل.س", valueContext: { path: "pricing.displayLineTotal" }, fontSize: "theme-sm", color: "theme-neutral", textAlign: "right" } },
                      { type: "ContentButton", props: { label: "−", destinationType: "action", buttonAction: "cartQtyDecrease", buttonVariantMode: "fixed", buttonVariantSize: "sm" } },
                      { type: "ContentParagraph", props: { text: "1", valueContext: { path: "quantity" }, textAlign: "center", fontSize: "theme-md" } },
                      { type: "ContentButton", props: { label: "+", destinationType: "action", buttonAction: "cartQtyIncrease", buttonVariantMode: "fixed", buttonVariantSize: "sm" } },
                    ],
                  },
                },
              ],
            },
          }],
        },

        // Product detail — the target every product card navigates to.
        PRODUCT_DETAILS_PAGE,
      ],
    }),
  },
  {
    legacy: true,
    legacyReason: "Uses SiteHeader / SiteFooter / ZonePopup / CartIconButton — none are in the mobile block set (docs/BLOCKS-MOBILE.md).",
    label: "Site JSON (root + zones + pages)",
    json: PK({
      root: {
        props: {
          title: "متجري", direction: "rtl", language: "ar",
          primary: "#0b78c5", surface: "#f6f8fc", text: "#14243f", neutral: "#6b7d93",
          bodyFont: "dm-sans", radiusMd: "12px",
        },
      },
      zones: {
        "root:zone-header": [{
          type: "SiteHeader",
          props: {
            title: "متجري", visible: true, showDrawerButton: true, drawerName: "site-drawer",
            backgroundColor: "#ffffff", textColor: "#0f172a",
            links: [
              { label: "Home", labelAr: "الرئيسية", link: { kind: "page", pageId: "/" } },
              { label: "Products", labelAr: "المنتجات", link: { kind: "page", pageId: "/products" } },
            ],
            rightSlot: [{ type: "CartIconButton", props: { href: "/cart" } }],
          },
        }],
        "root:zone-footer": [{
          type: "SiteFooter",
          props: {
            visible: true, taglineAr: "متجرك الشامل.", showBottomBar: true, bottomBarTextAr: "© ٢٠٢٦ متجري",
            columns: [{
              title: "Shop", titleAr: "التسوق",
              links: [{ label: "Products", labelAr: "المنتجات", link: { kind: "page", pageId: "/products" } }],
            }],
          },
        }],
        "root:zone-drawer": [{
          type: "ZoneDrawer",
          props: {
            is_active: true, key: "site-drawer", side: "left", backgroundColor: "#ffffff",
            slot: [{ type: "ContentHeading", props: { text: "القائمة", fontSize: "theme-lg" } }],
          },
        }],
        "root:zone-popup": [{
          type: "ZonePopup",
          props: {
            is_active: true, key: "login",
            slot: [
              { type: "ContentHeading", props: { text: "تسجيل الدخول" } },
              { type: "ContentInput", props: { label: "رقم الهاتف", name: "phone", inputType: "tel", required: true } },
              { type: "ContentButton", props: { label: "دخول", destinationType: "action", buttonAction: "login" } },
            ],
          },
        }],
        "root:zone-bottom-sheet": [],
      },
      pages: [{
        path: "/", slug: "/", name: "الرئيسية", title: "الرئيسية",
        content: [{
          type: "Section",
          props: {
            name: "Hero", paddingTop: "48px", paddingBottom: "48px", paddingHorizontal: "24px",
            content: [
              { type: "ContentHeading", props: { text: "مرحباً بك", level: "1", textAlign: "center", fontSize: "theme-xl", color: "theme-primary" } },
              { type: "ContentParagraph", props: { text: "أفضل المنتجات بأفضل الأسعار", textAlign: "center", fontSize: "theme-md", color: "theme-neutral" } },
              { type: "ContentButton", props: { label: "تسجيل الدخول", destinationType: "zone", zoneKey: "login", zoneAction: "open" } },
            ],
          },
        }],
      }],
    }),
  },
  {
    legacy: true,
    legacyReason: "SiteHeader / SiteFooter zones plus a shopping-cart preset; neither block is in the mobile block set.",
    label: "Site JSON · multi-page (home · products · detail · cart)",
    json: PK({
      root: {
        props: {
          title: "متجري", direction: "rtl", language: "ar",
          primary: "#0b78c5", surface: "#f6f8fc", text: "#14243f", neutral: "#6b7d93",
          bodyFont: "cairo", radiusMd: "12px",
        },
      },
      zones: {
        "root:zone-header": [{
          type: "SiteHeader",
          props: {
            title: "متجري", variant: "commerce", language: "ar", visible: true, brandHref: "/",
            backgroundColor: "#ffffff", textColor: "#0f172a",
            links: [
              { label: "Home", labelAr: "الرئيسية", link: { kind: "page", pageId: "/" } },
              { label: "Products", labelAr: "المنتجات", link: { kind: "page", pageId: "/products" } },
              { label: "Cart", labelAr: "السلة", link: { kind: "page", pageId: "/cart" } },
            ],
            rightSlot: [{ type: "CartIconButton", props: { href: "/cart" } }],
          },
        }],
        "root:zone-footer": [{
          type: "SiteFooter",
          props: {
            visible: true, taglineAr: "توصيل سريع لكل المحافظات.",
            showBottomBar: true, bottomBarTextAr: "© ٢٠٢٦ متجري",
            columns: [{
              title: "Shop", titleAr: "التسوق",
              links: [
                { label: "Products", labelAr: "المنتجات", link: { kind: "page", pageId: "/products" } },
                { label: "Cart", labelAr: "السلة", link: { kind: "page", pageId: "/cart" } },
              ],
            }],
          },
        }],
      },
      pages: [
        {
          path: "/", slug: "/", name: "الرئيسية", link: "/", title: "الرئيسية",
          description: "الصفحة الرئيسية للمتجر", iconName: "Home",
          content: [{
            type: "Section",
            props: {
              name: "Hero", paddingTop: "56px", paddingBottom: "56px", paddingHorizontal: "24px",
              backgroundColor: "#f6f8fc", maxWidth: "1280px", columns: 1, columnsMobile: 1,
              content: [
                { type: "ContentHeading", props: { text: "أهلاً بك في متجري", level: "1", textAlign: "center", fontSize: "theme-2xl", fontWeight: "theme-bold", color: "theme-text" } },
                { type: "ContentParagraph", props: { text: "تشكيلة مختارة بعناية، وتوصيل خلال ٢-٤ أيام عمل.", textAlign: "center", fontSize: "theme-md", color: "theme-neutral" } },
                { type: "ContentButton", props: { label: "تصفّح المنتجات", align: "center", destinationType: "link", link: { kind: "page", pageId: "/products" }, buttonVariantMode: "variant", buttonVariant: "primary", buttonVariantSize: "lg" } },
              ],
            },
          }],
        },
        {
          path: "/products", slug: "/products", name: "المنتجات", link: "/products",
          title: "كل المنتجات", iconName: "Package", isCustom: true,
          content: [{
            type: "Section",
            props: {
              name: "قائمة المنتجات", paddingTop: "40px", paddingBottom: "40px", paddingHorizontal: "24px",
              columns: 1, columnsMobile: 1,
              content: [
                { type: "ContentHeading", props: { text: "كل المنتجات", level: "2", textAlign: "right", fontSize: "theme-xl", color: "theme-text" } },
                { type: "ContentParagraph", props: { text: "اختر منتجاً لعرض تفاصيله.", textAlign: "right", fontSize: "theme-sm", color: "theme-neutral" } },
                { type: "ContentButton", props: { label: "عرض منتج تجريبي", align: "right", destinationType: "link", link: { kind: "page", pageId: "/products/:product-slug", dynamicSegment: { param: "product-slug", valueContext: "product.slug" } }, buttonVariantMode: "variant", buttonVariant: "secondary" } },
              ],
            },
          }],
        },
        {
          // Dynamic route: the engine fills `:product-slug` from the repeat item / route params.
          path: "/products/:product-slug", slug: "/products/example-product", name: "تفاصيل المنتج",
          link: "/products/example-product", title: "تفاصيل المنتج",
          dynamic: true, examplePath: "/products/example-product", iconName: "Package",
          content: [{
            type: "Section",
            props: {
              name: "تفاصيل المنتج", paddingTop: "32px", paddingBottom: "32px", paddingHorizontal: "24px",
              columns: 1, columnsMobile: 1,
              content: [{
                type: "Group",
                props: {
                  direction: "column", gap: 16, alignItems: "stretch",
                  product: { id: "prod-001", titleAr: "قميص كلاسيكي", titleEn: "Classic Shirt", slug: "classic-shirt" },
                  metadata: { type: "product", method: "get", id: "prod-001", apiUrl: "https://api.example.com/public/products/classic-shirt?include=PRICING&include=IMAGES" },
                  language: "ar",
                  content: [
                    { type: "ContentImage", props: { src: "https://placehold.co/600x600", valueContext: { path: "images[0].url" }, alt: "صورة المنتج", radius: "theme-lg" } },
                    { type: "ContentHeading", props: { text: "قميص كلاسيكي", valueContext: { path: "product.title" }, level: "1", textAlign: "right", fontSize: "theme-xl" } },
                    { type: "ContentParagraph", props: { text: "٠ ل.س", valueContext: { path: "pricing.displayPrice" }, textAlign: "right", fontSize: "theme-lg", color: "theme-primary" } },
                    { type: "ContentButton", props: { label: "إضافة إلى السلة", align: "center", destinationType: "action", buttonAction: "addToCart", buttonVariantMode: "variant", buttonVariant: "primary", buttonVariantSize: "lg" } },
                  ],
                },
              }],
            },
          }],
        },
        {
          path: "/cart", slug: "/cart", name: "السلة", link: "/cart", title: "سلة التسوق", iconName: "ShoppingCart",
          content: [{
            type: "Section",
            props: {
              name: "سلة التسوق", paddingTop: "32px", paddingBottom: "32px", paddingHorizontal: "24px",
              maxWidth: "900px", columns: 1,
              metadata: { preset: "shopping-cart" },
              content: [
                { type: "ContentHeading", props: { text: "سلة التسوق", level: "2", textAlign: "right", fontSize: "theme-2xl" } },
                {
                  type: "Group",
                  props: {
                    cartLineId: "prod-001:{\"Color\":\"Red\"}", direction: "row", gap: 12,
                    alignItems: "center", language: "ar",
                    content: [
                      { type: "ContentImage", props: { src: "https://placehold.co/144x144", valueContext: { path: "images[0].url" }, maxWidth: "72px", radius: "theme-md" } },
                      { type: "ContentHeading", props: { text: "اسم المنتج", valueContext: { path: "product.title" }, level: "3", fontSize: "theme-md" } },
                      { type: "ContentParagraph", props: { text: "٠ ل.س", valueContext: { path: "pricing.displayLineTotal" }, fontSize: "theme-sm", color: "theme-neutral" } },
                      { type: "ContentButton", props: { label: "−", destinationType: "action", buttonAction: "cartQtyDecrease", buttonVariantMode: "fixed", buttonVariantSize: "sm" } },
                      { type: "ContentParagraph", props: { text: "1", valueContext: { path: "quantity" }, textAlign: "center", fontSize: "theme-md" } },
                      { type: "ContentButton", props: { label: "+", destinationType: "action", buttonAction: "cartQtyIncrease", buttonVariantMode: "fixed", buttonVariantSize: "sm" } },
                    ],
                  },
                },
                { type: "ContentButton", props: { label: "إتمام الطلب", align: "center", destinationType: "action", buttonAction: "makeOrder", submitRedirectUrl: "/", buttonVariantMode: "variant", buttonVariant: "primary", buttonVariantSize: "lg" } },
              ],
            },
          }],
        },
      ],
    }),
  },
  {
    legacy: true,
    legacyReason: "Uses Space and RowGroup — web-only layout blocks, not in the mobile block set.",
    label: "Blocks: buttons · images · divider · spacing · video",
    json: PK({
      root: {
        props: {
          title: "معرض البلوكات", direction: "rtl", language: "ar",
          primary: "#0b78c5", surface: "#f6f8fc", text: "#14243f", neutral: "#6b7d93",
          bodyFont: "cairo", radiusMd: "12px", radiusLg: "18px",
        },
      },
      zones: {},
      pages: [{
        path: "/showcase", slug: "/showcase", name: "معرض البلوكات", link: "/showcase", title: "معرض البلوكات",
        content: [{
          type: "Section",
          props: {
            name: "المحتوى", paddingTop: "40px", paddingBottom: "40px", paddingHorizontal: "24px",
            backgroundColor: "#ffffff", maxWidth: "1280px", columns: 1, columnsMobile: 1, gridGap: "24px",
            content: [
              { type: "ContentHeading", props: { text: "بلوكات المحتوى", level: "2", textAlign: "right", fontSize: "theme-xl", fontWeight: "theme-bold", color: "theme-text" } },

              // Image — single banner
              { type: "ContentImage", props: { src: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80", alt: "حذاء رياضي", align: "center", objectFit: "cover", radius: "theme-lg", maxWidth: "800px" } },

              // Spacing
              { type: "Space", props: { size: "theme-24" } },

              // Images — gallery grid
              {
                type: "ImageGallery",
                props: {
                  mode: "grid", gridColumns: 2, gridRows: 0, aspectRatio: "landscape",
                  objectFit: "cover", radius: "theme-md", gap: "theme-16",
                  images: [
                    { src: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80", alt: "ساعة" },
                    { src: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80", alt: "كاميرا" },
                  ],
                },
              },

              // Divider — theme colour
              { type: "ContentDivider", props: { thickness: "1px", colorMode: "theme", colorTheme: "neutral" } },

              // Buttons — variant mode and fixed mode, side by side
              {
                type: "RowGroup",
                props: {
                  gap: 12, alignItems: "center", justifyContent: "center", wrap: "wrap", padding: "0px",
                  content: [
                    { type: "ContentButton", props: { label: "تسوّق الآن", align: "center", destinationType: "link", link: { kind: "page", pageId: "/products" }, buttonVariantMode: "variant", buttonVariant: "primary", buttonVariantSize: "lg" } },
                    { type: "ContentButton", props: { label: "تابعنا", align: "center", destinationType: "link", link: { kind: "url", url: "https://example.com", target: "_blank" }, buttonVariantMode: "fixed", bgColor: "theme-neutral", textColor: "theme-surface", buttonSize: "theme-md", radius: "theme-full" } },
                  ],
                },
              },

              { type: "Space", props: { size: "theme-40" } },

              // Divider — fixed colour
              { type: "ContentDivider", props: { thickness: "2px", colorMode: "fixed", colorFixed: "#0b78c5" } },

              // Video — YouTube embed
              { type: "ContentHeading", props: { text: "شاهد الفيديو التعريفي", level: "3", textAlign: "right", fontSize: "theme-lg" } },
              { type: "VideoEmbed", props: { src: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", align: "center", size: "theme-480", radius: "theme-lg" } },
            ],
          },
        }],
      }],
    }),
  },
  {
    legacy: true,
    legacyReason: "Superseded by Example 3 (products binding) and Example 1's /products page.",
    label: "Products Grid preset (bound card template)",
    json: PK({
      root: {
        props: {
          title: "متجري", direction: "rtl", language: "ar",
          primary: "#0b78c5", surface: "#f6f8fc", text: "#14243f", neutral: "#6b7d93",
          bodyFont: "cairo", radiusMd: "12px",
        },
      },
      zones: {},
      pages: [{
        path: "/products", slug: "/products", name: "المنتجات", link: "/products", title: "كل المنتجات",
        content: [
          {
            type: "Section",
            props: {
              name: "مقدمة", paddingTop: "32px", paddingBottom: "0px", paddingHorizontal: "24px",
              columns: 1, columnsMobile: 1,
              content: [
                { type: "ContentHeading", props: { text: "المنتجات المميزة", level: "2", textAlign: "right", fontSize: "theme-xl", color: "theme-text" } },
              ],
            },
          },
          {
            // Products Grid preset: `content` holds exactly ONE card-template Group with
            // `product: null`. The repeater clones it per product in the picked collection,
            // and children read live values through `valueContext` — no per-product blocks.
            type: "Section",
            props: {
              name: "Featured", paddingTop: "24px", paddingBottom: "48px", paddingHorizontal: "24px",
              maxWidth: "1280px", columns: 3, columnsMobile: 2, gridGap: "16px",
              metadata: { preset: "products-grid" },
              sectionKind: "products-grid",
              collection: { id: "coll_featured", name: "Featured", slug: "featured", productCount: 24 },
              content: [{
                type: "Group",
                props: {
                  product: null, metadata: null, skipProductDetailFetch: true,
                  direction: "column", gap: 10, alignItems: "stretch", justifyContent: "flex-start",
                  backgroundColor: "theme-surface", padding: "12px", borderRadius: "theme-md", boxShadow: "sm",
                  language: "ar",
                  content: [
                    { type: "ContentImage", props: { src: "https://placehold.co/400x400", valueContext: { path: "images[0].url" }, altValueContext: { path: "product.title" }, alt: "صورة المنتج", objectFit: "cover", radius: "theme-md" } },
                    { type: "ContentHeading", props: { text: "اسم المنتج", valueContext: { path: "product.title" }, level: "3", textAlign: "right", fontSize: "theme-md", fontWeight: "theme-semibold", color: "theme-text" } },
                    { type: "ContentParagraph", props: { text: "٠ ل.س", valueContext: { path: "pricing.displayPrice" }, textAlign: "right", fontSize: "theme-sm", color: "theme-primary" } },
                    { type: "ContentButton", props: { label: "إضافة إلى السلة", align: "center", destinationType: "action", buttonAction: "addToCart", buttonVariantMode: "variant", buttonVariant: "primary", buttonVariantSize: "sm" } },
                  ],
                },
              }],
            },
          },
        ],
      }],
    }),
  },
  {
    legacy: true,
    legacyReason: "Bare 1c page envelope with no blocks; kept only as an envelope smoke test.",
    label: "Page Shell (Envelope)",
    json: PK({
      path: "/profile",
      label: "User Profile",
      blocks: [],
      rootProps: {
        direction: "rtl", language: "ar", primary: "#0b78c5",
        surface: "#f6f8fc", text: "#14243f", neutral: "#6b7d93",
        bodyFont: "dm-sans",
      },
    }),
  },
  {
    legacy: true,
    legacyReason: "Uses legacy Text / Space / Button web block types.",
    label: "Section → container+column",
    json: PK({
      type: "Section",
      props: {
        backgroundColor: "#F9FAFB", paddingTop: "32px", paddingBottom: "32px",
        content: [
          { type: "Text", props: { text: "Hello World", size: "m", align: "center", color: "default" } },
          { type: "Space", props: { size: "24px", direction: "vertical" } },
          { type: "Button", props: { label: "Click Me", variant: "primary", href: "/products" } },
        ],
      },
    }),
  },
  {
    legacy: true,
    legacyReason: "Uses legacy Heading / Text / Button web block types.",
    label: "Heading + Text + Button",
    json: PK({
      type: "Section",
      props: {
        paddingTop: "48px", paddingBottom: "48px",
        content: [
          { type: "Heading", props: { text: "Our Products", level: "2", align: "center", size: "xl", colorMode: "theme", colorTheme: "text" } },
          { type: "Text", props: { text: "Browse our collection of premium items.", size: "m", align: "center", color: "muted" } },
          { type: "Button", props: { label: "Shop Now", labelAr: "تسوق الآن", variant: "primary", size: "lg", fullWidth: "on", href: "/products" } },
        ],
      },
    }),
  },
  {
    legacy: true,
    legacyReason: "Uses the legacy Button web block type.",
    label: "Flex Row + Button",
    json: PK({
      type: "Flex",
      props: {
        direction: "row", justifyContent: "center", alignItems: "center", gap: 16,
        items: [
          { type: "Button", props: { label: "Shop Now", variant: "primary", href: "/products" } },
          { type: "Button", props: { label: "Learn More", variant: "outline", href: "/about" } },
        ],
      },
    }),
  },
  {
    legacy: true,
    legacyReason: "Uses legacy Image / Icon / Video web block types.",
    label: "Image + Video + Icon",
    json: PK({
      type: "Section",
      props: {
        content: [
          { type: "Image", props: { src: "https://images.unsplash.com/photo-1542291026-7eec264c27ff", alt: "Product", aspectRatio: "landscape", borderRadius: "md", objectFit: "cover" } },
          { type: "Icon", props: { name: "Star", size: "32", colorMode: "theme", colorTheme: "primary" } },
          { type: "Video", props: { src: "https://example.com/video.mp4", controls: "on", aspectRatio: "16:9" } },
        ],
      },
    }),
  },
  {
    legacy: true,
    legacyReason: "Hero is not in the mobile block set; compose Section + Group + ContentHeading instead.",
    label: "Hero Banner",
    json: PK({
      type: "Hero",
      props: {
        title: "Summer Sale",
        description: "Up to 50% off on selected items",
        align: "center",
        padding: "80px",
        buttons: [
          { label: "Shop Now", labelAr: "تسوق الآن", variant: "primary", href: "/products" },
          { label: "Learn More", variant: "outline", href: "/about" },
        ],
      },
    }),
  },
  {
    legacy: true,
    legacyReason: "Card and Badge are not in the mobile block set; use a styled Group instead.",
    label: "Card + Badge + Divider",
    json: PK({
      type: "Section",
      props: {
        content: [
          {
            type: "Card",
            props: {
              title: "Product Name",
              description: "High-quality item with great features.",
              image: { url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff", alt: "Product" },
              variant: "elevated",
            },
          },
          { type: "Divider", props: { orientation: "horizontal", thickness: "2px" } },
          { type: "Badge", props: { label: "-20%", variant: "discount", size: "md" } },
        ],
      },
    }),
  },
  {
    legacy: true,
    legacyReason: "Standalone ProductGrid is legacy; use the products-grid Section preset.",
    label: "Commerce: Product Grid",
    json: PK({
      type: "ProductGrid",
      props: { collection: "all", columns: "2", gap: 16, maxProducts: "6" },
    }),
  },
  {
    legacy: true,
    legacyReason: "ProductCard / ProductCarousel are legacy; use a bound Group inside a products-grid Section.",
    label: "Commerce: Product Card + Details",
    json: PK({
      type: "Section",
      props: {
        content: [
          {
            type: "ProductCard",
            props: {
              product: { id: "prod-001", title: "Classic Sneakers", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff", price: 89.99 },
              variant: "vertical", showDescription: "on", showBadge: "on",
            },
          },
          {
            type: "ProductCarousel",
            props: { collection: "all", maxProducts: "8", variant: "vertical" },
          },
        ],
      },
    }),
  },
  {
    legacy: true,
    legacyReason: "TestimonialGrid is legacy; the mobile block set has Testimonials.",
    label: "Testimonial + Grid",
    json: PK({
      type: "Section",
      props: {
        content: [
          {
            type: "TestimonialGrid",
            props: { columns: "2", gap: 16, maxItems: "4", showAvatar: "on", showRating: "on" },
          },
        ],
      },
    }),
  },
  {
    legacy: true,
    legacyReason: "Countdown / SearchModal / CookieConsent are not in the mobile block set.",
    label: "Utility: Countdown + Search + Cookie",
    json: PK({
      type: "Section",
      props: {
        content: [
          { type: "Countdown", props: { targetDate: "2026-12-31T23:59:59Z", title: "Offer Ends In", titleAr: "العرض ينتهي في", showDays: "on", showHours: "on", showMinutes: "on", showSeconds: "on" } },
          { type: "SearchModal", props: { placeholder: "Search products…", placeholderAr: "بحث عن منتجات…" } },
          { type: "CookieConsent", props: { message: "We use cookies to improve your experience.", messageAr: "نستخدم ملفات تعريف الارتباط لتحسين تجربتك." } },
        ],
      },
    }),
  },
  {
    legacy: true,
    legacyReason: "Built from Hero / Heading / Space / ProductGrid / TestimonialGrid / Card / SiteHeader / SiteFooter — all outside the mobile block set.",
    label: "Full Home Page (All Blocks)",
    json: PK({
      path: "/",
      label: "Home",
      rootProps: {
        direction: "rtl", language: "ar", primary: "#0b78c5",
        surface: "#f6f8fc", text: "#14243f", neutral: "#6b7d93",
        bodyFont: "dm-sans", headerBrandTitle: "SOOQ",
        headerBackgroundColor: "#FFFFFF", headerTextColor: "#0F172A",
        headerShowDrawerButton: "on",
      },
      blocks: [
        { type: "SiteHeader", props: { id: "header-1" } },
        {
          type: "Section", props: {
            backgroundColor: "#f0f4ff", paddingTop: "80px", paddingBottom: "80px",
            content: [
              {
                type: "Hero", props: {
                  title: "مرحباً بكم في متجرنا", description: "أفضل المنتجات بأفضل الأسعار",
                  align: "center", padding: "40px",
                  buttons: [{ label: "تسوق الآن", labelAr: "تسوق الآن", variant: "primary", href: "/products" }],
                },
              },
            ],
          },
        },
        {
          type: "Section", props: {
            paddingTop: "64px", paddingBottom: "64px",
            content: [
              { type: "Heading", props: { text: "منتجاتنا المميزة", level: "2", align: "center", size: "xl", colorMode: "theme", colorTheme: "text" } },
              { type: "Space", props: { size: "32px", direction: "vertical" } },
              { type: "ProductGrid", props: { columns: "2", gap: 16, maxProducts: "4" } },
            ],
          },
        },
        {
          type: "Section", props: {
            backgroundColor: "#f9fafb", paddingTop: "64px", paddingBottom: "64px",
            content: [
              { type: "Heading", props: { text: "ماذا يقول عملاؤنا", level: "2", align: "center", size: "lg" } },
              { type: "Space", props: { size: "24px", direction: "vertical" } },
              { type: "TestimonialGrid", props: { columns: "2", gap: 16, maxItems: "2", showAvatar: "on", showRating: "on" } },
            ],
          },
        },
        {
          type: "Section", props: {
            paddingTop: "48px", paddingBottom: "48px",
            content: [
              { type: "Card", props: { title: "توصيل مجاني", description: "لجميع الطلبات فوق 100 دولار", variant: "elevated" } },
            ],
          },
        },
        { type: "SiteFooter", props: { id: "footer-1" } },
      ],
    }),
  },
];
