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
	clearCart,
	readStoreCart,
} from "@/core/config/cart/store-cart"
import { registerAddProductCartListener } from "@/core/config/cart/use-store-cart"
import {
	getStoreTenantId,
	submitCheckoutOrderFromCart,
} from "./checkout/checkout-api"

// ─── Config ───────────────────────────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ""
const TENANT_SLUG =
	process.env.NEXT_PUBLIC_TENANT_SLUG ?? "tmp-4624d73c8f49494cb8be2aedcb967e3a"

const COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

// ─── Cookie helpers ───────────────────────────────────────────────────────────

function readCookie(name: string): string | null {
	if (typeof document === "undefined") return null
	const match = document.cookie.match(
		new RegExp(
			`(?:^|; )${name.replace(/[[\]{}()*+?.,\\^$|#\s]/g, "\\$&")}=([^;]*)`,
		),
	)
	return match ? decodeURIComponent(match[1]) : null
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

// ─── Provider ─────────────────────────────────────────────────────────────────

export function StoreProvider({ children }: { children: React.ReactNode }) {
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
			const res = await fetch(`${API_URL}/customer/auth/otp/request`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ phone, tenantSlug: TENANT_SLUG, fullName }),
			})

			if (!res.ok) {
				const text = await res.text().catch(() => "")
				throw new Error(`فشل إرسال رمز التحقق (${res.status}): ${text}`)
			}
		} catch (err) {
			const msg =
				err instanceof Error ? err.message : "فشل إرسال رمز التحقق. حاول مرة أخرى."
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
			const res = await fetch(`${API_URL}/customer/auth/otp/verify`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ phone, tenantSlug: TENANT_SLUG, otpCode: otp }),
			})

			if (!res.ok) {
				const text = await res.text().catch(() => "")
				throw new Error(`رمز التحقق غير صحيح (${res.status}): ${text}`)
			}

			const data = await res.json()
			const tenantId = data?.tenantId ?? data?.tenant_id ?? TENANT_SLUG

			setCookie("sooq-tenant-id", tenantId)
			setCookie("sooq-user-name", fullName)
			setCookie("sooq-user-phone", phone)

			localStorage.removeItem("sooq-login-phone")
			localStorage.removeItem("sooq-login-fullName")

			setAuth({ isLoggedIn: true, customerName: fullName, customerPhone: phone })
		} catch (err) {
			const msg =
				err instanceof Error ? err.message : "رمز التحقق غير صحيح. حاول مرة أخرى."
			setErrors((prev) => ({ ...prev, verifyOtp: msg }))
			throw err
		} finally {
			setLoading((prev) => ({ ...prev, verifyOtp: false }))
		}
	}, [])

	// ─── makeOrder ─────────────────────────────────────────────────────────────

	const makeOrder = useCallback(async () => {
		const cart = readStoreCart()

		if (cart.items.length === 0) {
			throw new Error("السلة فارغة. أضف منتجات قبل إتمام الطلب.")
		}

		console.log("[complete-order] cart items:", cart.items)

		setLoading((prev) => ({ ...prev, makeOrder: true }))
		setErrors((prev) => ({ ...prev, makeOrder: null }))

		try {
			await submitCheckoutOrderFromCart(cart, getStoreTenantId())
			clearCart()
		} catch (err) {
			const msg =
				err instanceof Error ? err.message : "حدث خطأ أثناء تقديم الطلب."
			setErrors((prev) => ({ ...prev, makeOrder: msg }))
			throw err
		} finally {
			setLoading((prev) => ({ ...prev, makeOrder: false }))
		}
	}, [])

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
		clearCookie("sooq-tenant-id")
		clearCookie("sooq-user-name")
		clearCookie("sooq-user-phone")
		setAuth({ isLoggedIn: false, customerName: null, customerPhone: null })
	}, [])

	// ─── Context value ─────────────────────────────────────────────────────────

	const value: StoreContextValue = {
		auth,
		loading,
		errors,
		actions: {
			login,
			verifyOtp,
			makeOrder,
			addToCart,
			addToWishlist,
			logout,
		},
	}

	return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}
