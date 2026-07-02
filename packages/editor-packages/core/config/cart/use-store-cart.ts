"use client";

import { useCallback, useEffect, useState } from "react";
import type { ProductCardActionEventDetail } from "../binding/product-actions";
import {
  STORE_CART_UPDATED_EVENT,
  addOrUpdateLine,
  readStoreCart,
  removeLine,
  setLineQuantity,
  type StoreCart,
} from "./store-cart";

export function useStoreCart() {
  const [cart, setCart] = useState<StoreCart>(() => readStoreCart());

  const refresh = useCallback(() => {
    setCart(readStoreCart());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onCartUpdated = () => refresh();
    const onStorage = (event: StorageEvent) => {
      if (event.key === "store-cart") refresh();
    };

    window.addEventListener(STORE_CART_UPDATED_EVENT, onCartUpdated);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener(STORE_CART_UPDATED_EVENT, onCartUpdated);
      window.removeEventListener("storage", onStorage);
    };
  }, [refresh]);

  const bumpQuantity = useCallback((lineId: string, delta: number) => {
    const current = readStoreCart();
    const line = current.items.find((item) => item.lineId === lineId);
    if (!line) return;
    setLineQuantity(lineId, line.quantity + delta);
    refresh();
  }, [refresh]);

  const removeCartLine = useCallback((lineId: string) => {
    removeLine(lineId);
    refresh();
  }, [refresh]);

  return {
    cart,
    refresh,
    bumpQuantity,
    removeCartLine,
  };
}

let addProductListenerRegistered = false;

/** Mount once from cart UI so add-to-cart events persist to localStorage. */
export function registerAddProductCartListener() {
  if (typeof window === "undefined" || addProductListenerRegistered) return;

  const onAddProduct = (event: Event) => {
    const detail = (event as CustomEvent<ProductCardActionEventDetail>).detail;
    if (!detail?.product?.id) return;
    addOrUpdateLine(detail);
  };

  window.addEventListener("add-product", onAddProduct);
  addProductListenerRegistered = true;
}
