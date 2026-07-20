import type { ComponentDataOptionalId } from "@/core/types";
import { buildProductsPageSectionProps } from "../blocks/Section/section-preset-kinds";
import type { SectionPreset } from "./types";
import { createSection } from "./shared";
import { createStorefrontProductCardBlock } from "./products-grid";

export function createProductsPageInnerSection(
  overrides: Record<string, unknown> = {}
): ComponentDataOptionalId {
  return createSection(
    buildProductsPageSectionProps({
      name: "Products grid",
      columns: 3,
      columnsMobile: 1,
      gridGap: "24px",
      paddingTop: "0px",
      paddingBottom: "0px",
      content: [createStorefrontProductCardBlock()],
      ...overrides,
    })
  );
}

export function createProductsPagePresetContent(): ComponentDataOptionalId[] {
  return [
    createSection({
      name: "Products page",
      columns: 1,
      columnsMobile: 1,
      gridGap: "24px",
      paddingTop: "48px",
      paddingBottom: "48px",
      paddingHorizontal: "24px",
      maxWidth: "1280px",
      content: [
        {
          type: "ProductSearchInput",
          props: {
            placeholder: "ابحث عن منتج…",
            debounceMs: 250,
            bgColor: "theme-surface",
            textColor: "theme-text",
            borderColor: "theme-border",
            radius: "theme-md",
          },
        },
        {
          type: "ButtonGroup",
          props: {
            bindingMode: "categories",
            prependAllButton: true,
            allButtonTitle: "الكل",
            gap: "theme-8",
            align: "center",
            inactiveStyle: {
              bgColor: "theme-surface",
              textColor: "theme-text",
              radius: "theme-md",
              buttonSize: "theme-sm",
            },
            activeStyle: {
              bgColor: "theme-primary",
              textColor: "theme-surface",
              radius: "theme-md",
              buttonSize: "theme-sm",
            },
            items: [],
          },
        },
        createProductsPageInnerSection(),
        {
          type: "ButtonGroup",
          props: {
            bindingMode: "pagination",
            gap: "theme-8",
            align: "center",
            inactiveStyle: {
              bgColor: "theme-surface",
              textColor: "theme-text",
              radius: "theme-md",
              buttonSize: "theme-sm",
            },
            activeStyle: {
              bgColor: "theme-primary",
              textColor: "theme-surface",
              radius: "theme-md",
              buttonSize: "theme-sm",
            },
            items: [],
          },
        },
      ],
    }),
  ];
}

const productsPagePreset: SectionPreset = {
  id: "products-page",
  category: "products-grid",
  title: "صفحة المنتجات",
  previewImage:
    "https://placehold.co/800x500/e2e8f0/64748b?text=Products+Page",
  componentData: createProductsPagePresetContent()[0]!,
};

export const PRODUCTS_PAGE_PRESETS: SectionPreset[] = [productsPagePreset];

export function createProductsPagePreset(): ComponentDataOptionalId[] {
  return createProductsPagePresetContent();
}
