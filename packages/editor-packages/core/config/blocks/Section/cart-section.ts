import type { ComponentDataOptionalId } from "@/core/types";
import { readStoreCart, type StoreCartLine } from "../../cart/store-cart";
import { createDemoCartLine } from "../../cart/map-cart-line-to-bound-data";
import { createCartItemGroup } from "../../presets/cart";
import {
  createHeading,
  createParagraph,
  createPrimaryButton,
} from "../../presets/shared";
import {
  SECTION_KIND_CART,
  type SectionPresetMetadata,
} from "./section-preset-kinds";

export {
  CART_SECTION_METADATA,
  SECTION_KIND_CART,
} from "./section-preset-kinds";

export type CartSectionProps = {
  /** @deprecated Prefer `metadata.preset === "shopping-cart"`. */
  sectionKind?: typeof SECTION_KIND_CART | null;
  metadata?: SectionPresetMetadata | null;
  /** Snapshot of slot content for live storefront cart rendering. */
  cartSlotItems?: ComponentDataOptionalId[] | null;
};

export function isCartSection(props: CartSectionProps): boolean {
  if (props.metadata?.preset === SECTION_KIND_CART) return true;
  return props.sectionKind === SECTION_KIND_CART;
}

function isCartLineGroup(item: ComponentDataOptionalId): boolean {
  return item.type === "Group" && Boolean(item.props?.cartLineId);
}

export function extractCartShellBlocks(
  content: ComponentDataOptionalId[]
): ComponentDataOptionalId[] {
  return content.filter((item) => !isCartLineGroup(item));
}

export function mergeCartShellWithLineGroups(
  shell: ComponentDataOptionalId[],
  lineGroups: ComponentDataOptionalId[]
): ComponentDataOptionalId[] {
  const buttonIdx = shell.findIndex(
    (item) =>
      item.type === "ContentButton" &&
      item.props?.buttonAction === "makeOrder"
  );
  const insertAt = buttonIdx >= 0 ? buttonIdx : shell.length;
  return [...shell.slice(0, insertAt), ...lineGroups, ...shell.slice(insertAt)];
}

export function buildCartItemGroupsFromLines(
  lines: StoreCartLine[]
): ComponentDataOptionalId[] {
  return lines.map((line) =>
    createCartItemGroup({
      id: `Group-cart-${line.lineId}`,
      cartLineId: line.lineId,
    })
  );
}

export function buildCartSectionShellContent(): ComponentDataOptionalId[] {
  return [
    createHeading("سلة التسوق", {
      textAlign: "right",
      fontSize: "theme-2xl",
    }),
    createParagraph("راجع المنتجات في سلتك وعدّل الكميات قبل إتمام الطلب.", {
      textAlign: "right",
      color: "theme-neutral",
      fontSize: "theme-sm",
    }),
    createPrimaryButton("إتمام الطلب", {
      align: "center",
      destinationType: "action",
      buttonAction: "makeOrder",
      id: "complete-order",
    }),
  ];
}

/**
 * Reads `store-cart` from localStorage and builds section content:
 * shell blocks + one Group preset per cart line.
 */
export function resolveCartSectionContent(
  existingContent?: ComponentDataOptionalId[] | null
): {
  content: ComponentDataOptionalId[];
  cartSlotItems: ComponentDataOptionalId[];
  columns: number;
} {
  const cart = readStoreCart();
  const shell =
    existingContent && existingContent.length > 0
      ? extractCartShellBlocks(existingContent)
      : buildCartSectionShellContent();

  const lines =
    cart.items.length > 0 ? cart.items : [createDemoCartLine()];

  const content = mergeCartShellWithLineGroups(
    shell,
    buildCartItemGroupsFromLines(lines)
  );

  return {
    content,
    cartSlotItems: content,
    columns: 1,
  };
}
