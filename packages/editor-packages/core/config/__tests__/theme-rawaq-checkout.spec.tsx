/**
 * Guards the `/checkout` page injected into the Rawaq Furniture theme:
 * every block type must be registered, the checkout wiring (section kind,
 * select/input/button actions, `checkout.*` bindings) must survive the theme
 * layer, and the page must render through `<Render>` off the shipped JSON.
 */
import fs from "node:fs";
import path from "node:path";
import React from "react";
import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Render } from "@/core";

import conf from "../index";
import { composePuckData, normalizeSiteData } from "../lib/site-data";
import { createCheckoutPageContent } from "../presets/checkout";
import {
  StoreAuthContext,
  StoreContext,
  defaultCheckoutState,
  defaultCustomerState,
  type CustomerAddress,
  type StoreContextValue,
} from "../store-context";

const themesDir = path.join(__dirname, "..", "..", "themes");

const rawaq = JSON.parse(
  fs.readFileSync(path.join(themesDir, "theme-rawaq-furniture.json"), "utf8")
);

const findPage = (theme: any, pagePath: string) =>
  theme.pages.find((page: any) => page.path === pagePath);

function collectBlocks(node: unknown, out: any[] = []): any[] {
  if (Array.isArray(node)) {
    node.forEach((entry) => collectBlocks(entry, out));
    return out;
  }
  if (!node || typeof node !== "object") return out;

  const block = node as { type?: string; props?: Record<string, unknown> };
  if (block.type && block.props) out.push(block);
  for (const value of Object.values(node as Record<string, unknown>)) {
    if (value && typeof value === "object") collectBlocks(value, out);
  }
  return out;
}

const checkoutPage = findPage(rawaq, "/checkout");
const blocks = collectBlocks(checkoutPage?.content);

const propValues = (key: string) =>
  blocks.map((block) => block.props?.[key]).filter(Boolean);

const SAVED_ADDRESS: CustomerAddress = {
  addressId: "addr-1",
  label: "المنزل",
  recipientName: "أحمد محمد",
  recipientPhone: "+963991234567",
  governorate: "دمشق",
  city: "دمشق",
  streetAddress: "شارع الحمرا",
  notes: null,
  latitude: 33.5,
  longitude: 36.29,
  isDefault: true,
  createdAt: null,
  updatedAt: null,
};

/**
 * A signed-in customer with one saved address, COD available and a discount
 * applied — the state the checkout page is actually built for.
 */
function signedInStore(): StoreContextValue {
  const noop = () => {};
  const noopAsync = () => Promise.resolve();

  return {
    ...(({} as unknown) as StoreContextValue),
    auth: {
      isLoggedIn: true,
      customerName: "أحمد محمد",
      customerPhone: "+963991234567",
    },
    loading: {} as any,
    errors: { discount: null, placeOrder: null } as any,
    productsPage: {} as any,
    customer: { ...defaultCustomerState, addresses: [SAVED_ADDRESS] },
    orders: {} as any,
    orderDetail: {} as any,
    returnDraft: {} as any,
    checkout: {
      ...defaultCheckoutState,
      addressId: "addr-1",
      paymentMethods: [
        {
          providerCode: "COD",
          displayName: "الدفع عند الاستلام",
          requiresRedirect: false,
          supportsSavedCards: false,
        },
      ],
      paymentMethodCode: "COD",
      discount: { code: "10OFF", discountAmount: 10000 },
      subtotal: 100000,
      shippingCost: 5000,
      discountAmount: 10000,
      payableTotal: 95000,
    },
    actions: {
      checkout: {
        selectAddress: noop,
        selectPaymentMethod: noop,
        setDiscountCodeDraft: noop,
        validateDiscount: noopAsync,
        placeOrder: noopAsync,
        refreshCheckout: noopAsync,
      },
      customer: {} as any,
      orders: {} as any,
      productsPage: {} as any,
    } as any,
  } as StoreContextValue;
}

function renderPage(pagePath: string, store?: StoreContextValue) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const site = normalizeSiteData(rawaq);
  const tree = (
    <Render config={conf as any} data={composePuckData(site, pagePath) as any} />
  );

  return render(
    <QueryClientProvider client={client}>
      {store ? (
        <StoreAuthContext.Provider value={store.auth}>
          <StoreContext.Provider value={store}>{tree}</StoreContext.Provider>
        </StoreAuthContext.Provider>
      ) : (
        tree
      )}
    </QueryClientProvider>
  );
}

