import * as z from "zod"

import { optionalString, requiredString } from "@/lib/schema"

export const productStatusSchema = z.enum(["DRAFT", "ACTIVE", "ARCHIVED"])

export const productOptionValueSchema = z.object({
	valueAr: requiredString("قيمة الخيار بالعربية"),
	valueEn: requiredString("قيمة الخيار بالإنجليزية"),
	colorHex: optionalString(),
	sortOrder: z.number().int().min(0),
})

export const productOptionSchema = z.object({
	optionNameAr: requiredString("اسم الخيار بالعربية"),
	optionNameEn: requiredString("اسم الخيار بالإنجليزية"),
	sortOrder: z.number().int().min(0),
	values: z.array(productOptionValueSchema).min(1, "يجب إضافة قيمة واحدة على الأقل"),
})

export const productSchema = z.object({
	id: optionalString(),
	titleAr: requiredString("العنوان بالعربية"),
	titleEn: requiredString("العنوان بالإنجليزية"),
	descriptionAr: requiredString("الوصف بالعربية"),
	descriptionEn: requiredString("الوصف بالإنجليزية"),
	slug: requiredString("الرابط"),
	basePrice: z.coerce.number().min(0, "السعر الأساسي يجب أن يكون أكبر أو يساوي 0"),
	compareAtPrice: z.coerce
		.number()
		.min(0, "سعر المقارنة يجب أن يكون أكبر أو يساوي 0"),
	currencyCode: requiredString("العملة"),
	status: productStatusSchema,
	seoTitle: requiredString("عنوان SEO"),
	seoDescription: requiredString("وصف SEO"),
	allowOversell: z.boolean(),
	defaultCategoryId: optionalString(),
	categoryIds: z.array(z.string().trim()).min(1, "اختر فئة واحدة على الأقل"),
	tagIds: z.array(z.string().trim()),
	mediaAssetIds: z.array(z.string().trim()).nullable().default(null),
	mediaFiles: z.array(z.instanceof(File)).default([]),
	mediaUrls: z.array(z.string().trim()).default([]),
	options: z.array(productOptionSchema).default([]),
	// EAV custom attribute values — see modules/product/attribute/types.ts
	attributes: z
		.array(
			z.object({
				attributeDefId: z.string(),
				valueText: z.string().optional(),
				attributeOptionIds: z.array(z.string()).optional(),
			})
		)
		.default([]),
	createdAt: optionalString(),
	updatedAt: optionalString(),
})

export const variantOptionSchema = z.object({
  optionNameAr: z.string().trim().min(1, "اسم الخيار بالعربية مطلوب"),
  optionNameEn: z.string().trim().min(1, "اسم الخيار بالإنجليزية مطلوب"),
  values: z
	.array(
	  z.object({
		valueAr: z.string().trim().min(1, "قيمة الخيار بالعربية مطلوبة"),
		valueEn: z.string().trim().min(1, "قيمة الخيار بالإنجليزية مطلوبة"),
	  })
	)
	.min(1, "أضف قيمة واحدة على الأقل"),
})