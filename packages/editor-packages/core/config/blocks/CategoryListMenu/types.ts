import type { WithLayout } from "../../components/Layout";

export type CategoryListMenuProps = WithLayout<{
  buttonLabel: string;
  categoriesMenuTitle: string;
  /** Label for the control that returns to the category list */
  backLabel: string;
  /** Cap products shown per category (0 = all). */
  maxProducts: number;
}>;
