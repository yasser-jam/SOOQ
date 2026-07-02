import type {
  ProductCardData,
  ProductResourceMetadata,
} from "@/modules/product/product/data-store";
import type { ProductCardActionEventDetail } from "../binding/product-actions";

export const STORE_CART_KEY = "store-cart";
export const STORE_CART_UPDATED_EVENT = "store-cart-updated";

export type StoreCartLine = {
  lineId: string;
  quantity: number;
  product: ProductCardData;
  selectedVariant: ProductCardData["variants"][number] | null;
  selectedAttributes: Record<string, string>;
  pricing: ProductCardActionEventDetail["pricing"];
  language: "ar" | "en";
  metadata?: ProductResourceMetadata | null;
  addedAt: string;
};

export type StoreCart = {
  items: StoreCartLine[];
  updatedAt: string;
};

export type CartSectionResourceMetadata = {
  dataSource: "localStorage";
  storageKey: typeof STORE_CART_KEY;
};

const isBrowser = typeof window !== "undefined";

function createLineId(detail: ProductCardActionEventDetail): string {
  const variantId =
    detail.selectedVariant?.variantId ??
    JSON.stringify(detail.selectedAttributes);
  return `${detail.product.id}:${variantId}`;
}

function emptyCart(): StoreCart {
  return { items: [], updatedAt: new Date().toISOString() };
}

export function readStoreCart(): StoreCart {
  if (!isBrowser) return emptyCart();

  try {
    const raw = window.localStorage.getItem(STORE_CART_KEY);
    if (!raw) return emptyCart();

    const parsed = JSON.parse(raw) as StoreCart;
    if (!parsed || !Array.isArray(parsed.items)) return emptyCart();

    return {
      items: parsed.items,
      updatedAt: parsed.updatedAt ?? new Date().toISOString(),
    };
  } catch {
    return emptyCart();
  }
}

export function writeStoreCart(cart: StoreCart): void {
  if (!isBrowser) return;

  const next: StoreCart = {
    ...cart,
    updatedAt: new Date().toISOString(),
  };

  window.localStorage.setItem(STORE_CART_KEY, JSON.stringify(next));
  window.dispatchEvent(
    new CustomEvent(STORE_CART_UPDATED_EVENT, { detail: next, bubbles: true })
  );
}

export function addOrUpdateLine(detail: ProductCardActionEventDetail): StoreCart {
  const cart = readStoreCart();
  const lineId = createLineId(detail);
  const existing = cart.items.find((line) => line.lineId === lineId);

  if (existing) {
    const items = cart.items.map((line) =>
      line.lineId === lineId
        ? { ...line, quantity: line.quantity + 1 }
        : line
    );
    const next = { ...cart, items };
    writeStoreCart(next);
    return next;
  }

  const next: StoreCart = {
    ...cart,
    items: [
      ...cart.items,
      {
        lineId,
        quantity: 1,
        product: detail.product,
        selectedVariant: detail.selectedVariant,
        selectedAttributes: detail.selectedAttributes,
        pricing: detail.pricing,
        language: detail.language,
        metadata: detail.metadata,
        addedAt: new Date().toISOString(),
      },
    ],
  };

  writeStoreCart(next);
  return next;
}

export function setLineQuantity(lineId: string, quantity: number): StoreCart {
  const cart = readStoreCart();

  if (quantity < 1) {
    return removeLine(lineId);
  }

  const items = cart.items.map((line) =>
    line.lineId === lineId ? { ...line, quantity } : line
  );

  const next = { ...cart, items };
  writeStoreCart(next);
  return next;
}

export function removeLine(lineId: string): StoreCart {
  const cart = readStoreCart();
  const next = {
    ...cart,
    items: cart.items.filter((line) => line.lineId !== lineId),
  };
  writeStoreCart(next);
  return next;
}

export function clearCart(): StoreCart {
  const next = emptyCart();
  writeStoreCart(next);
  return next;
}

export function getLineTotal(line: StoreCartLine): number {
  return line.pricing.price * line.quantity;
}

export function getCartSubtotal(cart: StoreCart = readStoreCart()): number {
  return cart.items.reduce((sum, line) => sum + getLineTotal(line), 0);
}

export function formatCartMoney(amount: number, currencyCode = "SYP"): string {
  return `${amount.toLocaleString("ar-SY")} ${currencyCode}`;
}

export function getProductTitle(
  line: StoreCartLine,
  language?: "ar" | "en"
): string {
  const lang = language ?? line.language;
  return lang === "en"
    ? line.product.titleEn || line.product.titleAr
    : line.product.titleAr || line.product.titleEn;
}

export function getProductDescription(
  line: StoreCartLine,
  language?: "ar" | "en"
): string {
  const lang = language ?? line.language;
  return lang === "en"
    ? line.product.descriptionEn || line.product.descriptionAr
    : line.product.descriptionAr || line.product.descriptionEn;
}

export function getProductImageUrl(line: StoreCartLine): string | null {
  return line.product.mediaUrls?.[0] ?? null;
}

export function getProductHref(line: StoreCartLine): string {
  const slug = line.product.slug?.trim();
  return slug ? `/products/${slug}` : "#";
}
