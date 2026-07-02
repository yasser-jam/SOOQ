import type { ComponentDataOptionalId } from "@/core/types";
import { STORE_CART_KEY } from "../cart/store-cart";
import { createHeading, createParagraph, createSection } from "./shared";

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
      createCartSectionBlock(),
    ],
    ...overrides,
  });
}

export function createCartPageContent(): ComponentDataOptionalId[] {
  return [createCartSectionPreset({ id: "Section-cart" })];
}
