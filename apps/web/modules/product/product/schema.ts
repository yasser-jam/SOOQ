import * as z from "zod"

import { optionalString, requiredString } from "@/lib/schema"

export const productStatusSchema = z.enum(["DRAFT", "ACTIVE", "ARCHIVED"])

// NOTE: `options` is UI-only state (it drives the variant-matrix Cartesian
// render) and is stripped in `buildProductFormData` — it never reaches the
// backend. It is also hydrated from the server on edit, where fields come back
// nullable (`colorHex: null`, EN-only option names). A strict schema here can
// therefore only ever *block* submit with an error that has no input to render
// it against, which is exactly how the edit page came to silently do nothing.
// Entry-time validation lives in `variantOptionSchema` (used by option-dialog);
// this shape stays permissive on purpose.
// `nullish()` on every string: the server hydrates these as `null`, the
// option-dialog emits `undefined`, and the seeder omits `colorHex` entirely.
// All three are legitimate producers of this UI-only shape.
export const productOptionValueSchema = z.object({
	valueAr: z.string().trim().nullish(),
	valueEn: z.string().trim().nullish(),
	colorHex: z.string().trim().nullish(),
	sortOrder: z.number().int().min(0).catch(0),
})

export const productOptionSchema = z.object({
	optionNameAr: z.string().trim().nullish(),
	optionNameEn: z.string().trim().nullish(),
	sortOrder: z.number().int().min(0).catch(0),
	values: z.array(productOptionValueSchema).default([]),
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
	basePrice: z.coerce
		.number({ error: "السعر الأساسي مطلوب" })
		.min(0, "السعر الأساسي يجب أن يكون أكبر أو يساوي 0"),
	// Optional per CreateProductInput — a product without a strike-through
	// price is normal, and the backend omits `pricing.compareAtPrice` for one.
	compareAtPrice: z.coerce
		.number({ error: "سعر المقارنة غير صالح" })
		.min(0, "سعر المقارنة يجب أن يكون أكبر أو يساوي 0")
		.optional(),
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
