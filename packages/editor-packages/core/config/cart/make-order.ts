import type { StoreCart } from "./store-cart";

export const MAKE_ORDER_EVENT = "make-order";

export type MakeOrderEventDetail = {
  cart: StoreCart;
};

export function dispatchMakeOrderEvent(cart: StoreCart) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent<MakeOrderEventDetail>(MAKE_ORDER_EVENT, {
      detail: { cart },
      bubbles: true,
    })
  );
}
