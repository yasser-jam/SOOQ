import type { ComponentDataOptionalId } from "@/core/types";
import { buildProductsGridSectionProps } from "../blocks/Section/section-preset-kinds";
import type { SectionPreset } from "./types";
import {
  createHeading,
  createInput,
  createParagraph,
  createPrimaryButton,
  createSection,
  createSwitch,
} from "./shared";

/**
 * Products-page filter controls. Every one of these is an ordinary, editable
 * block — merchants can restyle, reorder or delete them. What makes them
 * filters is the `inputAction` / `switchAction` binding into the shared
 * `productsPage` slice on StoreContext (see `config/store-context.tsx`);
 * the storefront turns that slice into `/public/products/search` query params.
 */

/** Debounced search box → `productsPage.search` (sent as `q`). */
export function createProductsSearchInput(
  overrides: Record<string, unknown> = {}
): ComponentDataOptionalId {
  return createInput("", "search", {
    inputType: "search",
    placeholder: "ابحث عن منتج…",
    prependIcon: "search",
    inputAction: "search_products",
    debounceMs: 250,
    ...overrides,
  });
}

/** Price + availability filters, laid out as one responsive row. */
export function createProductsFilterBar(
  overrides: Record<string, unknown> = {}
): ComponentDataOptionalId {
  return {
    type: "Group",
    props: {
      direction: "row",
      gap: 12,
      alignItems: "flex-end",
      justifyContent: "flex-start",
      wrap: "wrap",
      product: null,
      metadata: null,
      skipProductDetailFetch: true,
      language: "ar",
      padding: "0px",
      content: [
        createInput("أقل سعر", "min-price", {
          inputType: "number",
          placeholder: "0",
          inputAction: "filter_min_price",
          debounceMs: 350,
          layout: { grow: true },
        }),
        createInput("أعلى سعر", "max-price", {
          inputType: "number",
          placeholder: "بدون حد",
          inputAction: "filter_max_price",
          debounceMs: 350,
          layout: { grow: true },
        }),
        createSwitch("المتوفر فقط", "in-stock-only", {
          switchAction: "filter_in_stock_only",
          labelPosition: "start",
        }),
      ],
      ...overrides,
    },
  };
}

export function createProductCardGroup(
  overrides: Record<string, unknown> = {}
): ComponentDataOptionalId {
  return {
    type: "Group",
    props: {
      direction: "column",
      gap: 12,
      alignItems: "stretch",
      justifyContent: "flex-start",
      wrap: "nowrap",
      product: null,
      metadata: null,
      skipProductDetailFetch: false,
      language: "ar",
      backgroundColor: "theme-surface",
      padding: "16px",
      borderRadius: "theme-md",
      boxShadow: "sm",
      content: [
        {
          type: "ContentImage",
          props: {
            src: "https://placehold.co/400x400/e2e8f0/64748b?text=Product",
            alt: "",
            altValueContext: { path: "product.title" },
            valueContext: { path: "images[0].url" },
            align: "center",
            objectFit: "cover",
            radius: "theme-md",
            maxWidth: "100%",
          },
        },
        {
          type: "Chip",
          props: {
            chipVariantMode: "theme",
            chipVariant: "neutral",
            shape: "pill",
            size: "sm",
            gap: 6,
            maxItems: 5,
            listValueContext: { path: "product.tags" },
          },
        },
        createHeading("عنوان المنتج", {
          valueContext: { path: "product.title" },
          fontSize: "theme-lg",
          fontWeight: "theme-semibold",
          textAlign: "right",
        }),
        createParagraph("وصف المنتج", {
          valueContext: { path: "product.description" },
          fontSize: "theme-sm",
          color: "theme-neutral",
          textAlign: "right",
        }),
        createParagraph("0.00 SYP", {
          valueContext: { path: "pricing.displayPrice" },
          fontSize: "theme-md",
          fontWeight: "theme-semibold",
          textAlign: "right",
        }),
        createPrimaryButton("إضافة إلى السلة", {
          destinationType: "action",
          buttonAction: "addToCart",
        }),
        createPrimaryButton("عرض التفاصيل", {
          buttonVariant: "secondary",
          destinationType: "link",
          link: {
            kind: "page",
            pageId: "/products/:product-slug",
            dynamicSegment: {
              param: "product-slug",
              valueContext: "product.slug",
            },
          },
        }),
      ],
      ...overrides,
    },
  };
}

/** Product card preset — a bound Group with image, title, price, and actions. */
export function createProductCardBlock(
  overrides: Record<string, unknown> = {}
): ComponentDataOptionalId {
  return {
    type: "Group",
    props: {
      ...(createProductCardGroup().props as Record<string, unknown>),
      layout: {
        grow: true,
        spanCol: 1,
        spanRow: 1,
        padding: "0px",
      },
      ...overrides,
    },
  };
}

/** Storefront product card — no add-to-cart; full-width details CTA. */
export function createStorefrontProductCardBlock(
  overrides: Record<string, unknown> = {}
): ComponentDataOptionalId {
  return createProductCardBlock({
    direction: "column",
    gap: 14,
    alignItems: "stretch",
    backgroundColor: "theme-surface",
    padding: "18px",
    borderRadius: "theme-lg",
    boxShadow: "md",
    content: [
      {
        type: "ContentImage",
        props: {
          src: "https://placehold.co/400x400/e2e8f0/64748b?text=Product",
          alt: "",
          altValueContext: { path: "product.title" },
          valueContext: { path: "images[0].url" },
          align: "center",
          objectFit: "cover",
          radius: "theme-lg",
          maxWidth: "100%",
        },
      },
      createHeading("عنوان المنتج", {
        valueContext: { path: "product.title" },
        fontSize: "theme-md",
        fontWeight: "theme-semibold",
        textAlign: "right",
      }),
      createParagraph("0.00 SYP", {
        valueContext: { path: "pricing.displayPrice" },
        fontSize: "theme-lg",
        fontWeight: "theme-bold",
        color: "theme-primary",
        textAlign: "right",
      }),
      createPrimaryButton("عرض التفاصيل", {
        destinationType: "link",
        buttonVariant: "primary",
        fullWidth: true,
        link: {
          kind: "page",
          pageId: "/products/:product-slug",
          dynamicSegment: {
            param: "product-slug",
            valueContext: "product.slug",
          },
        },
      }),
    ],
    ...overrides,
  });
}

