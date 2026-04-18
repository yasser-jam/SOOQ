import * as z from "zod";
import { productTagSchema } from "./schema";

export type ProductTag = z.infer<typeof productTagSchema>;