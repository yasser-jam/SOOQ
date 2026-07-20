import type { ComponentDataOptionalId } from "@/core/types";
import { createProductCardBlock } from "../../presets/products-grid";
import {
  SECTION_KIND_PRODUCTS_PAGE,
  type SectionPresetMetadata,
} from "./section-preset-kinds";

export {
  PRODUCTS_PAGE_SECTION_METADATA,
  SECTION_KIND_PRODUCTS_PAGE,
  buildProductsPageSectionProps,
  type SectionPresetMetadata,
} from "./section-preset-kinds";

export type ProductsPageSectionProps = {
  /** @deprecated Prefer `metadata.preset === "products-page"`. */
  sectionKind?: typeof SECTION_KIND_PRODUCTS_PAGE | null;
  metadata?: SectionPresetMetadata | null;
};

export function isProductsPageSection(
  props: ProductsPageSectionProps
): boolean {
  if (props.metadata?.preset === SECTION_KIND_PRODUCTS_PAGE) return true;
  return props.sectionKind === SECTION_KIND_PRODUCTS_PAGE;
}

export function buildDefaultProductsPageCardTemplate(): ComponentDataOptionalId {
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

export function ensureProductsPageTemplate(
  content: unknown
): ComponentDataOptionalId[] {
  if (!Array.isArray(content) || content.length === 0) {
    return [buildDefaultProductsPageCardTemplate()];
  }

  const first = content[0] as ComponentDataOptionalId | undefined;
  if (!first || typeof first !== "object" || first.type !== "Group") {
    return [buildDefaultProductsPageCardTemplate()];
  }

  return [
    {
      ...first,
      props: sanitizeTemplateProps(first.props as TemplateGroupProps),
    },
  ];
}

export function productsPageContentNeedsResync(content: unknown): boolean {
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
