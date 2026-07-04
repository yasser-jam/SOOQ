import type { ComponentDataOptionalId } from "@/core/types";
import type { SectionPreset } from "./types";
import { STORE_CART_KEY } from "../cart/store-cart";
import {
  createHeading,
  createParagraph,
  createPrimaryButton,
  createSection,
} from "./shared";

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
                type: "CartQuantity",
                props: {
                  align: "right",
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

/** Sidebar / palette block: cart item preset as CartItem type. */
export function createCartItemBlock(
  overrides: Record<string, unknown> = {}
): ComponentDataOptionalId {
  return {
    type: "CartItem",
    props: {
      ...(createCartItemGroup().props as Record<string, unknown>),
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

export function createCartListBlock(
  overrides: Record<string, unknown> = {}
): ComponentDataOptionalId {
  return {
    type: "CartList",
    props: {
      gap: "md",
      showDividerLines: true,
      metadata: {
        dataSource: "localStorage",
        storageKey: STORE_CART_KEY,
      },
      layout: { padding: "0px" },
      ...overrides,
    },
  };
}

export function createCartSectionBlock(
  overrides: Record<string, unknown> = {}
): ComponentDataOptionalId {
  return {
    type: "CartSection",
    props: {
      layoutStyle: "rows",
      gap: "md",
      showDividerLines: true,
      orderButtonLabel: "إتمام الطلب",
      metadata: {
        dataSource: "localStorage",
        storageKey: STORE_CART_KEY,
      },
      layout: { padding: "0px" },
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
    content: [
      createHeading("سلة التسوق", {
        textAlign: "right",
        fontSize: "theme-2xl",
      }),
      createParagraph("راجع المنتجات في سلتك وعدّل الكميات قبل إتمام الطلب.", {
        textAlign: "right",
        color: "theme-neutral",
        fontSize: "theme-sm",
      }),
      createCartListBlock(),
      createPrimaryButton("إتمام الطلب", {
        align: "center",
        destinationType: "action",
        buttonAction: "makeOrder",
      }),
    ],
    ...overrides,
  });
}

export function createCartPageContent(): ComponentDataOptionalId[] {
  return [createCartSectionPreset({ id: "Section-cart" })];
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
    content: [createCartItemBlock()],
  }),
};

export const CART_PRESETS: SectionPreset[] = [cartSectionPreset, cartItemPreset];
