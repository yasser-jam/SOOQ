import type { ComponentDataOptionalId } from "@/core/types";
import type { SectionPreset } from "./types";
import {
  createHeading,
  createParagraph,
  createPrimaryButton,
  createSection,
} from "./shared";

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

/** Sidebar / palette block: product card preset as ProductCard type. */
export function createProductCardBlock(
  overrides: Record<string, unknown> = {}
): ComponentDataOptionalId {
  return {
    type: "ProductCard",
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

export function createProductsGridPlaceholderContent(count = 3) {
  return Array.from({ length: count }, () => createProductCardBlock());
}

export function createProductsGridBlock(
  overrides: Record<string, unknown> = {}
): ComponentDataOptionalId {
  return {
    type: "ProductsGrid",
    props: {
      collection: null,
      metadata: null,
      columns: "3",
      maxRows: "0",
      gap: "md",
      layout: { padding: "0px" },
      ...overrides,
    },
  };
}

export function createProductsGridSection(
  cardCount = 3,
  overrides: Record<string, unknown> = {}
): ComponentDataOptionalId {
  return createSection({
    name: "Products grid",
    columns: cardCount,
    columnsMobile: 1,
    gridGap: "24px",
    paddingTop: "48px",
    paddingBottom: "48px",
    content: Array.from({ length: cardCount }, () => createProductCardBlock()),
    ...overrides,
  });
}

export function createDemoProductCard(
  id: string,
  product?: { id: string; titleAr?: string; titleEn?: string } | null
): ComponentDataOptionalId {
  const block = createProductCardBlock({
    product: product ?? null,
  });

  return {
    type: "ProductCard",
    props: {
      ...(block.props as Record<string, unknown>),
      id,
    },
  };
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
  componentData: createProductsGridSection(3),
};

export const PRODUCTS_GRID_PRESETS: SectionPreset[] = [
  productCardVertical,
  productsGridThreeColumns,
];
