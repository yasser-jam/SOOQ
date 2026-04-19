import * as z from "zod"

import { productCollectionSchema } from "./schema"

export type ProductCollection = z.infer<typeof productCollectionSchema>
