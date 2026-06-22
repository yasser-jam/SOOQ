import type { WithLayout } from "../../components/Layout";

export type CartSectionProps = WithLayout<{
  layoutStyle: "rows" | "cards";
  gap: "sm" | "md" | "lg" | "xl";
  showDividerLines: boolean;
}>;
