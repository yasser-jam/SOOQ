/**
 * Verifies the variant selector wired into the Rawaq Furniture theme's
 * product-detail page — that the paths saved in the theme JSON actually
 * resolve against the payload `UrlBoundProductProvider` supplies, and that
 * picking an option feeds the binding layer that re-prices the page.
 */
import fs from "node:fs";
import path from "node:path";
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";

import { ContentDropdown } from "../blocks/ContentDropdown";
import { BoundDataProvider, applyVariantPricing } from "../binding";
import type { BoundDataContextValue } from "../binding";

const theme = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "..", "..", "themes", "theme-rawaq-furniture.json"),
    "utf8"
  )
);

/** Walk the page tree for the one ContentDropdown the theme ships. */
function findDropdown(value: unknown): Record<string, any> | null {
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findDropdown(item);
      if (found) return found;
    }
    return null;
  }
  if (typeof value !== "object" || value === null) return null;

  const node = value as Record<string, any>;
  if (node.type === "ContentDropdown") return node;

  for (const child of Object.values(node)) {
    const found = findDropdown(child);
    if (found) return found;
  }
  return null;
}

const productPage = theme.pages.find(
  (page: Record<string, unknown>) => page.path === "/products/:product-slug"
);

/**
 * Shaped like `normalizeGetProduct` output in
 * apps/web/modules/product/product/data-store.ts — variants carry their
 * labels as `optionValues` rows, with no flat title field.
 */
const PAYLOAD = {
  product: { productId: "p-1", titleAr: "طاولة سنديان" },
  pricing: { basePrice: 100, currencyCode: "SYP", displayPrice: "100 SYP" },
  variantMatrix: {
    variants: [
      {
        variantId: "var-oak-small",
        price: 900000,
        stockQty: 3,
        isActive: true,
        optionValues: [
          { optionValueId: "ov-oak", valueAr: "سنديان", valueEn: "Oak" },
          { optionValueId: "ov-sm", valueAr: "صغير", valueEn: "Small" },
        ],
      },
      {
        variantId: "var-walnut-large",
        price: 1400000,
        stockQty: 1,
        isActive: true,
        optionValues: [
          { optionValueId: "ov-walnut", valueAr: "جوز", valueEn: "Walnut" },
          { optionValueId: "ov-lg", valueAr: "كبير", valueEn: "Large" },
        ],
      },
    ],
  },
};

const Dropdown = ContentDropdown.render as unknown as React.FC<
  Record<string, unknown>
>;

function renderThemeDropdown(
  bound: Partial<BoundDataContextValue> = {},
  data: unknown = PAYLOAD
) {
  const node = findDropdown(productPage.content)!;

  const value: BoundDataContextValue = {
    data: data as Record<string, unknown> | null,
    isLoading: false,
    isError: false,
    metadata: null,
    language: "ar",
    selectedVariantId: null,
    setSelectedVariantId: () => {},
    ...bound,
  };

  return render(
    <BoundDataProvider value={value}>
      <Dropdown
        {...ContentDropdown.defaultProps}
        {...node.props}
        puck={{ isEditing: false, dragRef: null }}
      />
    </BoundDataProvider>
  );
}

describe("theme-rawaq-furniture product-detail variant dropdown", () => {
  it("is placed on the dynamic product page, above the add-to-cart row", () => {
    const column =
      productPage.content[0].props.content[0].props.content[1].props.content;
    const ids = column.map((node: any) => node.props.id);

    expect(ids).toContain("Dropdown-product-variant");
    expect(ids.indexOf("Dropdown-product-variant")).toBe(
      ids.indexOf("RowGroup-product-actions") - 1
    );
  });

  it("is wired to the variant binding, not left as a plain form control", () => {
    const node = findDropdown(productPage.content)!;
    expect(node.props.dropdownAction).toBe("select_variant");
    expect(node.props.options[0].valuePath).toBe("variantId");
  });

  it("lists each variant with a composed Arabic label", () => {
    renderThemeDropdown();

    const select = screen.getByLabelText("الخيار") as HTMLSelectElement;
    expect(
      Array.from(select.options).map((option) => [option.value, option.text])
    ).toEqual([
      ["", "اختر الخيار المناسب"],
      ["var-oak-small", "سنديان / صغير"],
      ["var-walnut-large", "جوز / كبير"],
    ]);
  });

  it("re-prices the page through the same binding the price blocks read", () => {
    const setSelectedVariantId = jest.fn();
    renderThemeDropdown({ setSelectedVariantId });

    const select = screen.getByLabelText("الخيار") as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "var-walnut-large" } });

    expect(setSelectedVariantId).toHaveBeenCalledWith("var-walnut-large");

    // That id is what UrlBoundProductProvider feeds applyVariantPricing, which
    // drives the `pricing.displayPrice` paragraph already on this page.
    const repriced = applyVariantPricing(PAYLOAD as any, "var-walnut-large");
    expect((repriced as any).pricing.displayPrice).toBe("1400000 SYP");
  });

  it("collapses entirely for a product with a single variant", () => {
    const { container } = renderThemeDropdown(
      {},
      {
        product: { productId: "p-2" },
        variantMatrix: {
          variants: [{ variantId: "only", optionValues: [] }],
        },
      }
    );

    expect(container.innerHTML).toBe("");
  });
});
