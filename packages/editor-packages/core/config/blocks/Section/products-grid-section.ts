import type { ComponentDataOptionalId } from "@/core/types";
import {
  fetchCollectionProductsBySlug,
  type CollectionPickerRef,
  type CollectionProductRef,
} from "@/modules/product/collection/data-store";
import {
  buildPublicProductResourceMetadata,
  buildProductResourceMetadata,
} from "@/modules/product/product/data-store";
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

export function buildProductGroupBlocksFromCollectionProducts(
  products: CollectionProductRef[]
): ComponentDataOptionalId[] {
  return products.map((product) =>
    createProductCardBlock({
      product: {
        id: product.id,
        titleAr: product.titleAr,
        titleEn: product.titleEn,
        slug: product.slug,
      },
      metadata: product.slug
        ? buildPublicProductResourceMetadata(product.slug, product.id)
        : buildProductResourceMetadata(product.id),
      skipProductDetailFetch: true,
    })
  );
}

export function productsGridContentNeedsResync(
  content: unknown
): boolean {
  if (!Array.isArray(content) || content.length === 0) return false;

  return content.some((item) => {
    if (!item || typeof item !== "object") return false;
    const record = item as { type?: string; props?: Record<string, unknown> };
    if (record.type !== "Group") return false;
    if (!record.props?.product) return false;
    return record.props.skipProductDetailFetch !== true;
  });
}

export async function resolveProductsGridSectionContent(
  collection: CollectionPickerRef | null | undefined
): Promise<{
  content: ComponentDataOptionalId[];
  columns: number;
  name?: string;
}> {
  if (!collection?.slug) {
    return { content: [], columns: 1 };
  }

  const products = await fetchCollectionProductsBySlug(collection.slug);
  const content = buildProductGroupBlocksFromCollectionProducts(products);
  const columns =
    content.length > 0 ? Math.min(Math.max(content.length, 1), 3) : 1;

  return {
    content,
    columns,
    name: collection.name,
  };
}
