import {
  SECTION_KIND_CHECKOUT,
  SECTION_KIND_CUSTOMER_ADDRESSES,
  SECTION_KIND_CUSTOMER_ACCOUNT,
  SECTION_KIND_CUSTOMER_ORDERS,
  SECTION_KIND_CUSTOMER_ORDERS_PAGER,
  SECTION_KIND_CUSTOMER_ORDER_DETAIL,
  SECTION_KIND_CUSTOMER_ORDER_ITEMS,
  SECTION_KIND_CUSTOMER_ORDER_TIMELINE,
  type SectionPresetMetadata,
} from "./section-preset-kinds";

export {
  CHECKOUT_SECTION_METADATA,
  SECTION_KIND_CHECKOUT,
  buildCheckoutSectionProps,
  CUSTOMER_ACCOUNT_SECTION_METADATA,
  CUSTOMER_ADDRESSES_SECTION_METADATA,
  CUSTOMER_ORDERS_SECTION_METADATA,
  CUSTOMER_ORDERS_PAGER_SECTION_METADATA,
  CUSTOMER_ORDER_DETAIL_SECTION_METADATA,
  CUSTOMER_ORDER_ITEMS_SECTION_METADATA,
  CUSTOMER_ORDER_TIMELINE_SECTION_METADATA,
  SECTION_KIND_CUSTOMER_ACCOUNT,
  SECTION_KIND_CUSTOMER_ADDRESSES,
  SECTION_KIND_CUSTOMER_ORDERS,
  SECTION_KIND_CUSTOMER_ORDERS_PAGER,
  SECTION_KIND_CUSTOMER_ORDER_DETAIL,
  SECTION_KIND_CUSTOMER_ORDER_ITEMS,
  SECTION_KIND_CUSTOMER_ORDER_TIMELINE,
  buildCustomerAccountSectionProps,
  buildCustomerAddressesSectionProps,
  buildCustomerOrdersSectionProps,
  buildCustomerOrdersPagerSectionProps,
  buildCustomerOrderDetailSectionProps,
  buildCustomerOrderItemsSectionProps,
  buildCustomerOrderTimelineSectionProps,
  type SectionPresetMetadata,
} from "./section-preset-kinds";

export type CustomerSectionProps = {
  sectionKind?: string | null;
  metadata?: SectionPresetMetadata | null;
};

function matchesPreset(
  props: CustomerSectionProps,
  preset: string,
  legacyKind?: string
): boolean {
  if (props.metadata?.preset === preset) return true;
  return props.sectionKind === legacyKind;
}

export function isCustomerAccountSection(props: CustomerSectionProps): boolean {
  return matchesPreset(props, SECTION_KIND_CUSTOMER_ACCOUNT, SECTION_KIND_CUSTOMER_ACCOUNT);
}

export function isCustomerAddressesSection(props: CustomerSectionProps): boolean {
  return matchesPreset(
    props,
    SECTION_KIND_CUSTOMER_ADDRESSES,
    SECTION_KIND_CUSTOMER_ADDRESSES
  );
}

export function isCustomerOrdersSection(props: CustomerSectionProps): boolean {
  return matchesPreset(props, SECTION_KIND_CUSTOMER_ORDERS, SECTION_KIND_CUSTOMER_ORDERS);
}

export function isCustomerOrdersPagerSection(
  props: CustomerSectionProps
): boolean {
  return matchesPreset(
    props,
    SECTION_KIND_CUSTOMER_ORDERS_PAGER,
    SECTION_KIND_CUSTOMER_ORDERS_PAGER
  );
}

export function isCustomerOrderDetailSection(
  props: CustomerSectionProps
): boolean {
  return matchesPreset(
    props,
    SECTION_KIND_CUSTOMER_ORDER_DETAIL,
    SECTION_KIND_CUSTOMER_ORDER_DETAIL
  );
}

export function isCustomerOrderItemsSection(
  props: CustomerSectionProps
): boolean {
  return matchesPreset(
    props,
    SECTION_KIND_CUSTOMER_ORDER_ITEMS,
    SECTION_KIND_CUSTOMER_ORDER_ITEMS
  );
}

export function isCustomerOrderTimelineSection(
  props: CustomerSectionProps
): boolean {
  return matchesPreset(
    props,
    SECTION_KIND_CUSTOMER_ORDER_TIMELINE,
    SECTION_KIND_CUSTOMER_ORDER_TIMELINE
  );
}

export function isCheckoutSection(props: CustomerSectionProps): boolean {
  return matchesPreset(props, SECTION_KIND_CHECKOUT, SECTION_KIND_CHECKOUT);
}

export function isStoreListSection(props: CustomerSectionProps): boolean {
  return (
    isCustomerAddressesSection(props) ||
    isCustomerOrdersSection(props) ||
    isCustomerOrderItemsSection(props) ||
    isCustomerOrderTimelineSection(props)
  );
}
