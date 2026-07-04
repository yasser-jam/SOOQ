import type { WithLayout } from "../../components/Layout";
import type { CartSectionResourceMetadata } from "../../cart/store-cart";

export type CartListProps = WithLayout<{
  gap: "sm" | "md" | "lg" | "xl";
  showDividerLines: boolean;
  metadata?: CartSectionResourceMetadata | null;
}>;