export function createProductsGridSection(
  overrides: Record<string, unknown> = {}
): ComponentDataOptionalId {
  return createSection(
    buildProductsGridSectionProps({
      name: "Products grid",
      columns: 1,
      columnsMobile: 1,
      gridGap: "24px",
      paddingTop: "48px",
      paddingBottom: "48px",
      ...overrides,
    })
  );
}

export function createDemoProductCard(
  id: string,
  product?: { id: string; titleAr?: string; titleEn?: string } | null
): ComponentDataOptionalId {
  const block = createProductCardBlock({
    product: product ?? null,
  });

  return {
    type: "Group",
    props: {
      ...(block.props as Record<string, unknown>),
      id,
    },
  };
}

export function createProductDetailSection(
  overrides: Record<string, unknown> = {}
): ComponentDataOptionalId {
  return createSection({
    name: "Product details",
    columns: 1,
    columnsMobile: 1,
    content: [
      {
        type: "Group",
        props: {
          direction: "row",
          gap: 48,
          alignItems: "flex-start",
          justifyContent: "flex-start",
          wrap: "wrap",
          product: null,
          metadata: null,
          language: "ar",
          content: [
            {
              type: "Group",
              props: {
                direction: "column",
                gap: 0,
                alignItems: "stretch",
                justifyContent: "flex-start",
                wrap: "nowrap",
                layout: { grow: true },
                content: [
                  {
                    type: "ContentImage",
                    props: {
                      src: "https://placehold.co/600x600/e2e8f0/64748b?text=Product",
                      alt: { ar: "", en: "" },
                      align: "center",
                      objectFit: "cover",
                      radius: "theme-md",
                      maxWidth: "100%",
                      altValueContext: { path: "product.title" },
                      valueContext: { path: "images[0].url" },
                    },
                  },
                ],
              },
            },
            {
              type: "Group",
              props: {
                direction: "column",
                gap: 16,
                alignItems: "flex-start",
                justifyContent: "flex-start",
                wrap: "nowrap",
                layout: { grow: true },
                content: [
                  createHeading("عنوان المنتج", {
                    valueContext: { path: "product.title" },
                    fontSize: "theme-2xl",
                    fontWeight: "theme-bold",
                    textAlign: "right",
                  }),
                  createParagraph("وصف المنتج", {
                    valueContext: { path: "product.description" },
                    fontSize: "theme-md",
                    color: "theme-neutral",
                    textAlign: "right",
                  }),
                  createParagraph("0.00 SYP", {
                    valueContext: { path: "pricing.displayPrice" },
                    fontSize: "theme-lg",
                    fontWeight: "theme-bold",
                    textAlign: "right",
                  }),
                  createParagraph("", {
                    valueContext: { path: "pricing.displayCompareAt" },
                    fontSize: "theme-md",
                    color: "theme-neutral",
                    textAlign: "right",
                  }),
                  {
                    type: "Chip",
                    props: {
                      chipVariantMode: "theme",
                      chipVariant: "primary",
                      shape: "pill",
                      size: "sm",
                      gap: 8,
                      maxItems: 20,
                      listValueContext: { path: "product.tags" },
                    },
                  },
                  {
                    type: "Chip",
                    props: {
                      chipVariantMode: "theme",
                      chipVariant: "secondary",
                      shape: "rounded",
                      size: "sm",
                      gap: 8,
                      maxItems: 20,
                      listValueContext: { path: "product.categories" },
                    },
                  },
                  createParagraph("", {
                    valueContext: { path: "product.attributesDisplay" },
                    fontSize: "theme-sm",
                    color: "theme-neutral",
                    textAlign: "right",
                  }),
                  createPrimaryButton("إضافة إلى السلة", {
                    destinationType: "action",
                    buttonAction: "addToCart",
                  }),
                ],
              },
            },
          ],
          ...overrides,
        },
      },
    ],
  });
}

const productCardVertical: SectionPreset = {
  id: "product-card-vertical",
  category: "products-grid",
  title: "بطاقة منتج",
  previewImage:
    "https://placehold.co/400x520/e2e8f0/64748b?text=Product+Card",
  componentData: createSection({
    name: "Product card",
    columns: 1,
    columnsMobile: 1,
    gridGap: "24px",
    paddingTop: "0px",
    paddingBottom: "0px",
    content: [createProductCardBlock()],
  }),
};

const productsGridThreeColumns: SectionPreset = {
  id: "products-grid-three-columns",
  category: "products-grid",
  title: "شبكة منتجات",
  previewImage:
    "https://placehold.co/800x400/e2e8f0/64748b?text=Products+Grid",
  componentData: createProductsGridSection(),
};

const productDetailLayout: SectionPreset = {
  id: "product-detail-layout",
  category: "products-grid",
  title: "تفاصيل المنتج",
  previewImage:
    "https://placehold.co/800x500/e2e8f0/64748b?text=Product+Details",
  componentData: createProductDetailSection(),
};

export const PRODUCTS_GRID_PRESETS: SectionPreset[] = [
  productCardVertical,
  productsGridThreeColumns,
  productDetailLayout,
];
