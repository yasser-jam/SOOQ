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
import type {
  CategoryRef,
  CollectionProductRef,
} from "./data-adapter/types";

// ─── Auth ─────────────────────────────────────────────────────────────────────

export type StoreAuthState = {
  isLoggedIn: boolean;
  customerName: string | null;
  customerPhone: string | null;
};

const defaultAuth: StoreAuthState = {
  isLoggedIn: false,
  customerName: null,
  customerPhone: null,
};

// ─── Loading / Error per-operation ────────────────────────────────────────────

export type StoreLoadingState = {
  login: boolean;
  verifyOtp: boolean;
  makeOrder: boolean;
  profile: boolean;
  preferences: boolean;
  address: boolean;
};

export type StoreErrorState = {
  login: string | null;
  verifyOtp: string | null;
  makeOrder: string | null;
  profile: string | null;
  preferences: string | null;
  address: string | null;
};

// ─── Products page (searchable listing) ───────────────────────────────────────

export type ProductsPageState = {
  categories: CategoryRef[];
  selectedCategorySlug: string | null;
  search: string;
  /** Inclusive price floor; `null` = no lower bound. */
  minPrice: number | null;
  /** Inclusive price ceiling; `null` = no upper bound. */
  maxPrice: number | null;
  /** Hide out-of-stock products. */
  inStockOnly: boolean;
  page: number;
  pageSize: number;
  totalPages: number;
  products: CollectionProductRef[];
  isLoading: boolean;
  isError: boolean;
};

export type ProductsPageActions = {
  setCategory: (slug: string | null) => void;
  setSearch: (query: string) => void;
  setMinPrice: (value: number | null) => void;
  setMaxPrice: (value: number | null) => void;
  setInStockOnly: (value: boolean) => void;
  setPage: (page: number) => void;
  resetProductsPage: () => void;
};

// ─── Customer account (settings page) ─────────────────────────────────────────

export type CustomerProfile = {
  customerId: string;
  fullName: string;
  phone: string;
  totalSpendSyp: number;
  orderCount: number;
  lastOrderAt: string | null;
  createdAt: string | null;
};

export type CustomerPreferences = {
  emailOptIn: boolean;
  smsOptIn: boolean;
  emailConsentedAt: string | null;
  smsConsentedAt: string | null;
};

export type CustomerAddress = {
  addressId: string;
  label: string | null;
  recipientName: string | null;
  recipientPhone: string | null;
  governorate: string;
  city: string | null;
  streetAddress: string | null;
  notes: string | null;
  latitude: number | null;
  longitude: number | null;
  isDefault: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};

/** Working copy for the "add address" form; each field is written by one inputAction. */
export type CustomerAddressDraft = {
  label: string;
  recipientName: string;
  recipientPhone: string;
  governorate: string;
  city: string;
  streetAddress: string;
  notes: string;
  latitude: number | null;
  longitude: number | null;
  isDefault: boolean;
};

export type CustomerState = {
  profile: CustomerProfile | null;
  preferences: CustomerPreferences | null;
  addresses: CustomerAddress[];
  profileDraft: { fullName: string };
  addressDraft: CustomerAddressDraft;
  isLoading: boolean;
  isError: boolean;
};

export type CustomerActions = {
  setProfileDraftField: (field: "fullName", value: string) => void;
  saveProfile: () => Promise<void>;
  setMarketingPref: (channel: "email" | "sms", value: boolean) => Promise<void>;
  setAddressDraftField: (
    field: keyof CustomerAddressDraft,
    value: string | number | boolean | null
  ) => void;
  /** Called by ContentMap; the provider reverse-geocodes and fills governorate/city/street. */
  setAddressDraftLocation: (latitude: number, longitude: number) => void;
  createAddress: () => Promise<void>;
  setDefaultAddress: (addressId: string) => Promise<void>;
  deleteAddress: (addressId: string) => Promise<void>;
  refreshCustomer: () => Promise<void>;
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
  /** Update the products-page search query (debounced by the input block). */
  searchProducts: (query: string) => void;
};

// ─── Full context value ────────────────────────────────────────────────────────

export type StoreContextValue = {
  auth: StoreAuthState;
  loading: StoreLoadingState;
  errors: StoreErrorState;
  productsPage: ProductsPageState;
  customer: CustomerState;
  actions: StoreContextActions & {
    productsPage: ProductsPageActions;
    customer: CustomerActions;
  };
};

// ─── No-op defaults (editor mode) ─────────────────────────────────────────────

const noopAsync = () => Promise.resolve();
const noop = () => {};

const defaultProductsPageState: ProductsPageState = {
  categories: [],
  selectedCategorySlug: null,
  search: "",
  minPrice: null,
  maxPrice: null,
  inStockOnly: false,
  page: 1,
  pageSize: 12,
  totalPages: 0,
  products: [],
  isLoading: false,
  isError: false,
};

const defaultProductsPageActions: ProductsPageActions = {
  setCategory: noop,
  setSearch: noop,
  setMinPrice: noop,
  setMaxPrice: noop,
  setInStockOnly: noop,
  setPage: noop,
  resetProductsPage: noop,
};

export const defaultCustomerState: CustomerState = {
  profile: null,
  preferences: null,
  addresses: [],
  profileDraft: { fullName: "" },
  addressDraft: {
    label: "",
    recipientName: "",
    recipientPhone: "",
    governorate: "",
    city: "",
    streetAddress: "",
    notes: "",
    latitude: null,
    longitude: null,
    isDefault: false,
  },
  isLoading: false,
  isError: false,
};

const defaultCustomerActions: CustomerActions = {
  setProfileDraftField: noop,
  saveProfile: noopAsync,
  setMarketingPref: noopAsync,
  setAddressDraftField: noop,
  setAddressDraftLocation: noop,
  createAddress: noopAsync,
  setDefaultAddress: noopAsync,
  deleteAddress: noopAsync,
  refreshCustomer: noopAsync,
};

const defaultValue: StoreContextValue = {
  auth: defaultAuth,
  loading: {
    login: false,
    verifyOtp: false,
    makeOrder: false,
    profile: false,
    preferences: false,
    address: false,
  },
  errors: {
    login: null,
    verifyOtp: null,
    makeOrder: null,
    profile: null,
    preferences: null,
    address: null,
  },
  productsPage: defaultProductsPageState,
  customer: defaultCustomerState,
  actions: {
    login: noopAsync,
    verifyOtp: noopAsync,
    makeOrder: noopAsync,
    addToCart: noop,
    addToWishlist: noop,
    logout: noop,
    searchProducts: noop,
    productsPage: defaultProductsPageActions,
    customer: defaultCustomerActions,
  },
};

// ─── Context + hook ───────────────────────────────────────────────────────────

/**
 * Auth-only context so visibility gates do not re-render on cart/customer draft
 * updates. StoreProvider must wrap both this and StoreContext.
 */
export const StoreAuthContext = createContext<StoreAuthState>(defaultAuth);

export const StoreContext = createContext<StoreContextValue>(defaultValue);

/** Hook for blocks. Returns no-ops when used outside a StoreProvider. */
export function useStore(): StoreContextValue {
  return useContext(StoreContext);
}

/** Auth slice only — prefer this in show-condition gates. */
export function useStoreAuth(): StoreAuthState {
  return useContext(StoreAuthContext);
}
