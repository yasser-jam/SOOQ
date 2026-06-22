import { products, type Product, formatPrice, discountedPrice } from "./products";

/** One line in the demo shopping cart (mock data for Cart Section preset). */
export type MockCartLine = {
  lineId: string;
  productId: string;
  quantity: number;
};

/** Demo cart bound to the catalog — replace with real cart state in production. */
export const mockCart = {
  id: "cart-mock-demo",
  currency: "USD" as const,
  items: [
    { lineId: "line-1", productId: "prod-001", quantity: 2 },
    { lineId: "line-2", productId: "prod-003", quantity: 1 },
    { lineId: "line-3", productId: "prod-007", quantity: 3 },
    { lineId: "line-4", productId: "prod-011", quantity: 1 },
    { lineId: "line-5", productId: "prod-002", quantity: 1 },
  ] satisfies MockCartLine[],
};

export type ResolvedCartLine = {
  line: MockCartLine;
  product: Product;
  /** Unit price after discount if applicable. */
  unitPrice: number;
  lineTotal: number;
};

/** Resolve a single line against the catalog. */
export function resolveCartLine(line: MockCartLine): ResolvedCartLine | null {
  const product = products.find((p) => p.id === line.productId);
  if (!product) return null;
  const hasDiscount =
    typeof product.discount === "number" && product.discount > 0;
  const unitPrice = hasDiscount
    ? discountedPrice(product.price, product.discount!)
    : product.price;
  return {
    line,
    product,
    unitPrice,
    lineTotal: unitPrice * line.quantity,
  };
}

/** Joins cart lines with catalog products; skips unknown IDs. */
export function resolveItemsToLines(items: MockCartLine[]): ResolvedCartLine[] {
  const out: ResolvedCartLine[] = [];
  for (const line of items) {
    const resolved = resolveCartLine(line);
    if (resolved) out.push(resolved);
  }
  return out;
}

/** Joins `mockCart` lines with catalog products; skips unknown IDs. */
export function resolveMockCartLines(): ResolvedCartLine[] {
  return resolveItemsToLines(mockCart.items);
}

/** Deep copy of demo cart lines for interactive UI initial state. */
export function cloneMockCartItems(): MockCartLine[] {
  return mockCart.items.map((i) => ({ ...i }));
}

export function mockCartSubtotal(lines: ResolvedCartLine[]): number {
  return lines.reduce((sum, l) => sum + l.lineTotal, 0);
}

export function formatMoney(amount: number): string {
  return formatPrice(amount);
}
