import * as z from "zod"

import { requiredString } from "@/lib/schema"

export const discountTypeSchema = z.enum([
	"PERCENTAGE",
	"FIXED_AMOUNT",
	"FREE_SHIPPING",
])

export const discountScopeSchema = z.enum(["ALL", "PRODUCT", "CATEGORY"])

const optionalPositiveNumber = z
	.preprocess(
		(value) =>
			value === "" || value === null || value === undefined
				? null
				: Number(value),
		z.number().min(0).nullable()
	)
	.optional()
	.nullable()

const optionalPositiveInteger = z
	.preprocess(
		(value) =>
			value === "" || value === null || value === undefined
				? null
				: Number(value),
		z.number().int().min(1).nullable()
	)
	.optional()
	.nullable()

export const createDiscountCodeSchema = z.object({
	code: requiredString("الرمز"),
	discountType: discountTypeSchema,
	discountValue: z
		.preprocess(
			(value) =>
				value === "" || value === null || value === undefined
					? undefined
					: Number(value),
			z.number().min(0.01, "القيمة يجب أن تكون أكبر من صفر")
		),
	minOrderAmount: optionalPositiveNumber,
	maxDiscountCap: optionalPositiveNumber,
	usageLimit: optionalPositiveInteger,
	perCustomerMax: optionalPositiveInteger,
	applicableScope: discountScopeSchema.default("ALL"),
	startsAt: requiredString("تاريخ البداية"),
	expiresAt: requiredString("تاريخ الانتهاء"),
})

export const updateDiscountCodeSchema = createDiscountCodeSchema
	.omit({ code: true, discountType: true })
	.partial()
	.extend({
		isActive: z.boolean().optional(),
	})
