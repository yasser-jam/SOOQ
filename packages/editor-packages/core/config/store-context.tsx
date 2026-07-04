"use client";

/**
 * StoreContext — shared interface between editor blocks and the store runtime.
 *
 * Blocks import `useStore()` to call actions and read state.
 * In the editor, this returns no-op defaults so blocks render safely.
 * In the store app, `StoreProvider` (apps/store) overrides this with
 * real API implementations.
 */

import React, { createContext, useContext } from "react";
import type { ProductCardActionEventDetail } from "./binding/product-actions";

// ─── Auth ─────────────────────────────────────────────────────────────────────

export type StoreAuthState = {
  isLoggedIn: boolean;
  customerName: string | null;
  customerPhone: string | null;
};

// ─── Loading / Error per-operation ────────────────────────────────────────────

export type StoreLoadingState = {
  login: boolean;
  verifyOtp: boolean;
  makeOrder: boolean;
};

export type StoreErrorState = {
  login: string | null;
  verifyOtp: string | null;
  makeOrder: string | null;
};

// ─── Actions ──────────────────────────────────────────────────────────────────

export type StoreContextActions = {
  /** Request an OTP. Stores phone in localStorage for the verifyOtp step. */
  login: (phone: string, fullName: string) => Promise<void>;
  /** Verify the OTP received after login. Sets auth cookies on success. */
  verifyOtp: (otp: string) => Promise<void>;
  /** Submit the current cart as an order. Clears the cart on success. */
  makeOrder: () => Promise<void>;
  /** Add a product (with variant / attributes) to the local cart. */
  addToCart: (detail: ProductCardActionEventDetail) => void;
  /** Add a product to the wishlist. */
  addToWishlist: (detail: ProductCardActionEventDetail) => void;
  /** Clear auth cookies and reset auth state. */
  logout: () => void;
};

// ─── Full context value ────────────────────────────────────────────────────────

export type StoreContextValue = {
  auth: StoreAuthState;
  loading: StoreLoadingState;
  errors: StoreErrorState;
  actions: StoreContextActions;
};

// ─── No-op defaults (editor mode) ─────────────────────────────────────────────

const noopAsync = () => Promise.resolve();
const noop = () => {};

const defaultValue: StoreContextValue = {
  auth: {
    isLoggedIn: false,
    customerName: null,
    customerPhone: null,
  },
  loading: {
    login: false,
    verifyOtp: false,
    makeOrder: false,
  },
  errors: {
    login: null,
    verifyOtp: null,
    makeOrder: null,
  },
  actions: {
    login: noopAsync,
    verifyOtp: noopAsync,
    makeOrder: noopAsync,
    addToCart: noop,
    addToWishlist: noop,
    logout: noop,
  },
};

// ─── Context + hook ───────────────────────────────────────────────────────────

export const StoreContext = createContext<StoreContextValue>(defaultValue);

/** Hook for blocks. Returns no-ops when used outside a StoreProvider. */
export function useStore(): StoreContextValue {
  return useContext(StoreContext);
}
