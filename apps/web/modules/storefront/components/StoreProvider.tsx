"use client"

/**
 * StoreProvider — mounts once at the storefront root.
 * Provides real implementations of all StoreContext actions to the block tree.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
	StoreAuthContext,
	StoreContext,
	defaultCheckoutState,
	defaultCustomerState,
	type CheckoutState,
	type CustomerAddressDraft,
	type CustomerState,
	type StoreAuthState,
	type StoreContextValue,
	type StoreLoadingState,
	type StoreErrorState,
} from "@/core/config/store-context"
import { LanguageProvider } from "@/core/config/locale/LanguageProvider"
import type { ProductCardActionEventDetail } from "@/core/config/binding/product-actions"
import {
	addOrUpdateLine,
	clearCart,
	getCartSubtotal,
	readStoreCart,
	type StoreCart,
} from "@/core/config/cart/store-cart"
import {
	CREATE_ORDER_EVENT,
	type CreateOrderEventDetail,
} from "@/core/config/cart/make-order"
import { registerAddProductCartListener } from "@/core/config/cart/use-store-cart"
import {
	requestCustomerOtp,
	verifyCustomerOtp,
} from "@/modules/auth/customer-auth/actions"
import cookiesConfig from "@/config/cookies-config"
import { isMockApiEnabled } from "@/lib/mock/enabled"
import { MOCK_STORE_SLUG } from "@/lib/mock/seed"
import { getTenantIdFromToken } from "@/lib/jwt"
import {
	getStoreTenantId,
	isCustomerAuthenticated,
	listPaymentMethods,
	placeCheckoutOrder,
	reverseGeocode,
	validateCartForCheckout,
	validateDiscountCode,
} from "@/modules/storefront/components/checkout/checkout-api"
import { withStoreBasePath } from "@/core/config/lib/store-base-path"
import {
	createCustomerAddress,
	deleteCustomerAddress,
	getCustomerPreferences,
	getCustomerProfile,
	listCustomerAddresses,
	setDefaultCustomerAddress,
	updateCustomerProfile,
	updateMarketingPreferences,
} from "@/modules/storefront/lib/customer-account-api"
import { useProductsPageState } from "@/modules/storefront/lib/use-products-page-state"
import { useOrdersState } from "@/modules/storefront/lib/use-orders-state"
import { getOrdersErrorMessage } from "@/modules/storefront/components/orders/orders-error"
import { closeZone } from "@/core/config/lib/zone-events"

// ─── Config ───────────────────────────────────────────────────────────────────

const COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

/** Route of the editor-authored checkout page (see presets/checkout.ts). */
const CHECKOUT_PATH = "/checkout"

// ─── Cookie helpers ───────────────────────────────────────────────────────────

function readCookie(name: string): string | null {
	if (typeof document === "undefined") return null
	const match = document.cookie.match(
		new RegExp(
			`(?:^|; )${name.replace(/[[\]{}()*+?.,\\^$|#\s]/g, "\\$&")}=([^;]*)`,
		),
	)
	return match?.[1] != null ? decodeURIComponent(match[1]) : null
}

function getStoreTenantSlug(): string {
	const fromCookie = readCookie(cookiesConfig.tenantSlug)?.trim()
	if (fromCookie) return fromCookie
	if (isMockApiEnabled()) return MOCK_STORE_SLUG
	throw new Error("لم يتم العثور على معرّف المتجر.")
}

