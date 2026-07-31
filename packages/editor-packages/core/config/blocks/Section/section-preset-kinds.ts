export const SECTION_KIND_PRODUCTS_GRID = "products-grid" as const;
export const SECTION_KIND_PRODUCTS_PAGE = "products-page" as const;
export const SECTION_KIND_CART = "shopping-cart" as const;
export const SECTION_KIND_ZONE_HEADER = "zone-header" as const;
export const SECTION_KIND_CUSTOMER_ACCOUNT = "customer-account" as const;
export const SECTION_KIND_CUSTOMER_ADDRESSES = "customer-addresses" as const;

/** Persisted on Section.props.metadata — identifies a preset-driven section. */
export type SectionPresetMetadata = {
  preset:
    | typeof SECTION_KIND_PRODUCTS_GRID
    | typeof SECTION_KIND_PRODUCTS_PAGE
    | typeof SECTION_KIND_CART
    | typeof SECTION_KIND_ZONE_HEADER
    | typeof SECTION_KIND_CUSTOMER_ACCOUNT
    | typeof SECTION_KIND_CUSTOMER_ADDRESSES;
};

export const PRODUCTS_GRID_SECTION_METADATA: SectionPresetMetadata = {
  preset: SECTION_KIND_PRODUCTS_GRID,
};

export const PRODUCTS_PAGE_SECTION_METADATA: SectionPresetMetadata = {
  preset: SECTION_KIND_PRODUCTS_PAGE,
};

export const CART_SECTION_METADATA: SectionPresetMetadata = {
  preset: SECTION_KIND_CART,
};

export const CUSTOMER_ACCOUNT_SECTION_METADATA: SectionPresetMetadata = {
  preset: SECTION_KIND_CUSTOMER_ACCOUNT,
};

export const CUSTOMER_ADDRESSES_SECTION_METADATA: SectionPresetMetadata = {
  preset: SECTION_KIND_CUSTOMER_ADDRESSES,
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

/** Base props for a Section driven by the shared productsPage store slice. */
export function buildProductsPageSectionProps(
  overrides: Record<string, unknown> = {}
): Record<string, unknown> {
  return {
    sectionKind: SECTION_KIND_PRODUCTS_PAGE,
    metadata: PRODUCTS_PAGE_SECTION_METADATA,
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

/** Base props for a Section that binds profile + preferences to child blocks. */
export function buildCustomerAccountSectionProps(
  overrides: Record<string, unknown> = {}
): Record<string, unknown> {
  return {
    sectionKind: SECTION_KIND_CUSTOMER_ACCOUNT,
    metadata: CUSTOMER_ACCOUNT_SECTION_METADATA,
    content: [],
    ...overrides,
  };
}

/** Base props for a Section that repeats its template per saved address. */
export function buildCustomerAddressesSectionProps(
  overrides: Record<string, unknown> = {}
): Record<string, unknown> {
  return {
    sectionKind: SECTION_KIND_CUSTOMER_ADDRESSES,
    metadata: CUSTOMER_ADDRESSES_SECTION_METADATA,
    content: [],
    ...overrides,
  };
}
