import * as z from "zod"

import { productOptionSchema, productSchema } from "./schema"

export type Product = z.infer<typeof productSchema>
export type ProductOption = z.infer<typeof productOptionSchema>
