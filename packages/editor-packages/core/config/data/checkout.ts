import {
  mockCartSubtotal,
  resolveMockCartLines,
  formatMoney,
  type ResolvedCartLine,
} from "./cart";

/** Demo customer + checkout context — replace with real session / Stripe in production. */
export type MockShippingAddress = {
  fullName: string;
  line1: string;
  line2: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
};

export type MockPaymentMethod = {
  brand: string;
  last4: string;
  expiry: string;
};

export const mockCheckoutSession = {
  id: "checkout-sess-demo",
  customerEmail: "customer@example.com",
  shippingAddress: {
    fullName: "Alex Morgan",
    line1: "742 Evergreen Terrace",
    line2: "Apt 4",
    city: "Springfield",
    region: "OR",
    postalCode: "97475",
    country: "United States",
  } satisfies MockShippingAddress,
  payment: {
    brand: "Visa",
    last4: "4242",
    expiry: "12/28",
  } satisfies MockPaymentMethod,
};

/** Flat shipping + estimated tax for demo totals (USD). */
export const CHECKOUT_DEMO_SHIPPING = 9.99;
export const CHECKOUT_DEMO_TAX_RATE = 0.0825;

export function getCheckoutOrderLines(): ResolvedCartLine[] {
  return resolveMockCartLines();
}

export function getCheckoutSubtotal(lines: ResolvedCartLine[]): number {
  return mockCartSubtotal(lines);
}

export function getCheckoutEstimatedTax(subtotal: number): number {
  return Math.round(subtotal * CHECKOUT_DEMO_TAX_RATE * 100) / 100;
}

export function getCheckoutTotal(
  subtotal: number,
  shipping: number,
  tax: number
): number {
  return Math.round((subtotal + shipping + tax) * 100) / 100;
}

export { formatMoney };
