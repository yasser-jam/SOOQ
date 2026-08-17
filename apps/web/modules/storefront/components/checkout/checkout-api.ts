import {
	getProductTitle,
	type StoreCart,
	type StoreCartLine,
} from "@/core/config/cart/store-cart"
import type {
	CheckoutDiscount,
	CustomerAddress,
	PaymentMethodOption,
} from "@/core/config/store-context"
import { api } from "@/lib/api"
import { publicApi } from "@/lib/public-api"
import type { ApiResponse } from "@/lib/types"
import { isMockApiEnabled } from "@/lib/mock/enabled"
import { MOCK_STORE_TENANT_ID } from "@/lib/mock/seed"
import { getEditorTenantId } from "@/lib/tenant-context"

// ─── Cookie helper (no js-cookie in this app) ─────────────────────────────────

export function readCookie(name: string): string | null {
	if (typeof document === "undefined") return null
	const match = document.cookie.match(
		new RegExp(`(?:^|; )${name.replace(/[[\]{}()*+?.,\\^$|#\s]/g, "\\$&")}=([^;]*)`)
	)
	return match?.[1] != null ? decodeURIComponent(match[1]) : null
}

// ─── Tenant + customer cookies ─────────────────────────────────────────────────

const TENANT_ID_COOKIE = "sooq-tenant-id"
const USER_NAME_COOKIE = "sooq-user-name"
const USER_PHONE_COOKIE = "sooq-user-phone"
const ACCESS_TOKEN_COOKIE = "sooq-store-access-token"

/**
 * Resolve the tenant UUID to send with storefront requests.
 *
 * Aligns with the list-API path (`getEditorTenantId`): prefer the tenant
 * claim inside the signed access-token JWT, fall back to the `sooq-tenant-id`
 * cookie, then the mock tenant in dev. Reading the raw cookie directly is
 * unreliable — the storefront OTP flow can persist the tenant *slug* there
 * (not a UUID) when the backend response omits `tenantId`, which caused
 * checkout to POST with a slug while list APIs sent the correct UUID.
 */
export function getStoreTenantId(): string | null {
	return getEditorTenantId() ?? readCookie(TENANT_ID_COOKIE)
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

/** A saved address can only be attached to an authenticated customer. */
export function isCustomerAuthenticated(): boolean {
	return Boolean(readCookie(ACCESS_TOKEN_COOKIE))
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
	latitude: number | null
	longitude: number | null
}

export type CheckoutFormErrors = Partial<Record<keyof CheckoutFormValues, string>>

export function defaultCheckoutFormValues(): CheckoutFormValues {
	return {
		addressLabel: DEFAULT_SHIPPING_ADDRESS.addressLabel,
		latitude: DEFAULT_SHIPPING_ADDRESS.latitude,
		longitude: DEFAULT_SHIPPING_ADDRESS.longitude,
	}
}

export function validateCheckoutForm(values: CheckoutFormValues): CheckoutFormErrors {
	const errors: CheckoutFormErrors = {}

	if (!values.addressLabel.trim())
		errors.addressLabel = "وصف العنوان مطلوب"
	if (!Number.isFinite(values.latitude) || !Number.isFinite(values.longitude))
		errors.latitude = "حدّد موقع التوصيل على الخريطة"

	return errors
}

// ─── API call ─────────────────────────────────────────────────────────────────

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
	checkoutToken?: string
}

function resolveCheckoutTenantId(tenantId: string | null): string {
	if (tenantId) return tenantId
	if (isMockApiEnabled()) return MOCK_STORE_TENANT_ID
	throw new Error("معرّف المتجر غير متوفر. سجّل الدخول أولاً.")
}

function getApiErrorMessage(err: unknown, fallback: string): string {
	if (err instanceof Error && err.message) return err.message
	if (
		err &&
		typeof err === "object" &&
		"message" in err &&
		typeof (err as { message: unknown }).message === "string"
	) {
		return (err as { message: string }).message
	}
	return fallback
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

	if (values.latitude == null || values.longitude == null) {
		throw new Error("حدّد موقع التوصيل على الخريطة.")
	}

	const resolvedTenantId = resolveCheckoutTenantId(tenantId)
	const accessToken = readCookie(ACCESS_TOKEN_COOKIE)

	try {
		await publicApi("/public/checkout", {
			method: "POST",
			tenantId: resolvedTenantId,
			headers: accessToken
				? { Authorization: `Bearer ${accessToken}` }
				: undefined,
			body: {
				items,
				shippingAddress: {
					latitude: values.latitude,
					longitude: values.longitude,
					recipientName,
					phone,
					addressLabel: values.addressLabel,
				},
				paymentMethod: "COD",
				checkoutToken: crypto.randomUUID(),
				guestEmail: DEFAULT_GUEST_EMAIL,
			},
		})
	} catch (err) {
		throw new Error(
			getApiErrorMessage(err, "حدث خطأ أثناء تقديم الطلب."),
		)
	}
}

