import * as z from "zod"

import { optionalString, requiredString } from "@/lib/schema"

// Backend accepts MANUAL | AUTOMATED — see SOOQ-Back PRD module.
// AUTOMATIC kept as a legacy alias to avoid breaking existing local data.
export const collectionTypeSchema = z.enum(["MANUAL", "AUTOMATED", "AUTOMATIC"])

export const productCollectionSchema = z.object({
	id: optionalString(),
	collectionName: requiredString("اسم المجموعة"),
	collectionSlug: requiredString("الاسم المختصر"),
	collectionType: collectionTypeSchema,
	descriptionAr: requiredString("الوصف بالعربية"),
	descriptionEn: requiredString("الوصف بالإنجليزية"),
	isActive: z.boolean(),
	createdAt: optionalString(),
	updatedAt: optionalString(),
})
