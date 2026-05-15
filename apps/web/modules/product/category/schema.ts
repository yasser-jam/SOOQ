import * as z from "zod"

import { optionalString, requiredString } from "@/lib/schema"

export const productCategorySchema = z.object({
	id: optionalString(),
	categoryId: optionalString(),
	nameAr: requiredString("الاسم بالعربية"),
	nameEn: requiredString("الاسم بالإنجليزية"),
	slug: requiredString("الاسم المختصر"),
	descriptionAr: requiredString("الوصف بالعربية"),
	descriptionEn: requiredString("الوصف بالإنجليزية"),
	parentCategoryId: z.string().trim().nullable().optional(),
	sortOrder: z.coerce.number().int().min(0, "الترتيب مطلوب"),
	isActive: z.boolean(),
	// Phase 5 (PRD): optional starter template key for attribute seeding.
	// Backend validates the value and returns 400 with available keys on
	// mismatch — Zod doesn't need to enumerate them.
	templateKey: z.string().optional(),
	createdAt: optionalString(),
	updatedAt: optionalString(),
	children: z.array(z.any()).optional()
})