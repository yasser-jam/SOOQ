/**
 * The header's cart `ContentButton` should show a live item-count badge when
 * `showCartBadge` is on, updating as the localStorage cart changes.
 */
import React from "react";
import { act, render, screen } from "@testing-library/react";
import { Render } from "@/core";

import conf from "../../../index";
import { writeStoreCart, clearCart } from "../../../cart/store-cart";
import type { StoreCart } from "../../../cart/store-cart";

function renderData(showCartBadge: boolean) {
  return {
    root: { props: {} },
    zones: {},
    content: [
      {
        type: "ContentButton",
        props: {
          id: "cart-button",
          label: { ar: "السلة", en: "Cart" },
          align: "center",
          destinationType: "link",
          buttonAction: "link",
          submitRedirectUrl: "",
          link: { kind: "page", pageId: "/cart" },
          zoneKey: "popup-main",
          zoneAction: "open",
          buttonVariantMode: "variant",
          buttonVariant: "primary",
          buttonVariantSize: "md",
          radius: "theme-md",
          bgColor: "theme-primary",
          textColor: "theme-surface",
          buttonSize: "theme-md",
          showCartBadge,
        },
      },
    ],
  } as const;
}

function fakeCart(itemCount: number): StoreCart {
  return {
    updatedAt: new Date().toISOString(),
    items: itemCount > 0
      ? [
          {
            lineId: "p1:v1",
            quantity: itemCount,
            product: { id: "p1" } as StoreCart["items"][number]["product"],
            selectedVariant: null,
            selectedAttributes: {},
            pricing: {
              price: 1000,
              currencyCode: "SYP",
            } as StoreCart["items"][number]["pricing"],
            language: "ar",
            addedAt: new Date().toISOString(),
          },
        ]
      : [],
  };
}

describe("ContentButton cart badge", () => {
  afterEach(() => {
    act(() => {
      clearCart();
    });
  });

  it("renders no badge when showCartBadge is off", () => {
    render(<Render config={conf as any} data={renderData(false) as any} />);
    expect(screen.getByText("السلة")).toBeTruthy();
    expect(screen.queryByText("0")).toBeNull();
  });

  it("renders no badge when the cart is empty", () => {
    render(<Render config={conf as any} data={renderData(true) as any} />);
    expect(screen.getByText("السلة")).toBeTruthy();
    expect(screen.queryByText("0")).toBeNull();
  });

  it("shows the live item count and updates on cart changes", () => {
    act(() => {
      writeStoreCart(fakeCart(2));
    });

    render(<Render config={conf as any} data={renderData(true) as any} />);
    expect(screen.getByText("2")).toBeTruthy();

    act(() => {
      writeStoreCart(fakeCart(5));
    });
    expect(screen.getByText("5")).toBeTruthy();
  });

  it("caps the badge at 99+", () => {
    act(() => {
      writeStoreCart(fakeCart(150));
    });
    render(<Render config={conf as any} data={renderData(true) as any} />);
    expect(screen.getByText("99+")).toBeTruthy();
  });
});
