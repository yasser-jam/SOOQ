import type { WithLayout } from "../../components/Layout";
import type { Slot } from "@/core/types";

export type RowGroupProps = WithLayout<{
  gap: number;
  alignItems: "flex-start" | "center" | "flex-end" | "stretch" | "baseline";
  justifyContent:
    | "flex-start"
    | "center"
    | "flex-end"
    | "space-between"
    | "space-around"
    | "space-evenly";
  wrap: "wrap" | "nowrap";
  backgroundColor?: string;
  padding?: string;
  borderRadius?: string;
  content: Slot;
}>;
