"use client"

/**
 * StoreProvider — mounts once at the storefront root.
 * Provides real implementations of all StoreContext actions to the block tree.
 */

import React, { useCallback, useEffect, useState } from "react"
import {
	StoreContext,
	type StoreAuthState,
	type StoreContextValue,
	type StoreLoadingState,
	type StoreErrorState,
} from "@/core/config/store-context"
import type { ProductCardActionEventDetail } from "@/core/config/binding/product-actions"
import {
	addOrUpdateLine,
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
import { CheckoutDrawer } from "./checkout/CheckoutDrawer"
import {
	getStoreTenantId,
	validateCartForCheckout,
} from "./checkout/checkout-api"
import { useProductsPageState } from "../lib/use-products-page-state"

// ─── Config ───────────────────────────────────────────────────────────────────

const COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

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
	const customerName = readCookie("sooq-user-name")
	const customerPhone = readCookie("sooq-user-phone")
	return {
		isLoggedIn: Boolean(customerName && customerPhone),
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

// ─── Provider ─────────────────────────────────────────────────────────────────

export function StoreProvider({ children }: { children: React.ReactNode }) {
	const { productsPage, actions: productsPageActions } = useProductsPageState()

	const [auth, setAuth] = useState<StoreAuthState>({
		isLoggedIn: false,
		customerName: null,
		customerPhone: null,
	})

	const [loading, setLoading] = useState<StoreLoadingState>({
		login: false,
		verifyOtp: false,
		makeOrder: false,
	})

	const [errors, setErrors] = useState<StoreErrorState>({
		login: null,
		verifyOtp: null,
		makeOrder: null,
	})

	const [checkoutOpen, setCheckoutOpen] = useState(false)
	const [checkoutCart, setCheckoutCart] = useState<StoreCart | null>(null)

	// Hydrate auth state from cookies on the client
	useEffect(() => {
		setAuth(readAuthFromCookies())
	}, [])

	useEffect(() => {
		registerAddProductCartListener()
	}, [])

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

		if (!otp || !phone) return

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
				setCookie("sooq-access-token", tokens.accessToken)
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

	// ─── checkout dialog ───────────────────────────────────────────────────────

	const openCheckout = useCallback((cart: StoreCart) => {
		validateCartForCheckout(cart)
		setCheckoutCart(cart)
		setCheckoutOpen(true)
	}, [])

	const closeCheckout = useCallback(() => {
		setCheckoutOpen(false)
		setCheckoutCart(null)
	}, [])

	useEffect(() => {
		const handler = (e: Event) => {
			const detail = (e as CustomEvent<CreateOrderEventDetail>).detail
			if (!detail?.cart) return

			try {
				openCheckout(detail.cart)
			} catch (err) {
				console.error("[create-order]", err)
			}
		}

		window.addEventListener(CREATE_ORDER_EVENT, handler)
		return () => window.removeEventListener(CREATE_ORDER_EVENT, handler)
	}, [openCheckout])

	// ─── makeOrder ─────────────────────────────────────────────────────────────

	const makeOrder = useCallback(async () => {
		const cart = readStoreCart()
		setErrors((prev) => ({ ...prev, makeOrder: null }))

		try {
			openCheckout(cart)
		} catch (err) {
			const msg = getErrorMessage(err, "حدث خطأ أثناء تقديم الطلب.")
			setErrors((prev) => ({ ...prev, makeOrder: msg }))
			throw err
		}
	}, [openCheckout])

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
		clearCookie("sooq-access-token")
		clearCookie("sooq-tenant-id")
		clearCookie("sooq-user-name")
		clearCookie("sooq-user-phone")
		setAuth({ isLoggedIn: false, customerName: null, customerPhone: null })
	}, [])

	const searchProducts = useCallback(
		(query: string) => {
			productsPageActions.setSearch(query)
		},
		[productsPageActions],
	)

	// ─── Context value ─────────────────────────────────────────────────────────

	const value: StoreContextValue = {
		auth,
		loading,
		errors,
		productsPage,
		actions: {
			login,
			verifyOtp,
			makeOrder,
			addToCart,
			addToWishlist,
			logout,
			searchProducts,
			productsPage: productsPageActions,
		},
	}

	return (
		<StoreContext.Provider value={value}>
			{children}
			<CheckoutDrawer
				open={checkoutOpen}
				onClose={closeCheckout}
				cart={checkoutCart}
				tenantId={getStoreTenantId()}
			/>
		</StoreContext.Provider>
	)
}
