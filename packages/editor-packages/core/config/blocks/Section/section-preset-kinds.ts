export const SECTION_KIND_PRODUCTS_GRID = "products-grid" as const;
export const SECTION_KIND_CART = "shopping-cart" as const;
export const SECTION_KIND_ZONE_HEADER = "zone-header" as const;

/** Persisted on Section.props.metadata — identifies a preset-driven section. */
export type SectionPresetMetadata = {
  preset:
    | typeof SECTION_KIND_PRODUCTS_GRID
    | typeof SECTION_KIND_CART
    | typeof SECTION_KIND_ZONE_HEADER;
};

export const PRODUCTS_GRID_SECTION_METADATA: SectionPresetMetadata = {
  preset: SECTION_KIND_PRODUCTS_GRID,
};

export const CART_SECTION_METADATA: SectionPresetMetadata = {
  preset: SECTION_KIND_CART,
};

/** Base props for a Section that loads product cards after collection selection. */
export function buildProductsGridSectionProps(
  overrides: Record<string, unknown> = {}
): Record<string, unknown> {
  return {
    collection: null,
    sectionKind: SECTION_KIND_PRODUCTS_GRID,
    metadata: PRODUCTS_GRID_SECTION_METADATA,
    content: [],
    ...overrides,
  };
}

/** Base props for a Section that renders cart rows from localStorage (`store-cart`). */
export function buildCartSectionProps(
  overrides: Record<string, unknown> = {}
): Record<string, unknown> {
  return {
    sectionKind: SECTION_KIND_CART,
    metadata: CART_SECTION_METADATA,
    content: [],
    ...overrides,
  };
}
