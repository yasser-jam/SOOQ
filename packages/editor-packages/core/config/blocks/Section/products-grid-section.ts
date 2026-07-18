import type { ComponentDataOptionalId } from "@/core/types";
import type { CollectionPickerRef } from "@/modules/product/collection/data-store";
import { createProductCardBlock } from "../../presets/products-grid";
import {
  SECTION_KIND_PRODUCTS_GRID,
  type SectionPresetMetadata,
} from "./section-preset-kinds";

export {
  PRODUCTS_GRID_SECTION_METADATA,
  SECTION_KIND_PRODUCTS_GRID,
  buildProductsGridSectionProps,
  type SectionPresetMetadata,
} from "./section-preset-kinds";

export type ProductsGridSectionProps = {
  /** @deprecated Prefer `metadata.preset === "products-grid"`. */
  sectionKind?: typeof SECTION_KIND_PRODUCTS_GRID | null;
  metadata?: SectionPresetMetadata | null;
  collection?: CollectionPickerRef | null;
};

export function isProductsGridSection(
  props: ProductsGridSectionProps
): boolean {
  if (props.metadata?.preset === SECTION_KIND_PRODUCTS_GRID) return true;
  return props.sectionKind === SECTION_KIND_PRODUCTS_GRID;
}

/**
 * Build the default card template. The template is a generic Group with
 * bound `valueContext` paths on its children — no `product` prop, so the
 * repeater's per-product BoundDataProvider drives what each rendered card
 * shows at runtime.
 */
export function buildDefaultProductCardTemplate(): ComponentDataOptionalId {
  return createProductCardBlock({
    product: null,
    metadata: null,
    skipProductDetailFetch: true,
  });
}

type TemplateGroupProps = Record<string, unknown> & {
  product?: unknown;
  metadata?: unknown;
  skipProductDetailFetch?: unknown;
};

function sanitizeTemplateProps(props: TemplateGroupProps): TemplateGroupProps {
  const { product: _p, metadata: _m, ...rest } = props;
  return {
    ...rest,
    product: null,
    metadata: null,
    skipProductDetailFetch: true,
  };
}

/**
 * Normalize a products-grid Section's `content` slot into the template shape:
 *
 * - Empty → seed with the default card template.
 * - Legacy multi-card content (from the old N-card materialization) → keep the
 *   first card, drop the rest.
 * - Any card carrying its own `product` binding → strip it so the template is
 *   product-agnostic and each rendered clone inherits from the repeater's
 *   BoundDataProvider.
 *
 * Returns the normalized array. Callers should compare by reference and skip
 * emission when nothing needed to change.
 */
export function ensureProductsGridTemplate(
  content: unknown
): ComponentDataOptionalId[] {
  if (!Array.isArray(content) || content.length === 0) {
    return [buildDefaultProductCardTemplate()];
  }

  const first = content[0] as ComponentDataOptionalId | undefined;
  if (!first || typeof first !== "object" || first.type !== "Group") {
    return [buildDefaultProductCardTemplate()];
  }

  return [
    {
      ...first,
      props: sanitizeTemplateProps(first.props as TemplateGroupProps),
    },
  ];
}

/**
 * True when the current `content` slot needs `ensureProductsGridTemplate` to run —
 * either because it's the legacy N-card shape or the surviving template still
 * carries a product-specific binding.
 */
export function productsGridContentNeedsResync(content: unknown): boolean {
  if (!Array.isArray(content)) return true;
  if (content.length !== 1) return true;

  const first = content[0] as ComponentDataOptionalId | undefined;
  if (!first || typeof first !== "object" || first.type !== "Group") {
    return true;
  }

  const props = (first.props ?? {}) as TemplateGroupProps;
  if (props.product != null) return true;
  if (props.metadata != null) return true;
  if (props.skipProductDetailFetch !== true) return true;
  return false;
}
