import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";

import { ContentDropdown } from "../ContentDropdown";
import { BoundDataProvider } from "../../binding";
import type { BoundDataContextValue } from "../../binding";

const Dropdown = ContentDropdown.render as unknown as React.FC<
  Record<string, unknown>
>;

const PRODUCT_PAYLOAD = {
  product: { productId: "p-1", titleAr: "قميص" },
  variantMatrix: {
    variants: [
      { variantId: "v-red-m", attributes: { Color: "أحمر", Size: "M" } },
      { variantId: "v-blue-l", attributes: { Color: "أزرق", Size: "L" } },
    ],
  },
};

/** The variant-selector wiring a merchant builds on a product-detail page. */
const VARIANT_SOURCE = {
  mode: "bound" as const,
  groupLabel: { ar: "", en: "" },
  values: [],
  sourcePath: "variantMatrix.variants",
  titlePath: "attributes",
  valuePath: "variantId",
};

function renderDropdown(
  props: Record<string, unknown>,
  bound: Partial<BoundDataContextValue> = {}
) {
  const value: BoundDataContextValue = {
    data: null,
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
        {...props}
        puck={{ isEditing: false, dragRef: null }}
      />
    </BoundDataProvider>
  );
}

describe("ContentDropdown render", () => {
  it("renders the placeholder plus the static default options", () => {
    renderDropdown({ name: "size" });

    const select = screen.getByLabelText("اختر") as HTMLSelectElement;
    expect(
      Array.from(select.options).map((option) => [option.value, option.text])
    ).toEqual([
      ["", "اختر قيمة"],
      ["one", "الخيار الأول"],
      ["two", "الخيار الثاني"],
    ]);
  });

  it("lists bound variants and reports the picked one to the binding layer", () => {
    const setSelectedVariantId = jest.fn();

    renderDropdown(
      {
        name: "variant",
        options: [VARIANT_SOURCE],
        dropdownAction: "select_variant",
        autoSelectFirst: false,
      },
      { data: PRODUCT_PAYLOAD, setSelectedVariantId }
    );

    const select = screen.getByLabelText("اختر") as HTMLSelectElement;
    expect(
      Array.from(select.options).map((option) => [option.value, option.text])
    ).toEqual([
      ["", "اختر قيمة"],
      ["v-red-m", "أحمر / M"],
      ["v-blue-l", "أزرق / L"],
    ]);

    fireEvent.change(select, { target: { value: "v-blue-l" } });
    expect(setSelectedVariantId).toHaveBeenCalledWith("v-blue-l");
  });

  it("adopts the first variant on mount when autoSelectFirst is on", () => {
    const setSelectedVariantId = jest.fn();

    renderDropdown(
      {
        name: "variant",
        options: [VARIANT_SOURCE],
        dropdownAction: "select_variant",
        autoSelectFirst: true,
      },
      { data: PRODUCT_PAYLOAD, setSelectedVariantId }
    );

    expect(setSelectedVariantId).toHaveBeenCalledWith("v-red-m");
  });

  it("reflects the variant chosen elsewhere on the page", () => {
    renderDropdown(
      {
        name: "variant",
        options: [VARIANT_SOURCE],
        dropdownAction: "select_variant",
      },
      { data: PRODUCT_PAYLOAD, selectedVariantId: "v-blue-l" }
    );

    expect((screen.getByLabelText("اختر") as HTMLSelectElement).value).toBe(
      "v-blue-l"
    );
  });

  it("shows an editor hint instead of an empty list while editing", () => {
    render(
      <BoundDataProvider
        value={{
          data: null,
          isLoading: false,
          isError: false,
          metadata: null,
          language: "ar",
          selectedVariantId: null,
          setSelectedVariantId: () => {},
        }}
      >
        <Dropdown
          {...ContentDropdown.defaultProps}
          name="variant"
          options={[VARIANT_SOURCE]}
          puck={{ isEditing: true, dragRef: null }}
        />
      </BoundDataProvider>
    );

    const select = screen.getByLabelText("اختر") as HTMLSelectElement;
    expect(Array.from(select.options).map((option) => option.text)).toContain(
      "لا توجد خيارات — تحقّق من مصدر القيم"
    );
  });
});
