import {
  SECTION_KIND_CUSTOMER_ACCOUNT,
  SECTION_KIND_CUSTOMER_ADDRESSES,
  type SectionPresetMetadata,
} from "./section-preset-kinds";

export {
  CUSTOMER_ACCOUNT_SECTION_METADATA,
  CUSTOMER_ADDRESSES_SECTION_METADATA,
  SECTION_KIND_CUSTOMER_ACCOUNT,
  SECTION_KIND_CUSTOMER_ADDRESSES,
  buildCustomerAccountSectionProps,
  buildCustomerAddressesSectionProps,
  type SectionPresetMetadata,
} from "./section-preset-kinds";

export type CustomerAccountSectionProps = {
  /** @deprecated Prefer `metadata.preset === "customer-account"`. */
  sectionKind?:
    | typeof SECTION_KIND_CUSTOMER_ACCOUNT
    | typeof SECTION_KIND_CUSTOMER_ADDRESSES
    | null;
  metadata?: SectionPresetMetadata | null;
};

export function isCustomerAccountSection(
  props: CustomerAccountSectionProps
): boolean {
  if (props.metadata?.preset === SECTION_KIND_CUSTOMER_ACCOUNT) return true;
  return props.sectionKind === SECTION_KIND_CUSTOMER_ACCOUNT;
}

export function isCustomerAddressesSection(
  props: CustomerAccountSectionProps
): boolean {
  if (props.metadata?.preset === SECTION_KIND_CUSTOMER_ADDRESSES) return true;
  return props.sectionKind === SECTION_KIND_CUSTOMER_ADDRESSES;
}
