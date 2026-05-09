import type { InvoiceVisibleFields } from "./types"

type ToggleField = keyof Pick<
	InvoiceVisibleFields,
	| "showLogo"
	| "showStoreName"
	| "showOrderNumber"
	| "showOrderDate"
	| "showCustomerName"
	| "showCustomerPhone"
	| "showShippingAddress"
	| "showSku"
	| "showUnitPrice"
	| "showQuantity"
	| "showItemDiscount"
	| "showSubtotal"
	| "showShippingCost"
	| "showDiscountTotal"
	| "showTaxBreakdown"
	| "showPaymentMethod"
	| "showPaymentStatus"
	| "showPaymeraRrn"
	| "showNotes"
>

export interface ToggleGroup {
	id: string
	title: string
	description?: string
	toggles: { name: ToggleField; label: string; helper?: string }[]
}

export const VISIBLE_FIELDS_GROUPS: ToggleGroup[] = [
	{
		id: "store",
		title: "المتجر",
		description: "البيانات الأساسية لهوية المتجر على الفاتورة.",
		toggles: [
			{ name: "showLogo", label: "إظهار الشعار" },
			{ name: "showStoreName", label: "إظهار اسم المتجر" },
		],
	},
	{
		id: "order",
		title: "الطلب",
		toggles: [
			{ name: "showOrderNumber", label: "إظهار رقم الطلب" },
			{ name: "showOrderDate", label: "إظهار تاريخ الطلب" },
		],
	},
	{
		id: "customer",
		title: "العميل",
		toggles: [
			{ name: "showCustomerName", label: "إظهار اسم العميل" },
			{ name: "showCustomerPhone", label: "إظهار هاتف العميل" },
			{ name: "showShippingAddress", label: "إظهار عنوان الشحن" },
		],
	},
	{
		id: "items",
		title: "الأصناف",
		toggles: [
			{ name: "showSku", label: "إظهار رمز المنتج (SKU)" },
			{ name: "showUnitPrice", label: "إظهار سعر الوحدة" },
			{ name: "showQuantity", label: "إظهار الكمية" },
			{
				name: "showItemDiscount",
				label: "إظهار خصم الصنف",
				helper: "مفيد عند تطبيق خصم على منتج معيّن.",
			},
		],
	},
	{
		id: "totals",
		title: "المجاميع",
		toggles: [
			{ name: "showSubtotal", label: "إظهار المجموع الفرعي" },
			{ name: "showShippingCost", label: "إظهار تكلفة الشحن" },
			{ name: "showDiscountTotal", label: "إظهار إجمالي الخصم" },
			{ name: "showTaxBreakdown", label: "إظهار تفصيل الضريبة" },
		],
	},
	{
		id: "payment",
		title: "الدفع",
		toggles: [
			{ name: "showPaymentMethod", label: "إظهار طريقة الدفع" },
			{ name: "showPaymentStatus", label: "إظهار حالة الدفع" },
			{
				name: "showPaymeraRrn",
				label: "إظهار رقم عملية Paymera",
				helper: "RRN — مفيد عند الدفع الإلكتروني فقط.",
			},
		],
	},
	{
		id: "general",
		title: "ملاحظات",
		toggles: [{ name: "showNotes", label: "إظهار الملاحظات" }],
	},
]
