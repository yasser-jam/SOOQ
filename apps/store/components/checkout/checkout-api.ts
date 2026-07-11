import axios from "axios"

import {
	getProductTitle,
	type StoreCart,
	type StoreCartLine,
} from "@/core/config/cart/store-cart"

// ─── Cookie helper (no js-cookie in this app) ─────────────────────────────────

export function readCookie(name: string): string | null {
	if (typeof document === "undefined") return null
	const match = document.cookie.match(
		new RegExp(`(?:^|; )${name.replace(/[[\]{}()*+?.,\\^$|#\s]/g, "\\$&")}=([^;]*)`)
	)
	return match ? decodeURIComponent(match[1]) : null
}

// ─── Tenant + customer cookies ─────────────────────────────────────────────────

const TENANT_ID_COOKIE = "sooq-tenant-id"
const USER_NAME_COOKIE = "sooq-user-name"
const USER_PHONE_COOKIE = "sooq-user-phone"

export function getStoreTenantId(): string | null {
	return readCookie(TENANT_ID_COOKIE)
}

export function getCheckoutCustomerFromCookies(): {
	recipientName: string
	phone: string
} {
	return {
		recipientName: readCookie(USER_NAME_COOKIE)?.trim() ?? "",
		phone: readCookie(USER_PHONE_COOKIE)?.trim() ?? "",
	}
}

// ─── Static shipping defaults ──────────────────────────────────────────────────

export const DEFAULT_SHIPPING_ADDRESS = {
	latitude: 33.5138,
	longitude: 36.2765,
	addressLabel: "Al-Hamra Street, Building 5, Damascus",
} as const

export const DEFAULT_GUEST_EMAIL = "guest@example.com"

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

export function resolveLineVariantId(line: StoreCartLine): string | undefined {
	const selectedId = line.selectedVariant?.variantId?.trim()
	if (selectedId) return selectedId

	const fromVariants = line.product.variants
		.map((variant) => variant.variantId?.trim())
		.find(Boolean)
	if (fromVariants) return fromVariants

	if (line.product.variants.length <= 1) {
		return line.product.id
	}

	return undefined
}

export function mapCartToOrderItems(cart: StoreCart): MapCartResult {
	const items: CheckoutOrderItem[] = []
	const warnings: CartMappingWarning[] = []

	for (const line of cart.items) {
		const variantId = resolveLineVariantId(line)
		const title = getProductTitle(line)

		if (!variantId) {
			warnings.push({ productTitle: title })
			continue
		}

		items.push({ variantId, quantity: line.quantity })
	}

	return { items, warnings }
}

// ─── Pre-open validation (StoreProvider / create-order event) ─────────────────

export function validateCartForCheckout(cart: StoreCart): void {
	if (cart.items.length === 0) {
		throw new Error("السلة فارغة. أضف منتجات قبل إتمام الطلب.")
	}

	const { recipientName, phone } = getCheckoutCustomerFromCookies()

	if (!recipientName) {
		throw new Error("اسم المستلم غير متوفر. سجّل الدخول أولاً.")
	}

	if (!phone) {
		throw new Error("رقم الهاتف غير متوفر. سجّل الدخول أولاً.")
	}

	const { items, warnings } = mapCartToOrderItems(cart)

	if (items.length === 0) {
		const detail =
			warnings.length > 0
				? `\n${warnings.map((w) => `• ${w.productTitle}`).join("\n")}`
				: ""
		throw new Error(`لا توجد منتجات قابلة للطلب — تحقق من اختيار المتغيرات.${detail}`)
	}
}

// ─── Form values (used by CheckoutDrawer) ──────────────────────────────────────

export type CheckoutFormValues = {
	addressLabel: string
	latitude: string
	longitude: string
}

export type CheckoutFormErrors = Partial<Record<keyof CheckoutFormValues, string>>

export function defaultCheckoutFormValues(): CheckoutFormValues {
	return {
		addressLabel: DEFAULT_SHIPPING_ADDRESS.addressLabel,
		latitude: String(DEFAULT_SHIPPING_ADDRESS.latitude),
		longitude: String(DEFAULT_SHIPPING_ADDRESS.longitude),
	}
}

export function validateCheckoutForm(values: CheckoutFormValues): CheckoutFormErrors {
	const errors: CheckoutFormErrors = {}

	if (!values.addressLabel.trim())
		errors.addressLabel = "وصف العنوان مطلوب"
	if (!values.latitude || isNaN(Number(values.latitude)))
		errors.latitude = "خط العرض مطلوب (رقم)"
	if (!values.longitude || isNaN(Number(values.longitude)))
		errors.longitude = "خط الطول مطلوب (رقم)"

	return errors
}

// ─── API call ─────────────────────────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ""

export type CheckoutOrderPayload = {
	items: CheckoutOrderItem[]
	shippingAddress: {
		latitude: number
		longitude: number
		recipientName: string
		phone: string
		addressLabel: string
	}
	paymentMethod: "COD"
	guestEmail: string
}

export function buildCheckoutPayload(cart: StoreCart): CheckoutOrderPayload {
	const { items, warnings } = mapCartToOrderItems(cart)

	if (items.length === 0) {
		const detail = warnings.length > 0
			? `\n${warnings.map((w) => `• ${w.productTitle}`).join("\n")}`
			: ""
		throw new Error(`لا توجد منتجات قابلة للطلب — تحقق من اختيار المتغيرات.${detail}`)
	}

	const { recipientName, phone } = getCheckoutCustomerFromCookies()

	if (!recipientName) {
		throw new Error("اسم المستلم غير متوفر. سجّل الدخول أولاً.")
	}

	if (!phone) {
		throw new Error("رقم الهاتف غير متوفر. سجّل الدخول أولاً.")
	}

	return {
		items,
		shippingAddress: {
			...DEFAULT_SHIPPING_ADDRESS,
			recipientName,
			phone,
		},
		paymentMethod: "COD",
		guestEmail: DEFAULT_GUEST_EMAIL,
	}
}

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

	const { recipientName, phone } = getCheckoutCustomerFromCookies()

	if (!recipientName) {
		throw new Error("اسم المستلم غير متوفر. سجّل الدخول أولاً.")
	}

	if (!phone) {
		throw new Error("رقم الهاتف غير متوفر. سجّل الدخول أولاً.")
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
				recipientName,
				phone,
				addressLabel: values.addressLabel,
			},
			paymentMethod: "COD",
			checkoutToken: 'a26fa499-66a0-4d34-b9a7-18dca9a1e817',
			guestEmail: DEFAULT_GUEST_EMAIL,
		},
		{ headers },
	)
}

/** Submit checkout using cart lines from localStorage and customer cookies. */
export async function submitCheckoutOrderFromCart(
	cart: StoreCart,
	tenantId: string | null,
): Promise<void> {
	const payload = buildCheckoutPayload(cart)
	const headers: Record<string, string> = {}
	if (tenantId) headers["X-Tenant-Id"] = tenantId

	await axios.post(`${API_URL}/public/checkout`, payload, { headers })
}
