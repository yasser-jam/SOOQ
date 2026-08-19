/**
 * CategoryTree renders the nested `/public/categories` payload as a flat
 * list of indented links and delegates selection into the shared
 * `productsPage` slice (the same slice the products grid/pagination blocks
 * already read) — so clicking any node, at any depth, filters the existing
 * product grid without a bespoke fetch path.
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { Render } from "@/core";

import conf from "../index";
import { StoreContext, type StoreContextValue } from "../store-context";
import type { CategoryRef } from "../data-adapter";

const CATEGORY_TREE: CategoryRef[] = [
  {
    id: "cat-furniture",
    slug: "furniture",
    nameAr: "أثاث",
    nameEn: "Furniture",
    productCount: 40,
    children: [
      {
        id: "cat-living-room",
        slug: "living-room",
        nameAr: "غرفة المعيشة",
        nameEn: "Living Room",
        productCount: 12,
      },
      {
        id: "cat-bedroom",
        slug: "bedroom",
        nameAr: "غرفة النوم",
        nameEn: "Bedroom",
        productCount: 8,
      },
    ],
  },
  {
    id: "cat-sofas",
    slug: "sofas",
    nameAr: "كنب وأرائك",
    nameEn: "Sofas & Couches",
    productCount: 5,
  },
];

function buildStoreValue(
  setCategory: (slug: string | null) => void,
  selectedCategorySlug: string | null = null
): StoreContextValue {
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
      categories: CATEGORY_TREE,
      selectedCategorySlug,
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
        setCategory,
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

describe("CategoryTree", () => {
  it("renders every nesting level as a link and clicking a child filters by its slug", () => {
    const setCategory = jest.fn();
    const storeValue = buildStoreValue(setCategory);

    render(
      <StoreContext.Provider value={storeValue}>
        <Render
          config={conf as any}
          data={{
            root: { props: {} },
            content: [{ type: "CategoryTree", props: { id: "category-tree-1" } }],
          } as any}
        />
      </StoreContext.Provider>
    );

    // Top-level + nested categories all render as flat links.
    expect(screen.getByText("أثاث")).toBeTruthy();
    expect(screen.getByText("غرفة المعيشة")).toBeTruthy();
    expect(screen.getByText("غرفة النوم")).toBeTruthy();
    expect(screen.getByText("كنب وأرائك")).toBeTruthy();

    fireEvent.click(screen.getByText("غرفة المعيشة"));
    expect(setCategory).toHaveBeenCalledWith("living-room");
  });

  it("clicking a top-level category filters by its own slug", () => {
    const setCategory = jest.fn();
    const storeValue = buildStoreValue(setCategory);

    render(
      <StoreContext.Provider value={storeValue}>
        <Render
          config={conf as any}
          data={{
            root: { props: {} },
            content: [{ type: "CategoryTree", props: { id: "category-tree-1" } }],
          } as any}
        />
      </StoreContext.Provider>
    );

    fireEvent.click(screen.getByText("كنب وأرائك"));
    expect(setCategory).toHaveBeenCalledWith("sofas");
  });

  it("clicking \"الكل\" clears the selected category", () => {
    const setCategory = jest.fn();
    const storeValue = buildStoreValue(setCategory, "sofas");

    render(
      <StoreContext.Provider value={storeValue}>
        <Render
          config={conf as any}
          data={{
            root: { props: {} },
            content: [{ type: "CategoryTree", props: { id: "category-tree-1" } }],
          } as any}
        />
      </StoreContext.Provider>
    );

    fireEvent.click(screen.getByText("الكل"));
    expect(setCategory).toHaveBeenCalledWith(null);
  });
});
