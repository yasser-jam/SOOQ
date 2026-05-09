import * as z from "zod";
import { productTagSchema } from "./schema";

export type ProductTag = z.infer<typeof productTagSchema>;

export type CreateProductTagInput = Pick<ProductTag, "tagName" | "slug">

export type UpdateProductTagInput = {
  id: string
  data: Pick<ProductTag, "tagName" | "slug">
}
