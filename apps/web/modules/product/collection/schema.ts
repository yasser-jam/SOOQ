import * as z from "zod"

import { optionalString, requiredString } from "@/lib/schema"

export const collectionTypeSchema = z.enum(["MANUAL", "AUTOMATIC"])

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
