import axios from "axios"

import {
	getProductTitle,
	type StoreCart,
} from "@/core/config/cart/store-cart"

// ─── Cookie helper (no js-cookie in this app) ─────────────────────────────────

export function readCookie(name: string): string | null {
	if (typeof document === "undefined") return null
	const match = document.cookie.match(
		new RegExp(`(?:^|; )${name.replace(/[[\]{}()*+?.,\\^$|#\s]/g, "\\$&")}=([^;]*)`)
	)
	return match ? decodeURIComponent(match[1]) : null
}

// ─── Tenant ID ─────────────────────────────────────────────────────────────────

const TENANT_ID_COOKIE = "sooq-tenant-id"

export function getStoreTenantId(): string | null {
	return readCookie(TENANT_ID_COOKIE)
}

// ─── Cart → API mapping ────────────────────────────────────────────────────────

export type CheckoutOrderItem = {
	variantId: string
	quantity: number
}

export type CartMappingWarning = {
	productTitle: string
}

export type MapCartResult = {
	items: CheckoutOrderItem[]
	warnings: CartMappingWarning[]
}

export function mapCartToOrderItems(cart: StoreCart): MapCartResult {
	const items: CheckoutOrderItem[] = []
	const warnings: CartMappingWarning[] = []

	for (const line of cart.items) {
		const variantId = line.selectedVariant?.variantId
		const title = getProductTitle(line)

		if (!variantId) {
			warnings.push({ productTitle: title })
			continue
		}

		items.push({ variantId, quantity: line.quantity })
	}

	return { items, warnings }
}

// ─── Form values ───────────────────────────────────────────────────────────────

export type CheckoutFormValues = {
	recipientName: string
	phone: string
	addressLabel: string
	latitude: string
	longitude: string
	guestEmail: string
}

export type CheckoutFormErrors = Partial<Record<keyof CheckoutFormValues, string>>

export function validateCheckoutForm(values: CheckoutFormValues): CheckoutFormErrors {
	const errors: CheckoutFormErrors = {}

	if (!values.recipientName.trim())
		errors.recipientName = "اسم المستلم مطلوب"
	if (!values.phone.trim())
		errors.phone = "رقم الهاتف مطلوب"
	if (!values.addressLabel.trim())
		errors.addressLabel = "وصف العنوان مطلوب"
	if (!values.latitude || isNaN(Number(values.latitude)))
		errors.latitude = "خط العرض مطلوب (رقم)"
	if (!values.longitude || isNaN(Number(values.longitude)))
		errors.longitude = "خط الطول مطلوب (رقم)"
	if (!values.guestEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.guestEmail))
		errors.guestEmail = "أدخل بريدًا إلكترونيًا صحيحًا"

	return errors
}

// ─── API call ─────────────────────────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ""

export async function submitCheckoutOrder(
	cart: StoreCart,
	values: CheckoutFormValues,
	tenantId: string | null,
): Promise<void> {
	const { items, warnings } = mapCartToOrderItems(cart)

	if (items.length === 0) {
		const detail = warnings.length > 0
			? `\n${warnings.map((w) => `• ${w.productTitle}`).join("\n")}`
			: ""
		throw new Error(`لا توجد منتجات قابلة للطلب — تحقق من اختيار المتغيرات.${detail}`)
	}

	const headers: Record<string, string> = {}
	if (tenantId) headers["X-Tenant-Id"] = tenantId

	await axios.post(
		`${API_URL}/public/checkout`,
		{
			items,
			shippingAddress: {
				latitude: Number(values.latitude),
				longitude: Number(values.longitude),
				recipientName: values.recipientName,
				phone: values.phone,
				addressLabel: values.addressLabel,
			},
			paymentMethod: "COD",
			guestEmail: values.guestEmail,
		},
		{ headers },
	)
}
