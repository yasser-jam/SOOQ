import type { StoreCart } from "./store-cart";

export const CREATE_ORDER_EVENT = "create-order";

/** @deprecated Use CREATE_ORDER_EVENT */
export const MAKE_ORDER_EVENT = CREATE_ORDER_EVENT;

export type CreateOrderEventDetail = {
  cart: StoreCart;
};

/** @deprecated Use CreateOrderEventDetail */
export type MakeOrderEventDetail = CreateOrderEventDetail;

export function dispatchCreateOrderEvent(cart: StoreCart) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent<CreateOrderEventDetail>(CREATE_ORDER_EVENT, {
      detail: { cart },
      bubbles: true,
    })
  );
}

/** @deprecated Use dispatchCreateOrderEvent */
export function dispatchMakeOrderEvent(cart: StoreCart) {
  dispatchCreateOrderEvent(cart);
}
