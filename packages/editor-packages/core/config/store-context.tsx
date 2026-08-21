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
  invoice: boolean;
  cancelOrder: boolean;
  submitReturn: boolean;
  paymentMethods: boolean;
  discount: boolean;
  placeOrder: boolean;
};

export type StoreErrorState = {
  login: string | null;
  verifyOtp: string | null;
  makeOrder: string | null;
  profile: string | null;
  preferences: string | null;
  address: string | null;
  invoice: string | null;
  cancelOrder: string | null;
  submitReturn: string | null;
  paymentMethods: string | null;
  discount: string | null;
  placeOrder: string | null;
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

// ─── Customer orders (orders list + detail) ────────────────────────────────────

export type CustomerOrderSummary = {
  orderId: string;
  orderNumber?: string;
  orderStatus?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  subtotal?: number;
  discountAmount?: number;
  taxAmount?: number;
  total?: number;
  itemCount?: number;
  placedAt?: string;
  currencyCode?: string;
};

export type CustomerOrderShippingAddress = {
  latitude?: number | null;
  longitude?: number | null;
  recipientName?: string | null;
  phone?: string | null;
  addressLabel?: string | null;
};

export type CustomerOrderItem = {
  orderItemId?: string;
  variantId?: string;
  productTitle?: string;
  variantTitle?: string;
  sku?: string;
  quantity?: number;
  unitPrice?: number;
  discountAmount?: number;
  totalPrice?: number;
};

export type CustomerOrderTimelineEntry = {
  timelineId?: string;
  action?: string;
  actor?: string;
  details?: string | null;
  createdAt?: string;
};

export type CustomerOrderDetail = {
  orderId: string;
  orderNumber?: string;
  orderStatus?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  currencyCode?: string;
  subtotal?: number;
  discountAmount?: number;
  taxAmount?: number;
  shippingCost?: number;
  total?: number;
  shippingAddress?: CustomerOrderShippingAddress | null;
  notesCustomer?: string | null;
  placedAt?: string;
  items?: CustomerOrderItem[];
  timeline?: CustomerOrderTimelineEntry[];
};

export type OrdersState = {
  items: CustomerOrderSummary[];
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  pageLabel: string;
  isLoading: boolean;
  isError: boolean;
};

export type OrderDetailState = {
  order: CustomerOrderDetail | null;
  isCancellable: boolean;
  isReturnable: boolean;
  cancelReason: string;
};

export type ReturnItemDraft = {
  quantity: number;
  condition: string;
};

export type ReturnDraftState = {
  orderId: string | null;
  reason: string;
  items: Record<string, ReturnItemDraft>;
  submitted: boolean;
};

export type OrdersActions = {
  nextPage: () => void;
  prevPage: () => void;
  downloadInvoice: (orderId?: string, orderNumber?: string | null) => Promise<void>;
  cancelOrder: () => Promise<void>;
  submitReturn: () => Promise<void>;
  setCancelReason: (reason: string) => void;
  toggleReturnItem: (orderItemId: string, maxQuantity: number) => void;
  setReturnItemQuantity: (orderItemId: string, quantity: number) => void;
  setReturnItemCondition: (orderItemId: string, condition: string) => void;
  setOrderDetail: (order: CustomerOrderDetail | null) => void;
  refreshOrders: () => Promise<void>;
};

// ─── Checkout (the /checkout page) ────────────────────────────────────────────

/** One entry of `GET /public/payments/methods`. */
export type PaymentMethodOption = {
  providerCode: string;
  displayName: string;
  requiresRedirect: boolean;
  supportsSavedCards: boolean;
};

/** Result of `GET /public/checkout/validate-discount`. */
export type CheckoutDiscount = {
  code: string;
  discountAmount: number;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_SHIPPING";
  discountCodeId: string;
};

/**
 * Checkout is a small state machine: the customer picks a saved address and a
 * payment method, optionally applies a discount code, and only then can place
 * the order. `canPlaceOrder` is the single gate the place-order button reads —
 * blocks should never re-derive it.
 */
export type CheckoutState = {
  /** `addressId` of the selected saved address; null until one is chosen. */
  addressId: string | null;
  paymentMethods: PaymentMethodOption[];
  /** `providerCode` of the selected payment method. */
  paymentMethodCode: string | null;
  /** What the customer has typed into the discount-code input. */
  discountCodeDraft: string;
  /** Set once a code validates; cleared when the draft changes. */
  discount: CheckoutDiscount | null;
  subtotal: number;
  shippingCost: number;
  discountAmount: number;
  payableTotal: number;
  currencyCode: string;
  /** Set after a successful placeOrder — drives the success state. */
  placedOrderId: string | null;
  isLoading: boolean;
  isError: boolean;
};

export type CheckoutActions = {
  selectAddress: (addressId: string) => void;
  selectPaymentMethod: (providerCode: string) => void;
  setDiscountCodeDraft: (code: string) => void;
  validateDiscount: () => Promise<void>;
  placeOrder: () => Promise<void>;
  /** Loads payment methods + saved addresses and recomputes the totals. */
  refreshCheckout: () => Promise<void>;
};

// ─── Actions ──────────────────────────────────────────────────────────────────

export type StoreContextActions = {
  /** Request an OTP. Stores phone in localStorage for the verifyOtp step. */
  login: (phone: string, fullName: string) => Promise<void>;
  /** Verify the OTP received after login. Sets auth cookies on success. */
  verifyOtp: (otp: string) => Promise<void>;
  /**
   * Leave the cart for the checkout page. Validates the cart first and throws
   * when it cannot be ordered, so the cart button surfaces the reason.
   * The order itself is placed by `actions.checkout.placeOrder`.
   */
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
  orders: OrdersState;
  orderDetail: OrderDetailState;
  returnDraft: ReturnDraftState;
  checkout: CheckoutState;
  actions: StoreContextActions & {
    productsPage: ProductsPageActions;
    customer: CustomerActions;
    orders: OrdersActions;
    checkout: CheckoutActions;
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

const defaultOrdersState: OrdersState = {
  items: [],
  page: 0,
  pageSize: 20,
  totalPages: 0,
  hasNext: false,
  hasPrev: false,
  pageLabel: "",
  isLoading: false,
  isError: false,
};

const defaultOrderDetailState: OrderDetailState = {
  order: null,
  isCancellable: false,
  isReturnable: false,
  cancelReason: "",
};

const defaultReturnDraftState: ReturnDraftState = {
  orderId: null,
  reason: "DEFECTIVE",
  items: {},
  submitted: false,
};

const defaultOrdersActions: OrdersActions = {
  nextPage: noop,
  prevPage: noop,
  downloadInvoice: noopAsync,
  cancelOrder: noopAsync,
  submitReturn: noopAsync,
  setCancelReason: noop,
  toggleReturnItem: noop,
  setReturnItemQuantity: noop,
  setReturnItemCondition: noop,
  setOrderDetail: noop,
  refreshOrders: noopAsync,
};

export const defaultCheckoutState: CheckoutState = {
  addressId: null,
  paymentMethods: [],
  paymentMethodCode: null,
  discountCodeDraft: "",
  discount: null,
  subtotal: 0,
  shippingCost: 0,
  discountAmount: 0,
  payableTotal: 0,
  currencyCode: "SYP",
  placedOrderId: null,
  isLoading: false,
  isError: false,
};

const defaultCheckoutActions: CheckoutActions = {
  selectAddress: noop,
  selectPaymentMethod: noop,
  setDiscountCodeDraft: noop,
  validateDiscount: noopAsync,
  placeOrder: noopAsync,
  refreshCheckout: noopAsync,
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
    invoice: false,
    cancelOrder: false,
    submitReturn: false,
    paymentMethods: false,
    discount: false,
    placeOrder: false,
  },
  errors: {
    login: null,
    verifyOtp: null,
    makeOrder: null,
    profile: null,
    preferences: null,
    address: null,
    invoice: null,
    cancelOrder: null,
    submitReturn: null,
    paymentMethods: null,
    discount: null,
    placeOrder: null,
  },
  productsPage: defaultProductsPageState,
  customer: defaultCustomerState,
  orders: defaultOrdersState,
  orderDetail: defaultOrderDetailState,
  returnDraft: defaultReturnDraftState,
  checkout: defaultCheckoutState,
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
    orders: defaultOrdersActions,
    checkout: defaultCheckoutActions,
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
