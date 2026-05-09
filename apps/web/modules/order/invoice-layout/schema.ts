import * as z from "zod"

import { requiredString } from "@/lib/schema"

/**
 * Frontend shape of `visibleFieldsJson`. Backend stores it as a string blob;
 * we serialize on submit and parse on load.
 */
export const invoiceVisibleFieldsSchema = z.object({
	// Store
	showLogo: z.boolean().default(true),
	showStoreName: z.boolean().default(true),
	storeName: z.string().default(""),
	logoUrl: z.string().default(""),

	// Order
	showOrderNumber: z.boolean().default(true),
	showOrderDate: z.boolean().default(true),

	// Customer
	showCustomerName: z.boolean().default(true),
	showCustomerPhone: z.boolean().default(true),
	showShippingAddress: z.boolean().default(true),

	// Items
	showSku: z.boolean().default(true),
	showUnitPrice: z.boolean().default(true),
	showQuantity: z.boolean().default(true),
	showItemDiscount: z.boolean().default(false),

	// Totals
	showSubtotal: z.boolean().default(true),
	showShippingCost: z.boolean().default(true),
	showDiscountTotal: z.boolean().default(true),
	showTaxBreakdown: z.boolean().default(false),

	// Payment
	showPaymentMethod: z.boolean().default(true),
	showPaymentStatus: z.boolean().default(true),
	showPaymeraRrn: z.boolean().default(false),

	// General
	showNotes: z.boolean().default(false),
	headerText: z.string().default(""),
	footerText: z.string().default(""),
	colorScheme: z
		.string()
		.regex(/^#[0-9a-fA-F]{6}$/, "اللون يجب أن يكون hex مثل #1A2B3C")
		.default("#1A2B3C"),
})

export const invoiceLayoutFormSchema = z.object({
	profileName: requiredString("اسم القالب"),
	isDefault: z.boolean().default(false),
	visibleFields: invoiceVisibleFieldsSchema,
})