// ─── Checkout page: payment methods, discount, place order ────────────────────

type ApiPaymentMethod = {
	providerCode?: string
	displayName?: string
	requiresRedirect?: boolean
	supportsSavedCards?: boolean
}

/**
 * Storefront-visible payment providers — `GET /public/payments/methods`.
 *
 * Returns `[]` instead of throwing: an empty list makes the checkout page hide
 * its payment picker, which beats failing the whole page on a flaky lookup.
 */
export async function listPaymentMethods(
	tenantId: string | null,
): Promise<PaymentMethodOption[]> {
	try {
		const response = await publicApi<ApiResponse<ApiPaymentMethod[]>>(
			"/public/payments/methods",
			{ tenantId: resolveCheckoutTenantId(tenantId) },
		)

		return (response.data ?? [])
			.map((method) => ({
				providerCode: String(method.providerCode ?? "").trim(),
				displayName: String(
					method.displayName ?? method.providerCode ?? "",
				).trim(),
				requiresRedirect: Boolean(method.requiresRedirect),
				supportsSavedCards: Boolean(method.supportsSavedCards),
			}))
			.filter((method) => method.providerCode)
	} catch {
		return []
	}
}

type ApiDiscountValidation = {
	discountAmount?: number | string
}

/**
 * `GET /public/checkout/validate-discount`. The backend computes the amount, so
 * the current money context travels with the code. Throws with the backend's
 * own Arabic message when the code is rejected.
 */
export async function validateDiscountCode(
	input: { code: string; subtotal: number; shippingCost: number },
	tenantId: string | null,
): Promise<CheckoutDiscount> {
	const code = input.code.trim()

	if (!code) {
		throw new Error("أدخل كود الخصم أولاً.")
	}

	try {
		const response = await publicApi<ApiResponse<ApiDiscountValidation>>(
			"/public/checkout/validate-discount",
			{
				tenantId: resolveCheckoutTenantId(tenantId),
				params: {
					code,
					subtotal: input.subtotal,
					shippingCost: input.shippingCost,
				},
			},
		)

		const amount = Number(response.data?.discountAmount ?? 0)

		if (!Number.isFinite(amount) || amount <= 0) {
			throw new Error("كود الخصم غير صالح.")
		}

		return { code, discountAmount: amount }
	} catch (err) {
		throw new Error(getApiErrorMessage(err, "كود الخصم غير صالح."))
	}
}

/** Turn a saved address into the `shippingAddress` block the API expects. */
function toShippingAddress(address: CustomerAddress) {
	const { recipientName, phone } = getCheckoutCustomerFromCookies()

	if (address.latitude == null || address.longitude == null) {
		throw new Error("العنوان المحدد لا يحتوي على إحداثيات. اختر عنواناً آخر.")
	}

	const label =
		[address.governorate, address.city, address.streetAddress]
			.map((part) => part?.trim())
			.filter(Boolean)
			.join("، ") ||
		address.label?.trim() ||
		""

	if (!label) {
		throw new Error("العنوان المحدد غير مكتمل. اختر عنواناً آخر.")
	}

	const resolvedName = address.recipientName?.trim() || recipientName
	const resolvedPhone = address.recipientPhone?.trim() || phone

	if (!resolvedName || !resolvedPhone) {
		throw new Error("بيانات المستلم غير متوفرة. سجّل الدخول أولاً.")
	}

	return {
		latitude: address.latitude,
		longitude: address.longitude,
		recipientName: resolvedName,
		phone: resolvedPhone,
		addressLabel: label,
	}
}

/**
 * `POST /public/checkout` driven by the /checkout page's selections.
 * Returns the new order id so the page can switch to its success state.
 *
 * The body is the fixed five-key shape the backend expects; only
 * `shippingAddress` varies, and it comes from the address the customer picked.
 * Note there is no `discountCode` field — a validated code currently affects
 * the displayed total only, not what the backend charges.
 */
export async function placeCheckoutOrder(
	input: {
		cart: StoreCart
		address: CustomerAddress
		paymentMethodCode: string
	},
	tenantId: string | null,
): Promise<string> {
	const { items, warnings } = mapCartToOrderItems(input.cart)

	if (items.length === 0) {
		const detail =
			warnings.length > 0
				? `\n${warnings.map((w) => `• ${w.productTitle}`).join("\n")}`
				: ""
		throw new Error(
			`لا توجد منتجات قابلة للطلب — تحقق من اختيار المتغيرات.${detail}`,
		)
	}

	const shippingAddress = toShippingAddress(input.address)
	const accessToken = readCookie(ACCESS_TOKEN_COOKIE)

	try {
		const response = await publicApi<ApiResponse<{ orderId?: string }>>(
			"/public/checkout",
			{
				method: "POST",
				tenantId: resolveCheckoutTenantId(tenantId),
				headers: accessToken
					? { Authorization: `Bearer ${accessToken}` }
					: undefined,
				body: {
					items,
					shippingAddress,
					paymentMethod: input.paymentMethodCode,
					checkoutToken: crypto.randomUUID(),
					guestEmail: DEFAULT_GUEST_EMAIL,
				},
			},
		)

		return response.data?.orderId ?? ""
	} catch (err) {
		throw new Error(getApiErrorMessage(err, "حدث خطأ أثناء تقديم الطلب."))
	}
}

