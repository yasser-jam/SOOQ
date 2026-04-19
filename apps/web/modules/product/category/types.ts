import * as z from "zod"

import { productCategorySchema } from "./schema"

export type ProductCategory = z.infer<typeof productCategorySchema>
