/**
 * Customer account self-service — API layer for the published storefront's
 * `/settings` Puck page (reached at `/store/<tenantId>/settings` through the
 * middleware rewrite).
 *
 * Endpoints: profile, marketing preferences, and saved addresses under
 * `/customer/**`, authenticated with the storefront customer's
 * `sooq-store-access-token` cookie. All calls go through `api()` so the Bearer
 * header and mock mode keep working.
 *
 * Twin of `apps/web/modules/storefront/lib/customer-account-api.ts` — keep both
 * copies in sync.
 */

import { api } from "@/lib/api"
import type {
	CustomerAddress,
	CustomerAddressDraft,
	CustomerPreferences,
	CustomerProfile,
} from "@/core/config/store-context"
import type { ApiResponse } from "@/lib/types"

export { ADDRESS_LABEL_OPTIONS } from "@/components/checkout/checkout-api"

type ApiCustomerProfile = {
	customerId: string
	fullName: string
	phone: string
	totalSpendSyp: number | string
	orderCount: number
	lastOrderAt: string | null
	createdAt: string | null
}

type ApiCustomerPreferences = {
	emailOptIn: boolean
	smsOptIn: boolean
	emailConsentedAt: string | null
	smsConsentedAt: string | null
}

type ApiCustomerAddress = {
	addressId: string
	label: string | null
	recipientName: string | null
	recipientPhone: string | null
	governorate: string
	city: string | null
	streetAddress: string | null
	notes: string | null
	latitude: number | null
	longitude: number | null
	isDefault: boolean
	createdAt: string | null
	updatedAt: string | null
}

function toNumber(value: number | string | null | undefined): number {
	if (typeof value === "number" && Number.isFinite(value)) return value
	if (typeof value === "string") {
		const parsed = Number(value)
		return Number.isFinite(parsed) ? parsed : 0
	}
	return 0
}

function normalizeProfile(data: ApiCustomerProfile): CustomerProfile {
	return {
		customerId: data.customerId,
		fullName: data.fullName ?? "",
		phone: data.phone ?? "",
		totalSpendSyp: toNumber(data.totalSpendSyp),
		orderCount: data.orderCount ?? 0,
		lastOrderAt: data.lastOrderAt ?? null,
		createdAt: data.createdAt ?? null,
	}
}

function normalizePreferences(data: ApiCustomerPreferences): CustomerPreferences {
	return {
		emailOptIn: Boolean(data.emailOptIn),
		smsOptIn: Boolean(data.smsOptIn),
		emailConsentedAt: data.emailConsentedAt ?? null,
		smsConsentedAt: data.smsConsentedAt ?? null,
	}
}

function normalizeAddress(data: ApiCustomerAddress): CustomerAddress {
	return {
		addressId: data.addressId,
		label: data.label ?? null,
		recipientName: data.recipientName ?? null,
		recipientPhone: data.recipientPhone ?? null,
		governorate: data.governorate ?? "",
		city: data.city ?? null,
		streetAddress: data.streetAddress ?? null,
		notes: data.notes ?? null,
		latitude: data.latitude ?? null,
		longitude: data.longitude ?? null,
		isDefault: Boolean(data.isDefault),
		createdAt: data.createdAt ?? null,
		updatedAt: data.updatedAt ?? null,
	}
}

export async function getCustomerProfile(): Promise<CustomerProfile> {
	const response = await api<ApiResponse<ApiCustomerProfile>>("/customer/profile")
	if (!response.data) {
		throw new Error("تعذّر تحميل الملف الشخصي.")
	}
	return normalizeProfile(response.data)
}

export async function updateCustomerProfile(body: {
	fullName: string
}): Promise<CustomerProfile> {
	const response = await api<ApiResponse<ApiCustomerProfile>>("/customer/profile", {
		method: "PUT",
		body,
	})
	if (!response.data) {
		throw new Error("تعذّر حفظ التغييرات.")
	}
	return normalizeProfile(response.data)
}

export async function getCustomerPreferences(): Promise<CustomerPreferences> {
	const response = await api<ApiResponse<ApiCustomerPreferences>>(
		"/customer/preferences",
	)
	if (!response.data) {
		throw new Error("تعذّر تحميل تفضيلات التسويق.")
	}
	return normalizePreferences(response.data)
}

export async function updateMarketingPreferences(body: {
	emailOptIn: boolean
	smsOptIn: boolean
}): Promise<CustomerPreferences> {
	const response = await api<ApiResponse<ApiCustomerPreferences>>(
		"/customer/preferences/marketing",
		{
			method: "PUT",
			body,
		},
	)
	if (!response.data) {
		throw new Error("تعذّر حفظ تفضيلات التسويق.")
	}
	return normalizePreferences(response.data)
}

export async function listCustomerAddresses(): Promise<CustomerAddress[]> {
	const response = await api<ApiResponse<ApiCustomerAddress[]>>(
		"/customer/addresses",
	)
	return (response.data ?? []).map(normalizeAddress)
}

export async function createCustomerAddress(
	body: CustomerAddressDraft,
): Promise<CustomerAddress> {
	const response = await api<ApiResponse<ApiCustomerAddress>>("/customer/addresses", {
		method: "POST",
		body: {
			label: body.label.trim() || null,
			recipientName: body.recipientName.trim() || null,
			recipientPhone: body.recipientPhone.trim() || null,
			governorate: body.governorate.trim(),
			city: body.city.trim() || null,
			streetAddress: body.streetAddress.trim() || null,
			notes: body.notes.trim() || null,
			latitude: body.latitude,
			longitude: body.longitude,
			isDefault: body.isDefault,
		},
	})
	if (!response.data) {
		throw new Error("تعذّر حفظ العنوان.")
	}
	return normalizeAddress(response.data)
}

export async function setDefaultCustomerAddress(
	addressId: string,
): Promise<void> {
	await api<ApiResponse<unknown>>(`/customer/addresses/${addressId}/default`, {
		method: "POST",
	})
}

export async function deleteCustomerAddress(addressId: string): Promise<void> {
	await api<ApiResponse<unknown>>(`/customer/addresses/${addressId}`, {
		method: "DELETE",
	})
}
