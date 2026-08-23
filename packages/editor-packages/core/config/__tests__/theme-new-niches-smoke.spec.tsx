/**
 * Structural smoke test for the three new niche themes (lamsa-beauty,
 * nabd-sport, farha-kids): every page must normalize/compose without
 * throwing, and no ContentHeading/ContentParagraph may carry a literal
 * empty { ar: "", en: "" } text unless it's data-bound (valueContext).
 */
import fs from "node:fs";
import path from "node:path";
import React from "react";
import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Render } from "@/core";
import conf from "../index";
import { StoreContext, type StoreContextValue } from "../store-context";
import { composePuckData, normalizeSiteData } from "../lib/site-data";

type Node = { type?: string; props?: Record<string, unknown> };

function buildMinimalStoreValue(): StoreContextValue {
  return {
    auth: { isLoggedIn: false, customerName: null, customerPhone: null },
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
    productsPage: {
      categories: [],
      selectedCategorySlug: null,
      search: "",
      minPrice: null,
      maxPrice: null,
      inStockOnly: false,
      page: 1,
      pageSize: 12,
      totalPages: 1,
      products: [],
      isLoading: false,
      isError: false,
    },
    customer: {} as StoreContextValue["customer"],
    orders: {} as StoreContextValue["orders"],
    orderDetail: {} as StoreContextValue["orderDetail"],
    returnDraft: {} as StoreContextValue["returnDraft"],
    checkout: {} as StoreContextValue["checkout"],
    actions: {
      login: async () => {},
      verifyOtp: async () => {},
      makeOrder: async () => {},
      addToCart: () => {},
      addToWishlist: () => {},
      logout: () => {},
      searchProducts: () => {},
      productsPage: {
        setCategory: () => {},
        setSearch: () => {},
        setMinPrice: () => {},
        setMaxPrice: () => {},
        setInStockOnly: () => {},
        setPage: () => {},
        resetProductsPage: () => {},
      },
      customer: {} as StoreContextValue["actions"]["customer"],
      orders: {} as StoreContextValue["actions"]["orders"],
      checkout: {} as StoreContextValue["actions"]["checkout"],
    },
  };
}

const THEME_FILES = [
  "theme-lamsa-beauty.json",
  "theme-nabd-sport.json",
  "theme-farha-kids.json",
];

function collectEmptyTextNodes(node: unknown, out: string[] = [], p = "$"): string[] {
  if (Array.isArray(node)) {
    node.forEach((entry, index) => collectEmptyTextNodes(entry, out, `${p}[${index}]`));
    return out;
  }
  if (!node || typeof node !== "object") return out;

  const record = node as Node;
  const props = record.props;
  if (props) {
    if (
      (record.type === "ContentHeading" || record.type === "ContentParagraph") &&
      !props.valueContext
    ) {
      const text = props.text as { ar?: string; en?: string } | undefined;
      if (text && !text.ar && !text.en) {
        out.push(`${p} (${record.type}#${props.id})`);
      }
    }
    for (const key of ["content", "cardTemplate", "slot"]) {
      if (props[key] != null) {
        collectEmptyTextNodes(props[key], out, `${p}.${key}`);
      }
    }
  }
  return out;
}

describe.each(THEME_FILES)("%s", (fileName) => {
  const themePath = path.join(__dirname, "..", "..", "themes", fileName);
  const raw = JSON.parse(fs.readFileSync(themePath, "utf8"));

  it("has the same 11 page routes as the fashion-theme.json source", () => {
    const paths = raw.pages.map((p: { path?: string }) => p.path);
    expect(paths).toEqual([
      "/",
      "/login",
      "/verify-otp",
      "/products",
      "/products/:product-slug",
      "/cart",
      "/about",
      "/settings",
      "/checkout",
      "/orders",
      "/orders/:order-id",
    ]);
  });

  it("normalizes without throwing", () => {
    expect(() => normalizeSiteData(raw)).not.toThrow();
  });

  // `/about` carries 3 literal-empty ContentParagraph nodes already present,
  // unchanged, in the source `fashion-theme.json` this theme was derived
  // from. Per spec, non-home pages are intentionally left byte-identical in
  // content (only re-colored) — so this gap is inherited, not introduced.
  const KNOWN_PRE_EXISTING_EMPTY_PAGES = new Set(["/about"]);

  it.each(raw.pages.map((p: { path?: string }) => p.path))(
    "composes page %s without throwing and with no stray empty text nodes",
    (pagePath: string) => {
      const site = normalizeSiteData(raw);
      const composed = composePuckData(site, pagePath);
      expect(composed).toBeTruthy();
      const empties = collectEmptyTextNodes(composed.content);
      if (KNOWN_PRE_EXISTING_EMPTY_PAGES.has(pagePath)) {
        expect(empties.length).toBe(3);
      } else {
        expect(empties).toEqual([]);
      }
    }
  );

  it("actually renders the home page through <Render> without throwing", () => {
    const site = normalizeSiteData(raw);
    const composed = composePuckData(site, "/");
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    expect(() =>
      render(
        <QueryClientProvider client={client}>
          <StoreContext.Provider value={buildMinimalStoreValue()}>
            <Render config={conf as any} data={composed as any} />
          </StoreContext.Provider>
        </QueryClientProvider>
      )
    ).not.toThrow();
  });
});
