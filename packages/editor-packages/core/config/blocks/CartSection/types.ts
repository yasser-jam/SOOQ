import type { WithLayout } from "../../components/Layout";
import type { CartSectionResourceMetadata } from "../../cart/store-cart";

export type CartSectionProps = WithLayout<{
  layoutStyle: "rows" | "cards";
  gap: "sm" | "md" | "lg" | "xl";
  showDividerLines: boolean;
  orderButtonLabel: string;
  metadata?: CartSectionResourceMetadata | null;
}>;
