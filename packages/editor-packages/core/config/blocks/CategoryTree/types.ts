import type { WithLayout } from "../../components/Layout";

export type CategoryTreeProps = WithLayout<{
  textColor: string;
  activeColor: string;
  fontSize: string;
  gap: number;
  /** Extra right-indent (px) added per nesting depth level. */
  indentStep: number;
  showProductCount: boolean;
}>;
