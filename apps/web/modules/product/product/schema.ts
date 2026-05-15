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

// Phase 1: tags/categories carry mixed `{id}` + `{name}` refs. Each entry
// must have either an id or a name (validated via refine to keep the row
// rejected cleanly when both are missing).
export const tagRefSchema = z
	.object({
		id: z.string().trim().optional(),
		name: z.string().trim().optional(),
	})
	.refine((v) => !!(v.id || v.name), {
		message: "tag ref requires id or name",
	})

export const categoryRefSchema = z
	.object({
		id: z.string().trim().optional(),
		nameAr: z.string().trim().optional(),
		nameEn: z.string().trim().optional(),
	})
	.refine((v) => !!(v.id || v.nameAr), {
		message: "category ref requires id or nameAr",
	})

// Phase 2 (PRD): inline variant entry sent to POST/PUT /admin/products.
// Backend derives option axes from the union of `attributes` keys across all
// variants. SOOQ-Front uses `optionNameAr` (with EN fallback) as the axis key
// and `valueAr` as the value label.
//
// `variantId` is a transient client-side field (used to wire the inventory
// adjust modal to a saved row); not sent on the wire — see [[buildProductFormData]].
export const variantRequestSchema = z.object({
	attributes: z.record(z.string().trim().min(1), z.string().trim().min(1)),
	sku: optionalString(),
	price: z.coerce.number().min(0).nullable().optional(),
	compareAtPrice: z.coerce.number().min(0).nullable().optional(),
	costPrice: z.coerce.number().min(0).nullable().optional(),
	costCurrencyCode: optionalString().nullable(),
	stockQty: z.coerce.number().int().min(0).nullable().optional(),
	lowStockThreshold: z.coerce.number().int().min(0).nullable().optional(),
	weightGrams: z.coerce.number().int().min(0).nullable().optional(),
	barcode: z.string().trim().nullable().optional(),
	isActive: z.boolean().default(true),
	variantId: optionalString(),
})

const productBaseSchema = z.object({
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
	categories: z.array(categoryRefSchema).min(1, "اختر فئة واحدة على الأقل أو أضف فئة جديدة"),
	tags: z.array(tagRefSchema).default([]),
	mediaAssetIds: z.array(z.string().trim()).nullable().default(null),
	mediaFiles: z.array(z.instanceof(File)).default([]),
	mediaUrls: z.array(z.string().trim()).default([]),
	// UI-only: option axes the merchant defined via the option-dialog. Drives
	// the matrix Cartesian render. Not sent on the wire — backend derives
	// axes from `variants[].attributes` per Phase 2.
	options: z.array(productOptionSchema).default([]),
	variants: z.array(variantRequestSchema).default([]),
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

// Backend rules from PRD-FRONTEND-MIGRATION § P2.5 — caught pre-flight so the
// merchant gets an inline error instead of a 400 toast on submit.
export const productSchema = productBaseSchema.superRefine((value, ctx) => {
	const variants = value.variants ?? []
	if (variants.length === 0) return

	const firstKeys = Object.keys(variants[0]?.attributes ?? {}).sort()

	if (firstKeys.length > 3) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path: ["variants"],
			message: "لا يمكن تجاوز 3 محاور خيارات",
		})
	}

	const seenCombos = new Set<string>()
	variants.forEach((variant, index) => {
		const keys = Object.keys(variant.attributes ?? {}).sort()

		// Consistent axis set across all variants
		if (keys.join("|") !== firstKeys.join("|")) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["variants", index, "attributes"],
				message: "كل المتغيّرات يجب أن تحدّد نفس المحاور",
			})
		}

		// Duplicate attribute combinations
		const comboKey = keys
			.map((k) => `${k}=${(variant.attributes ?? {})[k]}`)
			.join("|")
		if (seenCombos.has(comboKey)) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["variants", index, "attributes"],
				message: "تركيبة مكرّرة — لا يمكن تكرار نفس الخيارات",
			})
		}
		seenCombos.add(comboKey)
	})
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