describe("theme-rawaq-furniture /checkout page", () => {
  it("ships the checkout page", () => {
    expect(checkoutPage).toBeTruthy();
    expect(checkoutPage.dynamic).toBeFalsy();
    expect(checkoutPage.slug).toBe("/checkout");
  });

  it("only uses block types registered in the palette", () => {
    const registered = new Set(Object.keys((conf as any).components));
    const unknown = [
      ...new Set(blocks.map((block) => block.type)),
    ].filter((type) => !registered.has(type));

    expect(unknown).toEqual([]);
  });

  it("exposes the checkout scope from the signed-in section", () => {
    const sections = blocks.filter((block) => block.type === "Section");
    const kinds = sections.map((section) => section.props.sectionKind);

    // Two sections: the signed-out gate, and the checkout-scoped one.
    expect(sections).toHaveLength(2);
    expect(kinds.filter((kind) => kind === "checkout")).toHaveLength(1);
  });

  it("keeps every checkout.* gate inside the scope, never on a Section", () => {
    // CheckoutBoundShell publishes `checkout.*` *inside* the section, so a
    // section-level condition on it would be evaluated before the scope
    // exists and would silently never match.
    const sectionsWithCheckoutGate = blocks.filter(
      (block) =>
        block.type === "Section" &&
        String(block.props?.dataCondition?.path ?? "").startsWith("checkout.")
    );

    expect(sectionsWithCheckoutGate).toEqual([]);
  });

  it("wires the address and payment selects to checkout actions", () => {
    expect(propValues("selectAction").sort()).toEqual([
      "checkout_address",
      "checkout_payment_method",
    ]);
  });

  it("wires the discount input and the two checkout buttons", () => {
    expect(propValues("inputAction")).toContain("discount_code");

    const actions = propValues("buttonAction");
    expect(actions).toContain("validateDiscount");
    expect(actions).toContain("placeOrder");
  });

  it("binds the money rows to the checkout scope in store currency", () => {
    const money = propValues("valueContext").filter(
      (context: any) => context.format === "money"
    );

    expect(money.length).toBeGreaterThanOrEqual(3);
    for (const context of money as any[]) {
      expect(context.path).toMatch(/^checkout\./);
      expect(context.currencyPath).toBe("checkout.currencyCode");
    }
  });

  it("gates the whole page on whether the order was already placed", () => {
    const conditions = propValues("dataCondition") as any[];
    const placed = conditions.filter(
      (condition) => condition.path === "checkout.isPlaced"
    );

    // One success section (truthy) + the four editable sections (falsy).
    expect(placed.filter((c) => c.op === "truthy")).toHaveLength(1);
    expect(placed.filter((c) => c.op === "falsy")).toHaveLength(4);
  });

  it("translates every user-facing string to a bilingual pair", () => {
    const texts = blocks
      .flatMap((block) => [block.props?.text, block.props?.label])
      .filter((value) => value != null);

    for (const text of texts) {
      expect(typeof text).toBe("object");
      expect(text).toHaveProperty("ar");
      expect(text).toHaveProperty("en");
    }
  });

  it("shows only the sign-in gate to a signed-out visitor", () => {
    const { container } = renderPage("/checkout");
    const text = container.textContent ?? "";

    expect(text).toContain("سجّل دخولك لإتمام الطلب.");
    expect(container.querySelectorAll("select")).toHaveLength(0);
    expect(text).not.toContain("ملخّص الطلب");
  });

  it("renders the full checkout for a signed-in customer", () => {
    const { container } = renderPage("/checkout", signedInStore());
    const text = (container.textContent ?? "").replace(/\s+/g, " ");

    // Address + payment selects, both populated from the store.
    const selects = [...container.querySelectorAll("select")];
    expect(selects).toHaveLength(2);
    expect(selects[0]?.textContent).toContain("المنزل");
    expect(selects[1]?.textContent).toContain("الدفع عند الاستلام");

    // Discount input and both action buttons.
    expect(container.querySelector('input[name="discountCode"]')).toBeTruthy();
    expect(text).toContain("تطبيق");
    expect(text).toContain("تأكيد الطلب");

    // Money rows, formatted in the store currency.
    expect(text).toContain("المجموع الفرعي");
    expect(text).toContain("تكلفة الشحن");
    expect(text).toContain("الخصم");
    expect(text).toContain("الإجمالي");

    // The sign-in gate and the success panel are both hidden.
    expect(text).not.toContain("سجّل دخولك لإتمام الطلب.");
    expect(text).not.toContain("تم استلام طلبك");
  });

  it("swaps to the success panel once the order is placed", () => {
    const store = signedInStore();
    const placed: typeof store = {
      ...store,
      checkout: { ...store.checkout, placedOrderId: "order-1" },
    };

    const { container } = renderPage("/checkout", placed);
    const text = (container.textContent ?? "").replace(/\s+/g, " ");

    expect(text).toContain("تم استلام طلبك");
    expect(text).not.toContain("ملخّص الطلب");
    expect(container.querySelectorAll("select")).toHaveLength(0);
  });

  it("keeps the theme layer behaviourally identical to the shared preset", () => {
    const shared = collectBlocks(createCheckoutPageContent());

    expect(blocks.map((block) => block.type)).toEqual(
      shared.map((block) => block.type)
    );
    expect(propValues("buttonAction")).toEqual(
      shared.map((block) => block.props?.buttonAction).filter(Boolean)
    );
  });
});
