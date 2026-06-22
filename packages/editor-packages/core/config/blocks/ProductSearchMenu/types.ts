import type { WithLayout } from "../../components/Layout";

export type ProductSearchMenuProps = WithLayout<{
  buttonLabel: string;
  searchPlaceholder: string;
  menuHeading: string;
  /** Max cards to show (0 = unlimited). */
  maxResults: number;
}>;