function setCookie(name: string, value: string) {
	document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`
}

function clearCookie(name: string) {
	document.cookie = `${name}=; path=/; max-age=0`
}

function readAuthFromCookies(): StoreAuthState {
	const accessToken = readCookie(cookiesConfig.storeAccessToken)
	const customerName = readCookie("sooq-user-name")
	const customerPhone = readCookie("sooq-user-phone")
	return {
		// Access token is the real session signal; name/phone are display-only.
		isLoggedIn: Boolean(accessToken),
		customerName: customerName ?? null,
		customerPhone: customerPhone ?? null,
	}
}

function getErrorMessage(err: unknown, fallback: string): string {
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

function emptyAddressDraft(): CustomerAddressDraft {
	return { ...defaultCustomerState.addressDraft }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

// apps/store/components/StoreProvider.tsx re-exports this file via the
// `@/modules/*` alias — there is only one implementation.
export function StoreProvider({
	children,
	initialLanguage = "ar",
}: {
	children: React.ReactNode
	initialLanguage?: "ar" | "en"
}) {
	const { productsPage, actions: productsPageActions } = useProductsPageState()

	const [auth, setAuth] = useState<StoreAuthState>({
		isLoggedIn: false,
		customerName: null,
		customerPhone: null,
	})

	const {
		orders,
		orderDetail,
		returnDraft,
		actions: ordersStateActions,
	} = useOrdersState(auth.isLoggedIn)

	const [loading, setLoading] = useState<StoreLoadingState>({
		login: false,
		verifyOtp: false,
		makeOrder: false,
		profile: false,
		preferences: false,
		address: false,
		invoice: false,
		cancelOrder: false,
		submitReturn: false,
		paymentMethods: false,
		discount: false,
		placeOrder: false,
	})

	const [errors, setErrors] = useState<StoreErrorState>({
		login: null,
		verifyOtp: null,
		makeOrder: null,
		profile: null,
		preferences: null,
		address: null,
		invoice: null,
		cancelOrder: null,
		submitReturn: null,
		paymentMethods: null,
		discount: null,
		placeOrder: null,
	})

	const [customer, setCustomer] = useState<CustomerState>(defaultCustomerState)
	const addressDraftEditedRef = useRef({
		governorate: false,
		city: false,
		streetAddress: false,
	})

	const [checkout, setCheckout] = useState<CheckoutState>(defaultCheckoutState)

	// Hydrate auth state from cookies on the client
	useEffect(() => {
		setAuth(readAuthFromCookies())
	}, [])

	useEffect(() => {
		registerAddProductCartListener()
	}, [])

	const refreshCustomer = useCallback(async () => {
		setCustomer((prev) => ({ ...prev, isLoading: true, isError: false }))

		// Always validate the storefront session via /customer/profile first.
		// A 403 means the token is invalid — drop the cookie and stay put
		// (no login redirect).
		let profile: Awaited<ReturnType<typeof getCustomerProfile>> | null =
			null
		try {
			profile = await getCustomerProfile()
		} catch (err) {
			const status =
				typeof err === "object" && err && "status" in err
					? (err as { status?: number }).status
					: undefined
			if (status === 403) {
				clearCookie(cookiesConfig.storeAccessToken)
				setAuth({
					isLoggedIn: false,
					customerName: null,
					customerPhone: null,
				})
				setCustomer(defaultCustomerState)
				return
			}
		}

		const [preferencesResult, addressesResult] = await Promise.allSettled([
			getCustomerPreferences(),
			listCustomerAddresses(),
		])

		const preferences =
			preferencesResult.status === "fulfilled"
				? preferencesResult.value
				: null
		const addresses =
			addressesResult.status === "fulfilled" ? addressesResult.value : []
		const addressesFailed = addressesResult.status === "rejected"

		setCustomer((prev) => ({
			...prev,
			profile: profile ?? prev.profile,
			preferences: preferences ?? prev.preferences,
			addresses,
			profileDraft: {
				fullName: profile?.fullName ?? prev.profileDraft.fullName,
			},
			isLoading: false,
			// Address list UI keys off this flag; don't fail the whole account
			// page when only profile/preferences error.
			isError: addressesFailed,
		}))

		if (addressesFailed) {
			const reason =
				addressesResult.status === "rejected"
					? addressesResult.reason
					: new Error("تعذّر تحميل العناوين.")
			throw reason
		}
	}, [])

	useEffect(() => {
		if (!auth.isLoggedIn) {
			setCustomer(defaultCustomerState)
			return
		}

		void refreshCustomer().catch((err) => {
			console.error("[customer]", err)
		})
	}, [auth.isLoggedIn, refreshCustomer])

	// ─── login ─────────────────────────────────────────────────────────────────

	const login = useCallback(async (phone: string, fullName: string) => {
		if (!phone) return

		setLoading((prev) => ({ ...prev, login: true }))
		setErrors((prev) => ({ ...prev, login: null }))

		// Persist for the verifyOtp step
		localStorage.setItem("sooq-login-phone", phone)
		localStorage.setItem("sooq-login-fullName", fullName)

		try {
			const tenantSlug = getStoreTenantSlug()
			await requestCustomerOtp({
				phone,
				tenantSlug,
				fullName,
			})
		} catch (err) {
			const msg = getErrorMessage(
				err,
				"فشل إرسال رمز التحقق. حاول مرة أخرى.",
			)
			setErrors((prev) => ({ ...prev, login: msg }))
			throw err
		} finally {
			setLoading((prev) => ({ ...prev, login: false }))
		}
	}, [])

	// ─── verifyOtp ─────────────────────────────────────────────────────────────

	const verifyOtp = useCallback(async (otp: string) => {
		const phone = localStorage.getItem("sooq-login-phone") ?? ""
		const fullName = localStorage.getItem("sooq-login-fullName") ?? ""

		// A successful verify clears the stored phone; pressing the button again
		// is a no-op success so the block's post-verify redirect still runs.
		if (!phone && isCustomerAuthenticated()) return

		if (!otp) {
			throw new Error("أدخل رمز التحقق أولاً.")
		}
		if (!phone) {
			throw new Error("انتهت جلسة التحقق. عد لصفحة تسجيل الدخول وأعد إرسال الرمز.")
		}

		setLoading((prev) => ({ ...prev, verifyOtp: true }))
		setErrors((prev) => ({ ...prev, verifyOtp: null }))

		try {
			const tenantSlug = getStoreTenantSlug()
			const tokens = await verifyCustomerOtp({
				phone,
				tenantSlug,
				otpCode: otp,
			})

			// The customer OTP response doesn't always echo `tenantId`; when it
			// does, it may be blank. Prefer the tenant UUID embedded in the
			// signed access-token JWT so downstream requests (checkout, list
			// APIs via getEditorTenantId) send a real UUID — never a slug.
			const tenantFromToken = tokens.accessToken
				? getTenantIdFromToken(tokens.accessToken)
				: null
			const tenantId = tenantFromToken || tokens.tenantId || null

			if (tokens.accessToken) {
				setCookie(cookiesConfig.storeAccessToken, tokens.accessToken)
			}
			if (tenantId) {
				setCookie("sooq-tenant-id", tenantId)
			}
			setCookie(cookiesConfig.tenantSlug, tokens.tenantSlug ?? tenantSlug)
			setCookie("sooq-user-name", fullName)
			setCookie("sooq-user-phone", phone)

			localStorage.removeItem("sooq-login-phone")
			localStorage.removeItem("sooq-login-fullName")

			setAuth({ isLoggedIn: true, customerName: fullName, customerPhone: phone })
		} catch (err) {
			const msg = getErrorMessage(
				err,
				"رمز التحقق غير صحيح. حاول مرة أخرى.",
			)
			setErrors((prev) => ({ ...prev, verifyOtp: msg }))
			throw err
		} finally {
			setLoading((prev) => ({ ...prev, verifyOtp: false }))
		}
	}, [])

	// ─── makeOrder — leave the cart for /checkout ──────────────────────────────

	/**
	 * The cart button no longer places the order; it validates and hands off to
	 * the editor-authored /checkout page, which owns address, payment, discount
	 * and the actual `placeOrder` call.
	 */
	const goToCheckout = useCallback((cart: StoreCart) => {
		validateCartForCheckout(cart)
		if (typeof window === "undefined") return
		window.location.href = withStoreBasePath(CHECKOUT_PATH) ?? CHECKOUT_PATH
	}, [])

	useEffect(() => {
		const handler = (e: Event) => {
			const detail = (e as CustomEvent<CreateOrderEventDetail>).detail
			if (!detail?.cart) return

			try {
				goToCheckout(detail.cart)
			} catch (err) {
				console.error("[create-order]", err)
			}
		}

		window.addEventListener(CREATE_ORDER_EVENT, handler)
		return () => window.removeEventListener(CREATE_ORDER_EVENT, handler)
	}, [goToCheckout])

	const makeOrder = useCallback(async () => {
		const cart = readStoreCart()
		setErrors((prev) => ({ ...prev, makeOrder: null }))

		try {
			goToCheckout(cart)
		} catch (err) {
			const msg = getErrorMessage(err, "حدث خطأ أثناء تقديم الطلب.")
			setErrors((prev) => ({ ...prev, makeOrder: msg }))
			throw err
		}
	}, [goToCheckout])

	// ─── checkout page ─────────────────────────────────────────────────────────

	/**
	 * Recompute the money lines from the cart + current discount. Shipping is
	 * not quoted by any public endpoint yet, so it stays 0 and the checkout
	 * page shows a zero shipping row rather than inventing a number.
	 */
	const recomputeTotals = useCallback(
		(discount: CheckoutState["discount"]): Partial<CheckoutState> => {
			const subtotal = getCartSubtotal(readStoreCart())
			const shippingCost = 0
			const discountAmount = discount?.discountAmount ?? 0

			return {
				subtotal,
				shippingCost,
				discountAmount,
				payableTotal: Math.max(0, subtotal + shippingCost - discountAmount),
			}
		},
		[],
	)

	const refreshCheckout = useCallback(async () => {
		setCheckout((prev) => ({ ...prev, isLoading: true, isError: false }))
		setLoading((prev) => ({ ...prev, paymentMethods: true }))

		try {
			const methods = await listPaymentMethods(getStoreTenantId())

			setCheckout((prev) => ({
				...prev,
				paymentMethods: methods,
				// Preselect when there is exactly one option (today: COD) so the
				// customer is not forced to touch a single-choice select.
				paymentMethodCode:
					prev.paymentMethodCode ??
					(methods.length === 1 ? (methods[0]?.providerCode ?? null) : null),
				...recomputeTotals(prev.discount),
				isLoading: false,
			}))
		} catch (err) {
			setErrors((prev) => ({
				...prev,
				paymentMethods: getErrorMessage(err, "تعذّر تحميل طرق الدفع."),
			}))
			setCheckout((prev) => ({ ...prev, isLoading: false, isError: true }))
		} finally {
			setLoading((prev) => ({ ...prev, paymentMethods: false }))
		}
	}, [recomputeTotals])

	// One lookup per mount — the payment-method list is small and static, and
	// the checkout page needs it populated before the customer gets there.
	useEffect(() => {
		void refreshCheckout()
	}, [refreshCheckout])

	// Default to the customer's default saved address once addresses arrive.
	useEffect(() => {
		if (customer.addresses.length === 0) return

		setCheckout((prev) => {
			if (prev.addressId) return prev
			const preferred =
				customer.addresses.find((address) => address.isDefault) ??
				customer.addresses[0]
			if (!preferred) return prev
			return { ...prev, addressId: preferred.addressId }
		})
	}, [customer.addresses])

	const selectAddress = useCallback((addressId: string) => {
		setCheckout((prev) => ({ ...prev, addressId }))
	}, [])

	const selectPaymentMethod = useCallback((providerCode: string) => {
		setCheckout((prev) => ({ ...prev, paymentMethodCode: providerCode }))
	}, [])

	const setDiscountCodeDraft = useCallback((code: string) => {
		// Editing the code invalidates whatever was applied before, so the
		// totals never show a discount that no longer matches the input.
		setCheckout((prev) => ({
			...prev,
			discountCodeDraft: code,
			discount: null,
			discountAmount: 0,
			payableTotal: Math.max(0, prev.subtotal + prev.shippingCost),
		}))
		setErrors((prev) => ({ ...prev, discount: null }))
	}, [])

	const validateDiscount = useCallback(async () => {
		setLoading((prev) => ({ ...prev, discount: true }))
		setErrors((prev) => ({ ...prev, discount: null }))

		try {
			const totals = recomputeTotals(null)
			const discount = await validateDiscountCode(
				{
					code: checkout.discountCodeDraft,
					subtotal: totals.subtotal ?? 0,
				},
				getStoreTenantId(),
			)

			setCheckout((prev) => ({
				...prev,
				discount,
				...recomputeTotals(discount),
			}))
		} catch (err) {
			setErrors((prev) => ({
				...prev,
				discount: getErrorMessage(err, "كود الخصم غير صالح."),
			}))
			setCheckout((prev) => ({
				...prev,
				discount: null,
				...recomputeTotals(null),
			}))
		} finally {
			setLoading((prev) => ({ ...prev, discount: false }))
		}
	}, [checkout.discountCodeDraft, recomputeTotals])

	const placeOrder = useCallback(async () => {
		setLoading((prev) => ({ ...prev, placeOrder: true }))
		setErrors((prev) => ({ ...prev, placeOrder: null }))

		try {
			const address = customer.addresses.find(
				(entry) => entry.addressId === checkout.addressId,
			)

			if (!address) {
				throw new Error("اختر عنوان التوصيل أولاً.")
			}

			if (!checkout.paymentMethodCode) {
				throw new Error("اختر طريقة الدفع أولاً.")
			}

			const placed = await placeCheckoutOrder(
				{
					cart: readStoreCart(),
					address,
					paymentMethodCode: checkout.paymentMethodCode,
				},
				getStoreTenantId(),
			)

			// Online payment (e.g. PAYMERA): hand the customer to the hosted
			// payment page. The cart is only cleared after the payment-result
			// page confirms the charge — keep it intact so a failed/canceled
			// payment lets the customer retry checkout.
			if (placed.paymentRedirectUrl) {
				if (typeof window !== "undefined") {
					window.location.href = placed.paymentRedirectUrl
				}
				return
			}

			clearCart()
			setCheckout((prev) => ({
				...prev,
				placedOrderId: placed.orderId || "placed",
				...recomputeTotals(prev.discount),
			}))
			await ordersStateActions.refreshOrders()
		} catch (err) {
			setErrors((prev) => ({
				...prev,
				placeOrder: getErrorMessage(err, "حدث خطأ أثناء تقديم الطلب."),
			}))
		} finally {
			setLoading((prev) => ({ ...prev, placeOrder: false }))
		}
	}, [
		checkout.addressId,
		checkout.paymentMethodCode,
		customer.addresses,
		recomputeTotals,
		ordersStateActions,
	])

	// ─── addToCart ─────────────────────────────────────────────────────────────

	const addToCart = useCallback((detail: ProductCardActionEventDetail) => {
		addOrUpdateLine(detail)
		// STORE_CART_UPDATED_EVENT is fired inside writeStoreCart,
		// which makes CartIconButton / CartSection re-render automatically.
	}, [])

	// ─── addToWishlist ─────────────────────────────────────────────────────────

	const addToWishlist = useCallback((_detail: ProductCardActionEventDetail) => {
		// TODO: implement wishlist API endpoint
		console.log("[SOOQ] addToWishlist called — API not yet implemented")
	}, [])

	// ─── logout ────────────────────────────────────────────────────────────────

	const logout = useCallback(() => {
		clearCookie(cookiesConfig.storeAccessToken)
		clearCookie("sooq-tenant-id")
		clearCookie("sooq-user-name")
		clearCookie("sooq-user-phone")
		setAuth({ isLoggedIn: false, customerName: null, customerPhone: null })
		setCustomer(defaultCustomerState)
		addressDraftEditedRef.current = {
			governorate: false,
			city: false,
			streetAddress: false,
		}
	}, [])

	const setProfileDraftField = useCallback(
		(field: "fullName", value: string) => {
			setCustomer((prev) => ({
				...prev,
				profileDraft: { ...prev.profileDraft, [field]: value },
			}))
		},
		[],
	)

	const saveProfile = useCallback(async () => {
		setLoading((prev) => ({ ...prev, profile: true }))
		setErrors((prev) => ({ ...prev, profile: null }))

		try {
			const profile = await updateCustomerProfile({
				fullName: customer.profileDraft.fullName.trim(),
			})
			setCustomer((prev) => ({
				...prev,
				profile,
				profileDraft: { fullName: profile.fullName },
			}))
		} catch (err) {
			const msg = getErrorMessage(err, "تعذّر حفظ التغييرات، حاول مجدداً.")
			setErrors((prev) => ({ ...prev, profile: msg }))
			throw err
		} finally {
			setLoading((prev) => ({ ...prev, profile: false }))
		}
	}, [customer.profileDraft.fullName])

	const setMarketingPref = useCallback(
		async (channel: "email" | "sms", value: boolean) => {
			const previous = customer.preferences
			const nextPreferences = {
				emailOptIn:
					channel === "email" ? value : (previous?.emailOptIn ?? false),
				smsOptIn: channel === "sms" ? value : (previous?.smsOptIn ?? false),
			}

			setCustomer((prev) => ({
				...prev,
				preferences: prev.preferences
					? { ...prev.preferences, ...nextPreferences }
					: {
							...nextPreferences,
							emailConsentedAt: null,
							smsConsentedAt: null,
						},
			}))

			setLoading((prev) => ({ ...prev, preferences: true }))
			setErrors((prev) => ({ ...prev, preferences: null }))

			try {
				const preferences = await updateMarketingPreferences(nextPreferences)
				setCustomer((prev) => ({ ...prev, preferences }))
			} catch (err) {
				setCustomer((prev) => ({ ...prev, preferences: previous }))
				const msg = getErrorMessage(
					err,
					"تعذّر حفظ تفضيلات التسويق، حاول مجدداً.",
				)
				setErrors((prev) => ({ ...prev, preferences: msg }))
				throw err
			} finally {
				setLoading((prev) => ({ ...prev, preferences: false }))
			}
		},
		[customer.preferences],
	)

	const setAddressDraftField = useCallback(
		(
			field: keyof CustomerAddressDraft,
			value: string | number | boolean | null,
		) => {
			if (field === "governorate") addressDraftEditedRef.current.governorate = true
			if (field === "city") addressDraftEditedRef.current.city = true
			if (field === "streetAddress") {
				addressDraftEditedRef.current.streetAddress = true
			}

			setCustomer((prev) => ({
				...prev,
				addressDraft: {
					...prev.addressDraft,
					[field]: value,
				},
			}))
		},
		[],
	)

	const setAddressDraftLocation = useCallback(
		(latitude: number, longitude: number) => {
			setCustomer((prev) => ({
				...prev,
				addressDraft: {
					...prev.addressDraft,
					latitude,
					longitude,
				},
			}))

			void (async () => {
				const result = await reverseGeocode(latitude, longitude)
				if (!result) return

				setCustomer((prev) => ({
					...prev,
					addressDraft: {
						...prev.addressDraft,
						governorate:
							addressDraftEditedRef.current.governorate || !result.governorate
								? prev.addressDraft.governorate
								: result.governorate,
						city:
							addressDraftEditedRef.current.city || !result.city
								? prev.addressDraft.city
								: result.city,
						streetAddress:
							addressDraftEditedRef.current.streetAddress ||
							!result.streetAddress
								? prev.addressDraft.streetAddress
								: result.streetAddress,
					},
				}))
			})()
		},
		[],
	)

	const createAddress = useCallback(async () => {
		setLoading((prev) => ({ ...prev, address: true }))
		setErrors((prev) => ({ ...prev, address: null }))

		try {
			await createCustomerAddress(customer.addressDraft)
			const addresses = await listCustomerAddresses()
			addressDraftEditedRef.current = {
				governorate: false,
				city: false,
				streetAddress: false,
			}
			setCustomer((prev) => ({
				...prev,
				addresses,
				addressDraft: emptyAddressDraft(),
			}))
		} catch (err) {
			const msg = getErrorMessage(err, "تعذّر حفظ العنوان، حاول مجدداً.")
			setErrors((prev) => ({ ...prev, address: msg }))
			throw err
		} finally {
			setLoading((prev) => ({ ...prev, address: false }))
		}
	}, [customer.addressDraft])

	const setDefaultAddress = useCallback(async (addressId: string) => {
		setLoading((prev) => ({ ...prev, address: true }))
		setErrors((prev) => ({ ...prev, address: null }))

		try {
			await setDefaultCustomerAddress(addressId)
			const addresses = await listCustomerAddresses()
			setCustomer((prev) => ({ ...prev, addresses }))
		} catch (err) {
			const msg = getErrorMessage(
				err,
				"تعذّر تعيين العنوان الافتراضي، حاول مجدداً.",
			)
			setErrors((prev) => ({ ...prev, address: msg }))
			throw err
		} finally {
			setLoading((prev) => ({ ...prev, address: false }))
		}
	}, [])

	const deleteAddress = useCallback(async (addressId: string) => {
		setLoading((prev) => ({ ...prev, address: true }))
		setErrors((prev) => ({ ...prev, address: null }))

		try {
			await deleteCustomerAddress(addressId)
			const addresses = await listCustomerAddresses()
			setCustomer((prev) => ({ ...prev, addresses }))
		} catch (err) {
			const msg = getErrorMessage(err, "تعذّر حذف العنوان، حاول مجدداً.")
			setErrors((prev) => ({ ...prev, address: msg }))
			throw err
		} finally {
			setLoading((prev) => ({ ...prev, address: false }))
		}
	}, [])

	const searchProducts = useCallback(
		(query: string) => {
			productsPageActions.setSearch(query)
		},
		[productsPageActions],
	)

	const ordersActions = useMemo(
		() => ({
			nextPage: ordersStateActions.nextPage,
			prevPage: ordersStateActions.prevPage,
			setCancelReason: ordersStateActions.setCancelReason,
			toggleReturnItem: ordersStateActions.toggleReturnItem,
			setReturnItemQuantity: ordersStateActions.setReturnItemQuantity,
			setReturnItemCondition: ordersStateActions.setReturnItemCondition,
			setOrderDetail: ordersStateActions.setOrderDetail,
			refreshOrders: ordersStateActions.refreshOrders,
			downloadInvoice: async (
				orderId?: string,
				orderNumber?: string | null,
			) => {
				setLoading((prev) => ({ ...prev, invoice: true }))
				setErrors((prev) => ({ ...prev, invoice: null }))
				try {
					await ordersStateActions.downloadInvoice(orderId, orderNumber)
				} catch (err) {
					setErrors((prev) => ({
						...prev,
						invoice: getOrdersErrorMessage(err, "تعذّر تحميل الفاتورة."),
					}))
					throw err
				} finally {
					setLoading((prev) => ({ ...prev, invoice: false }))
				}
			},
			cancelOrder: async () => {
				setLoading((prev) => ({ ...prev, cancelOrder: true }))
				setErrors((prev) => ({ ...prev, cancelOrder: null }))
				try {
					await ordersStateActions.cancelOrder()
					closeZone("cancel-order")
				} catch (err) {
					setErrors((prev) => ({
						...prev,
						cancelOrder: getOrdersErrorMessage(err, "تعذّر إلغاء الطلب."),
					}))
					throw err
				} finally {
					setLoading((prev) => ({ ...prev, cancelOrder: false }))
				}
			},
			submitReturn: async () => {
				setLoading((prev) => ({ ...prev, submitReturn: true }))
				setErrors((prev) => ({ ...prev, submitReturn: null }))
				try {
					await ordersStateActions.submitReturn()
				} catch (err) {
					setErrors((prev) => ({
						...prev,
						submitReturn: getOrdersErrorMessage(
							err,
							"تعذّر إرسال طلب الإرجاع.",
						),
					}))
					throw err
				} finally {
					setLoading((prev) => ({ ...prev, submitReturn: false }))
				}
			},
		}),
		[ordersStateActions],
	)

	// ─── Context value ─────────────────────────────────────────────────────────

	const customerActions = useMemo(
		() => ({
			setProfileDraftField,
			saveProfile,
			setMarketingPref,
			setAddressDraftField,
			setAddressDraftLocation,
			createAddress,
			setDefaultAddress,
			deleteAddress,
			refreshCustomer,
		}),
		[
			setProfileDraftField,
			saveProfile,
			setMarketingPref,
			setAddressDraftField,
			setAddressDraftLocation,
			createAddress,
			setDefaultAddress,
			deleteAddress,
			refreshCustomer,
		],
	)

	const checkoutActions = useMemo(
		() => ({
			selectAddress,
			selectPaymentMethod,
			setDiscountCodeDraft,
			validateDiscount,
			placeOrder,
			refreshCheckout,
		}),
		[
			selectAddress,
			selectPaymentMethod,
			setDiscountCodeDraft,
			validateDiscount,
			placeOrder,
			refreshCheckout,
		],
	)

	const value = useMemo<StoreContextValue>(
		() => ({
			auth,
			loading,
			errors,
			productsPage,
			customer,
			orders,
			orderDetail,
			returnDraft,
			checkout,
			actions: {
				login,
				verifyOtp,
				makeOrder,
				addToCart,
				addToWishlist,
				logout,
				searchProducts,
				productsPage: productsPageActions,
				customer: customerActions,
				orders: ordersActions,
				checkout: checkoutActions,
			},
		}),
		[
			auth,
			loading,
			errors,
			productsPage,
			customer,
			orders,
			orderDetail,
			returnDraft,
			checkout,
			login,
			verifyOtp,
			makeOrder,
			addToCart,
			addToWishlist,
			logout,
			searchProducts,
			productsPageActions,
			customerActions,
			ordersActions,
			checkoutActions,
		],
	)

	return (
		<LanguageProvider initialLanguage={initialLanguage} persist>
			<StoreAuthContext.Provider value={auth}>
				<StoreContext.Provider value={value}>
					{children}
				</StoreContext.Provider>
			</StoreAuthContext.Provider>
		</LanguageProvider>
	)
}
