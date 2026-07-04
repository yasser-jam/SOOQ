export const SECTION_KIND_PRODUCTS_GRID = "products-grid" as const;

/** Persisted on Section.props.metadata — identifies a products-grid preset section. */
export type SectionPresetMetadata = {
  preset: typeof SECTION_KIND_PRODUCTS_GRID;
};

export const PRODUCTS_GRID_SECTION_METADATA: SectionPresetMetadata = {
  preset: SECTION_KIND_PRODUCTS_GRID,
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
