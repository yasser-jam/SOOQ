import type { ComponentDataOptionalId } from "@/core/types";
import type { SectionPreset } from "./types";
import { buildCartSectionProps } from "../blocks/Section/section-preset-kinds";
import {
  buildCartSectionShellContent,
  resolveCartSectionContent,
} from "../blocks/Section/cart-section";
import { createHeading, createParagraph, createPrimaryButton, createSection } from "./shared";

function createCartQtyButton(
  label: string,
  buttonAction: "cartQtyDecrease" | "cartQtyIncrease"
) {
  return createPrimaryButton(label, {
    align: "center",
    destinationType: "action",
    buttonAction,
    buttonVariantMode: "fixed",
    buttonVariant: "secondary",
    buttonVariantSize: "sm",
    radius: "theme-md",
    bgColor: "theme-surface",
    textColor: "theme-text",
    buttonSize: "theme-sm",
  });
}

const nestedGroupDefaults = {
  backgroundColor: "",
  backgroundImage: "",
  backgroundOverlayColor: "",
  padding: "0px",
  borderRadius: "theme-none",
  boxShadow: "none",
  product: null,
  metadata: null,
  cartLineId: null,
};

/** Cart row preset — a Group with image, title, price, and quantity controls. */
export function createCartItemGroup(
  overrides: Record<string, unknown> = {}
): ComponentDataOptionalId {
  return {
    type: "Group",
    props: {
      direction: "row",
      gap: 16,
      alignItems: "flex-start",
      justifyContent: "flex-start",
      wrap: "nowrap",
      language: "ar",
      cartLineId: null,
      backgroundColor: "",
      padding: "12px 0",
      borderRadius: "theme-none",
      boxShadow: "",
      content: [
        {
          type: "ContentImage",
          props: {
            src: "https://placehold.co/144x144/e2e8f0/64748b?text=Product",
            alt: "",
            altValueContext: { path: "product.title" },
            valueContext: { path: "images[0].url" },
            align: "center",
            objectFit: "cover",
            radius: "theme-md",
            maxWidth: "72px",
          },
        },
        {
          type: "Group",
          props: {
            ...nestedGroupDefaults,
            direction: "column",
            gap: 8,
            alignItems: "stretch",
            justifyContent: "flex-start",
            wrap: "nowrap",
            language: "ar",
            layout: { grow: true },
            content: [
              createHeading("عنوان المنتج", {
                valueContext: { path: "product.title" },
                fontSize: "theme-md",
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
              {
                type: "Group",
                props: {
                  ...nestedGroupDefaults,
                  direction: "row",
                  gap: 8,
                  alignItems: "center",
                  justifyContent: "flex-end",
                  wrap: "nowrap",
                  language: "ar",
                  content: [
                    createCartQtyButton("−", "cartQtyDecrease"),
                    createParagraph("1", {
                      valueContext: { path: "quantity" },
                      textAlign: "center",
                      fontSize: "theme-md",
                      fontWeight: "theme-semibold",
                    }),
                    createCartQtyButton("+", "cartQtyIncrease"),
                  ],
                },
              },
            ],
          },
        },
      ],
      ...overrides,
    },
  };
}

export function createCartSectionPreset(
  overrides: Record<string, unknown> = {}
): ComponentDataOptionalId {
  return createSection({
    name: "سلة التسوق",
    maxWidth: "900px",
    paddingTop: "48px",
    paddingBottom: "48px",
    paddingHorizontal: "24px",
    columns: 1,
    ...buildCartSectionProps(),
    ...overrides,
  });
}

export function createCartPageContent(): ComponentDataOptionalId[] {
  const resolved = resolveCartSectionContent(buildCartSectionShellContent());

  return [
    createSection({
      id: "Section-cart",
      name: "سلة التسوق",
      maxWidth: "900px",
      paddingTop: "48px",
      paddingBottom: "48px",
      paddingHorizontal: "24px",
      columns: 1,
      ...buildCartSectionProps(),
      content: resolved.content,
      cartSlotItems: resolved.cartSlotItems,
    }),
  ];
}

const cartSectionPreset: SectionPreset = {
  id: "cart-section",
  category: "cart",
  title: "سلة التسوق",
  previewImage:
    "https://placehold.co/800x480/f8fafc/64748b?text=Cart+Section",
  componentData: createCartSectionPreset(),
};

const cartItemPreset: SectionPreset = {
  id: "cart-item-row",
  category: "cart",
  title: "عنصر السلة",
  previewImage:
    "https://placehold.co/640x160/f8fafc/64748b?text=Cart+Item",
  componentData: createSection({
    name: "Cart item",
    columns: 1,
    columnsMobile: 1,
    paddingTop: "0px",
    paddingBottom: "0px",
    content: [createCartItemGroup()],
  }),
};

export const CART_PRESETS: SectionPreset[] = [cartSectionPreset, cartItemPreset];