// ─── OpenStreetMap reverse geocoding ──────────────────────────────────────────

export type GeocodedAddress = {
	governorate: string
	city: string
	streetAddress: string
}

type NominatimAddress = Partial<
	Record<
		| "state"
		| "region"
		| "county"
		| "city"
		| "town"
		| "village"
		| "suburb"
		| "neighbourhood"
		| "road"
		| "house_number",
		string
	>
>

/**
 * Turn the picked pin into governorate/city/street text.
 *
 * Nominatim is a third-party OSM service, not the SOOQ backend, so it is
 * called with `fetch` instead of `api()`/`publicApi()`. Failures are silent —
 * the customer can always type the fields by hand.
 */
export async function reverseGeocode(
	latitude: number,
	longitude: number,
	signal?: AbortSignal,
): Promise<GeocodedAddress | null> {
	const url =
		"https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18" +
		`&accept-language=ar&lat=${latitude}&lon=${longitude}`

	try {
		const response = await fetch(url, {
			signal,
			headers: { Accept: "application/json" },
		})
		if (!response.ok) return null

		const body = (await response.json()) as { address?: NominatimAddress }
		const address = body.address ?? {}

		return {
			governorate: address.state ?? address.region ?? address.county ?? "",
			city:
				address.city ??
				address.town ??
				address.village ??
				address.suburb ??
				address.neighbourhood ??
				"",
			streetAddress: [address.road, address.house_number]
				.filter(Boolean)
				.join(" "),
		}
	} catch {
		return null
	}
}

// ─── Saved customer addresses ─────────────────────────────────────────────────

export const ADDRESS_LABEL_OPTIONS = [
	{ value: "HOME", label: "المنزل" },
	{ value: "WORK", label: "العمل" },
	{ value: "OTHER", label: "أخرى" },
] as const

export type SavedAddressFormValues = {
	label: string
	governorate: string
	city: string
	notes: string
	isDefault: boolean
}

export function defaultSavedAddressFormValues(): SavedAddressFormValues {
	return {
		label: "HOME",
		governorate: "",
		city: "",
		notes: "",
		isDefault: false,
	}
}

/** POST the currently picked checkout address to the customer's profile. */
export async function saveCustomerAddress(
	address: SavedAddressFormValues,
	checkout: CheckoutFormValues,
): Promise<void> {
	if (!isCustomerAuthenticated()) {
		throw new Error("سجّل الدخول أولاً لحفظ العنوان.")
	}

	const { recipientName, phone } = getCheckoutCustomerFromCookies()

	if (!recipientName || !phone) {
		throw new Error("بيانات المستلم غير متوفرة. سجّل الدخول أولاً.")
	}

	if (checkout.latitude == null || checkout.longitude == null) {
		throw new Error("حدّد موقع العنوان على الخريطة.")
	}

	if (!address.governorate.trim()) {
		throw new Error("المحافظة مطلوبة.")
	}

	try {
		await api("/customer/addresses", {
			method: "POST",
			body: {
				label: address.label,
				recipientName,
				recipientPhone: phone,
				governorate: address.governorate.trim(),
				city: address.city.trim() || null,
				streetAddress: checkout.addressLabel.trim() || null,
				notes: address.notes.trim() || null,
				latitude: checkout.latitude,
				longitude: checkout.longitude,
				isDefault: address.isDefault,
			},
		})
	} catch (err) {
		throw new Error(getApiErrorMessage(err, "تعذّر حفظ العنوان."))
	}
}

/** Submit checkout using cart lines from localStorage and customer cookies. */
export async function submitCheckoutOrderFromCart(
	cart: StoreCart,
	tenantId: string | null,
): Promise<void> {
	const payload = buildCheckoutPayload(cart)
	const resolvedTenantId = resolveCheckoutTenantId(tenantId)

	try {
		await publicApi("/public/checkout", {
			method: "POST",
			tenantId: resolvedTenantId,
			body: payload,
		})
	} catch (err) {
		throw new Error(
			getApiErrorMessage(err, "حدث خطأ أثناء تقديم الطلب."),
		)
	}
}
