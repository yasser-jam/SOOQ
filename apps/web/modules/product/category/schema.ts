import * as z from "zod"

import { optionalString, requiredString } from "@/lib/schema"

export const productCategorySchema = z.object({
	id: optionalString(),
	nameAr: requiredString("الاسم بالعربية"),
	nameEn: requiredString("الاسم بالإنجليزية"),
	slug: requiredString("الاسم المختصر"),
	descriptionAr: requiredString("الوصف بالعربية"),
	descriptionEn: requiredString("الوصف بالإنجليزية"),
	parentCategoryId: z.string().trim().nullable().optional(),
	sortOrder: z.coerce.number().int().min(0, "الترتيب مطلوب"),
	isActive: z.boolean(),
	createdAt: optionalString(),
	updatedAt: optionalString(),
	children: z.array(z.any()).optional()
})