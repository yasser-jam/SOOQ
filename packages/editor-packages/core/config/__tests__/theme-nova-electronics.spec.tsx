/**
 * Guards the nova-electronics theme fixes: the home page must carry real
 * copy (no literal-empty text nodes left over from the original fixture),
 * and `/products`, `/products/:product-slug`, `/settings`, `/orders` and
 * `/orders/:order-id` must wear nova's own dark-navy palette instead of the
 * rawaq cream/olive hex values they were copy-pasted with.
 */
import fs from "node:fs";
import path from "node:path";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Render } from "@/core";

import conf from "../index";
import { StoreContext, type StoreContextValue } from "../store-context";
import type { CategoryRef } from "../data-adapter";
import { composePuckData, normalizeSiteData } from "../lib/site-data";

type Node = { type?: string; props?: Record<string, unknown> };

const themePath = path.join(
  __dirname,
  "..",
  "..",
  "themes",
  "theme-nova-electronics.json"
);
const nova = JSON.parse(fs.readFileSync(themePath, "utf8"));

const findPage = (pagePath: string) =>
  nova.pages.find((page: { path?: string }) => page.path === pagePath);

const RAWAQ_COLORS = ["#f7f2ea", "#fffdf9", "#efe6d8"];

function renderTree(children: React.ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

const renderPage = (pagePath: string) => {
  const site = normalizeSiteData(nova);
  return renderTree(
    <Render
      config={conf as any}
      data={composePuckData(site, pagePath) as any}
    />
  );
};

function collectEmptyTextNodes(node: unknown, out: string[] = [], path = "$") {
  if (Array.isArray(node)) {
    node.forEach((entry, index) =>
      collectEmptyTextNodes(entry, out, `${path}[${index}]`)
    );
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
        out.push(`${path} (${record.type}#${props.id})`);
      }
    }
    for (const key of ["content", "cardTemplate", "slot"]) {
      if (props[key] != null) {
        collectEmptyTextNodes(props[key], out, `${path}.${key}`);
      }
    }
  }
  return out;
}

const CATEGORY_TREE: CategoryRef[] = [
  {
    id: "cat-laptops",
    slug: "laptops",
    nameAr: "حواسيب محمولة",
    nameEn: "Laptops",
    productCount: 18,
  },
  {
    id: "cat-audio",
    slug: "audio",
    nameAr: "سماعات وصوتيات",
    nameEn: "Audio",
    productCount: 24,
  },
];

function buildStoreValue(
  setCategory: (slug: string | null) => void
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

describe("theme-nova-electronics", () => {
  it("has no literal-empty ContentHeading/ContentParagraph left on the home page", () => {
    expect(collectEmptyTextNodes(findPage("/").content)).toEqual([]);
  });

  it("uses at least one ContentIcon on the home page (trust bar + Why Nova)", () => {
    const json = JSON.stringify(findPage("/").content);
    expect((json.match(/"ContentIcon"/g) ?? []).length).toBeGreaterThanOrEqual(7);
  });

  it.each(["/products", "/products/:product-slug", "/settings"])(
    "carries nova's own dark palette, not rawaq's cream/olive, on %s",
    (pagePath) => {
      const json = JSON.stringify(findPage(pagePath).content);
      for (const hex of RAWAQ_COLORS) {
        expect(json).not.toContain(hex);
      }
      expect(json).toContain("#0b0f1a");
      expect(json).toContain("#141a2e");
    }
  );

  it("no longer duplicates rawaq's exact /orders content", () => {
    const rawaqPath = path.join(
      __dirname,
      "..",
      "..",
      "themes",
      "theme-rawaq-furniture.json"
    );
    const rawaq = JSON.parse(fs.readFileSync(rawaqPath, "utf8"));
    expect(JSON.stringify(findPage("/orders").content)).not.toEqual(
      JSON.stringify(rawaq.pages.find((p: any) => p.path === "/orders").content)
    );
  });

  it("styles the order card as a real card on nova's own surface color", () => {
    const listSection = findPage("/orders").content.find(
      (section: Node) => section.props?.sectionKind === "customer-orders"
    );
    const card = (listSection!.props!.cardTemplate as Node[])[0]!;
    expect(card.props!.backgroundColor).toBe("#141a2e");
    expect(card.props!.borderRadius).toBe("theme-md");
  });

  it("uses a CategoryTree sidebar on /products instead of a flat button row", () => {
    const json = JSON.stringify(findPage("/products").content);
    expect(json).toContain('"CategoryTree"');
    expect(json).not.toContain("ButtonGroup-products-categories");
  });

  it("gives every /settings section its own island card distinct from the page bg", () => {
    for (const section of findPage("/settings").content as Node[]) {
      expect(section.props!.backgroundColor).toBe("#0b0f1a");
      const cardGroup = (section.props!.content as Node[]).find(
        (node) => node.type === "Group"
      );
      if (cardGroup) {
        expect(cardGroup.props!.backgroundColor).toBe("#141a2e");
      }
    }
  });

  it("CategoryTree (as wired into the theme) renders categories and resolves clicks", () => {
    const setCategory = jest.fn();
    const storeValue = buildStoreValue(setCategory);
    const page = findPage("/products");
    const treeNode = JSON.stringify(page.content).includes("CategoryTree-products");
    expect(treeNode).toBe(true);

    render(
      <StoreContext.Provider value={storeValue}>
        <Render
          config={conf as any}
          data={{
            root: { props: {} },
            content: [{ type: "CategoryTree", props: { id: "CategoryTree-products" } }],
          } as any}
        />
      </StoreContext.Provider>
    );

    expect(screen.getByText("حواسيب محمولة")).toBeTruthy();
    fireEvent.click(screen.getByText("سماعات وصوتيات"));
    expect(setCategory).toHaveBeenCalledWith("audio");
  });

  it.each(["/", "/orders", "/orders/:order-id"])(
    "renders %s from the shipped theme JSON without throwing",
    (pagePath) => {
      expect(() => renderPage(pagePath)).not.toThrow();
    }
  );
});
